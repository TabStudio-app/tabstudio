import "@supabase/functions-js/edge-runtime.d.ts"
import nodemailer from "npm:nodemailer"
import { buildEmailTemplate, isSupportedTemplateType, type TemplateData } from "./emailTemplates.ts"

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
      template_type?: unknown
      template_data?: unknown
    }
    const { template_type, template_data } = body as {
      template_type?: unknown
      template_data?: unknown
    }

    if (typeof to !== "string" || !to.trim()) {
      return jsonResponse(400, { success: false, error: "Invalid 'to' field" })
    }

    const hasTemplateType = template_type !== undefined && template_type !== null
    let resolvedSubject: string
    let resolvedHtml: string
    let responseMode: "raw" | "template"

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

    if (hasTemplateType) {
      if (typeof template_type !== "string" || !template_type.trim()) {
        return jsonResponse(400, {
          success: false,
          error: "Invalid 'template_type' field",
        })
      }

      const normalizedTemplateType = template_type.trim()
      if (!isSupportedTemplateType(normalizedTemplateType)) {
        return jsonResponse(400, {
          success: false,
          error: "Unsupported 'template_type' value",
          template_type: normalizedTemplateType,
        })
      }

      if (
        template_data !== undefined &&
        (
          typeof template_data !== "object" ||
          template_data === null ||
          Array.isArray(template_data)
        )
      ) {
        return jsonResponse(400, {
          success: false,
          error: "Invalid 'template_data' field: expected an object",
        })
      }

      const builtTemplate = buildEmailTemplate(
        normalizedTemplateType,
        (template_data ?? {}) as TemplateData,
      )

      resolvedSubject = builtTemplate.subject
      resolvedHtml = builtTemplate.html
      responseMode = "template"
    } else {
      resolvedSubject =
        typeof subject === "string" && subject.trim()
        ? subject.trim()
        : "New Notification"

      resolvedHtml =
        typeof html === "string" && html.trim()
        ? html
        : "<p>No content provided</p>"

      responseMode = "raw"
    }

    console.log("EMAIL MODE:", responseMode)
    console.log("EMAIL HTML RECEIVED:", resolvedHtml)

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
      mode: responseMode,
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
