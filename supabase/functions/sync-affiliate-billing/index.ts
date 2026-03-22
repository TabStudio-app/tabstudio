const jsonHeaders = { "Content-Type": "application/json" }
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
}

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...jsonHeaders, ...corsHeaders },
  })
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value.trim()
}

async function stripeRequestJson(
  path: string,
  {
    secretKey,
    method = "GET",
    form,
  }: {
    secretKey: string
    method?: "GET" | "POST"
    form?: URLSearchParams
  },
) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    ...(form ? { body: form } : {}),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(String(payload?.error?.message || `Stripe request failed (${response.status})`))
  }
  return payload
}

function normalizeEmail(rawEmail: unknown): string {
  return typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : ""
}

type StripeCustomer = { id?: string | null; email?: string | null }
type StripeSubscription = {
  id?: string | null
  status?: string | null
  cancel_at_period_end?: boolean | null
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
    if (req.method !== "POST") return jsonResponse(405, { success: false, error: "Method not allowed" })

    let body: { email?: unknown } = {}
    try {
      body = await req.json()
    } catch {
      return jsonResponse(400, { success: false, error: "Invalid JSON body" })
    }

    const email = normalizeEmail(body.email)
    if (!email) return jsonResponse(400, { success: false, error: "Missing email" })

    const stripeSecretKey = getRequiredEnv("STRIPE_SECRET_KEY")

    const customersPayload = await stripeRequestJson(`/customers?email=${encodeURIComponent(email)}&limit=20`, {
      secretKey: stripeSecretKey,
    })
    const customers = Array.isArray(customersPayload?.data) ? (customersPayload.data as StripeCustomer[]) : []
    const customerIds = customers
      .map((customer) => String(customer?.id || "").trim())
      .filter((value) => Boolean(value))

    let canceledAtPeriodEndCount = 0
    let alreadyCanceledCount = 0
    let scannedSubscriptions = 0

    for (const customerId of customerIds) {
      const subscriptionsPayload = await stripeRequestJson(
        `/subscriptions?customer=${encodeURIComponent(customerId)}&status=all&limit=100`,
        {
          secretKey: stripeSecretKey,
        },
      )
      const subscriptions = Array.isArray(subscriptionsPayload?.data)
        ? (subscriptionsPayload.data as StripeSubscription[])
        : []

      for (const subscription of subscriptions) {
        const subscriptionId = String(subscription?.id || "").trim()
        const status = String(subscription?.status || "").trim().toLowerCase()
        if (!subscriptionId) continue

        scannedSubscriptions += 1
        if (status === "canceled" || status === "incomplete_expired") {
          alreadyCanceledCount += 1
          continue
        }

        if (subscription?.cancel_at_period_end) {
          alreadyCanceledCount += 1
          continue
        }

        const form = new URLSearchParams()
        form.set("cancel_at_period_end", "true")
        await stripeRequestJson(`/subscriptions/${encodeURIComponent(subscriptionId)}`, {
          secretKey: stripeSecretKey,
          method: "POST",
          form,
        })
        canceledAtPeriodEndCount += 1
      }
    }

    return jsonResponse(200, {
      success: true,
      email,
      customersFound: customerIds.length,
      subscriptionsScanned: scannedSubscriptions,
      subscriptionsUpdated: canceledAtPeriodEndCount,
      alreadyCanceledOrEnding: alreadyCanceledCount,
    })
  } catch (error) {
    console.error("sync-affiliate-billing error", error)
    return jsonResponse(500, {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
})
