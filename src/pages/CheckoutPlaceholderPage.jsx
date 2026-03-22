import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppHeader from "../components/AppHeader";
import { getPlanMeta } from "../features/pricing";

export default function CheckoutPlaceholderPage({ shared }) {
  const {
    ACCENT_PRESETS,
    checkoutAutostartKey = "",
    checkoutButtonLabel = "Continue to Secure Checkout",
    checkoutErrorMessage = "",
    DARK_THEME,
    LIGHT_THEME,
    LS_ACCENT_COLOR_KEY,
    LS_THEME_MODE_KEY,
    TABBY_ASSIST_MINT,
    TABBY_ASSIST_MINT_STRONG,
    isCheckoutProcessing = false,
    normalizeBillingCycle,
    onActivateMembership,
    onBack,
    onChangePlan,
    currentPlanId = null,
    hasActiveMembership = false,
    selectedBillingCycle = "monthly",
    selectedPlan = "solo",
    shouldAutoLaunchCheckout = false,
    siteHeaderBarStyle,
    siteHeaderLeftGroupStyle,
    siteHeaderLogoButtonStyle,
    siteHeaderLogoImageStyle,
    siteHeaderSloganStyle,
    withAlpha,
  } = shared;

  const [themeRefresh, setThemeRefresh] = useState(0);
  const [checkoutCardHover, setCheckoutCardHover] = useState(false);
  const [checkoutActivateHover, setCheckoutActivateHover] = useState(false);
  const hasConsumedAutostartRef = useRef(false);
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
      if (ACCENT_PRESETS.some((p) => p.id === stored)) {
        if (isDark && stored === "black") return fallback;
        if (!isDark && stored === "white") return fallback;
        return stored;
      }
    } catch {}
    return fallback;
  }, [ACCENT_PRESETS, LS_ACCENT_COLOR_KEY, isDark, themeRefresh]);
  const accent = useMemo(() => (ACCENT_PRESETS.find((preset) => preset.id === accentId) || ACCENT_PRESETS[0]).hex, [ACCENT_PRESETS, accentId]);
  const THEME = useMemo(() => ({ ...(isDark ? DARK_THEME : LIGHT_THEME), accent }), [DARK_THEME, LIGHT_THEME, accent, isDark]);
  const planMeta = getPlanMeta(selectedPlan);
  const currentPlanMeta = getPlanMeta(currentPlanId || "solo");
  const activeBillingCycle = normalizeBillingCycle(selectedBillingCycle);
  const selectedPlanPriceLabel = activeBillingCycle === "yearly" ? planMeta.yearly : planMeta.monthly;
  const selectedBillingLabel = activeBillingCycle === "yearly" ? "Yearly billing" : "Monthly billing";
  const currentPlanPriceLabel = activeBillingCycle === "yearly" ? currentPlanMeta.yearly : currentPlanMeta.monthly;
  const planRank = useMemo(() => ({ solo: 1, band: 2, creator: 3 }), []);
  const isPlanSwitch = Boolean(hasActiveMembership && currentPlanId && String(currentPlanId) !== String(planMeta.id));
  const switchDirection = !isPlanSwitch
    ? "none"
    : (planRank[String(planMeta.id)] || 0) > (planRank[String(currentPlanId)] || 0)
      ? "upgrade"
      : "downgrade";
  const switchActionLabel = switchDirection === "upgrade" ? "upgrade" : switchDirection === "downgrade" ? "downgrade" : "plan change";
  const checkoutPrimaryActionLabel = isPlanSwitch
    ? `Review ${switchActionLabel} in Stripe`
    : checkoutButtonLabel;
  const switchSummaryLines = useMemo(() => {
    if (!isPlanSwitch) return [];
    if (switchDirection === "upgrade") {
      return [
        `You’re upgrading from ${currentPlanMeta.label} (${currentPlanPriceLabel}) to ${planMeta.label} (${selectedPlanPriceLabel}).`,
        `You’ll get instant access to ${planMeta.label} features.`,
        "You’ll be charged a prorated amount today for the price difference.",
        `Your full ${selectedPlanPriceLabel} billing starts from your next billing date.`,
      ];
    }
    return [
      `You’re downgrading from ${currentPlanMeta.label} (${currentPlanPriceLabel}) to ${planMeta.label} (${selectedPlanPriceLabel}).`,
      "Your current plan will remain active until the end of your billing period.",
      `Your new ${selectedPlanPriceLabel} pricing will start on your next billing date.`,
      "You won’t be charged anything today.",
    ];
  }, [currentPlanMeta.label, currentPlanPriceLabel, isPlanSwitch, planMeta.label, selectedPlanPriceLabel, switchDirection]);
  const selectedPlanHighlights = useMemo(() => {
    if (planMeta.id === "creator") {
      return [
        "Write tabs",
        "Save tabs",
        "Play tabs",
        "Organise personal tab library",
        "Export PDF tabs",
        "Setlist Creator (future feature)",
        "Export PNG tab overlays",
        "Transparent tab graphics for videos",
        "Tap-to-sync tab timing",
        "Unlimited saved tabs",
      ];
    }
    if (planMeta.id === "band") {
      return [
        "Write tabs",
        "Save tabs",
        "Play tabs",
        "Organise personal tab library",
        "Export PDF tabs",
        "Setlist Creator (future feature)",
        "Up to 250 saved tabs",
      ];
    }
    return [
      "Write tabs",
      "Save tabs",
      "Play tabs",
      "Organise personal tab library",
      "Up to 50 saved tabs",
    ];
  }, [planMeta.id]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onStorage = (e) => {
      if (!e?.key || e.key === LS_THEME_MODE_KEY || e.key === LS_ACCENT_COLOR_KEY) setThemeRefresh((v) => v + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [LS_ACCENT_COLOR_KEY, LS_THEME_MODE_KEY]);

  useEffect(() => {
    if (!shouldAutoLaunchCheckout || isCheckoutProcessing || typeof onActivateMembership !== "function") return;
    if (hasConsumedAutostartRef.current) return;

    hasConsumedAutostartRef.current = true;
    if (typeof window !== "undefined" && checkoutAutostartKey) {
      try {
        window.sessionStorage.removeItem(checkoutAutostartKey);
      } catch {}
    }

    void onActivateMembership();
  }, [checkoutAutostartKey, isCheckoutProcessing, onActivateMembership, shouldAutoLaunchCheckout]);

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
          isDark,
          logoAriaLabel: "Back to editor",
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
                filter: `blur(${checkoutCardHover ? 28 : 24}px)`,
                opacity: checkoutCardHover ? 0.95 : 0.8,
                pointerEvents: "none",
                zIndex: 0,
                transition: "opacity 220ms ease, filter 220ms ease",
              }}
            />
            <div
              onMouseEnter={() => setCheckoutCardHover(true)}
              onMouseLeave={() => setCheckoutCardHover(false)}
              onFocus={() => setCheckoutCardHover(true)}
              onBlur={() => setCheckoutCardHover(false)}
              style={{
                width: "min(620px, 100%)",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(18,18,18,0.95)",
                padding: "30px 26px",
                boxSizing: "border-box",
                display: "grid",
                gap: 14,
                boxShadow: checkoutCardHover
                  ? "0 14px 44px rgba(0,0,0,0.5)"
                  : "0 12px 40px rgba(0,0,0,0.45)",
                transform: checkoutCardHover ? "translateY(-1px)" : "translateY(0)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div style={{ display: "grid", gap: 10, textAlign: "center" }}>
                <div
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: withAlpha(THEME.text, 0.48),
                  }}
                >
                  Step 2 of 2
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: withAlpha(THEME.text, 0.56) }}>
                  Confirm your plan
                </div>
                <h1 style={{ margin: 0, fontSize: 39, fontWeight: 950, lineHeight: 1.04, letterSpacing: "-0.02em" }}>
                  Confirm your subscription
                </h1>
                <div style={{ color: withAlpha(THEME.text, 0.76), fontSize: 16, fontWeight: 700 }}>
                  Secure payment via Stripe
                </div>
                <div style={{ display: "grid", gap: 2 }}>
                  <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.12 }}>{planMeta.label}</div>
                  <div style={{ fontSize: 15, color: THEME.textFaint, fontWeight: 700 }}>
                    {selectedPlanPriceLabel} • {selectedBillingLabel}
                  </div>
                </div>
              </div>
              <div
                style={{
                  borderRadius: 12,
                  border: `2px solid ${withAlpha(TABBY_ASSIST_MINT, 0.76)}`,
                  background: "rgba(18,18,18,0.95)",
                  boxShadow: `0 0 0 1px ${withAlpha(TABBY_ASSIST_MINT, 0.12)}, 0 8px 30px ${withAlpha(TABBY_ASSIST_MINT, 0.06)}`,
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "12px 12px 10px", display: "grid", gap: 10 }}>
                  <div
                    style={{
                      borderRadius: 10,
                      border: `1px solid ${THEME.border}`,
                      background: withAlpha(THEME.text, isDark ? 0.03 : 0.02),
                      padding: "10px 10px 8px",
                      display: "grid",
                      gap: 7,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 900, color: THEME.textFaint, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Includes
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "4px 18px",
                      }}
                    >
                      {selectedPlanHighlights.map((item) => (
                        <div
                          key={item}
                          style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, lineHeight: 1.25, color: THEME.textFaint, fontWeight: 700 }}
                        >
                          <span aria-hidden="true" style={{ color: TABBY_ASSIST_MINT, fontWeight: 900 }}>•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: withAlpha(THEME.text, 0.42),
                }}
              >
                Instant access after checkout • Cancel anytime • Secure payment via Stripe
              </div>
              {isPlanSwitch ? (
                <div
                  style={{
                    marginTop: 2,
                    borderRadius: 10,
                    border: `1px solid ${THEME.border}`,
                    background: withAlpha(THEME.text, isDark ? 0.045 : 0.03),
                    padding: "9px 11px",
                    display: "grid",
                    gap: 5,
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 900, color: THEME.text }}>
                    {switchSummaryLines[0]}
                  </div>
                  {switchSummaryLines.slice(1).map((line) => (
                    <div key={line} style={{ fontSize: 12, lineHeight: 1.45, color: THEME.textFaint, fontWeight: 700 }}>
                      {line}
                    </div>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                onClick={onActivateMembership}
                disabled={isCheckoutProcessing}
                onMouseEnter={() => setCheckoutActivateHover(true)}
                onMouseLeave={() => setCheckoutActivateHover(false)}
                onFocus={() => setCheckoutActivateHover(true)}
                onBlur={() => setCheckoutActivateHover(false)}
                style={{
                  marginTop: 12,
                  minHeight: 46,
                  borderRadius: 11,
                  border: "none",
                  background: checkoutActivateHover ? TABBY_ASSIST_MINT_STRONG : TABBY_ASSIST_MINT,
                  color: "#04120a",
                  fontSize: 17,
                  fontWeight: 900,
                  cursor: isCheckoutProcessing ? "wait" : "pointer",
                  opacity: isCheckoutProcessing ? 0.72 : 1,
                  boxShadow: checkoutActivateHover ? `0 10px 18px ${withAlpha(TABBY_ASSIST_MINT, 0.24)}` : "none",
                  transform: checkoutActivateHover ? "translateY(-1px)" : "translateY(0)",
                  filter: checkoutActivateHover ? "brightness(1.05)" : "brightness(1)",
                  transition: "transform 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",
                }}
              >
                {isCheckoutProcessing ? "Opening secure checkout..." : checkoutPrimaryActionLabel}
              </button>
              <div
                style={{
                  marginTop: 8,
                  borderRadius: 10,
                  border: `1px solid ${THEME.border}`,
                  background: withAlpha(THEME.text, isDark ? 0.03 : 0.02),
                  padding: "9px 11px",
                  display: "grid",
                  gap: 4,
                  textAlign: "left",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 900, color: THEME.text }}>
                  What happens next
                </div>
                <div style={{ fontSize: 12, color: THEME.textFaint, fontWeight: 700, lineHeight: 1.45 }}>1. Review payment details in Stripe</div>
                <div style={{ fontSize: 12, color: THEME.textFaint, fontWeight: 700, lineHeight: 1.45 }}>2. Confirm your plan change</div>
                <div style={{ fontSize: 12, color: THEME.textFaint, fontWeight: 700, lineHeight: 1.45 }}>
                  3. Return to TabStudio with your updated access
                </div>
              </div>
              {isCheckoutProcessing ? (
                <div
                  style={{
                    marginTop: 8,
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: withAlpha(THEME.text, 0.46),
                  }}
                >
                  This may take a moment.
                </div>
              ) : null}
              {checkoutErrorMessage ? (
                <div
                  style={{
                    marginTop: 8,
                    textAlign: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fca5a5",
                  }}
                >
                  {checkoutErrorMessage}
                </div>
              ) : null}
              <button
                type="button"
                onClick={onChangePlan}
                style={{
                  minHeight: 40,
                  borderRadius: 10,
                  border: `1px solid ${THEME.border}`,
                  background: THEME.surfaceWarm,
                  color: THEME.text,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Change plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
