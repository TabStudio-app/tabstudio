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
type WelcomePlanTier = "creator" | "band"

type WelcomeTemplateData = TemplateData & {
  displayName?: unknown
  planTier?: unknown
}

type SubscriptionPlanTier = "creator" | "band"
type SubscriptionBillingCycle = "monthly" | "yearly"

type SubscriptionTemplateData = TemplateData & {
  displayName?: unknown
  planTier?: unknown
  billingCycle?: unknown
}

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
  const welcomeData = data as WelcomeTemplateData
  const displayName = getDisplayName(welcomeData)

  const planTier =
    welcomeData.planTier === "creator" || welcomeData.planTier === "band"
      ? (welcomeData.planTier as WelcomePlanTier)
      : undefined

  let welcomeLine =
    "Welcome to TabStudio. Your account is ready, and you can start creating and managing tabs right away."

  if (planTier === "creator") {
    welcomeLine =
      "Welcome to TabStudio. Your Creator workspace is ready so you can start writing, organizing, and polishing your tabs."
  } else if (planTier === "band") {
    welcomeLine =
      "Welcome to TabStudio. Your Band setup is ready so your group can collaborate on songs and keep tabs in sync."
  }

  const bodyHtml = `
    <p style="margin: 0 0 14px;">Hi ${displayName},</p>
    <p style="margin: 0 0 14px;">
      ${welcomeLine}
    </p>
    <p style="margin: 0;">
      If you run into anything, just reply to this email and our team will help.
    </p>
  `

  return {
    subject: "Welcome to TabStudio",
    html: renderTabStudioEmailLayout({
      bodyHtml,
      ctaText: "Sign in to TabStudio",
      ctaUrl: "https://tabstudio.app/signin",
    }),
  }
}

function subscriptionConfirmedTemplate(data: TemplateData): BuiltEmailTemplate {
  const subscriptionData = data as SubscriptionTemplateData
  const displayName = getDisplayName(subscriptionData)

  const planTier =
    subscriptionData.planTier === "creator" || subscriptionData.planTier === "band"
      ? (subscriptionData.planTier as SubscriptionPlanTier)
      : undefined

  const billingCycle =
    subscriptionData.billingCycle === "monthly" ||
    subscriptionData.billingCycle === "yearly"
      ? (subscriptionData.billingCycle as SubscriptionBillingCycle)
      : undefined

  const planLabel = planTier === "band" ? "Band" : planTier === "creator" ? "Creator" : null
  const cycleLabel =
    billingCycle === "monthly"
      ? "monthly subscription"
      : billingCycle === "yearly"
        ? "yearly subscription"
        : null

  const activationLine =
    planLabel && cycleLabel
      ? `Your ${planLabel} plan is now active on a ${cycleLabel}.`
      : "Your subscription is now active and ready to use."

  const bodyHtml = `
    <p style="margin: 0 0 14px;">Hi ${displayName},</p>
    <p style="margin: 0 0 14px;">
      Thanks for subscribing to TabStudio. Your payment was successful, and your access is fully enabled.
    </p>
    <p style="margin: 0 0 14px;">
      ${activationLine}
    </p>
    <p style="margin: 0;">
      You can now sign in and start using your plan features right away.
    </p>
  `

  return {
    subject: "Your TabStudio subscription is active",
    html: renderTabStudioEmailLayout({
      heading: "Your subscription is active",
      bodyHtml,
      ctaText: "Open TabStudio",
      ctaUrl: "https://tabstudio.app/signin",
    }),
  }
}

type AffiliateApplicationReceivedData = TemplateData & {
  fullName?: unknown
}

function affiliateApplicationReceivedTemplate(data: TemplateData): BuiltEmailTemplate {
  const affiliateData = data as AffiliateApplicationReceivedData
  const fullName =
    typeof affiliateData.fullName === "string" && affiliateData.fullName.trim()
      ? escapeHtml(affiliateData.fullName.trim())
      : "there"

  const bodyHtml = `
    <p style="margin: 0 0 14px;">Hi ${fullName},</p>
    <p style="margin: 0 0 14px;">
      Thanks for applying to the TabStudio Affiliate Program. We’ve received your application successfully.
    </p>
    <p style="margin: 0 0 14px;">
      Our team will review your content and the details you shared in your application.
    </p>
    <p style="margin: 0;">
      If approved, we’ll reach out with the next steps.
    </p>
  `

  return {
    subject: "We’ve received your TabStudio affiliate application",
    html: renderTabStudioEmailLayout({
      heading: "Application received",
      bodyHtml,
    }),
  }
}

type AffiliateApprovedData = TemplateData & {
  fullName?: unknown
  inviteToken?: unknown
  approvedEmail?: unknown
}

function affiliateApprovedTemplate(data: TemplateData): BuiltEmailTemplate {
  const affiliateData = data as AffiliateApprovedData
  const fullName =
    typeof affiliateData.fullName === "string" && affiliateData.fullName.trim()
      ? escapeHtml(affiliateData.fullName.trim())
      : "there"

  const inviteToken =
    typeof affiliateData.inviteToken === "string" && affiliateData.inviteToken.trim()
      ? affiliateData.inviteToken.trim()
      : ""

  const approvedEmail =
    typeof affiliateData.approvedEmail === "string" && affiliateData.approvedEmail.trim()
      ? affiliateData.approvedEmail.trim().toLowerCase()
      : ""

  const signupUrl = inviteToken
    ? `https://tabstudio.app/signup?plan=creator&approved=true&invite=${encodeURIComponent(inviteToken)}${
      approvedEmail ? `&email=${encodeURIComponent(approvedEmail)}` : ""
    }`
    : "https://tabstudio.app/signup"

  const bodyHtml = `
    <p style="margin: 0 0 14px;">Hi ${fullName},</p>
    <p style="margin: 0 0 14px;">
      Great news. You’ve been accepted into the TabStudio Affiliate Program.
    </p>
    <p style="margin: 0 0 14px;">
      You now have access to a free TabStudio Creator account, the ability to create and share tabs, and the opportunity to earn through affiliate referrals.
    </p>
    <p style="margin: 0;">
      To get started, create your account using the button below.
    </p>
  `

  return {
    subject: "You’ve been accepted to the TabStudio Affiliate Program",
    html: renderTabStudioEmailLayout({
      heading: "You’re approved",
      bodyHtml,
      ctaText: "Create your Creator account",
      ctaUrl: signupUrl,
    }),
  }
}

type SupportReceivedData = TemplateData & {
  fullName?: unknown
}

function supportReceivedTemplate(data: TemplateData): BuiltEmailTemplate {
  const supportData = data as SupportReceivedData
  const fullName =
    typeof supportData.fullName === "string" && supportData.fullName.trim()
      ? escapeHtml(supportData.fullName.trim())
      : "there"

  const bodyHtml = `
    <p style="margin: 0 0 14px;">Hi ${fullName},</p>
    <p style="margin: 0 0 14px;">
      Thanks for reaching out to TabStudio. We’ve received your message and our team will review it shortly.
    </p>
    <p style="margin: 0 0 14px;">
      We aim to respond as soon as possible with help or next steps.
    </p>
    <p style="margin: 0;">
      If your request is urgent, feel free to reply directly to this email.
    </p>
  `

  return {
    subject: "We’ve received your TabStudio support request",
    html: renderTabStudioEmailLayout({
      heading: "Support request received",
      bodyHtml,
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
      return subscriptionConfirmedTemplate(data)
    case "affiliate_application_received":
      return affiliateApplicationReceivedTemplate(data)
    case "affiliate_approved":
      return affiliateApprovedTemplate(data)
    case "support_received":
      return supportReceivedTemplate(data)
    default: {
      const neverType: never = type
      throw new Error(`Unsupported template type: ${String(neverType)}`)
    }
  }
}
