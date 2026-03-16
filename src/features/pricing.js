function normalizePricingPlanId(planId) {
  const raw = String(planId || "").trim().toLowerCase();
  if (raw === "band") return "band";
  if (raw === "creator") return "creator";
  return "solo";
}

export function getPlanMeta(planId) {
  const normalized = normalizePricingPlanId(planId);
  if (normalized === "creator") {
    return {
      id: "creator",
      label: "Creator Plan",
      monthly: "$9.99/month",
      yearly: "$95.99/year",
    };
  }
  if (normalized === "band") {
    return {
      id: "band",
      label: "Band Plan",
      monthly: "$6.99/month",
      yearly: "$67.99/year",
    };
  }
  return {
    id: "solo",
    label: "Solo Plan",
    monthly: "$3.99/month",
    yearly: "$38.99/year",
  };
}

export const MEMBERSHIP_PLANS = [
  {
    id: "solo",
    name: "Solo",
    description: "Great for learning riffs and storing ideas.",
    features: ["Write tabs", "Save tabs", "Play tabs", "Organise personal tab library", "Up to 50 saved tabs"],
    monthly: "$3.99 / month",
    yearly: "$38.99 / year",
    cta: "Get Solo",
  },
  {
    id: "band",
    name: "Band",
    description: "Perfect for musicians writing songs and playing with others.",
    features: ["Includes everything in Solo", "Export PDF tabs", "Setlist Creator (future feature)", "Up to 250 saved tabs"],
    monthly: "$6.99 / month",
    yearly: "$67.99 / year",
    cta: "Get Band",
  },
  {
    id: "creator",
    name: "Creator",
    description: "Built for YouTubers, teachers, and tab creators.",
    features: ["Includes everything in Band", "Export PNG tab overlays", "Transparent tab graphics for videos", "Tap-to-sync tab timing", "Unlimited saved tabs"],
    monthly: "$9.99 / month",
    yearly: "$95.99 / year",
    cta: "Get Creator",
  },
];

export const MEMBERSHIP_COMPARISON_ROWS = [
  { label: "Write Tabs", solo: "Yes", band: "Yes", creator: "Yes" },
  { label: "Save Tabs", solo: "Yes", band: "Yes", creator: "Yes" },
  { label: "Play Tabs", solo: "Yes", band: "Yes", creator: "Yes" },
  { label: "Export PDF", solo: "—", band: "Yes", creator: "Yes" },
  { label: "Setlist Creator (Coming Soon)", solo: "—", band: "Included", creator: "Included" },
  { label: "Export PNG Overlays", solo: "—", band: "—", creator: "Yes" },
  { label: "Tap-to-Sync Timing", solo: "—", band: "—", creator: "Yes" },
  { label: "Saved Tabs Limit", solo: "Up to 50", band: "Up to 250", creator: "Unlimited" },
];
