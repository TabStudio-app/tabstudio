import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getPlanMeta } from "../features/pricing";
import { getProfile } from "../lib/profile";
import { supabase } from "../lib/supabaseClient";

export default function SuccessPage({ shared }) {
  const {
    ACCENT_PRESETS,
    DARK_THEME,
    LIGHT_THEME,
    LS_ACCENT_COLOR_KEY,
    LS_THEME_MODE_KEY,
    onMembershipActivated,
    selectedPlan = "solo",
  } = shared;

  const [themeRefresh, setThemeRefresh] = useState(0);
  const [activationMessage, setActivationMessage] = useState("Please wait while we confirm payment and route you to profile setup.");
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

    const resolveActiveMembership = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = String(session?.user?.id || "").trim();
      if (!userId) return false;

      const profileResult = await getProfile(userId);
      if (cancelled) return false;
      if (profileResult.error || !profileResult.data) return false;

      const membershipStatus = String(profileResult.data.membership_status || "").trim().toLowerCase();
      if (membershipStatus === "active") {
        onMembershipActivated?.(profileResult.data);
        return true;
      }

      return false;
    };

    const runPoll = async () => {
      const isActive = await resolveActiveMembership();
      if (cancelled || isActive) return;

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
  }, [onMembershipActivated]);

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
        <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>Finalizing your membership...</h1>
        <div style={{ color: THEME.textFaint, fontSize: 16, fontWeight: 700 }}>
          Confirming your {planMeta.label.toLowerCase()} purchase with TabStudio.
        </div>
        <div style={{ color: THEME.textMuted, fontSize: 14 }}>
          {activationMessage}
        </div>
      </div>
    </div>
  );
}
