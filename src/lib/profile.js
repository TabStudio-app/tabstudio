import { supabase } from "./supabaseClient";

export async function getProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return { data, error };
}

export async function getProfileByEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return { data: null, error: null };
  const { data, error } = await supabase.from("profiles").select("id").ilike("email", normalizedEmail).maybeSingle();
  return { data, error };
}

export async function createProfile(userId, profileData = {}) {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email: profileData.email ?? null,
      display_name: profileData.display_name ?? null,
      gender: profileData.gender ?? null,
      birthday: profileData.birthday ?? null,
      avatar_url: profileData.avatar_url ?? null,
      favourite_instruments: Array.isArray(profileData.favourite_instruments) ? profileData.favourite_instruments : [],
      heard_about: profileData.heard_about ?? null,
      plan_tier: profileData.plan_tier ?? "free",
      membership_status: profileData.membership_status ?? "free",
      billing_cycle: profileData.billing_cycle ?? "monthly",
    })
    .select()
    .single();

  return { data, error };
}

export async function updateProfile(userId, profileData = {}) {
  const updates = {};

  if ("email" in profileData) updates.email = profileData.email ?? null;
  if ("display_name" in profileData) updates.display_name = profileData.display_name ?? null;
  if ("gender" in profileData) updates.gender = profileData.gender ?? null;
  if ("birthday" in profileData) updates.birthday = profileData.birthday ?? null;
  if ("avatar_url" in profileData) updates.avatar_url = profileData.avatar_url ?? null;
  if ("favourite_instruments" in profileData) {
    updates.favourite_instruments = Array.isArray(profileData.favourite_instruments) ? profileData.favourite_instruments : [];
  }
  if ("heard_about" in profileData) updates.heard_about = profileData.heard_about ?? null;
  if ("plan_tier" in profileData) updates.plan_tier = profileData.plan_tier ?? "free";
  if ("membership_status" in profileData) updates.membership_status = profileData.membership_status ?? "free";
  if ("billing_cycle" in profileData) updates.billing_cycle = profileData.billing_cycle ?? "monthly";

  const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single();
  return { data, error };
}
