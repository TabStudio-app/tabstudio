import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppHeader from "../components/AppHeader";
import { getPlanMeta } from "../features/pricing";
import { signUp } from "../lib/auth";
import { getProfileByEmail } from "../lib/profile";
import { inputErrorText, inputImmersive, inputLabel } from "../utils/uiTokens";

export default function SignupPage({ shared }) {
  const {
    ACCENT_PRESETS,
    DARK_THEME,
    LIGHT_THEME,
    LS_ACCENT_COLOR_KEY,
    LS_THEME_MODE_KEY,
    TABBY_ASSIST_MINT,
    TABBY_ASSIST_MINT_STRONG,
    normalizeBillingCycle,
    onBack,
    onContinue,
    onGoSignIn,
    selectedBillingCycle = "monthly",
    selectedPlan = "solo",
    siteHeaderBarStyle,
    siteHeaderLeftGroupStyle,
    siteHeaderLogoButtonStyle,
    siteHeaderLogoImageStyle,
    siteHeaderSloganStyle,
    withAlpha,
  } = shared;

  const [themeRefresh, setThemeRefresh] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [signupTouchedFields, setSignupTouchedFields] = useState({});
  const [signupFocusedField, setSignupFocusedField] = useState("");
  const [signupHoveredField, setSignupHoveredField] = useState("");
  const [isCheckoutCtaHover, setIsCheckoutCtaHover] = useState(false);
  const [isSubmittingSignup, setIsSubmittingSignup] = useState(false);
  const [signupCardHover, setSignupCardHover] = useState(false);
  const [emailAvailability, setEmailAvailability] = useState("idle");
  const emailAvailabilityRequestRef = useRef(0);

  const getSystemThemeForSignup = useCallback(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }, []);
  const isSignupDarkMode = useMemo(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = window.localStorage.getItem(LS_THEME_MODE_KEY);
      if (stored === "dark") return true;
      if (stored === "light") return false;
    } catch {}
    return getSystemThemeForSignup() === "dark";
  }, [getSystemThemeForSignup, themeRefresh]);
  const signupAccentId = useMemo(() => {
    const fallback = isSignupDarkMode ? "white" : "black";
    if (typeof window === "undefined") return fallback;
    try {
      const stored = window.localStorage.getItem(LS_ACCENT_COLOR_KEY);
      if (ACCENT_PRESETS.some((p) => p.id === stored)) {
        if (isSignupDarkMode && stored === "black") return fallback;
        if (!isSignupDarkMode && stored === "white") return fallback;
        return stored;
      }
    } catch {}
    return fallback;
  }, [isSignupDarkMode, themeRefresh]);
  const signupAccent = useMemo(
    () => (ACCENT_PRESETS.find((preset) => preset.id === signupAccentId) || ACCENT_PRESETS[0]).hex,
    [signupAccentId]
  );
  const SIGNUP_THEME = useMemo(() => {
    const base = isSignupDarkMode ? DARK_THEME : LIGHT_THEME;
    return { ...base, accent: signupAccent };
  }, [isSignupDarkMode, signupAccent]);
  const activeBillingCycle = normalizeBillingCycle(selectedBillingCycle);
  const planMeta = getPlanMeta(selectedPlan);
  const selectedPlanPriceLabel = activeBillingCycle === "yearly" ? planMeta.yearly : planMeta.monthly;
  const cleanEmail = String(email || "").trim();
  const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
  const emailErrorMessage = String(errors.email || "").trim();
  const isDuplicateEmailError = /already exists|already registered|sign in or use a different email/i.test(emailErrorMessage);
  const duplicateEmailMessage = "An account with this email already exists. Sign in or use a different email.";
  const shouldShowDuplicateEmailMessage = emailAvailability === "duplicate" || isDuplicateEmailError;
  const shouldShowEmailValidIcon = hasValidEmail && emailAvailability === "available" && !emailErrorMessage;
  const shouldShowEmailError =
    cleanEmail.length > 0 &&
    !hasValidEmail &&
    (Boolean(signupTouchedFields.email) || Boolean(errors.email));

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onStorage = (e) => {
      if (!e?.key || e.key === LS_THEME_MODE_KEY || e.key === LS_ACCENT_COLOR_KEY) setThemeRefresh((v) => v + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [LS_ACCENT_COLOR_KEY, LS_THEME_MODE_KEY]);

  const runEmailAvailabilityCheck = useCallback(async (candidateEmail) => {
    const normalizedEmail = String(candidateEmail || "").trim();
    if (!normalizedEmail) {
      setEmailAvailability("idle");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailAvailability("idle");
      return;
    }

    const requestId = emailAvailabilityRequestRef.current + 1;
    emailAvailabilityRequestRef.current = requestId;
    setEmailAvailability("checking");

    try {
      const { data, error } = await getProfileByEmail(normalizedEmail);
      if (emailAvailabilityRequestRef.current !== requestId) return;
      if (error) {
        setEmailAvailability("idle");
        return;
      }
      if (data) {
        setEmailAvailability("duplicate");
        setErrors((prev) => ({
          ...prev,
          email: duplicateEmailMessage,
        }));
        return;
      }
      setEmailAvailability("available");
      setErrors((prev) => {
        if (!prev.email) return prev;
        const updated = { ...prev };
        delete updated.email;
        return updated;
      });
    } catch {
      if (emailAvailabilityRequestRef.current === requestId) {
        setEmailAvailability("idle");
      }
    }
  }, [duplicateEmailMessage]);

  useEffect(() => {
    if (!cleanEmail) {
      setEmailAvailability("idle");
      return undefined;
    }
    if (!hasValidEmail) {
      setEmailAvailability("idle");
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      await runEmailAvailabilityCheck(cleanEmail);
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [cleanEmail, hasValidEmail, runEmailAvailabilityCheck]);

  const inputStyle = (field, overrides = {}) => ({
    ...inputImmersive({
      focused: signupFocusedField === field,
      hovered: signupHoveredField === field,
      minHeight: 44,
      padding: "0 12px",
      fontSize: 16,
      fontWeight: 700,
    }),
    ...overrides,
  });
  const getLabelStyle = (field) => ({
    ...inputLabel(SIGNUP_THEME),
    color: signupFocusedField === field ? withAlpha(SIGNUP_THEME.text, 0.92) : undefined,
  });
  const errorTextStyle = inputErrorText();
  const inputWithToggleStyle = (field) => inputStyle(field, { paddingRight: 44 });
  const toggleBtnStyle = {
    position: "absolute",
    top: "50%",
    right: 8,
    transform: "translateY(-50%)",
    width: 28,
    height: 28,
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: SIGNUP_THEME.textFaint,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  };
  const passwordHasMinimumLength = String(password || "").length >= 8;
  const shouldShowPasswordLengthError =
    String(password || "").length > 0 &&
    !passwordHasMinimumLength &&
    (Boolean(signupTouchedFields.password) || String(confirmPassword || "").length > 0 || Boolean(errors.password));
  const passwordsMatch =
    String(password || "").length > 0 &&
    String(confirmPassword || "").length > 0 &&
    passwordHasMinimumLength &&
    password === confirmPassword;
  const passwordsMismatch =
    String(password || "").length > 0 &&
    String(confirmPassword || "").length > 0 &&
    passwordHasMinimumLength &&
    password !== confirmPassword &&
    (String(confirmPassword || "").length >= 3 || Boolean(signupTouchedFields.confirmPassword));
  const canContinue =
    !isSubmittingSignup &&
    hasValidEmail &&
    passwordHasMinimumLength &&
    String(confirmPassword || "").length > 0 &&
    password === confirmPassword;

  const validateEmailOnBlur = useCallback(async () => {
    const nextMessage = !cleanEmail ? "" : hasValidEmail ? "" : "Please enter a valid email address.";
    setErrors((prev) => ({
      ...prev,
      email: nextMessage,
    }));
    if (hasValidEmail) {
      await runEmailAvailabilityCheck(cleanEmail);
    }
  }, [cleanEmail, hasValidEmail, runEmailAvailabilityCheck]);

  const handleContinue = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) nextErrors.email = "Please enter a valid email address.";
    if (String(password || "").length < 8) nextErrors.password = "Password must be at least 8 characters.";
    if (!String(confirmPassword || "").length) nextErrors.confirmPassword = "Please confirm your password.";
    if (String(password || "").length && String(confirmPassword || "").length && password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setIsSubmittingSignup(true);
    try {
      const { error } = await signUp(cleanEmail, password);

      if (error) {
        const errorMessage = String(error?.message || "").toLowerCase();
        const duplicateEmail =
          errorMessage.includes("already registered") ||
          errorMessage.includes("already been registered") ||
          errorMessage.includes("user already registered");
        setErrors((prev) => ({
          ...prev,
          email: duplicateEmail ? duplicateEmailMessage : error.message,
        }));
        setIsSubmittingSignup(false);
        return;
      }
      await onContinue?.({ email: cleanEmail, password, selectedPlan, selectedBillingCycle: activeBillingCycle });
    } catch {
      setIsSubmittingSignup(false);
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        maxWidth: "100vw",
        height: "100dvh",
        minHeight: "100vh",
        backgroundColor: SIGNUP_THEME.bg,
        backgroundImage: `radial-gradient(1100px 760px at 50% 46%, ${withAlpha(TABBY_ASSIST_MINT, 0.1)} 0%, ${withAlpha(
          TABBY_ASSIST_MINT,
          0.04
        )} 34%, ${withAlpha(TABBY_ASSIST_MINT, 0)} 72%)`,
        backgroundRepeat: "no-repeat",
        color: SIGNUP_THEME.text,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr)",
        overflowX: "hidden",
        overflowY: "hidden",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes tabstudio-signup-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <AppHeader
        shared={{
          isDark: isSignupDarkMode,
          logoAriaLabel: "Back to editor",
          onLogoClick: onBack,
          rightContent: null,
          showRightGroup: false,
          siteHeaderBarStyle,
          siteHeaderLeftGroupStyle,
          siteHeaderLogoButtonStyle,
          siteHeaderLogoImageStyle,
          siteHeaderSloganStyle,
          theme: SIGNUP_THEME,
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
                filter: `blur(${signupCardHover ? 28 : 24}px)`,
                opacity: signupCardHover ? 0.95 : 0.8,
                pointerEvents: "none",
                zIndex: 0,
                transition: "opacity 220ms ease, filter 220ms ease",
              }}
            />
            <div
              onMouseEnter={() => setSignupCardHover(true)}
              onMouseLeave={() => setSignupCardHover(false)}
              onFocus={() => setSignupCardHover(true)}
              onBlur={() => setSignupCardHover(false)}
              style={{
                width: "min(620px, 100%)",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(18,18,18,0.95)",
                padding: "30px 26px",
                boxSizing: "border-box",
                display: "grid",
                gap: 18,
                boxShadow: signupCardHover
                  ? "0 14px 44px rgba(0,0,0,0.5)"
                  : "0 12px 40px rgba(0,0,0,0.45)",
                transform: signupCardHover ? "translateY(-1px)" : "translateY(0)",
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
                    color: withAlpha(SIGNUP_THEME.text, 0.48),
                  }}
                >
                  Step 1 of 2
                </div>
                <h1 style={{ margin: 0, fontSize: 39, fontWeight: 950, lineHeight: 1.04, letterSpacing: "-0.02em" }}>
                  Create your TabStudio account
                </h1>
                <div
                  style={{
                    color: withAlpha(SIGNUP_THEME.text, 0.54),
                    fontSize: 13,
                    fontWeight: 600,
                    fontStyle: "italic",
                    lineHeight: 1.4,
                  }}
                >
                  {planMeta.label.replace(/\s+Plan$/i, "")} • {selectedPlanPriceLabel}
                </div>
              </div>

              <form onSubmit={handleContinue} style={{ display: "grid", gap: 14 }}>
                <div style={{ display: "grid", gap: 7 }}>
                  <label style={getLabelStyle("email")}>Email</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailAvailability("idle");
                        setErrors((prev) => {
                          if (!prev.email) return prev;
                          const updated = { ...prev };
                          delete updated.email;
                          return updated;
                        });
                      }}
                      onMouseEnter={() => setSignupHoveredField("email")}
                      onMouseLeave={() => setSignupHoveredField((prev) => (prev === "email" ? "" : prev))}
                      onFocus={() => setSignupFocusedField("email")}
                      onBlur={() => {
                        setSignupFocusedField((prev) => (prev === "email" ? "" : prev));
                        setSignupTouchedFields((prev) => ({ ...prev, email: true }));
                        validateEmailOnBlur();
                      }}
                      style={inputStyle("email", { paddingRight: 40 })}
                    />
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        top: "50%",
                        right: 12,
                        transform: "translateY(-50%)",
                        width: 16,
                        height: 16,
                        color: "#34d399",
                        opacity: shouldShowEmailValidIcon ? 1 : 0,
                        transition: "opacity 160ms ease",
                        pointerEvents: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M3.5 8.2 6.5 11 12.5 4.8"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                  {shouldShowEmailError || shouldShowDuplicateEmailMessage || emailErrorMessage ? (
                    <div style={errorTextStyle}>
                      {shouldShowEmailError
                        ? "Please enter a valid email address."
                        : shouldShowDuplicateEmailMessage
                        ? duplicateEmailMessage
                        : emailErrorMessage}
                      {shouldShowDuplicateEmailMessage && onGoSignIn ? (
                        <>
                          {" "}
                          <button
                            type="button"
                            onClick={onGoSignIn}
                            style={{
                              border: "none",
                              background: "transparent",
                              padding: 0,
                              margin: 0,
                              color: "#34d399",
                              fontSize: "inherit",
                              fontWeight: 800,
                              cursor: "pointer",
                              textDecoration: "underline",
                            }}
                          >
                            Sign in
                          </button>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div style={{ display: "grid", gap: 7 }}>
                  <label style={getLabelStyle("password")}>Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password || errors.confirmPassword) {
                        setErrors((prev) => ({ ...prev, password: "", confirmPassword: "" }));
                      }
                      }}
                      onMouseEnter={() => setSignupHoveredField("password")}
                      onMouseLeave={() => setSignupHoveredField((prev) => (prev === "password" ? "" : prev))}
                      onFocus={() => setSignupFocusedField("password")}
                      onBlur={() => {
                        setSignupFocusedField((prev) => (prev === "password" ? "" : prev));
                        setSignupTouchedFields((prev) => ({ ...prev, password: true }));
                      }}
                      style={inputWithToggleStyle("password")}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      style={toggleBtnStyle}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                        {showPassword ? null : <path d="M4 20 20 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
                      </svg>
                    </button>
                  </div>
                  {shouldShowPasswordLengthError || errors.password ? (
                    <div style={errorTextStyle}>Password must be at least 8 characters.</div>
                  ) : null}
                </div>
                <div style={{ display: "grid", gap: 7 }}>
                  <label style={getLabelStyle("confirmPassword")}>Confirm Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                      }}
                      onMouseEnter={() => setSignupHoveredField("confirmPassword")}
                      onMouseLeave={() => setSignupHoveredField((prev) => (prev === "confirmPassword" ? "" : prev))}
                      onFocus={() => setSignupFocusedField("confirmPassword")}
                      onBlur={() => {
                        setSignupFocusedField((prev) => (prev === "confirmPassword" ? "" : prev));
                        setSignupTouchedFields((prev) => ({ ...prev, confirmPassword: true }));
                      }}
                      style={inputWithToggleStyle("confirmPassword")}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      style={toggleBtnStyle}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                        {showConfirmPassword ? null : <path d="M4 20 20 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
                      </svg>
                    </button>
                  </div>
                  {passwordsMismatch ? (
                    <div style={errorTextStyle}>Passwords do not match</div>
                  ) : passwordsMatch ? (
                    <div style={{ fontSize: 12, color: "#34d399", fontWeight: 800 }}>✓ Passwords match</div>
                  ) : errors.confirmPassword && !shouldShowPasswordLengthError ? (
                    <div style={errorTextStyle}>{errors.confirmPassword}</div>
                  ) : null}
                </div>
                <button
                  type="submit"
                  disabled={!canContinue}
                  onMouseEnter={() => setIsCheckoutCtaHover(true)}
                  onMouseLeave={() => setIsCheckoutCtaHover(false)}
                  onFocus={() => setIsCheckoutCtaHover(true)}
                  onBlur={() => setIsCheckoutCtaHover(false)}
                  style={{
                    minHeight: 46,
                    borderRadius: 11,
                    border: `1px solid ${canContinue ? withAlpha(TABBY_ASSIST_MINT, 0.72) : withAlpha(TABBY_ASSIST_MINT, 0.34)}`,
                    background: canContinue
                      ? isCheckoutCtaHover
                        ? TABBY_ASSIST_MINT_STRONG
                        : TABBY_ASSIST_MINT
                      : withAlpha(TABBY_ASSIST_MINT, 0.42),
                    color: "#FFFFFF",
                    fontSize: 17,
                    fontWeight: 900,
                    cursor: canContinue ? "pointer" : "not-allowed",
                    opacity: canContinue ? 1 : 0.62,
                    boxShadow:
                      canContinue && isCheckoutCtaHover
                        ? `0 8px 18px ${withAlpha(TABBY_ASSIST_MINT, 0.26)}`
                        : "none",
                    transition: "background 180ms ease, box-shadow 180ms ease, opacity 180ms ease, border-color 180ms ease",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {isSubmittingSignup ? (
                    <>
                      <span
                        aria-hidden="true"
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          border: "2px solid rgba(255,255,255,0.34)",
                          borderTopColor: "#FFFFFF",
                          display: "inline-block",
                          animation: "tabstudio-signup-spin 0.8s linear infinite",
                        }}
                      />
                      <span>Preparing Checkout...</span>
                    </>
                  ) : (
                    "Continue to Checkout"
                  )}
                </button>
                <div style={{ textAlign: "center", fontSize: 13, color: SIGNUP_THEME.textFaint, fontWeight: 700 }}>
                  Secure checkout powered by Stripe • Cancel anytime
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
