import React, { useEffect, useMemo, useState } from "react";
import AppHeader from "../components/AppHeader";
import { clearAuthRedirectStateFromUrl, readAuthRedirectState, updatePassword } from "../lib/auth";
import { supabase } from "../lib/supabaseClient";
import { inputErrorText, inputImmersive, inputLabel } from "../utils/uiTokens";

export default function ResetPasswordPage({ shared }) {
  const {
    ACCENT_PRESETS,
    DARK_THEME,
    LS_ACCENT_COLOR_KEY,
    LS_THEME_MODE_KEY,
    TABBY_ASSIST_MINT,
    TABBY_ASSIST_MINT_STRONG,
    onBack,
    onGoSignIn,
    onRecoverySessionResolved,
    onResetPasswordComplete,
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
  const [resetNarrow, setResetNarrow] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 980 : false));
  const [focusedField, setFocusedField] = useState("");
  const [hoveredField, setHoveredField] = useState("");
  const [resetCtaHover, setResetCtaHover] = useState(false);
  const [resetCardHover, setResetCardHover] = useState(false);
  const [resetHeaderHoverBtn, setResetHeaderHoverBtn] = useState("");
  const [resetHeaderPressedBtn, setResetHeaderPressedBtn] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("loading");
  const [statusMessage, setStatusMessage] = useState("Checking your reset link.");
  const [activeSession, setActiveSession] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDark = true;
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
    const onStorage = (event) => {
      if (!event?.key || event.key === LS_THEME_MODE_KEY || event.key === LS_ACCENT_COLOR_KEY) {
        setThemeRefresh((value) => value + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [LS_ACCENT_COLOR_KEY, LS_THEME_MODE_KEY]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setResetNarrow(window.innerWidth < 980);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const style = document.createElement("style");
    style.textContent = `
      @keyframes tabstudioResetDotBounce {
        0%, 80%, 100% {
          transform: translateY(0) scale(1);
          opacity: 0.55;
        }
        40% {
          transform: translateY(-5px) scale(1.08);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const prepareRecoverySession = async () => {
      const { code, errorCode, errorDescription, tokenHash, type } = readAuthRedirectState();

      if (errorCode || errorDescription) {
        if (cancelled) return;
        setStatus("error");
        setStatusMessage(errorDescription || "This reset link is not valid anymore. Please request a new one.");
        clearAuthRedirectStateFromUrl();
        return;
      }

      try {
        let session = null;

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          session = data?.session || null;
        } else if (tokenHash && type === "recovery") {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });
          if (error) throw error;
          session = data?.session || null;
        } else {
          const {
            data: { session: currentSession },
          } = await supabase.auth.getSession();
          session = currentSession || null;
        }

        if (!session) {
          throw new Error("This reset link is not valid anymore. Please request a new one.");
        }

        if (!cancelled) {
          setActiveSession(session);
          setStatus("ready");
          setStatusMessage("");
          clearAuthRedirectStateFromUrl();
        }

        await onRecoverySessionResolved?.({ session });
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setStatusMessage(String(error?.message || "This reset link could not be completed. Please request a new one."));
        clearAuthRedirectStateFromUrl();
      }
    };

    void prepareRecoverySession();

    return () => {
      cancelled = true;
    };
  }, [onRecoverySessionResolved]);

  const inputStyle = (field) => ({
    ...inputImmersive({
      focused: focusedField === field,
      hovered: hoveredField === field,
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
    background: resetCtaHover ? TABBY_ASSIST_MINT_STRONG : TABBY_ASSIST_MINT,
    color: "#04120a",
    fontSize: 17,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: resetCtaHover ? `0 10px 18px ${withAlpha(TABBY_ASSIST_MINT, 0.24)}` : "none",
    transform: resetCtaHover ? "translateY(-1px)" : "translateY(0)",
    filter: resetCtaHover ? "brightness(1.05)" : "brightness(1)",
    transition: "transform 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",
  };
  const loadingDotsWrapStyle = {
    display: "inline-flex",
    alignItems: "flex-end",
    gap: 4,
    marginLeft: 2,
  };
  const loadingDotStyle = (index) => ({
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "#04120a",
    display: "inline-block",
    animation: "tabstudioResetDotBounce 0.9s ease-in-out infinite",
    animationDelay: `${index * 0.12}s`,
  });
  const textLinkStyle = {
    border: "none",
    background: "transparent",
    color: THEME.accent,
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    padding: 0,
  };

  const validate = () => {
    const nextErrors = {};
    if (String(password || "").length < 8) nextErrors.password = "Password must be at least 8 characters.";
    if (!String(confirmPassword || "").length) nextErrors.confirmPassword = "Please confirm your new password.";
    if (String(password || "").length >= 8 && password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const { error } = await updatePassword(password);
      if (error) throw error;

      setErrors({});
      setStatus("success");
      setStatusMessage("Your password has been updated. Redirecting you back into TabStudio.");
      const nextPath = (await onResetPasswordComplete?.({ session: activeSession })) || "/editor";
      window.setTimeout(() => {
        if (typeof nextPath === "string" && nextPath) {
          window.history.pushState({}, "", nextPath);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      }, 900);
    } catch (error) {
      setErrors((current) => ({
        ...current,
        form: String(error?.message || "Unable to update your password right now."),
      }));
      setIsSubmitting(false);
    }
  };

  const headerRightContent = (
    <button
      type="button"
      onClick={onBack}
      onMouseEnter={() => setResetHeaderHoverBtn("back")}
      onMouseLeave={() => setResetHeaderHoverBtn((current) => (current === "back" ? "" : current))}
      onFocus={() => setResetHeaderHoverBtn("back")}
      onBlur={() => setResetHeaderHoverBtn((current) => (current === "back" ? "" : current))}
      onPointerDown={() => setResetHeaderPressedBtn("back")}
      onPointerUp={() => setResetHeaderPressedBtn("")}
      onPointerCancel={() => setResetHeaderPressedBtn("")}
      style={siteHeaderEditorLinkStyle(THEME, { hovered: resetHeaderHoverBtn === "back", pressed: resetHeaderPressedBtn === "back" })}
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
          padding: resetNarrow ? "18px 14px 28px" : "26px 20px 36px",
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
                width: resetNarrow ? 570 : 660,
                height: resetNarrow ? 530 : 600,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                background: `radial-gradient(circle at center, ${withAlpha(TABBY_ASSIST_MINT, 0.09)} 0%, ${withAlpha(
                  TABBY_ASSIST_MINT,
                  0.04
                )} 40%, ${withAlpha(TABBY_ASSIST_MINT, 0)} 75%)`,
                filter: `blur(${resetCardHover ? 28 : 24}px)`,
                opacity: resetCardHover ? 0.95 : 0.8,
                pointerEvents: "none",
                zIndex: 0,
                transition: "opacity 220ms ease, filter 220ms ease",
              }}
            />

            <div
              onMouseEnter={() => setResetCardHover(true)}
              onMouseLeave={() => setResetCardHover(false)}
              onFocus={() => setResetCardHover(true)}
              onBlur={() => setResetCardHover(false)}
              style={{
                width: "min(620px, 100%)",
                borderRadius: 14,
                border: `1px solid ${status === "error" ? "rgba(239,68,68,0.4)" : resetCardHover ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.08)"}`,
                background: "rgba(18,18,18,0.95)",
                padding: resetNarrow ? "24px 18px" : "30px 26px",
                boxSizing: "border-box",
                display: "grid",
                gap: 18,
                boxShadow: resetCardHover ? "0 14px 44px rgba(0,0,0,0.5)" : "0 12px 40px rgba(0,0,0,0.45)",
                transform: resetCardHover ? "translateY(-1px)" : "translateY(0)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div style={{ display: "grid", gap: 10, textAlign: "center" }}>
                <h1 style={{ margin: 0, fontSize: resetNarrow ? 35 : 39, fontWeight: 950, lineHeight: 1.04, letterSpacing: "-0.02em" }}>
                  Reset your password
                </h1>
                <div style={{ color: withAlpha(THEME.text, 0.76), fontSize: 16, fontWeight: 700, lineHeight: 1.5 }}>
                  {statusMessage || "Choose a new password for your account."}
                </div>
              </div>

              {status === "loading" ? (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 16, fontWeight: 800 }}>
                    <span>Checking link</span>
                    <span aria-hidden="true" style={loadingDotsWrapStyle}>
                      {[0, 1, 2].map((index) => (
                        <span key={index} style={loadingDotStyle(index)} />
                      ))}
                    </span>
                  </div>
                </div>
              ) : null}

              {status === "ready" ? (
                <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
                  <div style={{ display: "grid", gap: 7 }}>
                    <label style={labelStyle}>New password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={isSubmitting}
                      onMouseEnter={() => setHoveredField("password")}
                      onMouseLeave={() => setHoveredField((current) => (current === "password" ? "" : current))}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField((current) => (current === "password" ? "" : current))}
                      style={inputStyle("password")}
                    />
                    {errors.password ? <div style={errorTextStyle}>{errors.password}</div> : null}
                  </div>

                  <div style={{ display: "grid", gap: 7 }}>
                    <label style={labelStyle}>Confirm new password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      disabled={isSubmitting}
                      onMouseEnter={() => setHoveredField("confirm")}
                      onMouseLeave={() => setHoveredField((current) => (current === "confirm" ? "" : current))}
                      onFocus={() => setFocusedField("confirm")}
                      onBlur={() => setFocusedField((current) => (current === "confirm" ? "" : current))}
                      style={inputStyle("confirm")}
                    />
                    {errors.confirmPassword ? <div style={errorTextStyle}>{errors.confirmPassword}</div> : null}
                  </div>

                  {errors.form ? <div style={errorTextStyle}>{errors.form}</div> : null}

                  <button
                    type="submit"
                    onMouseEnter={() => setResetCtaHover(true)}
                    onMouseLeave={() => setResetCtaHover(false)}
                    onFocus={() => setResetCtaHover(true)}
                    onBlur={() => setResetCtaHover(false)}
                    disabled={isSubmitting}
                    style={{
                      ...actionBtnStyle,
                      opacity: isSubmitting ? 0.92 : 1,
                      cursor: isSubmitting ? "progress" : actionBtnStyle.cursor,
                    }}
                  >
                    {isSubmitting ? (
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <span>Updating password</span>
                        <span aria-hidden="true" style={loadingDotsWrapStyle}>
                          {[0, 1, 2].map((index) => (
                            <span key={index} style={loadingDotStyle(index)} />
                          ))}
                        </span>
                      </span>
                    ) : (
                      "Save New Password"
                    )}
                  </button>
                </form>
              ) : null}

              {status === "success" ? (
                <div style={{ textAlign: "center" }}>
                  <button type="button" disabled style={{ ...actionBtnStyle, opacity: 0.92, cursor: "progress" }}>
                    Returning to TabStudio
                  </button>
                </div>
              ) : null}

              {status === "error" ? (
                <div style={{ display: "grid", gap: 10, justifyItems: "center" }}>
                  <button
                    type="button"
                    onClick={onGoSignIn}
                    onMouseEnter={() => setResetCtaHover(true)}
                    onMouseLeave={() => setResetCtaHover(false)}
                    onFocus={() => setResetCtaHover(true)}
                    onBlur={() => setResetCtaHover(false)}
                    style={{ ...actionBtnStyle }}
                  >
                    Back to Sign In
                  </button>
                  <button type="button" onClick={onBack} style={textLinkStyle}>
                    Back to Editor
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
