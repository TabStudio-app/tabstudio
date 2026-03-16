import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppHeader from "../components/AppHeader";
import affiliateScreenshot from "../assets/Affiliate-Screenshot1.png";

export default function BecomeAnAffiliatePage({ shared }) {
  const {
    ACCENT_PRESETS,
    DARK_THEME,
    LIGHT_THEME,
    LS_ACCENT_COLOR_KEY,
    LS_THEME_MODE_KEY,
    TABBY_ASSIST_MINT,
    TABBY_ASSIST_MINT_STRONG,
    onApply,
    onBack,
    siteHeaderBarStyle,
    siteHeaderLeftGroupStyle,
    siteHeaderLogoButtonStyle,
    siteHeaderLogoImageStyle,
    siteHeaderSloganStyle,
    withAlpha,
  } = shared;

  const [themeRefresh, setThemeRefresh] = useState(0);
  const [ctaHover, setCtaHover] = useState(false);
  const [secondaryCtaHover, setSecondaryCtaHover] = useState(false);
  const [headerCtaHover, setHeaderCtaHover] = useState(false);
  const [selectedFollowerCount, setSelectedFollowerCount] = useState("10000");
  const [isFollowerInputFocused, setIsFollowerInputFocused] = useState(false);
  const [selectedConversionRate, setSelectedConversionRate] = useState(0.005);
  const [screenshotModalOpen, setScreenshotModalOpen] = useState(false);
  const [calculatorPulseActive, setCalculatorPulseActive] = useState(false);
  const [highlightedBreakdownMetric, setHighlightedBreakdownMetric] = useState(null);

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
  const safeFollowerCount = useMemo(() => {
    const numeric = Number(String(selectedFollowerCount || "").replace(/,/g, ""));
    if (!Number.isFinite(numeric) || numeric <= 0) return 1000;
    return Math.max(1000, Math.floor(numeric));
  }, [selectedFollowerCount]);
  const conversionOptions = [
    { label: "0.5%", value: 0.005 },
    { label: "1%", value: 0.01 },
    { label: "2%", value: 0.02 },
  ];
  const estimatedMembers = useMemo(() => Math.round(safeFollowerCount * selectedConversionRate), [safeFollowerCount, selectedConversionRate]);
  const monthlyRevenue = useMemo(() => estimatedMembers * 3.99, [estimatedMembers]);
  const creatorEarnings = useMemo(() => monthlyRevenue * 0.3, [monthlyRevenue]);
  const [animatedCreatorEarnings, setAnimatedCreatorEarnings] = useState(creatorEarnings);
  const animatedCreatorEarningsRef = useRef(creatorEarnings);
  const lastInteractionRef = useRef(null);
  const hasAnimatedOnceRef = useRef(false);

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

  useEffect(() => {
    animatedCreatorEarningsRef.current = animatedCreatorEarnings;
  }, [animatedCreatorEarnings]);

  useEffect(() => {
    if (typeof window === "undefined") {
      setAnimatedCreatorEarnings(creatorEarnings);
      return undefined;
    }

    const startValue = animatedCreatorEarningsRef.current;
    const endValue = creatorEarnings;
    if (Math.abs(endValue - startValue) < 0.5) {
      setAnimatedCreatorEarnings(endValue);
      return undefined;
    }

    const duration = 520;
    const start = window.performance.now();
    let frameId = 0;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (timestamp) => {
      const progress = Math.min(1, (timestamp - start) / duration);
      setAnimatedCreatorEarnings(startValue + (endValue - startValue) * easeOutCubic(progress));
      if (progress < 1) frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [creatorEarnings]);

  useEffect(() => {
    if (!hasAnimatedOnceRef.current) {
      hasAnimatedOnceRef.current = true;
      return undefined;
    }

    setCalculatorPulseActive(true);
    const pulseTimer = window.setTimeout(() => setCalculatorPulseActive(false), 220);

    if (lastInteractionRef.current === "followers" || lastInteractionRef.current === "conversion") {
      setHighlightedBreakdownMetric(lastInteractionRef.current);
      const highlightTimer = window.setTimeout(() => setHighlightedBreakdownMetric(null), 320);
      return () => {
        window.clearTimeout(pulseTimer);
        window.clearTimeout(highlightTimer);
      };
    }

    return () => window.clearTimeout(pulseTimer);
  }, [creatorEarnings]);

  useEffect(() => {
    if (typeof window === "undefined" || !screenshotModalOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setScreenshotModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screenshotModalOpen]);

  const primaryCtaStyle = (hovered) => ({
    minHeight: 46,
    borderRadius: 11,
    border: "none",
    background: hovered ? TABBY_ASSIST_MINT_STRONG : TABBY_ASSIST_MINT,
    color: "#062016",
    fontSize: 16,
    fontWeight: 800,
    padding: "0 18px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxSizing: "border-box",
    boxShadow: hovered ? `0 8px 16px ${withAlpha(TABBY_ASSIST_MINT, 0.28)}` : "none",
    transition: "all 0.15s ease",
    transform: hovered ? "translateY(-1px)" : "translateY(0)",
    lineHeight: 1,
    whiteSpace: "nowrap",
  });
  const secondaryCtaStyle = {
    minHeight: 46,
    borderRadius: 11,
    border: `1px solid ${secondaryCtaHover ? withAlpha(THEME.accent, 0.55) : THEME.border}`,
    background: secondaryCtaHover ? withAlpha(THEME.text, 0.06) : withAlpha(THEME.text, 0.03),
    color: THEME.text,
    fontSize: 15,
    fontWeight: 800,
    padding: "0 16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxSizing: "border-box",
    boxShadow: secondaryCtaHover ? `0 8px 18px ${withAlpha(THEME.text, 0.08)}` : "none",
    transition: "background 0.18s ease, border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease",
    transform: secondaryCtaHover ? "translateY(-1px)" : "translateY(0)",
    lineHeight: 1,
    whiteSpace: "nowrap",
  };
  const scrollToEarnings = useCallback(() => {
    if (typeof document === "undefined") return;
    const target = document.getElementById("affiliate-earnings-example");
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: THEME.bg,
        backgroundImage: `radial-gradient(900px 560px at 16% 8%, ${withAlpha(TABBY_ASSIST_MINT, 0.1)} 0%, ${withAlpha(
          TABBY_ASSIST_MINT,
          0
        )} 60%), radial-gradient(920px 560px at 84% 18%, ${withAlpha(THEME.text, 0.06)} 0%, ${withAlpha(
          THEME.text,
          0
        )} 62%)`,
        color: THEME.text,
      }}
    >
      <style>{`
        @keyframes affiliateBadgeShift {
          0% {
            background-position: 0% 50%;
          }

          50% {
            background-position: 100% 50%;
          }

          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes affiliateCalculatorPulse {
          0% {
            border-color: rgba(255, 255, 255, 0.08);
            box-shadow: 0 0 0 rgba(91, 212, 161, 0);
            filter: brightness(1);
          }

          50% {
            border-color: rgba(91, 212, 161, 0.24);
            box-shadow: 0 0 0 1px rgba(91, 212, 161, 0.1), 0 18px 40px rgba(91, 212, 161, 0.08);
            filter: brightness(1.02);
          }

          100% {
            border-color: rgba(255, 255, 255, 0.08);
            box-shadow: 0 0 0 rgba(91, 212, 161, 0);
            filter: brightness(1);
          }
        }

        .affiliate-benefits-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          grid-auto-rows: 1fr;
          gap: 10px;
          align-items: stretch;
        }

        .affiliate-benefit-item {
          display: grid;
          grid-template-columns: 20px minmax(0, 1fr);
          gap: 10px;
          align-items: start;
          height: 100%;
          min-height: 44px;
        }

        .affiliate-benefit-text {
          font-size: 13px;
          line-height: 1.4;
          font-weight: 700;
          align-self: start;
        }

        .affiliate-hero-badge {
          background-size: 200% 200%;
          animation: affiliateBadgeShift 7s ease-in-out infinite;
          transition: border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
        }

        .affiliate-hero-badge:hover {
          border-color: rgba(91, 212, 161, 0.24);
          color: rgba(255, 255, 255, 0.78) !important;
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
        }

        .affiliate-proof-panel,
        .affiliate-benefits-panel,
        .affiliate-conversion-btn,
        .affiliate-calculator-card,
        .affiliate-breakdown-item,
        .affiliate-breakdown-item-label,
        .affiliate-breakdown-item-value {
          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease,
            color 0.2s ease,
            opacity 0.2s ease;
        }

        .affiliate-proof-panel:hover {
          transform: translateY(-2px);
          border-color: rgba(91, 212, 161, 0.12);
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.2);
        }

        .affiliate-screenshot-trigger {
          cursor: zoom-in;
          position: relative;
        }

        .affiliate-screenshot-trigger img {
          transform: none;
          transition: transform 0.22s ease, filter 0.22s ease;
        }

        .affiliate-screenshot-trigger:hover img {
          transform: none;
          filter: brightness(1.015);
        }

        .affiliate-screenshot-spotlight,
        .affiliate-screenshot-hint {
          transition: opacity 0.22s ease, transform 0.22s ease;
        }

        .affiliate-screenshot-trigger:hover .affiliate-screenshot-spotlight {
          opacity: 1;
        }

        .affiliate-screenshot-trigger:hover .affiliate-screenshot-hint {
          opacity: 1;
          transform: translateY(0);
        }

        .affiliate-benefits-panel:hover {
          transform: translateY(-2px);
          border-color: rgba(91, 212, 161, 0.1);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
        }

        .affiliate-conversion-btn:hover {
          transform: translateY(-1px);
          border-color: rgba(91, 212, 161, 0.2) !important;
          background: rgba(255, 255, 255, 0.04) !important;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
        }

        .affiliate-calculator-card:hover {
          transform: translateY(-2px);
          border-color: rgba(91, 212, 161, 0.1);
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.14);
        }

        .affiliate-calculator-card.is-updating {
          animation: affiliateCalculatorPulse 0.22s ease-out;
        }

        .affiliate-breakdown-item:hover {
          box-shadow: inset 0 -1px 0 rgba(91, 212, 161, 0.12);
        }

        .affiliate-breakdown-item:hover .affiliate-breakdown-item-label {
          opacity: 0.68;
        }

        .affiliate-breakdown-item:hover .affiliate-breakdown-item-value {
          color: rgba(255, 255, 255, 0.98);
        }

        .affiliate-breakdown-item.is-highlighted {
          box-shadow: inset 0 -1px 0 rgba(91, 212, 161, 0.28);
        }

        .affiliate-breakdown-item.is-highlighted .affiliate-breakdown-item-label {
          color: rgba(255, 255, 255, 0.42) !important;
        }

        .affiliate-breakdown-item.is-highlighted .affiliate-breakdown-item-value {
          color: rgba(91, 212, 161, 0.98) !important;
        }

        @media (max-width: 960px) {
          .affiliate-benefits-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .affiliate-benefits-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>
      <AppHeader
        shared={{
          isDark: isDarkMode,
          logoAriaLabel: "Back to editor",
          onLogoClick: onBack,
          rightContent: (
            <button
              type="button"
              onClick={onApply}
              onMouseEnter={() => setHeaderCtaHover(true)}
              onMouseLeave={() => setHeaderCtaHover(false)}
              onFocus={() => setHeaderCtaHover(true)}
              onBlur={() => setHeaderCtaHover(false)}
              style={{
                ...primaryCtaStyle(headerCtaHover),
                minHeight: 38,
                height: 38,
                fontSize: 15,
                padding: "0 16px",
              }}
            >
              Apply Now
            </button>
          ),
          showRightGroup: true,
          siteHeaderBarStyle,
          siteHeaderLeftGroupStyle,
          siteHeaderLogoButtonStyle,
          siteHeaderLogoImageStyle,
          siteHeaderSloganStyle,
          theme: THEME,
        }}
      />

      <main
        style={{
          width: "min(1160px, calc(100vw - 36px))",
          margin: "0 auto",
          padding: "20px 0 24px",
        }}
      >
        <section
          style={{
            borderRadius: 24,
            border: `1px solid ${withAlpha(THEME.text, 0.1)}`,
            background: `linear-gradient(135deg, ${withAlpha(THEME.surfaceWarm ?? THEME.surface, 0.96)} 0%, ${withAlpha(
              THEME.surfaceWarm ?? THEME.surface,
              0.84
            )} 100%)`,
            boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
            padding: "20px clamp(18px, 3vw, 28px) 18px",
            display: "grid",
            gap: 2,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: "-20%",
              background: `radial-gradient(circle at 30% 30%, ${withAlpha(TABBY_ASSIST_MINT, 0.12)} 0%, ${withAlpha(
                TABBY_ASSIST_MINT,
                0
              )} 60%)`,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 0.78fr) minmax(520px, 1.22fr)",
              gap: 16,
              alignItems: "stretch",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div style={{ display: "grid", gap: 0, alignContent: "start", paddingRight: 4 }}>
              <div
                className="affiliate-hero-badge"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  width: "fit-content",
                  borderRadius: 999,
                  border: `1px solid ${withAlpha(THEME.text, 0.12)}`,
                  background: `linear-gradient(120deg, ${withAlpha(TABBY_ASSIST_MINT, 0.12)} 0%, ${withAlpha(
                    TABBY_ASSIST_MINT,
                    0.02
                  )} 100%)`,
                  padding: "7px 11px",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.09em",
                  textTransform: "uppercase",
                  color: withAlpha(THEME.text, 0.56),
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 10, lineHeight: 1, color: withAlpha(TABBY_ASSIST_MINT, 0.82) }}>
                  ✦
                </span>
                Creator Affiliate Program
              </div>

              <h1
                style={{
                  margin: "10px 0 0",
                  fontSize: "clamp(38px, 6vw, 64px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.055em",
                  fontWeight: 950,
                  maxWidth: 560,
                }}
              >
                The tab app that <span style={{ color: TABBY_ASSIST_MINT }}>pays you</span>
              </h1>

              <p
                style={{
                  margin: "18px 0 0",
                  maxWidth: 500,
                  fontSize: 16,
                  lineHeight: 1.6,
                  fontWeight: 600,
                  color: withAlpha(THEME.text, 0.68),
                }}
              >
                Approved creators get a free Creator plan, built-in referral tracking, and 30% recurring commission when their audience joins TabStudio.
              </p>

              <div style={{ display: "grid", gap: 12, justifyItems: "start", marginTop: 10 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={onApply}
                    onMouseEnter={() => setCtaHover(true)}
                    onMouseLeave={() => setCtaHover(false)}
                    onFocus={() => setCtaHover(true)}
                    onBlur={() => setCtaHover(false)}
                    style={primaryCtaStyle(ctaHover)}
                  >
                    Apply to become an affiliate
                  </button>
                  <button
                    type="button"
                    onClick={scrollToEarnings}
                    onMouseEnter={() => setSecondaryCtaHover(true)}
                    onMouseLeave={() => setSecondaryCtaHover(false)}
                    onFocus={() => setSecondaryCtaHover(true)}
                    onBlur={() => setSecondaryCtaHover(false)}
                    style={secondaryCtaStyle}
                  >
                    See example earnings
                  </button>
                </div>
              </div>
            </div>

            <div
              className="affiliate-proof-panel"
              style={{
                borderRadius: 22,
                border: `1px solid ${withAlpha(THEME.text, 0.08)}`,
                background: `linear-gradient(180deg, ${withAlpha(THEME.surfaceWarm ?? THEME.surface, 0.93)} 0%, ${withAlpha(
                  THEME.surfaceWarm ?? THEME.surface,
                  0.82
                )} 100%)`,
                padding: "10px",
                display: "grid",
                gap: 8,
                minHeight: 0,
              }}
            >
              <div
                style={{
                  borderRadius: 18,
                  border: `1px solid ${withAlpha(THEME.text, 0.08)}`,
                  background: `radial-gradient(circle at 30% 18%, ${withAlpha(TABBY_ASSIST_MINT, 0.05)} 0%, ${withAlpha(
                    TABBY_ASSIST_MINT,
                    0
                  )} 40%), ${withAlpha(THEME.text, 0.016)}`,
                  padding: "8px",
                  minHeight: 390,
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  className="affiliate-screenshot-trigger"
                  onClick={() => setScreenshotModalOpen(true)}
                  style={{
                    display: "block",
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    border: "none",
                    padding: 0,
                    margin: 0,
                    background: "transparent",
                    overflow: "hidden",
                    borderRadius: 14,
                    boxSizing: "border-box",
                    minHeight: 372,
                  }}
                  aria-label="Open affiliate dashboard screenshot"
                >
                  <img
                    src={affiliateScreenshot}
                    alt="TabStudio affiliate dashboard screenshot"
                    style={{
                      display: "block",
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      objectPosition: "center top",
                      borderRadius: 14,
                    }}
                  />
                  <div
                    className="affiliate-screenshot-spotlight"
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0,
                      pointerEvents: "none",
                      borderRadius: 14,
                      background: `radial-gradient(circle at 84% 15%, ${withAlpha(TABBY_ASSIST_MINT, 0.18)} 0%, ${withAlpha(
                        TABBY_ASSIST_MINT,
                        0.08
                      )} 12%, ${withAlpha(TABBY_ASSIST_MINT, 0)} 34%)`,
                    }}
                  />
                  <div
                    className="affiliate-screenshot-hint"
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      right: 14,
                      bottom: 14,
                      opacity: 0,
                      transform: "translateY(4px)",
                      pointerEvents: "none",
                      borderRadius: 999,
                      border: `1px solid ${withAlpha(THEME.text, 0.14)}`,
                      background: withAlpha("#000000", 0.38),
                      color: withAlpha(THEME.text, 0.88),
                      padding: "7px 10px",
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                      boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    Click to enlarge
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div
            className="affiliate-benefits-panel"
            style={{
              borderRadius: 18,
              border: `1px solid ${withAlpha(THEME.text, 0.08)}`,
              background: withAlpha(THEME.text, 0.018),
              padding: "9px 14px",
              display: "grid",
              gap: 6,
              position: "relative",
              zIndex: 1,
              marginTop: 8,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: withAlpha(THEME.text, 0.5),
              }}
            >
              What approved creators unlock
            </div>
            <div
              className="affiliate-benefits-grid"
              style={{ paddingTop: 18 }}
            >
                {[
                  "Free Creator plan (full TabStudio access)",
                  "30% recurring commission on memberships",
                  "Your own referral link to share with your audience",
                  "Built-in dashboard with clicks, signups, and earnings",
                "Create custom tabs tailored to your videos and lessons",
                "Export clean PNG tabs/chord diagrams perfect for video overlays",
              ].map((item) => (
                <div
                  key={item}
                  className="affiliate-benefit-item"
                >
                  <div
                    aria-hidden="true"
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      background: withAlpha(TABBY_ASSIST_MINT, 0.12),
                      color: TABBY_ASSIST_MINT,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 11,
                      fontWeight: 900,
                    }}
                  >
                    ✓
                  </div>
                  <div className="affiliate-benefit-text" style={{ color: withAlpha(THEME.text, 0.9) }}>
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>

        <section
          id="affiliate-earnings-example"
          style={{
            marginTop: 20,
            borderRadius: 18,
            border: `1px solid ${withAlpha(THEME.text, 0.08)}`,
            background: `linear-gradient(135deg, ${withAlpha(THEME.text, 0.018)} 0%, ${withAlpha(
              THEME.surfaceWarm ?? THEME.surface,
              0.94
            )} 100%)`,
            padding: "22px 20px",
            display: "grid",
            gap: 10,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: "-18%",
              background: `radial-gradient(circle at 78% 24%, ${withAlpha(TABBY_ASSIST_MINT, 0.12)} 0%, ${withAlpha(
                TABBY_ASSIST_MINT,
                0.04
              )} 22%, ${withAlpha(TABBY_ASSIST_MINT, 0)} 60%)`,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          <div style={{ display: "grid", gap: 6, maxWidth: 700, position: "relative", zIndex: 1 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: withAlpha(THEME.text, 0.5),
              }}
            >
              Estimated creator earnings
            </div>
            <div style={{ fontSize: 24, lineHeight: 1.08, fontWeight: 950, letterSpacing: "-0.03em" }}>
              What could this look like for your audience?
            </div>
          </div>

          <div style={{ display: "grid", gap: 22, maxWidth: 520, marginTop: 10, position: "relative", zIndex: 1 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 12, color: withAlpha(THEME.text, 0.52), fontWeight: 800 }}>
                Enter your audience size
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: 8,
                  alignItems: "center",
                  borderRadius: 12,
                  border: `1px solid ${THEME.border}`,
                  background: withAlpha(THEME.text, 0.025),
                  padding: "0 10px 0 12px",
                  minHeight: 46,
                }}
              >
                <input
                  type="text"
                  inputMode="numeric"
                    value={isFollowerInputFocused ? selectedFollowerCount : formatWholeNumber(selectedFollowerCount)}
                    onChange={(event) => {
                      const digitsOnly = String(event.target.value || "").replace(/[^\d]/g, "");
                      lastInteractionRef.current = "followers";
                      setSelectedFollowerCount(digitsOnly);
                    }}
                  onFocus={() => {
                    setIsFollowerInputFocused(true);
                    setSelectedFollowerCount((current) => String(current || "").replace(/,/g, ""));
                  }}
                  onBlur={() => {
                    setIsFollowerInputFocused(false);
                    setSelectedFollowerCount(String(Math.max(1000, safeFollowerCount)));
                  }}
                  style={{
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    color: THEME.text,
                    outline: "none",
                    fontSize: 16,
                    fontWeight: 800,
                    padding: 0,
                    fontFamily: "inherit",
                  }}
                />
                <div style={{ fontSize: 12, color: withAlpha(THEME.text, 0.5), fontWeight: 700, whiteSpace: "nowrap" }}>followers</div>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.45, color: withAlpha(THEME.text, 0.5), fontWeight: 600 }}>
                Best for creators sharing tabs, lessons, and guitar content.
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, color: withAlpha(THEME.text, 0.52), fontWeight: 800 }}>Estimated audience conversion</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {conversionOptions.map((option) => {
                  const active = selectedConversionRate === option.value;
                  return (
                    <button
                      className="affiliate-conversion-btn"
                      key={option.label}
                      type="button"
                      onClick={() => {
                        lastInteractionRef.current = "conversion";
                        setSelectedConversionRate(option.value);
                      }}
                      style={{
                        minHeight: 34,
                        borderRadius: 999,
                        border: `1px solid ${active ? withAlpha(THEME.accent, 0.82) : THEME.border}`,
                        background: active
                          ? `linear-gradient(180deg, ${withAlpha(TABBY_ASSIST_MINT, 0.16)} 0%, ${withAlpha(THEME.accent, 0.1)} 100%)`
                          : withAlpha(THEME.text, 0.03),
                        color: active ? THEME.accent : THEME.text,
                        padding: "0 12px",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: "pointer",
                        boxShadow: active ? `0 0 0 1px ${withAlpha(TABBY_ASSIST_MINT, 0.08)}, 0 10px 20px ${withAlpha(TABBY_ASSIST_MINT, 0.08)}` : "none",
                        transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease",
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            className={`affiliate-calculator-card${calculatorPulseActive ? " is-updating" : ""}`}
            style={{
              borderRadius: 16,
              border: `1px solid ${withAlpha(THEME.text, 0.08)}`,
              background: `linear-gradient(135deg, ${withAlpha(THEME.text, 0.02)} 0%, ${withAlpha(
                THEME.surfaceWarm ?? THEME.surface,
                0.92
              )} 100%)`,
              padding: "24px 22px 20px",
              display: "grid",
              gap: 18,
              marginTop: 10,
              position: "relative",
              zIndex: 1,
            }}
          >
            <div style={{ display: "grid", gap: 10, justifyItems: "center", textAlign: "center" }}>
              <div
                style={{
                  fontSize: 12,
                  color: withAlpha(THEME.text, 0.48),
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Estimated monthly creator earnings
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 950,
                  lineHeight: 1.02,
                  letterSpacing: "-0.04em",
                  color: THEME.accent,
                }}
              >
                {`≈ ${formatCurrency(animatedCreatorEarnings)} / month`}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 10,
                paddingTop: 10,
                borderTop: `1px solid ${withAlpha(THEME.text, 0.08)}`,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 12,
                  alignItems: "start",
                }}
              >
                {[
                  { label: "Followers", value: formatWholeNumber(safeFollowerCount) },
                  { label: "Conversion", value: `${(selectedConversionRate * 100).toFixed(selectedConversionRate === 0.005 ? 1 : 0)}%` },
                  { label: "Members", value: formatWholeNumber(estimatedMembers) },
                ].map((step) => (
                  <div
                    className={`affiliate-breakdown-item${
                      highlightedBreakdownMetric === step.label.toLowerCase() ? " is-highlighted" : ""
                    }`}
                    key={step.label}
                    style={{
                      display: "grid",
                      gap: 6,
                      justifyItems: "center",
                      textAlign: "center",
                      borderRadius: 10,
                      padding: "4px 6px 6px",
                    }}
                  >
                    <div
                      className="affiliate-breakdown-item-label"
                      style={{
                        fontSize: 11,
                        color: withAlpha(THEME.text, 0.46),
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      {step.label}
                    </div>
                    <div
                      className="affiliate-breakdown-item-value"
                      style={{
                        fontSize: 24,
                        fontWeight: 900,
                        lineHeight: 1.08,
                        letterSpacing: "-0.03em",
                        color: THEME.text,
                      }}
                    >
                      {step.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: 11,
              lineHeight: 1.5,
              color: withAlpha(THEME.text, 0.44),
              fontWeight: 600,
              textAlign: "left",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              position: "relative",
              zIndex: 1,
            }}
          >
            Example based on the lowest membership tier ($3.99) with 30% creator commission. Recurring earnings depend on members staying subscribed.
          </div>
        </section>
      </main>

      {screenshotModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Affiliate dashboard screenshot"
          onClick={() => setScreenshotModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 5600,
            background: withAlpha("#000000", 0.76),
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              width: "min(1320px, calc(100vw - 48px))",
              maxWidth: "100%",
              display: "grid",
              placeItems: "center",
            }}
          >
            <img
              src={affiliateScreenshot}
              alt="TabStudio affiliate dashboard screenshot full size"
              style={{
                display: "block",
                maxWidth: "100%",
                width: "auto",
                height: "auto",
                maxHeight: "calc(100vh - 48px)",
                borderRadius: 18,
                boxShadow: "0 28px 80px rgba(0,0,0,0.42)",
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function browserDotStyle(color) {
  return {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: color,
    display: "inline-block",
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatWholeNumber(value) {
  const numeric = Number(String(value || "").replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return "";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(numeric);
}
