import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

type AffiliateNotificationPayload = {
  full_name?: unknown
  email?: unknown
  main_platform?: unknown
  following_band?: unknown
  creator_links?: unknown
  content_types?: unknown
  tab_usage?: unknown
  feature_plan?: unknown
  motivation?: unknown
  extra?: unknown
}

const jsonHeaders = { "Content-Type": "application/json" }
const resendUrl = "https://api.resend.com/emails"
const supportEmail = "support@tabstudio.app"
const subject = "New Affiliate Application 🚀"

function response(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders })
}

function valueOrFallback(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed || "(not provided)"
  }
  if (value === null || value === undefined) return "(not provided)"
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return "(unavailable)"
  }
}

function jsonField(value: unknown): string {
  if (value === null || value === undefined) return "(not provided)"
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return "(unavailable)"
  }
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return response(405, { success: false, error: "Method not allowed" })
    }

    let payload: AffiliateNotificationPayload
    try {
      payload = (await req.json()) as AffiliateNotificationPayload
    } catch {
      return response(400, { success: false, error: "Invalid JSON body" })
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY")?.trim()
    if (!resendApiKey) {
      return response(500, { success: false, error: "RESEND_API_KEY is not configured" })
    }

    const fullName = valueOrFallback(payload.full_name)
    const email = valueOrFallback(payload.email)
    const mainPlatform = valueOrFallback(payload.main_platform)
    const followingBand = valueOrFallback(payload.following_band)
    const creatorLinks = jsonField(payload.creator_links)
    const contentTypes = jsonField(payload.content_types)
    const tabUsage = jsonField(payload.tab_usage)
    const featurePlan = jsonField(payload.feature_plan)
    const motivation = jsonField(payload.motivation)
    const extra = valueOrFallback(payload.extra)

    const textBody = [
      "New affiliate application received.",
      "",
      `full_name: ${fullName}`,
      `email: ${email}`,
      `main_platform: ${mainPlatform}`,
      `following_band: ${followingBand}`,
      `creator_links: ${creatorLinks}`,
      `content_types: ${contentTypes}`,
      `tab_usage: ${tabUsage}`,
      `feature_plan: ${featurePlan}`,
      `motivation: ${motivation}`,
      `extra: ${extra}`,
    ].join("\n")

    const htmlBody = `
      <h2>New affiliate application received</h2>
      <p><strong>full_name:</strong> ${fullName}</p>
      <p><strong>email:</strong> ${email}</p>
      <p><strong>main_platform:</strong> ${mainPlatform}</p>
      <p><strong>following_band:</strong> ${followingBand}</p>
      <p><strong>creator_links:</strong></p>
      <pre>${creatorLinks}</pre>
      <p><strong>content_types:</strong></p>
      <pre>${contentTypes}</pre>
      <p><strong>tab_usage:</strong></p>
      <pre>${tabUsage}</pre>
      <p><strong>feature_plan:</strong></p>
      <pre>${featurePlan}</pre>
      <p><strong>motivation:</strong></p>
      <pre>${motivation}</pre>
      <p><strong>extra:</strong> ${extra}</p>
    `

    const resendResponse = await fetch(resendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TabStudio <noreply@tabstudio.app>",
        to: [supportEmail],
        subject,
        text: textBody,
        html: htmlBody,
      }),
    })

    const resendPayload = await resendResponse.json().catch(() => ({}))
    if (!resendResponse.ok) {
      console.error("Resend API error", resendPayload)
      return response(resendResponse.status, {
        success: false,
        error: "Failed to send affiliate notification email",
        details: resendPayload,
      })
    }

    return response(200, {
      success: true,
      message: "Affiliate notification email sent",
      id: resendPayload?.id ?? null,
    })
  } catch (error) {
    console.error("send-affiliate-notification error", error)
    return response(500, { success: false, error: "Internal server error" })
  }
})
