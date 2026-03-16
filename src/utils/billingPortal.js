export async function createBillingPortalSession({ userEmail, returnPath = "/account/billing" }) {
  const response = await fetch("/api/create-billing-portal-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userEmail,
      returnPath,
    }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = String(payload?.error || "Unable to open the billing portal right now.");
    throw new Error(message);
  }

  const portalUrl = String(payload?.url || "").trim();
  if (!portalUrl) {
    throw new Error("Billing portal URL was not returned.");
  }

  return {
    url: portalUrl,
  };
}
