import React, { useEffect, useMemo, useState } from "react";
import AppHeader from "../components/AppHeader";

export default function SuccessPage({ shared }) {
  const {
    ACCENT_PRESETS,
    DARK_THEME,
    LS_ACCENT_COLOR_KEY,
    LS_THEME_MODE_KEY,
    TABBY_ASSIST_MINT = "#34d399",
    TABBY_ASSIST_MINT_STRONG = "#10b981",
    siteHeaderBarStyle,
    siteHeaderLeftGroupStyle,
    siteHeaderLogoButtonStyle,
    siteHeaderLogoImageStyle,
    siteHeaderSloganStyle,
    withAlpha,
  } = shared;

  const [themeRefresh, setThemeRefresh] = useState(0);
  const [cardHover, setCardHover] = useState(false);

  const accentId = useMemo(() => {
    const fallback = "white";
    if (typeof window === "undefined") return fallback;
    try {
      const stored = window.localStorage.getItem(LS_ACCENT_COLOR_KEY);
      if (ACCENT_PRESETS.some((preset) => preset.id === stored)) {
        if (stored === "black") return fallback;
        return stored;
      }
    } catch {}
    return fallback;
  }, [ACCENT_PRESETS, LS_ACCENT_COLOR_KEY, themeRefresh]);

  const accent = useMemo(() => (ACCENT_PRESETS.find((preset) => preset.id === accentId) || ACCENT_PRESETS[0]).hex, [ACCENT_PRESETS, accentId]);
  const THEME = useMemo(() => ({ ...DARK_THEME, accent }), [DARK_THEME, accent]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onStorage = (e) => {
      if (!e?.key || e.key === LS_THEME_MODE_KEY || e.key === LS_ACCENT_COLOR_KEY) {
        setThemeRefresh((value) => value + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [LS_ACCENT_COLOR_KEY, LS_THEME_MODE_KEY]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const style = document.createElement("style");
    style.textContent = `
      @keyframes tabstudioSuccessDotPulse {
        0%, 100% {
          transform: scale(0.92);
          opacity: 0.55;
        }
        50% {
          transform: scale(1.08);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const waitingDotStyle = (index) => ({
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: TABBY_ASSIST_MINT,
    display: "inline-block",
    animation: "tabstudioSuccessDotPulse 1s ease-in-out infinite",
    animationDelay: `${index * 0.14}s`,
  });

  return (
    <div
      style={{
        width: "100vw",
        maxWidth: "100vw",
        height: "100dvh",
        minHeight: "100vh",
        backgroundColor: THEME.bg,
        backgroundImage: `radial-gradient(1100px 760px at 50% 46%, ${withAlpha(TABBY_ASSIST_MINT, 0.1)} 0%, ${withAlpha(
          TABBY_ASSIST_MINT,
          0.04
        )} 34%, ${withAlpha(TABBY_ASSIST_MINT, 0)} 72%)`,
        backgroundRepeat: "no-repeat",
        color: THEME.text,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr)",
        overflowX: "hidden",
        overflowY: "hidden",
        position: "relative",
      }}
    >
      <AppHeader
        shared={{
          isDark: true,
          logoAriaLabel: "Back to editor",
          onLogoClick: null,
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
            width: "min(640px, calc(100vw - 28px))",
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
                width: 660,
                height: 600,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                background: `radial-gradient(circle at center, ${withAlpha(TABBY_ASSIST_MINT, 0.09)} 0%, ${withAlpha(
                  TABBY_ASSIST_MINT,
                  0.04
                )} 40%, ${withAlpha(TABBY_ASSIST_MINT, 0)} 75%)`,
                filter: `blur(${cardHover ? 28 : 24}px)`,
                opacity: cardHover ? 0.95 : 0.8,
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
                width: "min(620px, 100%)",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(18,18,18,0.95)",
                padding: "30px 26px",
                boxSizing: "border-box",
                display: "grid",
                gap: 14,
                boxShadow: cardHover ? "0 14px 44px rgba(0,0,0,0.5)" : "0 12px 40px rgba(0,0,0,0.45)",
                transform: cardHover ? "translateY(-1px)" : "translateY(0)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div style={{ display: "grid", gap: 10, textAlign: "center" }}>
                <h1 style={{ margin: 0, fontSize: 39, fontWeight: 950, lineHeight: 1.04, letterSpacing: "-0.02em" }}>
                  Almost there — verify your email
                </h1>
                <div
                  style={{
                    color: withAlpha(THEME.text, 0.76),
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  Your payment was successful.
                </div>
                <div
                  style={{
                    color: withAlpha(THEME.text, 0.62),
                    fontSize: 15,
                    fontWeight: 700,
                    lineHeight: 1.55,
                  }}
                >
                  We&apos;ve sent you a confirmation email.
                  <br />
                  Please verify your email to continue to account setup.
                </div>
                <div
                  style={{
                    color: withAlpha(THEME.text, 0.42),
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: 1.45,
                  }}
                >
                  You can close this page once you&apos;ve confirmed your email.
                </div>
              </div>

              <div
                style={{
                  marginTop: 6,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  color: withAlpha(THEME.text, 0.5),
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                <span>Waiting for confirmation</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span aria-hidden="true" style={waitingDotStyle(0)} />
                  <span aria-hidden="true" style={waitingDotStyle(1)} />
                  <span aria-hidden="true" style={waitingDotStyle(2)} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
