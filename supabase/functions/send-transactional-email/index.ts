import "@supabase/functions-js/edge-runtime.d.ts"
import nodemailer from "npm:nodemailer"

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
  return value
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders })
    }

    if (req.method !== "POST") {
      return jsonResponse(405, { success: false, error: "Method not allowed" })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return jsonResponse(400, { success: false, error: "Invalid JSON body" })
    }

    const { to, subject, html, from } = body as {
      to?: unknown
      subject?: unknown
      html?: unknown
      from?: unknown
    }
    console.log("EMAIL HTML RECEIVED:", html)

    if (typeof to !== "string" || !to.trim()) {
      return jsonResponse(400, { success: false, error: "Invalid 'to' field" })
    }

    const host = getRequiredEnv("ZOHO_SMTP_HOST")
    const portRaw = getRequiredEnv("ZOHO_SMTP_PORT")
    const user = getRequiredEnv("ZOHO_SMTP_USER")
    const pass = getRequiredEnv("ZOHO_SMTP_PASS")
    const fromName = getRequiredEnv("EMAIL_FROM_NAME")
    const fromAddress = getRequiredEnv("EMAIL_FROM_ADDRESS")

    const port = Number(portRaw)
    if (!Number.isInteger(port) || port <= 0) {
      throw new Error("Invalid ZOHO_SMTP_PORT: must be a positive integer")
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    })

    const resolvedSubject =
      typeof subject === "string" && subject.trim()
      ? subject.trim()
      : "New Notification"

    const resolvedHtml =
      typeof html === "string" && html.trim()
      ? html
      : "<p>No content provided</p>"

    const resolvedFrom =
      typeof from === "string" && from.trim()
        ? from.trim()
        : `${fromName} <${fromAddress}>`

    const info = await transporter.sendMail({
      from: resolvedFrom,
      to: to.trim(),
      subject: resolvedSubject,
      html: resolvedHtml,
    })

    return jsonResponse(200, {
      success: true,
      to: to.trim(),
      messageId: info.messageId,
    })
  } catch (error) {
    console.error("send-transactional-email error", error)

    if (
      error instanceof Error &&
      error.message.startsWith("Missing required environment variable:")
    ) {
      return jsonResponse(500, {
        success: false,
        error: error.message,
      })
    }

    if (error instanceof Error && error.message.startsWith("Invalid ZOHO_SMTP_PORT")) {
      return jsonResponse(500, {
        success: false,
        error: error.message,
      })
    }

    return jsonResponse(500, {
      success: false,
      error: "Failed to send email",
    })
  }
})
