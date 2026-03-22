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
  if (!normalizedUserId) return customers[0] || null;

  return customers.find((customer) => String(customer?.metadata?.supabase_user_id || "").trim() === normalizedUserId) || customers[0] || null;
}

function normalizeInvoiceStatus(invoice) {
  const status = String(invoice?.status || "").trim().toLowerCase();
  if (status === "paid") return "paid";
  if (Number(invoice?.amount_refunded || 0) > 0) return "refunded";
  if (status === "open" || status === "draft") {
    const dueDateEpoch = Number(invoice?.due_date || 0);
    if (dueDateEpoch > 0 && dueDateEpoch * 1000 > Date.now()) return "upcoming";
    return "open";
  }
  return "open";
}

function toIsoFromEpochSeconds(seconds) {
  const value = Number(seconds || 0);
  if (!value || value <= 0) return "";
  return new Date(value * 1000).toISOString();
}

function normalizeCardBrand(rawBrand) {
  const brand = String(rawBrand || "").trim();
  if (!brand) return "Card";
  return brand.slice(0, 1).toUpperCase() + brand.slice(1);
}

function formatDefaultPaymentMethod(paymentMethod) {
  if (!paymentMethod || typeof paymentMethod !== "object") return "";
  const type = String(paymentMethod.type || "").trim().toLowerCase();
  if (type === "card") {
    const brand = normalizeCardBrand(paymentMethod?.card?.brand);
    const last4 = String(paymentMethod?.card?.last4 || "").trim();
    if (last4) return `${brand} •••• ${last4}`;
    return brand;
  }
  if (!type) return "";
  return type.slice(0, 1).toUpperCase() + type.slice(1);
}

async function getCustomerWithDefaultPaymentMethod({ secretKey, customerId }) {
  const query = new URLSearchParams();
  query.append("expand[]", "invoice_settings.default_payment_method");
  const result = await fetchStripeJson(`/customers/${encodeURIComponent(String(customerId || "").trim())}?${query.toString()}`, {
    secretKey,
  });

  if (!result.response.ok) {
    throw new Error(String(result.payload?.error?.message || "Unable to load customer billing details."));
  }

  return result.payload || null;
}

async function getActiveSubscriptionWithPaymentMethod({ secretKey, customerId }) {
  const query = new URLSearchParams();
  query.set("customer", String(customerId || "").trim());
  query.set("status", "all");
  query.set("limit", "20");
  query.append("expand[]", "data.default_payment_method");

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

async function listInvoices({ secretKey, customerId, limit = 12 }) {
  const query = new URLSearchParams();
  query.set("customer", String(customerId || "").trim());
  query.set("limit", String(Math.max(1, Math.min(50, Number(limit) || 12))));

  const result = await fetchStripeJson(`/invoices?${query.toString()}`, { secretKey });
  if (!result.response.ok) {
    throw new Error(String(result.payload?.error?.message || "Unable to load invoice history."));
  }

  const rows = Array.isArray(result.payload?.data) ? result.payload.data : [];
  return rows.map((invoice) => ({
    id: String(invoice?.number || invoice?.id || "").trim() || String(invoice?.id || "").trim(),
    createdAt: toIsoFromEpochSeconds(invoice?.created),
    amountCents: Number(invoice?.total || 0),
    currency: String(invoice?.currency || "usd").toUpperCase(),
    status: normalizeInvoiceStatus(invoice),
    hostedInvoiceUrl: String(invoice?.hosted_invoice_url || "").trim(),
    invoicePdf: String(invoice?.invoice_pdf || "").trim(),
  }));
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
      return sendJson(res, 200, {
        billingEmail: userEmail,
        defaultPaymentMethod: "",
        invoices: [],
      });
    }

    const customerId = String(customer.id || "").trim();
    const [fullCustomer, activeSubscription, invoices] = await Promise.all([
      getCustomerWithDefaultPaymentMethod({ secretKey: stripeSecretKey, customerId }),
      getActiveSubscriptionWithPaymentMethod({ secretKey: stripeSecretKey, customerId }),
      listInvoices({ secretKey: stripeSecretKey, customerId, limit: 12 }),
    ]);

    const subscriptionPaymentMethod =
      activeSubscription && typeof activeSubscription.default_payment_method === "object"
        ? activeSubscription.default_payment_method
        : null;
    const customerPaymentMethod =
      fullCustomer && typeof fullCustomer?.invoice_settings?.default_payment_method === "object"
        ? fullCustomer.invoice_settings.default_payment_method
        : null;

    const defaultPaymentMethod = formatDefaultPaymentMethod(subscriptionPaymentMethod || customerPaymentMethod);
    const billingEmail = String(fullCustomer?.email || customer?.email || userEmail).trim().toLowerCase();

    return sendJson(res, 200, {
      billingEmail,
      defaultPaymentMethod,
      invoices,
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: String(error?.message || "Unable to load billing details."),
    });
  }
}
