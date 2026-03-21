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

const MAX_ATTACHMENTS = 5
const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024
const MAX_TOTAL_ATTACHMENT_BYTES = 12 * 1024 * 1024

type IncomingAttachment = {
  filename?: unknown
  content_type?: unknown
  content_base64?: unknown
  size_bytes?: unknown
}

function normalizeAttachments(rawAttachments: unknown) {
  if (rawAttachments === undefined || rawAttachments === null) return []
  if (!Array.isArray(rawAttachments)) {
    throw new Error("Invalid 'attachments' field: expected an array")
  }
  if (rawAttachments.length > MAX_ATTACHMENTS) {
    throw new Error(`Too many attachments: max ${MAX_ATTACHMENTS}`)
  }

  let totalBytes = 0
  const attachments = rawAttachments.map((rawAttachment, idx) => {
    const attachment = (rawAttachment ?? {}) as IncomingAttachment
    const filename =
      typeof attachment.filename === "string" && attachment.filename.trim()
        ? attachment.filename.trim()
        : `attachment-${idx + 1}`
    const contentType =
      typeof attachment.content_type === "string" && attachment.content_type.trim()
        ? attachment.content_type.trim()
        : "application/octet-stream"
    const contentBase64 =
      typeof attachment.content_base64 === "string" && attachment.content_base64.trim()
        ? attachment.content_base64.trim()
        : ""

    if (!contentBase64) {
      throw new Error(`Attachment ${idx + 1} is missing content_base64`)
    }

    if (!/^[A-Za-z0-9+/=\r\n]+$/.test(contentBase64)) {
      throw new Error(`Attachment ${idx + 1} has invalid base64 content`)
    }

    const inferredBytes = Math.floor((contentBase64.replace(/\s+/g, "").length * 3) / 4)
    const reportedBytes =
      Number.isFinite(Number(attachment.size_bytes)) && Number(attachment.size_bytes) > 0
        ? Number(attachment.size_bytes)
        : inferredBytes
    const resolvedBytes = Math.max(inferredBytes, reportedBytes)

    if (resolvedBytes > MAX_ATTACHMENT_BYTES) {
      throw new Error(`Attachment ${idx + 1} exceeds ${MAX_ATTACHMENT_BYTES} bytes`)
    }

    totalBytes += resolvedBytes
    if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
      throw new Error(`Attachments exceed total ${MAX_TOTAL_ATTACHMENT_BYTES} bytes`)
    }

    return {
      filename,
      content: contentBase64,
      encoding: "base64" as const,
      contentType,
    }
  })

  return attachments
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

    const { to, subject, html, from, attachments } = body as {
      to?: unknown
      subject?: unknown
      html?: unknown
      from?: unknown
      attachments?: unknown
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

    const normalizedAttachments = normalizeAttachments(attachments)

    const info = await transporter.sendMail({
      from: resolvedFrom,
      to: to.trim(),
      subject: resolvedSubject,
      html: resolvedHtml,
      attachments: normalizedAttachments,
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

    if (
      error instanceof Error &&
      (
        error.message.startsWith("Invalid 'attachments' field") ||
        error.message.startsWith("Too many attachments") ||
        error.message.includes("Attachment")
      )
    ) {
      return jsonResponse(400, {
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
