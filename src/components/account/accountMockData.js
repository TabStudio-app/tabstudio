export const ACCOUNT_LANGUAGE_OPTIONS = [
  { id: "en", name: "English (US)", available: true },
  { id: "es", name: "Spanish (Español)", available: false },
  { id: "zh-Hans", name: "Mandarin Chinese", available: false },
  { id: "fr", name: "French", available: false },
  { id: "de", name: "German", available: false },
  { id: "pt", name: "Portuguese", available: false },
  { id: "ar", name: "Arabic", available: false },
  { id: "ja", name: "Japanese", available: false },
  { id: "ru", name: "Russian", available: false },
  { id: "ko", name: "Korean", available: false },
];

export const ACCOUNT_MOCK_DATA = {
  identity: {
    fullName: "Harry Bolton",
    email: "support@tabstudio.app",
  },
  profile: {
    handle: "@harrybolton",
    bio: "Guitar-first songwriter and tab creator.",
    website: "https://tabstudio.app/harry",
  },
  membership: {
    memberSince: "2025-01-12",
    renewalDate: "2026-04-01",
    billingCycle: "Monthly",
  },
  usage: {
    tabsCreated: 48,
    pdfExports30d: 17,
    storageUsedMb: 124,
    lastActiveLabel: "Today",
    summaryNote: "Live account insights will expand here as project activity, exports, and storage tracking ship.",
  },
  security: {
    sessions: [
      { id: "session_1", device: "MacBook Pro", browser: "Chrome", location: "Tokyo, JP", lastSeen: "Active now", status: "current" },
      { id: "session_2", device: "iPhone", browser: "Safari", location: "Tokyo, JP", lastSeen: "2 hours ago", status: "recent" },
      { id: "session_3", device: "Windows Desktop", browser: "Edge", location: "London, UK", lastSeen: "4 days ago", status: "recent" },
    ],
  },
  billing: {
    invoices: [
      { id: "INV-1082", createdAt: "2026-03-01", amountCents: 1200, currency: "USD", status: "paid" },
      { id: "INV-1114", createdAt: "2026-04-01", amountCents: 1200, currency: "USD", status: "upcoming" },
      { id: "INV-1045", createdAt: "2026-02-01", amountCents: 1200, currency: "USD", status: "paid" },
      { id: "INV-0997", createdAt: "2025-12-01", amountCents: 1200, currency: "USD", status: "refunded" },
    ],
  },
  affiliate: {
    referralLink: "https://tabstudio.app/ref/harry",
    summary: {
      clicks: 2840,
      signups: 189,
      activeMembers: 126,
      monthlyEarningsCents: 18240,
    },
    earnings: {
      thisMonthCents: 18240,
      lifetimeCents: 31195,
      nextPayoutDate: "2026-04-05",
      pendingBalanceCents: 7485,
    },
    history: [
      { id: "aff_jan_2026", month: "2026-01-01", referrals: 31, amountCents: 4815, status: "paid" },
      { id: "aff_feb_2026", month: "2026-02-01", referrals: 47, amountCents: 8140, status: "paid" },
      { id: "aff_mar_2026", month: "2026-03-01", referrals: 49, amountCents: 18240, status: "pending" },
    ],
  },
  featureFlags: {
    invoicesLive: false,
    devicesLive: false,
    affiliateLive: true,
  },
};
