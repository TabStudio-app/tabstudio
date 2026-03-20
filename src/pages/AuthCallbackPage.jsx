import React, { useEffect, useMemo, useState } from "react";
import AppHeader from "../components/AppHeader";
import { clearAuthRedirectStateFromUrl, normalizeAuthOtpType, readAuthRedirectState } from "../lib/auth";
import { supabase } from "../lib/supabaseClient";

function SuccessIcon({ color = "#34d399" }) {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <circle cx="36" cy="36" r="34" fill="rgba(52,211,153,0.12)" stroke={color} strokeWidth="2" />
      <path d="M22 36.5 31.5 46 50 27.5" stroke={color} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorIcon({ color = "#ef4444" }) {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <circle cx="36" cy="36" r="34" fill="rgba(239,68,68,0.12)" stroke={color} strokeWidth="2" />
      <path d="M27 27 45 45" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M45 27 27 45" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

export default function AuthCallbackPage({ shared }) {
  const {
    ACCENT_PRESETS,
    DARK_THEME,
    LS_ACCENT_COLOR_KEY,
    LS_THEME_MODE_KEY,
    TABBY_ASSIST_MINT = "#34d399",
    TABBY_ASSIST_MINT_STRONG = "#10b981",
    onBack,
    onContinueToResetPassword,
    siteHeaderBarStyle,
    siteHeaderLeftGroupStyle,
    siteHeaderLogoButtonStyle,
    siteHeaderLogoImageStyle,
    siteHeaderSloganStyle,
    withAlpha,
  } = shared;

  const [themeRefresh, setThemeRefresh] = useState(0);
  const [cardHover, setCardHover] = useState(false);
  const [viewState, setViewState] = useState({
    status: "loading",
    type: "",
    title: "Confirming your link...",
    subtitle: "Please wait while TabStudio verifies your email link.",
    body: "This usually only takes a moment.",
    helper: "",
  });

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
    if (typeof document === "undefined") return undefined;
    const style = document.createElement("style");
    style.textContent = `
      @keyframes tabstudioCallbackDotBounce {
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

    const resolveAlreadyVerifiedState = async (resolvedType) => {
      if (resolvedType === "recovery") return false;
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) return false;
      const emailConfirmedAt = user?.email_confirmed_at || user?.confirmed_at || null;
      if (!emailConfirmedAt) return false;
      if (cancelled) return true;
      setViewState({
        status: "success",
        type: resolvedType,
        title: "Email already verified",
        subtitle: "",
        body: "This verification link has already been used. Your email is confirmed and your account is ready.",
        helper: "This page can now be closed.",
      });
      return true;
    };

    const resolveCallback = async () => {
      const { accessToken, code, errorCode, errorDescription, refreshToken, tokenHash, type } = readAuthRedirectState();
      const resolvedType = normalizeAuthOtpType(type);
      console.info("[AUTH CALLBACK] start", {
        pathname: typeof window !== "undefined" ? window.location.pathname : "",
        hasAccessToken: Boolean(accessToken),
        hasRefreshToken: Boolean(refreshToken),
        hasCode: Boolean(code),
        hasTokenHash: Boolean(tokenHash),
        resolvedType,
        errorCode,
        errorDescription,
      });

      if (errorCode || errorDescription) {
        if (await resolveAlreadyVerifiedState(resolvedType)) {
          clearAuthRedirectStateFromUrl();
          return;
        }
        if (cancelled) return;
        console.warn("[AUTH CALLBACK] redirect-state-error", {
          resolvedType,
          errorCode,
          errorDescription,
        });
        setViewState({
          status: "error",
          type: resolvedType,
          title: "Verification failed",
          subtitle: "",
          body: errorDescription || "This link may be invalid or expired.",
          helper: "",
        });
        clearAuthRedirectStateFromUrl();
        return;
      }

      try {
        let session = null;
        let resolutionMethod = "existing-session";

        if (accessToken && refreshToken) {
          resolutionMethod = "setSession";
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          session = data?.session || null;
        } else if (code) {
          resolutionMethod = "exchangeCodeForSession";
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          session = data?.session || null;
        } else if (tokenHash && resolvedType) {
          resolutionMethod = "verifyOtp";
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: resolvedType,
          });
          if (error) throw error;
          session = data?.session || null;
        } else {
          const {
            data: { session: currentSession },
          } = await supabase.auth.getSession();
          session = currentSession || null;
        }

        console.info("[AUTH CALLBACK] session-resolved", {
          resolutionMethod,
          hasSession: Boolean(session),
          sessionUserId: String(session?.user?.id || ""),
          sessionEmail: String(session?.user?.email || ""),
        });

        if (!session) {
          throw new Error("This link may be invalid or expired.");
        }

        if (resolvedType !== "recovery") {
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();
          if (userError) throw userError;

          const emailConfirmedAt = user?.email_confirmed_at || user?.confirmed_at || null;
          console.info("[AUTH CALLBACK] user-read", {
            resolvedType,
            userId: String(user?.id || ""),
            email: String(user?.email || ""),
            emailConfirmedAt: user?.email_confirmed_at || null,
            confirmedAt: user?.confirmed_at || null,
            effectiveConfirmedAt: emailConfirmedAt,
          });
          if (!emailConfirmedAt) {
            throw new Error("Email verification has not completed yet.");
          }
        }

        if (cancelled) return;

        if (resolvedType === "recovery") {
          setViewState({
            status: "success",
            type: resolvedType,
            title: "Reset link verified",
            subtitle: "Your TabStudio password reset link has been confirmed.",
            body: "You can continue to choose a new password now.",
            helper: "This page can now be closed.",
          });
        } else {
          setViewState({
            status: "success",
            type: resolvedType,
            title: "Email verified",
            subtitle: "Your TabStudio email has been successfully confirmed.",
            body: "You can now close this window and return to TabStudio.",
            helper: "This page can now be closed.",
          });
        }

        clearAuthRedirectStateFromUrl();
      } catch (error) {
        if (await resolveAlreadyVerifiedState(resolvedType)) {
          clearAuthRedirectStateFromUrl();
          return;
        }
        console.error("[AUTH CALLBACK] failed", {
          resolvedType,
          message: String(error?.message || "Unknown auth callback error."),
        });
        if (cancelled) return;
        setViewState({
          status: "error",
          type: resolvedType,
          title: "Verification failed",
          subtitle: "",
          body: String(error?.message || "This link may be invalid or expired."),
          helper: "",
        });
        clearAuthRedirectStateFromUrl();
      }
    };

    void resolveCallback();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadingDotStyle = (index) => ({
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "#04120a",
    display: "inline-block",
    animation: "tabstudioCallbackDotBounce 0.9s ease-in-out infinite",
    animationDelay: `${index * 0.12}s`,
  });

  const primaryButtonStyle = {
    minHeight: 46,
    borderRadius: 11,
    width: "100%",
    border: "none",
    background: TABBY_ASSIST_MINT,
    color: "#04120a",
    fontSize: 17,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: `0 10px 18px ${withAlpha(TABBY_ASSIST_MINT, 0.24)}`,
    transition: "transform 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",
  };

  const accentColor = viewState.status === "error" ? "#ef4444" : TABBY_ASSIST_MINT;

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
                background: `radial-gradient(circle at center, ${withAlpha(accentColor, 0.09)} 0%, ${withAlpha(accentColor, 0.04)} 40%, ${withAlpha(
                  accentColor,
                  0
                )} 75%)`,
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
                border: `1px solid ${viewState.status === "error" ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.08)"}`,
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
              <div style={{ display: "grid", gap: 10, textAlign: "center", justifyItems: "center" }}>
                {viewState.status === "loading" ? (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      color: withAlpha(THEME.text, 0.58),
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    <span>Confirming your link</span>
                    <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 4 }}>
                      <span aria-hidden="true" style={loadingDotStyle(0)} />
                      <span aria-hidden="true" style={loadingDotStyle(1)} />
                      <span aria-hidden="true" style={loadingDotStyle(2)} />
                    </span>
                  </div>
                ) : viewState.status === "error" ? (
                  <ErrorIcon />
                ) : (
                  <SuccessIcon />
                )}

                <h1 style={{ margin: 0, fontSize: 39, fontWeight: 950, lineHeight: 1.04, letterSpacing: "-0.02em" }}>{viewState.title}</h1>
                {viewState.subtitle ? (
                  <div
                    style={{
                      color: withAlpha(THEME.text, 0.76),
                      fontSize: 16,
                      fontWeight: 700,
                    }}
                  >
                    {viewState.subtitle}
                  </div>
                ) : null}
                <div
                  style={{
                    color: withAlpha(THEME.text, 0.62),
                    fontSize: 15,
                    fontWeight: 700,
                    lineHeight: 1.55,
                    maxWidth: 440,
                  }}
                >
                  {viewState.body}
                </div>
                {viewState.helper ? (
                  <div
                    style={{
                      color: withAlpha(THEME.text, 0.42),
                      fontSize: 13,
                      fontWeight: 600,
                      lineHeight: 1.45,
                    }}
                  >
                    {viewState.helper}
                  </div>
                ) : null}
              </div>

              {viewState.status === "success" && viewState.type === "recovery" ? (
                <button type="button" onClick={onContinueToResetPassword} style={primaryButtonStyle}>
                  Continue to Reset Password
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
