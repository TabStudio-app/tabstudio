import { supabase } from "./supabaseClient";

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeOptionalText(value) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeStringArray(values) {
  if (!Array.isArray(values)) return [];
  return values.map((value) => normalizeText(value)).filter(Boolean);
}

function buildCreatorLinks(formValues = {}) {
  const links = [
    { platform: "instagram", value: normalizeText(formValues.instagram) },
    { platform: "youtube", value: normalizeText(formValues.youtube) },
    { platform: "tiktok", value: normalizeText(formValues.tiktok) },
    { platform: "other", value: normalizeText(formValues.otherLink) },
  ].filter((entry) => Boolean(entry.value));
  return links;
}

export function buildAffiliateApplicationInsertPayload(formValues = {}) {
  return {
    full_name: normalizeText(formValues.fullName),
    email: normalizeText(formValues.email).toLowerCase(),
    creator_links: buildCreatorLinks(formValues),
    main_platform: normalizeOptionalText(formValues.mainPlatform),
    following_band: normalizeOptionalText(formValues.following),
    content_types: normalizeStringArray(formValues.contentType),
    tab_usage: normalizeStringArray(formValues.tabUsage),
    feature_plan: normalizeStringArray(formValues.featurePlan),
    motivation: normalizeStringArray(formValues.motivation),
    extra: normalizeOptionalText(formValues.extra),
  };
}

export async function createAffiliateApplication(formValues = {}) {
  const payload = buildAffiliateApplicationInsertPayload(formValues);
  const { data, error } = await supabase.from("affiliate_applications").insert(payload).select("id").single();
  if (error) {
    console.error("[affiliate_applications.insert] Supabase error", {
      error,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
      payloadPreview: {
        email: payload.email,
        full_name: payload.full_name,
        creator_links_count: Array.isArray(payload.creator_links) ? payload.creator_links.length : 0,
      },
    });
  }
  return { data, error };
}
