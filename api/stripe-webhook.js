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

function normalizePotentialUserId(rawUserId) {
  const value = String(rawUserId || "").trim();
  if (!value) return "";
  const lowered = value.toLowerCase();
  if (lowered === "undefined" || lowered === "null" || lowered === "nan") {
    return "";
  }
  return value;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "").trim());
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

function getSupabaseFunctionBaseUrl() {
  const supabaseUrl = String(process.env.SUPABASE_URL || "").trim().replace(/\/+$/g, "");
  return supabaseUrl ? `${supabaseUrl}/functions/v1` : "";
}

async function sendSubscriptionConfirmedEmail({ to, planTier, billingCycle }) {
  const supabaseFunctionBaseUrl = getSupabaseFunctionBaseUrl();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!supabaseFunctionBaseUrl || !serviceRoleKey) {
    const error = new Error("Missing Supabase function configuration for transactional email.");
    error.code = "missing_email_env";
    throw error;
  }

  const normalizedTo = String(to || "").trim().toLowerCase();
  if (!normalizedTo) {
    const error = new Error("Missing recipient email for subscription confirmation.");
    error.code = "missing_email_recipient";
    throw error;
  }

  const response = await fetch(`${supabaseFunctionBaseUrl}/send-transactional-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
    body: JSON.stringify({
      to: normalizedTo,
      template_type: "subscription_confirmed",
      template_data: {
        planTier: normalizePlanTier(planTier),
        billingCycle: normalizeBillingCycle(billingCycle),
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(String(payload?.error || "Failed to send subscription confirmation email."));
    error.code = "subscription_email_failed";
    throw error;
  }
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

  const existing = await supabaseAdmin
    .from("profiles")
    .select("id,email,affiliate_approved")
    .eq("id", normalizedUserId)
    .maybeSingle();
  if (existing.error) throw existing.error;

  if (existing.data) {
    const isAffiliateApproved = Boolean(existing.data.affiliate_approved);
    const updatePayload = {
      ...payload,
      ...(isAffiliateApproved
        ? {
            // Affiliate-approved users should keep Creator access regardless of Stripe plan events.
            plan_tier: "creator",
            membership_status: "active",
            billing_cycle: "monthly",
          }
        : {}),
    };
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

function isProfilesForeignKeyError(error) {
  const message = String(error?.message || "").toLowerCase();
  const details = String(error?.details || "").toLowerCase();
  const code = String(error?.code || "").trim();
  return (
    code === "23503" &&
    (message.includes("profiles_id_fkey") || details.includes("profiles_id_fkey") || message.includes("foreign key constraint"))
  );
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

function deriveInvoiceEmailFields(invoice) {
  const line = Array.isArray(invoice?.lines?.data) ? invoice.lines.data[0] : null;
  const priceId = String(line?.price?.id || "").trim();
  const fromPrice = resolvePlanFromPriceId(priceId);
  return {
    email: String(invoice?.customer_email || invoice?.customer_details?.email || "").trim().toLowerCase(),
    planTier: normalizePlanTier(fromPrice.planTier),
    billingCycle: normalizeBillingCycle(line?.price?.recurring?.interval || fromPrice.billingCycle),
  };
}

async function resolveInvoiceRecipientEmail(stripe, invoice) {
  const directEmail = String(invoice?.customer_email || invoice?.customer_details?.email || "").trim().toLowerCase();
  if (directEmail) return directEmail;

  const customerId = String(invoice?.customer || "").trim();
  if (!customerId) return "";

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer && !("deleted" in customer && customer.deleted)) {
      return String(customer?.email || "").trim().toLowerCase();
    }
  } catch (error) {
    logWebhook("warn", "invoice_customer_lookup_failed", {
      eventType: "invoice.paid",
      customerId,
      message: String(error?.message || "Unable to look up Stripe customer email."),
    });
  }

  return "";
}

function deriveCheckoutSessionMembershipFields(session) {
  const metadata = session?.metadata && typeof session.metadata === "object" ? session.metadata : {};
  return {
    userId: normalizePotentialUserId(metadata.supabase_user_id || session?.client_reference_id || ""),
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
  if (!isUuid(membershipFields.userId)) {
    const error = new Error("Invalid user metadata for membership sync.");
    error.code = "invalid_user_metadata";
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
    } else if (event.type === "invoice.paid") {
      const invoice = event.data.object || {};
      const invoiceFields = deriveInvoiceEmailFields(invoice);
      if (!invoiceFields.email) {
        invoiceFields.email = await resolveInvoiceRecipientEmail(stripe, invoice);
      }
      if (!invoiceFields.email) {
        logWebhook("warn", "invoice_paid_missing_email", {
          eventType: event.type,
          invoiceId: String(event?.data?.object?.id || "").trim(),
        });
        return sendJson(res, 200, { received: true, ignored: true });
      }
      await sendSubscriptionConfirmedEmail({
        to: invoiceFields.email,
        planTier: invoiceFields.planTier,
        billingCycle: invoiceFields.billingCycle,
      });
      logWebhook("info", "invoice_paid_subscription_email_sent", {
        eventType: event.type,
        invoiceId: String(event?.data?.object?.id || "").trim(),
        email: invoiceFields.email,
        planTier: invoiceFields.planTier,
        billingCycle: invoiceFields.billingCycle,
      });
    } else {
      logWebhook("info", "ignored_event", {
        eventType: event.type,
      });
    }

    return sendJson(res, 200, { received: true });
  } catch (error) {
    const isMetadataIssue = error?.code === "missing_user_metadata" || error?.code === "invalid_user_metadata";
    const isCheckoutAuthRace =
      event?.type === "checkout.session.completed" && isProfilesForeignKeyError(error);
    const branch = isMetadataIssue ? String(error.code) : "profile_update_failure";

    if (isMetadataIssue) {
      logWebhook("warn", branch, {
        eventType: event.type,
        message: String(error?.message || "Membership metadata issue."),
      });
      return sendJson(res, 200, { received: true, ignored: true });
    }

    if (isCheckoutAuthRace) {
      logWebhook("warn", "checkout_profile_fk_blocked", {
        eventType: event.type,
        message: String(error?.message || "Checkout profile update blocked by FK."),
      });
      return sendJson(res, 200, { received: true, ignored: true });
    }

    logWebhook("error", branch, {
      eventType: event.type,
      message: String(error?.message || "Webhook handling failed."),
    });
    return sendJson(res, 500, { error: "Webhook handling failed." });
  }
}
