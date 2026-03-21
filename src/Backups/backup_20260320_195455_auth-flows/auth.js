import { supabase } from "./supabaseClient";

const AUTH_CALLBACK_PATH = "/auth/callback";
const AUTH_OTP_TYPES = new Set(["signup", "magiclink", "recovery", "email_change", "email"]);

export function buildSiteUrl(path = "/") {
  const normalizedPath = String(path || "/").trim() || "/";
  if (typeof window === "undefined") return normalizedPath;
  return new URL(normalizedPath, window.location.origin).toString();
}

export function getSignupRedirectUrl() {
  return buildSiteUrl(AUTH_CALLBACK_PATH);
}

export function getMagicLinkRedirectUrl() {
  return buildSiteUrl(AUTH_CALLBACK_PATH);
}

export function getEmailChangeRedirectUrl() {
  return buildSiteUrl(AUTH_CALLBACK_PATH);
}

export function getResetPasswordRedirectUrl() {
  return buildSiteUrl("/auth/reset-password");
}

export function normalizeAuthOtpType(rawType) {
  const value = String(rawType || "").trim().toLowerCase();
  return AUTH_OTP_TYPES.has(value) ? value : "";
}

export function readAuthRedirectState() {
  if (typeof window === "undefined") {
    return {
      accessToken: "",
      code: "",
      errorCode: "",
      errorDescription: "",
      refreshToken: "",
      tokenHash: "",
      type: "",
    };
  }

  const currentUrl = new URL(window.location.href);
  const searchParams = currentUrl.searchParams;
  const hashParams = new URLSearchParams(String(window.location.hash || "").replace(/^#/, ""));

  return {
    accessToken: String(searchParams.get("access_token") || hashParams.get("access_token") || "").trim(),
    code: String(searchParams.get("code") || hashParams.get("code") || "").trim(),
    errorCode: String(searchParams.get("error_code") || hashParams.get("error_code") || "").trim(),
    errorDescription: String(searchParams.get("error_description") || hashParams.get("error_description") || "").trim(),
    refreshToken: String(searchParams.get("refresh_token") || hashParams.get("refresh_token") || "").trim(),
    tokenHash: String(searchParams.get("token_hash") || hashParams.get("token_hash") || "").trim(),
    type: normalizeAuthOtpType(searchParams.get("type") || hashParams.get("type") || ""),
  };
}

export function clearAuthRedirectStateFromUrl() {
  if (typeof window === "undefined") return;
  const cleanPath = `${window.location.pathname}${window.location.search && window.location.search.includes("next=") ? `?next=${encodeURIComponent(new URL(window.location.href).searchParams.get("next") || "")}` : ""}`;
  window.history.replaceState({}, "", cleanPath === "/?" ? "/" : cleanPath);
}

export async function signUp(email, password, { emailRedirectTo = getSignupRedirectUrl() } = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
    },
  });
  return { data, error };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function requestPasswordReset(email, { redirectTo = getResetPasswordRedirectUrl() } = {}) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  return { data, error };
}

export async function requestMagicLink(email, { emailRedirectTo = getMagicLinkRedirectUrl(), shouldCreateUser = false } = {}) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo,
      shouldCreateUser,
    },
  });
  return { data, error };
}

export async function requestEmailChange(nextEmail, { emailRedirectTo = getEmailChangeRedirectUrl() } = {}) {
  const { data, error } = await supabase.auth.updateUser(
    {
      email: nextEmail,
    },
    {
      emailRedirectTo,
    }
  );
  return { data, error };
}

export async function updatePassword(nextPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: nextPassword,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}
