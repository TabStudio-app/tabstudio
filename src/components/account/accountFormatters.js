export function formatCurrency(cents, currency = "USD", locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format((Number(cents) || 0) / 100);
}

export function formatDate(value, locale = "en-US", options = { month: "long", day: "numeric", year: "numeric" }) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatMonthYear(value, locale = "en-US") {
  return formatDate(value, locale, { month: "long", year: "numeric" });
}

export function formatStorageMb(value) {
  const mb = Number(value) || 0;
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}

export function planDisplayName(planId) {
  if (planId === "creator") return "Creator Plan";
  if (planId === "band") return "Band Plan";
  if (planId === "solo") return "Solo Plan";
  return "Free Plan";
}

export function invoiceStatusMeta(status) {
  if (status === "paid") return { label: "Paid", tone: "success" };
  if (status === "upcoming") return { label: "Upcoming", tone: "warning" };
  if (status === "refunded") return { label: "Refunded", tone: "info" };
  return { label: "Open", tone: "muted" };
}

export function affiliateStatusMeta(status) {
  if (status === "paid") return { label: "Paid", tone: "success" };
  if (status === "pending") return { label: "Pending", tone: "warning" };
  return { label: "Queued", tone: "muted" };
}

export function sessionDeviceLabel(session) {
  return [session?.device, session?.browser].filter(Boolean).join(" · ");
}

export function accountActionLabel(status, idleLabel, successLabel = "Saved", loadingLabel = "Saving...") {
  if (status === "saving") return loadingLabel;
  if (status === "success") return successLabel;
  return idleLabel;
}
