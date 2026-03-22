const STRIPE_API_BASE = "https://api.stripe.com/v1";

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : {};
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
  if (!normalizedPriceId) return "free";
  const priceMap = [
    ["solo", "monthly", "STRIPE_PRICE_SOLO_MONTHLY"],
    ["solo", "yearly", "STRIPE_PRICE_SOLO_YEARLY"],
    ["band", "monthly", "STRIPE_PRICE_BAND_MONTHLY"],
    ["band", "yearly", "STRIPE_PRICE_BAND_YEARLY"],
    ["creator", "monthly", "STRIPE_PRICE_CREATOR_MONTHLY"],
    ["creator", "yearly", "STRIPE_PRICE_CREATOR_YEARLY"],
  ];

  for (const [planTier, _billingCycle, envKey] of priceMap) {
    if (String(process.env[envKey] || "").trim() === normalizedPriceId) {
      return planTier;
    }
  }

  return "free";
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
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

async function findStripeCustomer({ secretKey, userEmail, userId }) {
  const query = new URLSearchParams();
  query.set("email", String(userEmail || "").trim().toLowerCase());
  query.set("limit", "20");

  const listedCustomers = await fetchStripeJson(`/customers?${query.toString()}`, { secretKey });
  if (!listedCustomers.response.ok) {
    throw new Error(String(listedCustomers.payload?.error?.message || "Unable to look up Stripe customer."));
  }

  const customers = Array.isArray(listedCustomers.payload?.data) ? listedCustomers.payload.data : [];
  if (!customers.length) return null;
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) return customers[0];
  return customers.find((customer) => String(customer?.metadata?.supabase_user_id || "").trim() === normalizedUserId) || null;
}

async function getActiveSubscription({ secretKey, customerId }) {
  const query = new URLSearchParams();
  query.set("customer", String(customerId || "").trim());
  query.set("status", "all");
  query.set("limit", "20");

  const listedSubscriptions = await fetchStripeJson(`/subscriptions?${query.toString()}`, { secretKey });
  if (!listedSubscriptions.response.ok) {
    throw new Error(String(listedSubscriptions.payload?.error?.message || "Unable to look up Stripe subscriptions."));
  }

  const subscriptions = Array.isArray(listedSubscriptions.payload?.data) ? listedSubscriptions.payload.data : [];
  return (
    subscriptions.find((subscription) => {
      const status = String(subscription?.status || "").trim().toLowerCase();
      return status === "active" || status === "trialing";
    }) || null
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const stripeSecretKey = String(process.env.STRIPE_SECRET_KEY || "").trim();
  if (!stripeSecretKey) {
    return sendJson(res, 500, { error: "Stripe is not configured." });
  }

  let body = {};
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: "Invalid request payload." });
  }

  const userEmail = String(body?.userEmail || "").trim().toLowerCase();
  const userId = String(body?.userId || "").trim();
  if (!userEmail) {
    return sendJson(res, 400, { error: "Missing account email." });
  }

  try {
    const customer = await findStripeCustomer({
      secretKey: stripeSecretKey,
      userEmail,
      userId,
    });
    if (!customer?.id) {
      return sendJson(res, 404, { error: "No matching Stripe customer found for this account." });
    }

    const subscription = await getActiveSubscription({
      secretKey: stripeSecretKey,
      customerId: String(customer.id || "").trim(),
    });
    if (!subscription) {
      return sendJson(res, 200, {
        planId: "free",
        billingCycle: "monthly",
        renewalDate: "",
        memberSinceDate: "",
      });
    }

    const price = subscription?.items?.data?.[0]?.price || null;
    const planId = normalizePlanTier(resolvePlanFromPriceId(String(price?.id || "").trim()));
    const billingCycle = normalizeBillingCycle(price?.recurring?.interval);
    const renewalDate = Number(subscription?.current_period_end) > 0
      ? new Date(Number(subscription.current_period_end) * 1000).toISOString()
      : "";
    const memberSinceDate = Number(subscription?.start_date) > 0
      ? new Date(Number(subscription.start_date) * 1000).toISOString()
      : "";

    return sendJson(res, 200, {
      planId,
      billingCycle,
      renewalDate,
      memberSinceDate,
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: String(error?.message || "Unable to load subscription summary."),
    });
  }
}
