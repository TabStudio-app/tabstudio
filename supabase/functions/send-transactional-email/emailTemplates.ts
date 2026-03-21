import { renderTabStudioEmailLayout } from "./emailLayout.ts"

export const SUPPORTED_EMAIL_TYPES = [
  "welcome",
  "subscription_confirmed",
  "affiliate_application_received",
  "affiliate_approved",
  "support_received",
] as const

export type SupportedEmailType = (typeof SUPPORTED_EMAIL_TYPES)[number]
export type TemplateData = Record<string, unknown>

export type BuiltEmailTemplate = {
  subject: string
  html: string
}

export function isSupportedTemplateType(value: string): value is SupportedEmailType {
  return (SUPPORTED_EMAIL_TYPES as readonly string[]).includes(value)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function getDisplayName(data: TemplateData): string {
  const rawName = data.displayName
  if (typeof rawName !== "string" || !rawName.trim()) {
    return "there"
  }
  return escapeHtml(rawName.trim())
}

function welcomeTemplate(data: TemplateData): BuiltEmailTemplate {
  const displayName = getDisplayName(data)

  const bodyHtml = `
    <p style="margin: 0 0 14px;">Hi ${displayName},</p>
    <p style="margin: 0 0 14px;">
      Welcome to TabStudio. Your account is ready, and you can start creating and managing tabs right away.
    </p>
    <p style="margin: 0;">
      If you run into anything, just reply to this email and our team will help.
    </p>
  `

  return {
    subject: "Welcome to TabStudio",
    html: renderTabStudioEmailLayout({
      heading: "Welcome to TabStudio",
      bodyHtml,
      ctaText: "Sign in to TabStudio",
      ctaUrl: "https://tabstudio.app/signin",
    }),
  }
}

function placeholderTemplate(title: string): BuiltEmailTemplate {
  return {
    subject: `[TabStudio] ${title}`,
    html: renderTabStudioEmailLayout({
      heading: title,
      bodyHtml: `
        <p style="margin: 0 0 14px;">
          This is a temporary ${title.toLowerCase()} email template.
        </p>
        <p style="margin: 0;">
          The final production copy for this email type will be added soon.
        </p>
      `,
    }),
  }
}

export function buildEmailTemplate(
  type: SupportedEmailType,
  data: TemplateData,
): BuiltEmailTemplate {
  switch (type) {
    case "welcome":
      return welcomeTemplate(data)
    case "subscription_confirmed":
      return placeholderTemplate("Subscription Confirmed")
    case "affiliate_application_received":
      return placeholderTemplate("Affiliate Application Received")
    case "affiliate_approved":
      return placeholderTemplate("Affiliate Approved")
    case "support_received":
      return placeholderTemplate("Support Request Received")
    default: {
      const neverType: never = type
      throw new Error(`Unsupported template type: ${String(neverType)}`)
    }
  }
}
