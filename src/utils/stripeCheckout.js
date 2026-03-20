import { supabase } from "../lib/supabaseClient";

export async function createStripeCheckoutSession({
  planTier,
  billingCycle,
  successPath = "/success",
  cancelPath = "/checkout",
  pendingAuthUserId = "",
  pendingAuthEmail = "",
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

  const response = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({
      planTier,
      billingCycle,
      successPath,
      cancelPath,
      pendingAuthUserId: normalizedPendingAuthUserId,
      pendingAuthEmail: normalizedPendingAuthEmail,
    }),
  });

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
