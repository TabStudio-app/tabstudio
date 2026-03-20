import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getPlanMeta } from "../features/pricing";
import { getProfile } from "../lib/profile";
import { supabase } from "../lib/supabaseClient";

const SESSION_CONVERSION_SIGNUP_KEY = "tabstudioConversionSignupStateV1";

function loadPendingSignupState() {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(SESSION_CONVERSION_SIGNUP_KEY) || "null");
    if (!parsed || typeof parsed !== "object") return null;
    const flowEmail = String(parsed.flowEmail || "").trim();
    const flowPassword = String(parsed.flowPassword || "");
    const pendingAuthUserId = String(parsed.pendingAuthUserId || "").trim();
    if (!flowEmail || flowPassword.length < 8 || !pendingAuthUserId) return null;
    return {
      flowEmail,
      pendingAuthUserId,
    };
  } catch {
    return null;
  }
}

export default function SuccessPage({ shared }) {
  const {
    ACCENT_PRESETS,
    DARK_THEME,
    LIGHT_THEME,
    LS_ACCENT_COLOR_KEY,
    LS_THEME_MODE_KEY,
    onMembershipActivated,
    onBack,
    onGoSignIn,
    selectedPlan = "solo",
    withAlpha,
  } = shared;

  const [themeRefresh, setThemeRefresh] = useState(0);
  const [activationMessage, setActivationMessage] = useState("Please wait while we confirm payment and route you to profile setup.");
  const [viewMode, setViewMode] = useState("loading");
  const getSystemTheme = useCallback(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }, []);
  const isDark = useMemo(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = window.localStorage.getItem(LS_THEME_MODE_KEY);
      if (stored === "dark") return true;
      if (stored === "light") return false;
    } catch {}
    return getSystemTheme() === "dark";
  }, [LS_THEME_MODE_KEY, getSystemTheme, themeRefresh]);
  const accentId = useMemo(() => {
    const fallback = isDark ? "white" : "black";
    if (typeof window === "undefined") return fallback;
    try {
      const stored = window.localStorage.getItem(LS_ACCENT_COLOR_KEY);
      if (ACCENT_PRESETS.some((p) => p.id === stored)) return stored;
    } catch {}
    return fallback;
  }, [ACCENT_PRESETS, LS_ACCENT_COLOR_KEY, isDark, themeRefresh]);
  const accent = useMemo(() => (ACCENT_PRESETS.find((preset) => preset.id === accentId) || ACCENT_PRESETS[0]).hex, [ACCENT_PRESETS, accentId]);
  const THEME = useMemo(() => ({ ...(isDark ? DARK_THEME : LIGHT_THEME), accent }), [DARK_THEME, LIGHT_THEME, accent, isDark]);
  const planMeta = getPlanMeta(selectedPlan);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onStorage = (e) => {
      if (!e?.key || e.key === LS_THEME_MODE_KEY || e.key === LS_ACCENT_COLOR_KEY) setThemeRefresh((v) => v + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [LS_ACCENT_COLOR_KEY, LS_THEME_MODE_KEY]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId = null;
    let pollCount = 0;
    const pendingSignupState = loadPendingSignupState();

    const resolveActiveMembership = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = String(session?.user?.id || "").trim();
      if (!userId) {
        if (pendingSignupState) {
          setViewMode("activation");
          setActivationMessage(
            `We've sent a quick confirmation link to ${pendingSignupState.flowEmail}. Once confirmed, you'll be taken straight into your workspace.`
          );
        } else {
          setViewMode("loading");
          setActivationMessage("Please wait while we confirm payment and route you to profile setup.");
        }
        return false;
      }

      const profileResult = await getProfile(userId);
      if (cancelled) return false;
      if (profileResult.error || !profileResult.data) return false;

      const membershipStatus = String(profileResult.data.membership_status || "").trim().toLowerCase();
      if (membershipStatus === "active") {
        setViewMode("finalizing");
        onMembershipActivated?.(profileResult.data);
        return true;
      }

      return false;
    };

    const runPoll = async () => {
      const isActive = await resolveActiveMembership();
      if (cancelled || isActive) return;

      if (viewMode === "activation") return;

      pollCount += 1;
      if (pollCount >= 10) {
        setActivationMessage("We're activating your membership. This usually takes a few seconds. If this page does not update, please refresh.");
        return;
      }

      timeoutId = window.setTimeout(() => {
        void runPoll();
      }, 1000);
    };

    void runPoll();

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [onMembershipActivated, viewMode]);

  return (
    <div
      style={{
        height: "100dvh",
        minHeight: "100dvh",
        background: THEME.bg,
        color: THEME.text,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        display: "grid",
        placeItems: "center",
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "min(640px, calc(100vw - 32px))",
          borderRadius: 16,
          border: `1px solid ${THEME.border}`,
          background: THEME.surfaceWarm,
          padding: 24,
        display: "grid",
        gap: 14,
      }}
    >
        <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>
          {viewMode === "activation" ? "Almost there — check your email" : "Finalizing your membership..."}
        </h1>
        <div style={{ color: THEME.textFaint, fontSize: 16, fontWeight: 700 }}>
          {viewMode === "activation"
            ? `Your ${planMeta.label.toLowerCase()} payment is complete.`
            : `Confirming your ${planMeta.label.toLowerCase()} purchase with TabStudio.`}
        </div>
        <div style={{ color: THEME.textMuted, fontSize: 14, lineHeight: 1.55 }}>{activationMessage}</div>
        {viewMode === "activation" ? (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onGoSignIn}
              style={{
                minHeight: 42,
                padding: "0 14px",
                borderRadius: 10,
                border: "none",
                background: THEME.accent,
                color: isDark ? "#050505" : "#FFFFFF",
                fontSize: 14,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Go to Sign In
            </button>
            <button
              type="button"
              onClick={onBack}
              style={{
                minHeight: 42,
                padding: "0 14px",
                borderRadius: 10,
                border: `1px solid ${THEME.border}`,
                background: withAlpha(THEME.text, isDark ? 0.04 : 0.02),
                color: THEME.text,
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Back to Editor
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
