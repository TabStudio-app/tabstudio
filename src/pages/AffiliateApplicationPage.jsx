import React, { useCallback, useEffect, useMemo, useState } from "react";
import AppHeader from "../components/AppHeader";
import AffiliateApplicationForm from "../components/affiliate/AffiliateApplicationForm";

export default function AffiliateApplicationPage({ shared }) {
  const {
    ACCENT_PRESETS,
    DARK_THEME,
    LIGHT_THEME,
    LS_ACCENT_COLOR_KEY,
    LS_THEME_MODE_KEY,
    TABBY_ASSIST_MINT,
    TABBY_ASSIST_MINT_STRONG,
    onBack,
    onBackToProjects,
    siteHeaderBarStyle,
    siteHeaderLeftGroupStyle,
    siteHeaderLogoButtonStyle,
    siteHeaderLogoImageStyle,
    siteHeaderSloganStyle,
    withAlpha,
  } = shared;

  const [themeRefresh, setThemeRefresh] = useState(0);
  const [cardHover, setCardHover] = useState(false);

  const getSystemTheme = useCallback(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }, []);
  const isDarkMode = useMemo(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = window.localStorage.getItem(LS_THEME_MODE_KEY);
      if (stored === "dark") return true;
      if (stored === "light") return false;
    } catch {}
    return getSystemTheme() === "dark";
  }, [getSystemTheme, themeRefresh, LS_THEME_MODE_KEY]);
  const accentId = useMemo(() => {
    const fallback = isDarkMode ? "white" : "black";
    if (typeof window === "undefined") return fallback;
    try {
      const stored = window.localStorage.getItem(LS_ACCENT_COLOR_KEY);
      if (ACCENT_PRESETS.some((preset) => preset.id === stored)) {
        if (isDarkMode && stored === "black") return fallback;
        if (!isDarkMode && stored === "white") return fallback;
        return stored;
      }
    } catch {}
    return fallback;
  }, [ACCENT_PRESETS, isDarkMode, themeRefresh, LS_ACCENT_COLOR_KEY]);
  const accent = useMemo(
    () => (ACCENT_PRESETS.find((preset) => preset.id === accentId) || ACCENT_PRESETS[0]).hex,
    [ACCENT_PRESETS, accentId]
  );
  const THEME = useMemo(() => {
    const base = isDarkMode ? DARK_THEME : LIGHT_THEME;
    return { ...base, accent };
  }, [DARK_THEME, LIGHT_THEME, accent, isDarkMode]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onStorage = (event) => {
      if (!event?.key || event.key === LS_THEME_MODE_KEY || event.key === LS_ACCENT_COLOR_KEY) {
        setThemeRefresh((value) => value + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [LS_ACCENT_COLOR_KEY, LS_THEME_MODE_KEY]);

  return (
    <div
      style={{
        width: "100vw",
        maxWidth: "100vw",
        minHeight: "100dvh",
        backgroundColor: THEME.bg,
        backgroundImage: `radial-gradient(1440px 960px at 50% 42%, ${withAlpha(TABBY_ASSIST_MINT, 0.14)} 0%, ${withAlpha(
          TABBY_ASSIST_MINT,
          0.06
        )} 42%, ${withAlpha(TABBY_ASSIST_MINT, 0)} 82%)`,
        backgroundRepeat: "no-repeat",
        color: THEME.text,
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr)",
        overflowX: "hidden",
      }}
    >
      <AppHeader
        shared={{
          isDark: isDarkMode,
          logoAriaLabel: "Back to affiliate landing page",
          onLogoClick: onBack,
          rightContent: null,
          showRightGroup: false,
          siteHeaderBarStyle,
          siteHeaderLeftGroupStyle,
          siteHeaderLogoButtonStyle,
          siteHeaderLogoImageStyle,
          siteHeaderSloganStyle,
          theme: THEME,
        }}
      />

      <div
        style={{
          width: "100%",
          minHeight: "100vh",
          overflow: "hidden auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "26px 20px 36px",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "min(720px, calc(100vw - 28px))",
            display: "grid",
            alignItems: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "grid", gap: 14, alignContent: "center", justifyItems: "center", minWidth: 0 }}>
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 980,
                height: 840,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                background: `radial-gradient(circle at center, ${withAlpha(TABBY_ASSIST_MINT, 0.16)} 0%, ${withAlpha(
                  TABBY_ASSIST_MINT,
                  0.07
                )} 44%, ${withAlpha(TABBY_ASSIST_MINT, 0)} 80%)`,
                filter: `blur(${cardHover ? 40 : 36}px)`,
                opacity: cardHover ? 1 : 0.9,
                pointerEvents: "none",
                zIndex: 0,
                transition: "opacity 220ms ease, filter 220ms ease",
              }}
            />
            <div
              onMouseEnter={() => setCardHover(true)}
              onMouseLeave={() => setCardHover(false)}
              onFocus={() => setCardHover(true)}
              onBlur={() => setCardHover(false)}
              style={{
                width: "min(690px, 100%)",
                borderRadius: 14,
                border: `1px solid ${cardHover ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.08)"}`,
                background: "rgba(18,18,18,0.95)",
                padding: "30px 26px",
                boxSizing: "border-box",
                display: "grid",
                gap: 18,
                boxShadow: cardHover ? "0 14px 44px rgba(0,0,0,0.5)" : "0 12px 40px rgba(0,0,0,0.45)",
                transform: cardHover ? "translateY(-1px)" : "translateY(0)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                position: "relative",
                zIndex: 2,
              }}
            >
              <AffiliateApplicationForm
                theme={THEME}
                withAlpha={withAlpha}
                TABBY_ASSIST_MINT={TABBY_ASSIST_MINT}
                TABBY_ASSIST_MINT_STRONG={TABBY_ASSIST_MINT_STRONG}
                onBackToProjects={onBackToProjects}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
