const STRIPE_API_BASE = "https://api.stripe.com/v1";

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function getRequestOrigin(req) {
  const explicitOrigin = String(req.headers.origin || "").trim();
  if (explicitOrigin) return explicitOrigin;
  const proto = String(req.headers["x-forwarded-proto"] || "https").trim();
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").trim();
  return host ? `${proto}://${host}` : "";
}

function normalizeReturnUrl(req, returnPath) {
  const origin = getRequestOrigin(req);
  const requestedPath = String(returnPath || "/account/billing").trim() || "/account/billing";
  try {
    return new URL(requestedPath, origin || "https://tabstudio.app").toString();
  } catch {
    return new URL("/account/billing", origin || "https://tabstudio.app").toString();
  }
}

function resolveStripeCustomerIdForUser(userEmail) {
  const normalizedEmail = String(userEmail || "").trim().toLowerCase();
  if (!normalizedEmail) return "";

  const rawMap = String(process.env.TABSTUDIO_STRIPE_CUSTOMER_MAP || "").trim();
  if (rawMap) {
    try {
      const parsed = JSON.parse(rawMap);
      const mapped = parsed?.[normalizedEmail];
      if (mapped) return String(mapped).trim();
    } catch {
      // Ignore malformed env and fall through to dev fallback.
    }
  }

  return String(process.env.TABSTUDIO_DEV_STRIPE_CUSTOMER_ID || "").trim();
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const stripeSecretKey = String(process.env.STRIPE_SECRET_KEY || "").trim();
  if (!stripeSecretKey) {
    return sendJson(res, 500, { error: "Stripe billing portal is not configured." });
  }

  let body = {};
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: "Invalid request payload." });
  }

  const userEmail = String(body?.userEmail || "").trim().toLowerCase();
  const stripeCustomerId = resolveStripeCustomerIdForUser(userEmail);
  if (!stripeCustomerId) {
    return sendJson(res, 404, { error: "No Stripe customer was found for this account." });
  }

  const returnUrl = normalizeReturnUrl(req, body?.returnPath || "/account/billing");
  const form = new URLSearchParams();
  form.set("customer", stripeCustomerId);
  form.set("return_url", returnUrl);

  try {
    const stripeResponse = await fetch(`${STRIPE_API_BASE}/billing_portal/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });

    const stripePayload = await stripeResponse.json();
    if (!stripeResponse.ok) {
      const message = String(stripePayload?.error?.message || "Unable to create billing portal session.");
      return sendJson(res, stripeResponse.status, { error: message });
    }

    return sendJson(res, 200, {
      url: stripePayload.url,
    });
  } catch {
    return sendJson(res, 500, { error: "Unable to reach Stripe right now." });
  }
}
