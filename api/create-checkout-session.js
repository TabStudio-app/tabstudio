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

function planRank(planTier) {
  if (planTier === "creator") return 3;
  if (planTier === "band") return 2;
  if (planTier === "solo") return 1;
  return 0;
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
  return configured || getRequestOrigin(req) || "";
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

async function fetchStripeJson(path, { method = "GET", secretKey, form = null, extraHeaders = {} } = {}) {
  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...extraHeaders,
    },
    body: form,
  });
  const payload = await response.json();
  return { response, payload };
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
  if (userId) {
    form.set("metadata[supabase_user_id]", userId);
  }

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

async function getActiveStripeSubscription({ secretKey, customerId }) {
  const query = new URLSearchParams();
  query.set("customer", String(customerId || "").trim());
  query.set("status", "all");
  query.set("limit", "20");
  const listedSubscriptions = await fetchStripeJson(`/subscriptions?${query.toString()}`, { secretKey });
  if (!listedSubscriptions.response.ok) {
    throw new Error(String(listedSubscriptions.payload?.error?.message || "Unable to look up Stripe subscriptions."));
  }
  const subscriptions = Array.isArray(listedSubscriptions.payload?.data) ? listedSubscriptions.payload.data : [];
  return subscriptions.find((subscription) => {
    const status = String(subscription?.status || "").trim().toLowerCase();
    return status === "active" || status === "trialing";
  }) || null;
}

async function createSubscriptionUpdatePortalSession({
  secretKey,
  customerId,
  subscriptionId,
  subscriptionItemId,
  targetPriceId,
  returnUrl,
} = {}) {
  const form = new URLSearchParams();
  form.set("customer", String(customerId || "").trim());
  form.set("return_url", String(returnUrl || "").trim());
  form.set("flow_data[type]", "subscription_update_confirm");
  form.set("flow_data[subscription_update_confirm][subscription]", String(subscriptionId || "").trim());
  form.set("flow_data[subscription_update_confirm][items][0][id]", String(subscriptionItemId || "").trim());
  form.set("flow_data[subscription_update_confirm][items][0][price]", String(targetPriceId || "").trim());
  form.set("flow_data[subscription_update_confirm][items][0][quantity]", "1");

  const portalSession = await fetchStripeJson("/billing_portal/sessions", {
    method: "POST",
    secretKey,
    form,
  });

  if (!portalSession.response.ok) {
    throw new Error(String(portalSession.payload?.error?.message || "Unable to create plan update session."));
  }

  const url = String(portalSession.payload?.url || "").trim();
  if (!url) {
    throw new Error("Plan update session did not return a redirect URL.");
  }

  return { url };
}

async function resolveCheckoutIdentity({ accessToken, pendingAuthUserId, pendingAuthEmail }) {
  const normalizedPendingUserId = String(pendingAuthUserId || "").trim();
  const normalizedPendingEmail = String(pendingAuthEmail || "").trim().toLowerCase();

  if (!normalizedPendingEmail) {
    throw new Error("A valid email is required before checkout can begin.");
  }

  return {
    userId: normalizedPendingUserId,
    userEmail: normalizedPendingEmail,
    hasAccessToken: Boolean(String(accessToken || "").trim()),
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const stripeSecretKey = String(process.env.STRIPE_SECRET_KEY || "").trim();
  if (!stripeSecretKey) {
    return sendJson(res, 500, { error: "Stripe checkout is not configured." });
  }

  const authHeader = String(req.headers.authorization || "").trim();
  const accessToken = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
  const checkoutRequestKey = String(req.headers["x-checkout-request-key"] || "").trim();

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
  if (!appUrl) {
    return sendJson(res, 500, { error: "Unable to determine the application URL for checkout." });
  }

  try {
    console.info("[create-checkout-session] request", {
      hasAccessToken: Boolean(accessToken),
      checkoutRequestKey,
      pendingAuthUserId: String(body?.pendingAuthUserId || "").trim(),
      pendingAuthEmail: String(body?.pendingAuthEmail || "").trim().toLowerCase(),
      planTier,
      billingCycle,
    });
    const { userId, userEmail } = await resolveCheckoutIdentity({
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
    const existingSubscription = await getActiveStripeSubscription({
      secretKey: stripeSecretKey,
      customerId: stripeCustomerId,
    });
    const existingSubscriptionItem = Array.isArray(existingSubscription?.items?.data) ? existingSubscription.items.data[0] : null;
    const existingPriceId = String(existingSubscriptionItem?.price?.id || "").trim();
    const existingPlanTier = resolvePlanFromPriceId(existingPriceId);
    const existingPlanRank = planRank(existingPlanTier);
    const requestedPlanRank = planRank(planTier);

    if (
      existingSubscription?.id &&
      existingSubscriptionItem?.id &&
      existingPlanRank > 0 &&
      requestedPlanRank > 0 &&
      existingPlanTier !== planTier
    ) {
      const portalReturnUrl = `${appUrl}/account`;
      const planSwitch = await createSubscriptionUpdatePortalSession({
        secretKey: stripeSecretKey,
        customerId: stripeCustomerId,
        subscriptionId: String(existingSubscription.id || "").trim(),
        subscriptionItemId: String(existingSubscriptionItem.id || "").trim(),
        targetPriceId: priceId,
        returnUrl: portalReturnUrl,
      });
      console.info("[create-checkout-session] existing-subscription-plan-switch", {
        userId,
        customerId: stripeCustomerId,
        existingPlanTier,
        requestedPlanTier: planTier,
        switchDirection: requestedPlanRank > existingPlanRank ? "upgrade" : "downgrade",
      });
      return sendJson(res, 200, {
        url: planSwitch.url,
      });
    }

    const form = new URLSearchParams();
    form.set("mode", "subscription");
    form.set("customer", stripeCustomerId);
    form.set("success_url", `${appUrl}${successPath}?session_id={CHECKOUT_SESSION_ID}`);
    form.set("cancel_url", `${appUrl}${cancelPath}`);
    form.set("line_items[0][price]", priceId);
    form.set("line_items[0][quantity]", "1");
    form.set("metadata[email]", userEmail);
    form.set("metadata[plan_tier]", planTier);
    form.set("metadata[billing_cycle]", billingCycle);
    form.set("subscription_data[metadata][email]", userEmail);
    form.set("subscription_data[metadata][plan_tier]", planTier);
    form.set("subscription_data[metadata][billing_cycle]", billingCycle);
    if (userId) {
      form.set("client_reference_id", userId);
      form.set("metadata[supabase_user_id]", userId);
      form.set("subscription_data[metadata][supabase_user_id]", userId);
    }

    const checkoutSession = await fetchStripeJson("/checkout/sessions", {
      method: "POST",
      secretKey: stripeSecretKey,
      form,
      extraHeaders: checkoutRequestKey ? { "Idempotency-Key": checkoutRequestKey } : {},
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
    const message = String(error?.message || "Unable to create checkout session.");
    console.error("[create-checkout-session] failed", {
      error: message,
      hasAccessToken: Boolean(accessToken),
      checkoutRequestKey,
      pendingAuthUserId: String(body?.pendingAuthUserId || "").trim(),
      pendingAuthEmail: String(body?.pendingAuthEmail || "").trim().toLowerCase(),
      planTier,
      billingCycle,
    });
    return sendJson(res, 400, {
      error: message,
    });
  }
}
