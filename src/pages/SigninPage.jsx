import React, { useEffect, useMemo, useRef, useState } from "react";
import tabbyLight from "../assets/tabby-light-v1-transparent.png";
import tabbyDark from "../assets/tabby-dark-v1-transparent.png";
import AppHeader from "../components/AppHeader";
import { inputErrorText, inputImmersive, inputLabel } from "../utils/uiTokens";

export default function SigninPage({ shared }) {
  const {
    ACCENT_PRESETS,
    DARK_THEME,
    LS_ACCENT_COLOR_KEY,
    LS_MEMBERSHIP_SCROLL_TO_PLANS_KEY,
    LS_THEME_MODE_KEY,
    TABBY_ASSIST_MINT,
    TABBY_ASSIST_MINT_STRONG,
    TabbySpeechBubble,
    VIEWPORT_TABBY_ASSET_MAX_WIDTH_PX,
    VIEWPORT_TABBY_BOTTOM_PX,
    VIEWPORT_TABBY_CONTAINER_SIZE_PX,
    VIEWPORT_TABBY_GLOW_SIZE_PX,
    VIEWPORT_TABBY_RIGHT_PX,
    VIEWPORT_TABBY_Z_INDEX,
    onAuthSuccess,
    onBack,
    onGoMembership,
    siteHeaderBarStyle,
    siteHeaderEditorLinkStyle,
    siteHeaderLeftGroupStyle,
    siteHeaderLogoButtonStyle,
    siteHeaderLogoImageStyle,
    siteHeaderRightGroupStyle,
    siteHeaderSloganStyle,
    withAlpha,
  } = shared;

  const [themeRefresh, setThemeRefresh] = useState(0);
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [signinNarrow, setSigninNarrow] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 980 : false));
  const [signinFocusedField, setSigninFocusedField] = useState("");
  const [signinHoveredField, setSigninHoveredField] = useState("");
  const [signinCtaHover, setSigninCtaHover] = useState(false);
  const [signinCardHover, setSigninCardHover] = useState(false);
  const [tabbyFloatUp, setTabbyFloatUp] = useState(false);
  const [signinWelcomeBubbleVisible, setSigninWelcomeBubbleVisible] = useState(true);
  const [signinResetBubbleVisible, setSigninResetBubbleVisible] = useState(false);
  const [signinTabbyDismissed, setSigninTabbyDismissed] = useState(false);
  const [signinHeaderHoverBtn, setSigninHeaderHoverBtn] = useState("");
  const [signinHeaderPressedBtn, setSigninHeaderPressedBtn] = useState("");
  const signinResetBubbleTimerRef = useRef(null);

  const isDark = true;
  const accentId = useMemo(() => {
    const fallback = "white";
    if (typeof window === "undefined") return fallback;
    try {
      const stored = window.localStorage.getItem(LS_ACCENT_COLOR_KEY);
      if (ACCENT_PRESETS.some((p) => p.id === stored)) {
        if (stored === "black") return fallback;
        return stored;
      }
    } catch {}
    return fallback;
  }, [ACCENT_PRESETS, LS_ACCENT_COLOR_KEY, themeRefresh]);
  const accent = useMemo(() => (ACCENT_PRESETS.find((p) => p.id === accentId) || ACCENT_PRESETS[0]).hex, [ACCENT_PRESETS, accentId]);
  const THEME = useMemo(() => ({ ...DARK_THEME, accent }), [DARK_THEME, accent]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onStorage = (e) => {
      if (!e?.key || e.key === LS_THEME_MODE_KEY || e.key === LS_ACCENT_COLOR_KEY) setThemeRefresh((v) => v + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [LS_ACCENT_COLOR_KEY, LS_THEME_MODE_KEY]);

  useEffect(() => {
    const id = window.setInterval(() => setTabbyFloatUp((v) => !v), 2200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setSigninWelcomeBubbleVisible(true);
    const hideId = window.setTimeout(() => {
      setSigninWelcomeBubbleVisible(false);
    }, 3000);
    return () => window.clearTimeout(hideId);
  }, []);

  useEffect(() => {
    return () => {
      if (signinResetBubbleTimerRef.current) {
        window.clearTimeout(signinResetBubbleTimerRef.current);
        signinResetBubbleTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setSigninNarrow(window.innerWidth < 980);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const inputStyle = (field) => ({
    ...inputImmersive({
      focused: signinFocusedField === field,
      hovered: signinHoveredField === field,
      minHeight: 44,
      padding: "0 12px",
      fontSize: 16,
      fontWeight: 700,
    }),
  });
  const labelStyle = inputLabel(THEME);
  const errorTextStyle = inputErrorText();
  const actionBtnStyle = {
    minHeight: 46,
    borderRadius: 11,
    width: "100%",
    border: "none",
    background: signinCtaHover ? TABBY_ASSIST_MINT_STRONG : TABBY_ASSIST_MINT,
    color: "#04120a",
    fontSize: 17,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: signinCtaHover ? `0 10px 18px ${withAlpha(TABBY_ASSIST_MINT, 0.24)}` : "none",
    transform: signinCtaHover ? "translateY(-1px)" : "translateY(0)",
    filter: signinCtaHover ? "brightness(1.05)" : "brightness(1)",
    transition: "transform 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",
  };
  const textLinkStyle = {
    border: "none",
    background: "transparent",
    color: THEME.accent,
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    padding: 0,
  };

  const submitLabel = mode === "create" ? "Create Account" : mode === "forgot" ? "Send Reset Link" : "Sign In";
  const validate = () => {
    const nextErrors = {};
    const cleanEmail = String(email || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) nextErrors.email = "Please enter a valid email.";
    if (mode !== "forgot" && String(password || "").length < 8) nextErrors.password = "Password must be at least 8 characters.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };
  const onSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (mode === "forgot") {
      setSigninWelcomeBubbleVisible(false);
      setSigninResetBubbleVisible(true);
      if (signinResetBubbleTimerRef.current) {
        window.clearTimeout(signinResetBubbleTimerRef.current);
      }
      signinResetBubbleTimerRef.current = window.setTimeout(() => {
        setSigninResetBubbleVisible(false);
        signinResetBubbleTimerRef.current = null;
      }, 3600);
      return;
    }
    onAuthSuccess?.({ email: String(email || "").trim(), mode });
  };

  const headerRightContent = (
    <button
      type="button"
      onClick={onBack}
      onMouseEnter={() => setSigninHeaderHoverBtn("back")}
      onMouseLeave={() => setSigninHeaderHoverBtn((prev) => (prev === "back" ? "" : prev))}
      onFocus={() => setSigninHeaderHoverBtn("back")}
      onBlur={() => setSigninHeaderHoverBtn((prev) => (prev === "back" ? "" : prev))}
      onPointerDown={() => setSigninHeaderPressedBtn("back")}
      onPointerUp={() => setSigninHeaderPressedBtn("")}
      onPointerCancel={() => setSigninHeaderPressedBtn("")}
      style={siteHeaderEditorLinkStyle(THEME, { hovered: signinHeaderHoverBtn === "back" })}
    >
      Editor
    </button>
  );

  return (
    <div
      style={{
        width: "100vw",
        maxWidth: "100vw",
        minHeight: "100vh",
        height: "100dvh",
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
          rightContent: headerRightContent,
          showRightGroup: true,
          siteHeaderBarStyle,
          siteHeaderLeftGroupStyle,
          siteHeaderLogoButtonStyle,
          siteHeaderLogoImageStyle,
          siteHeaderRightGroupStyle,
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
          padding: signinNarrow ? "18px 14px 28px" : "26px 20px 36px",
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
                width: signinNarrow ? 570 : 660,
                height: signinNarrow ? 530 : 600,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                background: `radial-gradient(circle at center, ${withAlpha(TABBY_ASSIST_MINT, 0.09)} 0%, ${withAlpha(
                  TABBY_ASSIST_MINT,
                  0.04
                )} 40%, ${withAlpha(TABBY_ASSIST_MINT, 0)} 75%)`,
                filter: `blur(${signinCardHover ? 28 : 24}px)`,
                opacity: signinCardHover ? 0.95 : 0.8,
                pointerEvents: "none",
                zIndex: 0,
                transition: "opacity 220ms ease, filter 220ms ease",
              }}
            />
            <div
              onMouseEnter={() => setSigninCardHover(true)}
              onMouseLeave={() => setSigninCardHover(false)}
              onFocus={() => setSigninCardHover(true)}
              onBlur={() => setSigninCardHover(false)}
              style={{
                width: "min(620px, 100%)",
                borderRadius: 14,
                border: `1px solid ${signinCardHover ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.08)"}`,
                background: "rgba(18,18,18,0.95)",
                padding: signinNarrow ? "24px 18px" : "30px 26px",
                boxSizing: "border-box",
                display: "grid",
                gap: 18,
                boxShadow: signinCardHover
                  ? "0 14px 44px rgba(0,0,0,0.5)"
                  : "0 12px 40px rgba(0,0,0,0.45)",
                transform: signinCardHover ? "translateY(-1px)" : "translateY(0)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div style={{ display: "grid", gap: 10, textAlign: "center" }}>
                <h1 style={{ margin: 0, fontSize: signinNarrow ? 35 : 39, fontWeight: 950, lineHeight: 1.04, letterSpacing: "-0.02em" }}>
                  Welcome to TabStudio
                </h1>
                <div style={{ color: withAlpha(THEME.text, 0.76), fontSize: 16, fontWeight: 700 }}>
                  Sign in to access your saved tabs and projects.
                </div>
              </div>

              <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
                <div style={{ display: "grid", gap: 7 }}>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onMouseEnter={() => setSigninHoveredField("email")}
                    onMouseLeave={() => setSigninHoveredField((prev) => (prev === "email" ? "" : prev))}
                    onFocus={() => setSigninFocusedField("email")}
                    onBlur={() => setSigninFocusedField((prev) => (prev === "email" ? "" : prev))}
                    style={inputStyle("email")}
                  />
                  {errors.email ? <div style={errorTextStyle}>{errors.email}</div> : null}
                </div>
                {mode !== "forgot" ? (
                  <div style={{ display: "grid", gap: 7 }}>
                    <label style={labelStyle}>Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onMouseEnter={() => setSigninHoveredField("password")}
                      onMouseLeave={() => setSigninHoveredField((prev) => (prev === "password" ? "" : prev))}
                      onFocus={() => setSigninFocusedField("password")}
                      onBlur={() => setSigninFocusedField((prev) => (prev === "password" ? "" : prev))}
                      style={inputStyle("password")}
                    />
                    {errors.password ? <div style={errorTextStyle}>{errors.password}</div> : null}
                  </div>
                ) : null}
                <button
                  type="submit"
                  onMouseEnter={() => setSigninCtaHover(true)}
                  onMouseLeave={() => setSigninCtaHover(false)}
                  onFocus={() => setSigninCtaHover(true)}
                  onBlur={() => setSigninCtaHover(false)}
                  style={actionBtnStyle}
                >
                  {submitLabel}
                </button>
              </form>

              {mode === "signin" ? (
                <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setErrors({});
                      onGoMembership?.();
                    }}
                    style={textLinkStyle}
                  >
                    Create account
                  </button>
                  <button type="button" onClick={() => { setMode("forgot"); setErrors({}); }} style={textLinkStyle}>Forgot password</button>
                </div>
              ) : mode === "create" ? (
                <div style={{ textAlign: "center" }}>
                  <button type="button" onClick={() => { setMode("signin"); setErrors({}); }} style={textLinkStyle}>
                    Already have an account? Sign in
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <button type="button" onClick={() => { setMode("signin"); setErrors({}); }} style={textLinkStyle}>
                    Back to Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {!signinTabbyDismissed ? (
          <div
            style={{
              position: "fixed",
              right: VIEWPORT_TABBY_RIGHT_PX,
              bottom: VIEWPORT_TABBY_BOTTOM_PX,
              zIndex: VIEWPORT_TABBY_Z_INDEX,
              pointerEvents: "none",
            }}
            aria-hidden="true"
          >
            <div
              style={{
                position: "relative",
                width: VIEWPORT_TABBY_CONTAINER_SIZE_PX,
                height: VIEWPORT_TABBY_CONTAINER_SIZE_PX,
                transform: `translateY(${tabbyFloatUp ? -6 : 2}px)`,
                transition: "transform 2100ms cubic-bezier(0.42, 0, 0.28, 1)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <TabbySpeechBubble
                theme={THEME}
                isDark={isDark}
                accentColor={TABBY_ASSIST_MINT}
                variant="neutral"
                visible={signinWelcomeBubbleVisible || signinResetBubbleVisible}
                bubbleWidth={signinResetBubbleVisible ? 190 : 140}
                bubbleMaxWidth={signinResetBubbleVisible ? 190 : 140}
                tailSide="bottom-center"
                pointerEvents="none"
                withAlpha={withAlpha}
                style={{
                  position: "absolute",
                  top: -10,
                  left: "50%",
                  transform: "translate(-50%, -100%)",
                  fontSize: 12,
                  fontWeight: 700,
                  opacity: 0.88,
                  transition: "opacity 320ms ease",
                }}
              >
                {signinResetBubbleVisible ? (
                  <span style={{ whiteSpace: "pre-line" }}>{"Check your email 📧\nYour reset link is on the way."}</span>
                ) : (
                  "Welcome back"
                )}
              </TabbySpeechBubble>
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: VIEWPORT_TABBY_GLOW_SIZE_PX,
                  height: VIEWPORT_TABBY_GLOW_SIZE_PX,
                  transform: "translate(-50%, -50%)",
                  borderRadius: "50%",
                  background: `radial-gradient(circle at center, ${withAlpha("#FFFFFF", 0.24)} 0%, ${withAlpha("#FFFFFF", 0.12)} 42%, transparent 74%)`,
                  filter: "blur(1px)",
                }}
              />
              <div style={{ position: "absolute", width: `min(${VIEWPORT_TABBY_ASSET_MAX_WIDTH_PX}px, 100%)` }}>
                <button
                  type="button"
                  onDoubleClick={() => setSigninTabbyDismissed(true)}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    margin: 0,
                    display: "block",
                    width: "100%",
                    cursor: "pointer",
                    pointerEvents: "auto",
                  }}
                  aria-label="Tabby"
                  title="Double-click to hide Tabby"
                >
                  <img
                    src={isDark ? tabbyDark : tabbyLight}
                    alt="Tabby"
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                      objectFit: "contain",
                      filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.24))",
                    }}
                  />
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
