type EmailLayoutInput = {
  heading?: string
  bodyHtml: string
  ctaText?: string
  ctaUrl?: string
}

export function renderTabStudioEmailLayout(input: EmailLayoutInput): string {
  const { heading, bodyHtml, ctaText, ctaUrl } = input

  const headingBlock = heading
    ? `
      <h1 style="margin: 0 0 16px; font-size: 24px; line-height: 1.3; color: #111827; font-family: Arial, Helvetica, sans-serif;">
        ${heading}
      </h1>
    `
    : ""

  const ctaBlock =
    ctaText && ctaUrl
      ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0 0;">
        <tr>
          <td style="border-radius: 8px; background-color: #111827; text-align: center;">
            <a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 20px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; font-family: Arial, Helvetica, sans-serif;">
              ${ctaText}
            </a>
          </td>
        </tr>
      </table>
    `
      : ""

  return `
<!doctype html>
<html lang="en">
  <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; margin: 0; padding: 24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 640px; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
            <tr>
              <td style="padding: 20px 24px; background-color: #111827;">
                <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 700; letter-spacing: 0.2px; font-family: Arial, Helvetica, sans-serif;">
                  TabStudio
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 28px 24px 24px; color: #1f2937; font-size: 15px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
                ${headingBlock}
                ${bodyHtml}
                ${ctaBlock}
              </td>
            </tr>
            <tr>
              <td style="padding: 18px 24px 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.5; font-family: Arial, Helvetica, sans-serif;">
                  Need help? Contact us at
                  <a href="mailto:support@tabstudio.app" style="color: #374151; text-decoration: underline;">support@tabstudio.app</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim()
}
