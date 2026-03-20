import { createClient } from "@supabase/supabase-js";

const STRIPE_API_BASE = "https://api.stripe.com/v1";

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function normalizePlanTier(rawPlanTier) {
  const value = String(rawPlanTier || "").trim().toLowerCase();
  if (value === "solo" || value === "band" || value === "creator") return value;
  return "";
}

function normalizeBillingCycle(rawBillingCycle) {
  const value = String(rawBillingCycle || "").trim().toLowerCase();
  return value === "yearly" ? "yearly" : value === "monthly" ? "monthly" : "";
}

function resolvePriceEnvKey(planTier, billingCycle) {
  const plan = normalizePlanTier(planTier);
  const cycle = normalizeBillingCycle(billingCycle);
  if (!plan || !cycle) return "";
  return `STRIPE_PRICE_${plan.toUpperCase()}_${cycle.toUpperCase()}`;
}

function getRequestOrigin(req) {
  const explicitOrigin = String(req.headers.origin || "").trim();
  if (explicitOrigin) return explicitOrigin;
  const proto = String(req.headers["x-forwarded-proto"] || "https").trim();
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").trim();
  return host ? `${proto}://${host}` : "";
}

function getAppUrl(req) {
  const configured = String(process.env.APP_URL || "").trim().replace(/\/+$/g, "");
  return configured || getRequestOrigin(req) || "http://localhost:5173";
}

function normalizeAppPath(rawPath, fallbackPath) {
  const value = String(rawPath || "").trim();
  if (!value) return fallbackPath;
  if (value.startsWith("/")) return value;
  try {
    return new URL(value).pathname || fallbackPath;
  } catch {
    return fallbackPath;
  }
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : {};
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

async function fetchStripeJson(path, { method = "GET", secretKey, form = null } = {}) {
  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: form,
  });
  const payload = await response.json();
  return { response, payload };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findOrCreateStripeCustomer({ secretKey, userId, email }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const query = new URLSearchParams();
  query.set("email", normalizedEmail);
  query.set("limit", "10");

  const listedCustomers = await fetchStripeJson(`/customers?${query.toString()}`, { secretKey });
  if (!listedCustomers.response.ok) {
    throw new Error(String(listedCustomers.payload?.error?.message || "Unable to look up Stripe customer."));
  }

  const matchingCustomers = Array.isArray(listedCustomers.payload?.data) ? listedCustomers.payload.data : [];
  const exactMatch =
    matchingCustomers.find((customer) => String(customer?.metadata?.supabase_user_id || "") === userId) || matchingCustomers[0] || null;
  if (exactMatch?.id) return exactMatch.id;

  const form = new URLSearchParams();
  form.set("email", normalizedEmail);
  form.set("metadata[supabase_user_id]", userId);

  const createdCustomer = await fetchStripeJson("/customers", {
    method: "POST",
    secretKey,
    form,
  });

  if (!createdCustomer.response.ok) {
    throw new Error(String(createdCustomer.payload?.error?.message || "Unable to create Stripe customer."));
  }

  return String(createdCustomer.payload?.id || "").trim();
}

async function resolveCheckoutIdentity({ supabaseAdmin, accessToken, pendingAuthUserId, pendingAuthEmail }) {
  const normalizedPendingUserId = String(pendingAuthUserId || "").trim();
  const normalizedPendingEmail = String(pendingAuthEmail || "").trim().toLowerCase();

  if (accessToken) {
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !user?.id) {
      throw new Error("Unable to verify authenticated user.");
    }
    return {
      userId: String(user.id || "").trim(),
      userEmail: String(user.email || "").trim().toLowerCase(),
    };
  }

  if (!normalizedPendingUserId || !normalizedPendingEmail) {
    throw new Error("Authentication is required.");
  }

  let resolvedPendingUser = null;
  let pendingLookupError = null;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(normalizedPendingUserId);
    if (!error && data?.user?.id) {
      resolvedPendingUser = data.user;
      pendingLookupError = null;
      break;
    }

    pendingLookupError = error || new Error("Pending user not found.");
    console.warn("[create-checkout-session] pending-account-lookup-retry", {
      attempt,
      pendingAuthUserId: normalizedPendingUserId,
      pendingAuthEmail: normalizedPendingEmail,
      error: String(pendingLookupError?.message || pendingLookupError || "Unknown error"),
    });

    if (attempt < 5) {
      await delay(300);
    }
  }

  if (!resolvedPendingUser?.id) {
    throw new Error("Unable to verify your pending account yet. Please try again.");
  }

  const resolvedEmail = String(resolvedPendingUser.email || "").trim().toLowerCase();
  if (!resolvedEmail || resolvedEmail !== normalizedPendingEmail) {
    console.warn("[create-checkout-session] pending-account-email-mismatch", {
      pendingAuthUserId: normalizedPendingUserId,
      pendingAuthEmail: normalizedPendingEmail,
      resolvedEmail,
    });
    throw new Error("Your pending account email could not be verified.");
  }

  return {
    userId: String(resolvedPendingUser.id || "").trim(),
    userEmail: resolvedEmail,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const stripeSecretKey = String(process.env.STRIPE_SECRET_KEY || "").trim();
  const supabaseAdmin = buildSupabaseAdminClient();
  if (!stripeSecretKey || !supabaseAdmin) {
    return sendJson(res, 500, { error: "Stripe checkout is not configured." });
  }

  const authHeader = String(req.headers.authorization || "").trim();
  const accessToken = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";

  let body = {};
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: "Invalid request payload." });
  }

  const planTier = normalizePlanTier(body?.planTier);
  const billingCycle = normalizeBillingCycle(body?.billingCycle);
  const priceEnvKey = resolvePriceEnvKey(planTier, billingCycle);
  const priceId = String(process.env[priceEnvKey] || "").trim();
  if (!planTier || !billingCycle || !priceId) {
    return sendJson(res, 400, { error: "Invalid membership selection." });
  }

  const successPath = normalizeAppPath(body?.successPath, "/success");
  const cancelPath = normalizeAppPath(body?.cancelPath, "/checkout");
  const appUrl = getAppUrl(req);

  try {
    console.info("[create-checkout-session] request", {
      hasAccessToken: Boolean(accessToken),
      pendingAuthUserId: String(body?.pendingAuthUserId || "").trim(),
      pendingAuthEmail: String(body?.pendingAuthEmail || "").trim().toLowerCase(),
      planTier,
      billingCycle,
    });
    const { userId, userEmail } = await resolveCheckoutIdentity({
      supabaseAdmin,
      accessToken,
      pendingAuthUserId: body?.pendingAuthUserId,
      pendingAuthEmail: body?.pendingAuthEmail,
    });

    if (!userId || !userEmail) {
      return sendJson(res, 400, { error: "A valid account is required before checkout can begin." });
    }

    const stripeCustomerId = await findOrCreateStripeCustomer({
      secretKey: stripeSecretKey,
      userId,
      email: userEmail,
    });

    const form = new URLSearchParams();
    form.set("mode", "subscription");
    form.set("customer", stripeCustomerId);
    form.set("client_reference_id", userId);
    form.set("success_url", `${appUrl}${successPath}?session_id={CHECKOUT_SESSION_ID}`);
    form.set("cancel_url", `${appUrl}${cancelPath}`);
    form.set("line_items[0][price]", priceId);
    form.set("line_items[0][quantity]", "1");
    form.set("metadata[supabase_user_id]", userId);
    form.set("metadata[email]", userEmail);
    form.set("metadata[plan_tier]", planTier);
    form.set("metadata[billing_cycle]", billingCycle);
    form.set("subscription_data[metadata][supabase_user_id]", userId);
    form.set("subscription_data[metadata][email]", userEmail);
    form.set("subscription_data[metadata][plan_tier]", planTier);
    form.set("subscription_data[metadata][billing_cycle]", billingCycle);

    const checkoutSession = await fetchStripeJson("/checkout/sessions", {
      method: "POST",
      secretKey: stripeSecretKey,
      form,
    });

    if (!checkoutSession.response.ok) {
      return sendJson(res, checkoutSession.response.status, {
        error: String(checkoutSession.payload?.error?.message || "Unable to create checkout session."),
      });
    }

    return sendJson(res, 200, {
      url: checkoutSession.payload?.url || null,
    });
  } catch (error) {
    console.error("[create-checkout-session] failed", {
      error: String(error?.message || error || "Unknown error"),
      hasAccessToken: Boolean(accessToken),
      pendingAuthUserId: String(body?.pendingAuthUserId || "").trim(),
      pendingAuthEmail: String(body?.pendingAuthEmail || "").trim().toLowerCase(),
      planTier,
      billingCycle,
    });
    return sendJson(res, 500, {
      error: String(error?.message || "Unable to reach Stripe right now."),
    });
  }
}
