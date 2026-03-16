import { supabase } from "../lib/supabaseClient";

export async function createStripeCheckoutSession({
  planTier,
  billingCycle,
  successPath = "/success",
  cancelPath = "/checkout",
} = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = String(session?.access_token || "").trim();
  if (!accessToken) {
    throw new Error("You must be signed in before starting checkout.");
  }

  const response = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      planTier,
      billingCycle,
      successPath,
      cancelPath,
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
