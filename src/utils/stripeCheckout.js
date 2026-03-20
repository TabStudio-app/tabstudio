import { supabase } from "../lib/supabaseClient";

function buildCheckoutLaunchError(message, { retryable = false, code = "" } = {}) {
  const error = new Error(String(message || "Unable to start checkout."));
  error.retryable = retryable;
  error.code = code;
  return error;
}

export async function createStripeCheckoutSession({
  planTier,
  billingCycle,
  successPath = "/success",
  cancelPath = "/checkout",
  pendingAuthUserId = "",
  pendingAuthEmail = "",
  idempotencyKey = "",
  timeoutMs = 12000,
} = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = String(session?.access_token || "").trim();
  const normalizedPendingAuthUserId = String(pendingAuthUserId || "").trim();
  const normalizedPendingAuthEmail = String(pendingAuthEmail || "").trim().toLowerCase();
  if (!accessToken && (!normalizedPendingAuthUserId || !normalizedPendingAuthEmail)) {
    throw new Error("We couldn't prepare your account for checkout. Please create your account again.");
  }

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId =
    typeof window !== "undefined" && controller
      ? window.setTimeout(() => {
          controller.abort();
        }, timeoutMs)
      : null;

  let response;
  try {
    response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(idempotencyKey ? { "X-Checkout-Request-Key": String(idempotencyKey || "").trim() } : {}),
      },
      body: JSON.stringify({
        planTier,
        billingCycle,
        successPath,
        cancelPath,
        pendingAuthUserId: normalizedPendingAuthUserId,
        pendingAuthEmail: normalizedPendingAuthEmail,
      }),
      ...(controller ? { signal: controller.signal } : {}),
    });
  } catch (error) {
    if (timeoutId) window.clearTimeout(timeoutId);
    if (error?.name === "AbortError") {
      throw buildCheckoutLaunchError("Secure checkout is taking longer than expected.", {
        retryable: true,
        code: "timeout",
      });
    }
    throw buildCheckoutLaunchError("We couldn't reach secure checkout.", {
      retryable: true,
      code: "network",
    });
  }

  if (timeoutId) window.clearTimeout(timeoutId);

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String(payload?.error || "Unable to start checkout."));
  }

  const url = String(payload?.url || "").trim();
  if (!url) {
    throw new Error("Stripe checkout did not return a redirect URL.");
  }

  return { url };
}
