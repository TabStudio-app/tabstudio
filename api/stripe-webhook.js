import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function logWebhook(level, branch, details = {}) {
  const payload = {
    branch,
    ...details,
  };
  if (level === "error") {
    console.error("[STRIPE WEBHOOK]", payload);
    return;
  }
  if (level === "warn") {
    console.warn("[STRIPE WEBHOOK]", payload);
    return;
  }
  console.log("[STRIPE WEBHOOK]", payload);
}

function normalizePlanTier(rawPlanTier) {
  const value = String(rawPlanTier || "").trim().toLowerCase();
  if (value === "solo" || value === "band" || value === "creator") return value;
  return "free";
}

function normalizeBillingCycle(rawBillingCycle) {
  const value = String(rawBillingCycle || "").trim().toLowerCase();
  return value === "yearly" ? "yearly" : "monthly";
}

function resolvePlanFromPriceId(priceId) {
  const normalizedPriceId = String(priceId || "").trim();
  if (!normalizedPriceId) {
    return { planTier: "free", billingCycle: "monthly" };
  }

  const priceMap = [
    ["solo", "monthly", "STRIPE_PRICE_SOLO_MONTHLY"],
    ["solo", "yearly", "STRIPE_PRICE_SOLO_YEARLY"],
    ["band", "monthly", "STRIPE_PRICE_BAND_MONTHLY"],
    ["band", "yearly", "STRIPE_PRICE_BAND_YEARLY"],
    ["creator", "monthly", "STRIPE_PRICE_CREATOR_MONTHLY"],
    ["creator", "yearly", "STRIPE_PRICE_CREATOR_YEARLY"],
  ];

  for (const [planTier, billingCycle, envKey] of priceMap) {
    if (String(process.env[envKey] || "").trim() === normalizedPriceId) {
      return { planTier, billingCycle };
    }
  }

  return { planTier: "free", billingCycle: "monthly" };
}

function normalizeWebhookMembershipState(rawStatus) {
  const status = String(rawStatus || "").trim().toLowerCase();
  if (status === "active" || status === "trialing") return "active";
  return "free";
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function buildSupabaseAdminClient() {
  const supabaseUrl = String(process.env.SUPABASE_URL || "").trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getMissingWebhookEnvVars() {
  const requiredEnvVars = ["STRIPE_WEBHOOK_SECRET", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  return requiredEnvVars.filter((envKey) => !String(process.env[envKey] || "").trim());
}

function buildStripeClient() {
  return new Stripe(String(process.env.STRIPE_SECRET_KEY || "sk_test_webhook_placeholder"));
}

async function upsertProfileMembership(supabaseAdmin, userId, updates) {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) {
    throw new Error("Missing Supabase user id in Stripe event metadata.");
  }

  const normalizedEmail = String(updates?.email || "").trim().toLowerCase();
  const payload = {
    id: normalizedUserId,
    plan_tier: normalizePlanTier(updates?.planTier),
    membership_status: String(updates?.membershipStatus || "free").trim().toLowerCase() === "active" ? "active" : "free",
    billing_cycle: normalizeBillingCycle(updates?.billingCycle),
  };

  const existing = await supabaseAdmin.from("profiles").select("id,email").eq("id", normalizedUserId).maybeSingle();
  if (existing.error) throw existing.error;

  if (existing.data) {
    const updatePayload = { ...payload };
    if (normalizedEmail && String(existing.data.email || "").trim().toLowerCase() !== normalizedEmail) {
      updatePayload.email = normalizedEmail;
    }
    const result = await supabaseAdmin.from("profiles").update(updatePayload).eq("id", normalizedUserId);
    if (result.error) throw result.error;
    return;
  }

  const result = await supabaseAdmin.from("profiles").insert({
    ...payload,
    email: normalizedEmail || null,
  });
  if (result.error) throw result.error;
}

function getSubscriptionPriceId(subscription) {
  return subscription?.items?.data?.[0]?.price?.id || "";
}

function deriveSubscriptionMembershipFields(subscription) {
  const metadata = subscription?.metadata && typeof subscription.metadata === "object" ? subscription.metadata : {};
  const fallbackFromPrice = resolvePlanFromPriceId(getSubscriptionPriceId(subscription));
  const membershipStatus = normalizeWebhookMembershipState(subscription?.status);
  const planTier = membershipStatus === "active" ? normalizePlanTier(metadata.plan_tier || fallbackFromPrice.planTier) : "free";
  const billingCycle =
    metadata.billing_cycle ||
    subscription?.items?.data?.[0]?.price?.recurring?.interval ||
    fallbackFromPrice.billingCycle;

  return {
    userId: String(metadata.supabase_user_id || "").trim(),
    email: String(metadata.email || subscription?.customer_email || "").trim().toLowerCase(),
    planTier,
    billingCycle,
    membershipStatus,
  };
}

function deriveCheckoutSessionMembershipFields(session) {
  const metadata = session?.metadata && typeof session.metadata === "object" ? session.metadata : {};
  return {
    userId: String(metadata.supabase_user_id || session?.client_reference_id || "").trim(),
    email: String(metadata.email || session?.customer_details?.email || session?.customer_email || "").trim().toLowerCase(),
    planTier: normalizePlanTier(metadata.plan_tier),
    billingCycle: normalizeBillingCycle(metadata.billing_cycle),
    membershipStatus: "active",
  };
}

function ensureMembershipFields(eventType, membershipFields) {
  if (!membershipFields.userId) {
    const error = new Error("Missing user metadata for membership sync.");
    error.code = "missing_user_metadata";
    error.eventType = eventType;
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const missingEnvVars = getMissingWebhookEnvVars();
  const supabaseAdmin = buildSupabaseAdminClient();
  if (missingEnvVars.length > 0 || !supabaseAdmin) {
    logWebhook("error", "missing_env", {
      missingEnvVars,
    });
    return sendJson(res, 500, { error: "Stripe webhook is not configured." });
  }

  const rawBody = await readRawBody(req);
  const signatureHeader = String(req.headers["stripe-signature"] || "").trim();
  const webhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET || "").trim();
  const stripe = buildStripeClient();

  let event = null;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signatureHeader, webhookSecret);
  } catch (error) {
    logWebhook("error", "invalid_signature", {
      message: String(error?.message || "Unknown Stripe signature error."),
    });
    return sendJson(res, 400, { error: "Invalid Stripe signature." });
  }

  if (!event?.type) {
    logWebhook("error", "invalid_payload", {
      message: "Stripe event type missing after verification.",
    });
    return sendJson(res, 400, { error: "Invalid Stripe payload." });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const membershipFields = deriveCheckoutSessionMembershipFields(event.data.object || {});
      ensureMembershipFields(event.type, membershipFields);
      await upsertProfileMembership(supabaseAdmin, membershipFields.userId, membershipFields);
      logWebhook("info", "checkout_session_completed_synced", {
        eventType: event.type,
        userId: membershipFields.userId,
        planTier: membershipFields.planTier,
        billingCycle: membershipFields.billingCycle,
      });
    } else if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      const membershipFields = deriveSubscriptionMembershipFields(event.data.object || {});
      ensureMembershipFields(event.type, membershipFields);
      await upsertProfileMembership(supabaseAdmin, membershipFields.userId, membershipFields);
      logWebhook("info", "subscription_synced", {
        eventType: event.type,
        userId: membershipFields.userId,
        planTier: membershipFields.planTier,
        billingCycle: membershipFields.billingCycle,
        membershipStatus: membershipFields.membershipStatus,
      });
    } else if (event.type === "customer.subscription.deleted") {
      const membershipFields = deriveSubscriptionMembershipFields(event.data.object || {});
      ensureMembershipFields(event.type, membershipFields);
      await upsertProfileMembership(supabaseAdmin, membershipFields.userId, {
        email: membershipFields.email,
        planTier: "free",
        membershipStatus: "free",
        billingCycle: "monthly",
      });
      logWebhook("info", "subscription_deleted_downgraded", {
        eventType: event.type,
        userId: membershipFields.userId,
      });
    } else {
      logWebhook("info", "ignored_event", {
        eventType: event.type,
      });
    }

    return sendJson(res, 200, { received: true });
  } catch (error) {
    const branch = error?.code === "missing_user_metadata" ? "missing_user_metadata" : "profile_update_failure";
    logWebhook("error", branch, {
      eventType: event.type,
      message: String(error?.message || "Webhook handling failed."),
    });
    return sendJson(res, 500, { error: "Webhook handling failed." });
  }
}
