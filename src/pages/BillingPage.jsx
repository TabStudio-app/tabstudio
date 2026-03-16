import React, { useCallback, useEffect, useMemo, useState } from "react";

export default function BillingPage({ shared }) {
  const {
    ACCENT_PRESETS,
    DARK_THEME,
    LIGHT_THEME,
    LS_ACCENT_COLOR_KEY,
    LS_THEME_MODE_KEY,
    onBackToEditor,
    userState,
  } = shared;

  const [themeRefresh, setThemeRefresh] = useState(0);
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
  const activePlan =
    userState?.planType === "creator"
      ? "Creator Plan"
      : userState?.planType === "band"
        ? "Band Plan"
        : userState?.planType === "solo"
          ? "Solo Plan"
          : "No active plan";

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onStorage = (e) => {
      if (!e?.key || e.key === LS_THEME_MODE_KEY || e.key === LS_ACCENT_COLOR_KEY) setThemeRefresh((v) => v + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [LS_ACCENT_COLOR_KEY, LS_THEME_MODE_KEY]);

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
      <div style={{ width: "min(760px, calc(100vw - 32px))", borderRadius: 16, border: `1px solid ${THEME.border}`, background: THEME.surfaceWarm, padding: 24, display: "grid", gap: 14 }}>
        <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.1 }}>Billing & Subscription</h1>
        <div style={{ color: THEME.textFaint, fontSize: 15 }}>This is a V1 placeholder for future Stripe billing portal integration.</div>
        <div style={{ border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 14, display: "grid", gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: THEME.textFaint }}>
            Current plan
          </div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>{activePlan}</div>
          <div style={{ fontSize: 14, color: THEME.textMuted }}>
            Account: {String(userState?.email || "").trim() || "Not set"}
          </div>
        </div>
        <button
          type="button"
          onClick={onBackToEditor}
          style={{
            justifySelf: "start",
            minHeight: 40,
            padding: "0 14px",
            borderRadius: 10,
            border: `1px solid ${THEME.border}`,
            background: THEME.surfaceWarm,
            color: THEME.text,
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Back to Editor
        </button>
      </div>
    </div>
  );
}
