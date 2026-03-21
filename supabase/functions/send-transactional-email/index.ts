import "@supabase/functions-js/edge-runtime.d.ts"
import nodemailer from "npm:nodemailer"
import {
  buildEmailTemplate,
  isSupportedTemplateType,
  type TemplateData,
} from "./emailTemplates.ts"

const jsonHeaders = { "Content-Type": "application/json" }

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
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
    if (req.method !== "POST") {
      return jsonResponse(405, { success: false, error: "Method not allowed" })
    }

    const functionSecret = getRequiredEnv("FUNCTION_SECRET")
    const incomingSecret = req.headers.get("X-Function-Secret")

    if (!incomingSecret || incomingSecret !== functionSecret) {
      return jsonResponse(401, { success: false, error: "Unauthorized" })
    }

    let payload: unknown
    try {
      payload = await req.json()
    } catch {
      return jsonResponse(400, { success: false, error: "Invalid JSON body" })
    }

    const { to, type, data } = payload as {
      to?: unknown
      type?: unknown
      data?: unknown
    }

    if (typeof to !== "string" || !to.trim()) {
      return jsonResponse(400, { success: false, error: "Invalid 'to' field" })
    }

    if (typeof type !== "string" || !type.trim()) {
      return jsonResponse(400, {
        success: false,
        error: "Invalid 'type' field",
      })
    }

    if (!isSupportedTemplateType(type)) {
      return jsonResponse(400, {
        success: false,
        error: "Unsupported email type",
      })
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

    const template = buildEmailTemplate(type, (data ?? {}) as TemplateData)

    const info = await transporter.sendMail({
      from: `${fromName} <${fromAddress}>`,
      to: to.trim(),
      subject: template.subject,
      html: template.html,
    })

    return jsonResponse(200, {
      success: true,
      type,
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
