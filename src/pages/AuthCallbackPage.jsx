import React, { useEffect, useMemo, useState } from "react";
import AppHeader from "../components/AppHeader";
import { clearAuthRedirectStateFromUrl, normalizeAuthOtpType, readAuthRedirectState } from "../lib/auth";
import { supabase } from "../lib/supabaseClient";

export default function AuthCallbackPage({ shared }) {
  const {
    ACCENT_PRESETS,
    DARK_THEME,
    LS_ACCENT_COLOR_KEY,
    LS_THEME_MODE_KEY,
    TABBY_ASSIST_MINT,
    TABBY_ASSIST_MINT_STRONG,
    onAuthResolved,
    onBack,
    onGoSignIn,
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
  const [callbackNarrow, setCallbackNarrow] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 980 : false));
  const [callbackCardHover, setCallbackCardHover] = useState(false);
  const [callbackCtaHover, setCallbackCtaHover] = useState(false);
  const [callbackHeaderHoverBtn, setCallbackHeaderHoverBtn] = useState("");
  const [callbackHeaderPressedBtn, setCallbackHeaderPressedBtn] = useState("");
  const [viewState, setViewState] = useState({
    status: "loading",
    title: "Confirming your link...",
    message: "Please wait while TabStudio finishes signing you in.",
    ctaLabel: "",
    ctaAction: null,
  });

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
    const onResize = () => setCallbackNarrow(window.innerWidth < 980);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
    let redirectTimer = null;

    const resolveAuthLink = async () => {
      const { code, errorCode, errorDescription, tokenHash, type } = readAuthRedirectState();

      if (errorCode || errorDescription) {
        if (cancelled) return;
        setViewState({
          status: "error",
          title: "This link could not be completed.",
          message: errorDescription || "The sign-in link may have expired or already been used. Please request a new one.",
          ctaLabel: "Back to Sign In",
          ctaAction: () => onGoSignIn?.(),
        });
        clearAuthRedirectStateFromUrl();
        return;
      }

      try {
        let session = null;
        let resolvedType = normalizeAuthOtpType(type);

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          session = data?.session || null;
        } else if (tokenHash && resolvedType) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: resolvedType,
          });
          if (error) throw error;
          session = data?.session || null;
        } else {
          const {
            data: { session: activeSession },
          } = await supabase.auth.getSession();
          session = activeSession || null;
        }

        if (!session) {
          throw new Error("This link is no longer valid. Please request a new email and try again.");
        }

        const resolution = (await onAuthResolved?.({ session, type: resolvedType || "magiclink" })) || {};
        if (cancelled) return;

        setViewState({
          status: "success",
          title: resolution.title || "You're in.",
          message: resolution.message || "Your link was confirmed successfully. Redirecting now.",
          ctaLabel: resolution.path ? "Continue" : "",
          ctaAction: resolution.path ? () => resolution.navigate?.(resolution.path) : null,
        });
        clearAuthRedirectStateFromUrl();

        if (resolution.path && typeof resolution.navigate === "function") {
          redirectTimer = window.setTimeout(() => {
            resolution.navigate(resolution.path);
          }, 900);
        }
      } catch (error) {
        if (cancelled) return;
        setViewState({
          status: "error",
          title: "This link could not be completed.",
          message: String(error?.message || "The link may have expired or already been used. Please request a fresh email and try again."),
          ctaLabel: "Back to Sign In",
          ctaAction: () => onGoSignIn?.(),
        });
        clearAuthRedirectStateFromUrl();
      }
    };

    void resolveAuthLink();

    return () => {
      cancelled = true;
      if (redirectTimer) window.clearTimeout(redirectTimer);
    };
  }, [onAuthResolved, onGoSignIn]);

  const actionBtnStyle = {
    minHeight: 46,
    borderRadius: 11,
    width: "100%",
    border: "none",
    background: callbackCtaHover ? TABBY_ASSIST_MINT_STRONG : TABBY_ASSIST_MINT,
    color: "#04120a",
    fontSize: 17,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: callbackCtaHover ? `0 10px 18px ${withAlpha(TABBY_ASSIST_MINT, 0.24)}` : "none",
    transform: callbackCtaHover ? "translateY(-1px)" : "translateY(0)",
    filter: callbackCtaHover ? "brightness(1.05)" : "brightness(1)",
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
    animation: "tabstudioCallbackDotBounce 0.9s ease-in-out infinite",
    animationDelay: `${index * 0.12}s`,
  });

  const headerRightContent = (
    <button
      type="button"
      onClick={onBack}
      onMouseEnter={() => setCallbackHeaderHoverBtn("back")}
      onMouseLeave={() => setCallbackHeaderHoverBtn((current) => (current === "back" ? "" : current))}
      onFocus={() => setCallbackHeaderHoverBtn("back")}
      onBlur={() => setCallbackHeaderHoverBtn((current) => (current === "back" ? "" : current))}
      onPointerDown={() => setCallbackHeaderPressedBtn("back")}
      onPointerUp={() => setCallbackHeaderPressedBtn("")}
      onPointerCancel={() => setCallbackHeaderPressedBtn("")}
      style={siteHeaderEditorLinkStyle(THEME, { hovered: callbackHeaderHoverBtn === "back", pressed: callbackHeaderPressedBtn === "back" })}
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
          padding: callbackNarrow ? "18px 14px 28px" : "26px 20px 36px",
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
                width: callbackNarrow ? 570 : 660,
                height: callbackNarrow ? 530 : 600,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                background: `radial-gradient(circle at center, ${withAlpha(TABBY_ASSIST_MINT, 0.09)} 0%, ${withAlpha(
                  TABBY_ASSIST_MINT,
                  0.04
                )} 40%, ${withAlpha(TABBY_ASSIST_MINT, 0)} 75%)`,
                filter: `blur(${callbackCardHover ? 28 : 24}px)`,
                opacity: callbackCardHover ? 0.95 : 0.8,
                pointerEvents: "none",
                zIndex: 0,
                transition: "opacity 220ms ease, filter 220ms ease",
              }}
            />

            <div
              onMouseEnter={() => setCallbackCardHover(true)}
              onMouseLeave={() => setCallbackCardHover(false)}
              onFocus={() => setCallbackCardHover(true)}
              onBlur={() => setCallbackCardHover(false)}
              style={{
                width: "min(620px, 100%)",
                borderRadius: 14,
                border: `1px solid ${viewState.status === "error" ? "rgba(239,68,68,0.4)" : callbackCardHover ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.08)"}`,
                background: "rgba(18,18,18,0.95)",
                padding: callbackNarrow ? "24px 18px" : "30px 26px",
                boxSizing: "border-box",
                display: "grid",
                gap: 18,
                boxShadow: callbackCardHover ? "0 14px 44px rgba(0,0,0,0.5)" : "0 12px 40px rgba(0,0,0,0.45)",
                transform: callbackCardHover ? "translateY(-1px)" : "translateY(0)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div style={{ display: "grid", gap: 10, textAlign: "center" }}>
                <h1 style={{ margin: 0, fontSize: callbackNarrow ? 35 : 39, fontWeight: 950, lineHeight: 1.04, letterSpacing: "-0.02em" }}>
                  {viewState.title}
                </h1>
                <div style={{ color: withAlpha(THEME.text, 0.76), fontSize: 16, fontWeight: 700, lineHeight: 1.5 }}>{viewState.message}</div>
              </div>

              {viewState.status === "loading" ? (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 16, fontWeight: 800 }}>
                    <span>Verifying link</span>
                    <span aria-hidden="true" style={loadingDotsWrapStyle}>
                      {[0, 1, 2].map((index) => (
                        <span key={index} style={loadingDotStyle(index)} />
                      ))}
                    </span>
                  </div>
                </div>
              ) : null}

              {viewState.status !== "loading" && viewState.ctaLabel && typeof viewState.ctaAction === "function" ? (
                <button
                  type="button"
                  onClick={viewState.ctaAction}
                  onMouseEnter={() => setCallbackCtaHover(true)}
                  onMouseLeave={() => setCallbackCtaHover(false)}
                  onFocus={() => setCallbackCtaHover(true)}
                  onBlur={() => setCallbackCtaHover(false)}
                  style={actionBtnStyle}
                >
                  {viewState.ctaLabel}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
