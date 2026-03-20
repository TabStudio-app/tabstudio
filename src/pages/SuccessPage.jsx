import React, { useEffect, useMemo, useState } from "react";
import AppHeader from "../components/AppHeader";
import { supabase } from "../lib/supabaseClient";

function SuccessIcon({ color = "#34d399" }) {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <circle cx="36" cy="36" r="34" fill="rgba(52,211,153,0.12)" stroke={color} strokeWidth="2" />
      <path d="M22 36.5 31.5 46 50 27.5" stroke={color} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SuccessPage({ shared }) {
  const {
    ACCENT_PRESETS,
    DARK_THEME,
    LS_ACCENT_COLOR_KEY,
    LS_THEME_MODE_KEY,
    TABBY_ASSIST_MINT = "#34d399",
    onVerificationDetected,
    onContinueToAccountSetup,
    pendingVerificationState,
    siteHeaderBarStyle,
    siteHeaderLeftGroupStyle,
    siteHeaderLogoButtonStyle,
    siteHeaderLogoImageStyle,
    siteHeaderSloganStyle,
    withAlpha,
  } = shared;

  const [themeRefresh, setThemeRefresh] = useState(0);
  const [cardHover, setCardHover] = useState(false);
  const [viewMode, setViewMode] = useState("waiting");

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

  useEffect(() => {
    let effectDisposed = false;
    let handoffStarted = false;
    let continueTimer = null;
    let pollTimer = null;
    let remoteSigninInFlight = false;

    const pendingEmail = String(pendingVerificationState?.flowEmail || "").trim().toLowerCase();
    const pendingPassword = String(pendingVerificationState?.flowPassword || "");
    const pendingAuthUserId = String(pendingVerificationState?.pendingAuthUserId || "").trim();

    const canAttemptRemoteVerification = Boolean(pendingAuthUserId && pendingEmail && pendingPassword.length >= 8);

    const completeVerifiedFlow = () => {
      if (handoffStarted) return;
      handoffStarted = true;
      setViewMode("verified");
      continueTimer = window.setTimeout(() => {
        onContinueToAccountSetup?.();
      }, 1400);
    };

    const handleResolvedVerification = async (session) => {
      const nextState = await onVerificationDetected?.({ session });
      const hasCompletedAccess = Boolean(nextState?.isLoggedIn) && Boolean(nextState?.hasMembership);
      console.info("[SUCCESS VERIFY] handleResolvedVerification:nextState", {
        isLoggedIn: Boolean(nextState?.isLoggedIn),
        hasMembership: Boolean(nextState?.hasMembership),
        planTier: String(nextState?.planTier || ""),
        authUserId: String(nextState?.authUserId || ""),
        hasCompletedAccess,
        effectDisposed,
      });
      if (!hasCompletedAccess) return false;
      if (effectDisposed) {
        if (handoffStarted) return true;
        handoffStarted = true;
        console.info("[SUCCESS VERIFY] handleResolvedVerification:continue-despite-cancelled", {
          reason: "effect-cleanup-during-successful-hydration",
        });
        onContinueToAccountSetup?.();
        return true;
      }
      completeVerifiedFlow();
      return true;
    };

    const checkRemoteVerificationStatus = async () => {
      const requestPayload = {
        pendingAuthUserId,
        pendingAuthEmail: pendingEmail,
      };
      console.info("[SUCCESS VERIFY] api-request", requestPayload);
      const response = await fetch("/api/check-verification-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });
      const payload = await response.json().catch(() => ({}));
      console.info("[SUCCESS VERIFY] api-response", {
        ok: response.ok,
        status: response.status,
        payload,
      });
      if (!response.ok) {
        throw new Error(String(payload?.error || "Unable to check verification status."));
      }
      return payload;
    };

    const pollForVerification = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (effectDisposed) return;

      if (session) {
        const resolved = await handleResolvedVerification(session);
        if (resolved || effectDisposed) return;
      } else if (canAttemptRemoteVerification && !remoteSigninInFlight) {
        try {
          const verification = await checkRemoteVerificationStatus();
          if (effectDisposed) return;

          if (verification?.verified) {
            remoteSigninInFlight = true;
            console.info("[SUCCESS VERIFY] signInWithPassword:start", {
              pendingAuthUserId,
              pendingEmail,
            });
            const { data, error } = await supabase.auth.signInWithPassword({
              email: pendingEmail,
              password: pendingPassword,
            });
            if (error) throw error;
            console.info("[SUCCESS VERIFY] signInWithPassword:success", {
              hasSession: Boolean(data?.session),
              sessionUserId: String(data?.session?.user?.id || ""),
              sessionEmail: String(data?.session?.user?.email || ""),
            });

            const resolved = await handleResolvedVerification(data?.session || null);
            remoteSigninInFlight = false;
            if (resolved || effectDisposed) {
              console.info("[SUCCESS VERIFY] verified-branch-reached", {
                resolved,
                effectDisposed,
              });
              return;
            }
          }
        } catch (error) {
          console.warn("[SUCCESS VERIFY] remote-check-or-signin-failed", {
            message: String(error?.message || error || "Unknown verification polling error."),
          });
          remoteSigninInFlight = false;
        }
      }

      pollTimer = window.setTimeout(() => {
        void pollForVerification();
      }, canAttemptRemoteVerification ? 3000 : 1200);
    };

    const {
      data: listener,
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session || effectDisposed) return;
      void handleResolvedVerification(session);
    });

    void pollForVerification();

    return () => {
      effectDisposed = true;
      if (continueTimer) window.clearTimeout(continueTimer);
      if (pollTimer) window.clearTimeout(pollTimer);
      listener.subscription.unsubscribe();
    };
  }, [onContinueToAccountSetup, onVerificationDetected, pendingVerificationState]);

  const waitingDotStyle = (index) => ({
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: TABBY_ASSIST_MINT,
    display: "inline-block",
    animation: "tabstudioSuccessDotPulse 1s ease-in-out infinite",
    animationDelay: `${index * 0.14}s`,
  });

  const title = viewMode === "verified" ? "Email verified" : "Almost there — verify your email";
  const subtitle = viewMode === "verified" ? "Your email has been successfully confirmed." : "Your payment was successful.";
  const body = viewMode === "verified"
    ? "We’re taking you to account setup now."
    : "We’ve sent you a confirmation email.\nPlease verify your email to continue to account setup.";
  const helper = viewMode === "verified" ? "Preparing your account..." : "";

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
              <div style={{ display: "grid", gap: 10, textAlign: "center", justifyItems: "center" }}>
                {viewMode === "verified" ? <SuccessIcon /> : null}
                <h1 style={{ margin: 0, fontSize: 39, fontWeight: 950, lineHeight: 1.04, letterSpacing: "-0.02em" }}>{title}</h1>
                <div
                  style={{
                    color: withAlpha(THEME.text, 0.76),
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  {subtitle}
                </div>
                <div
                  style={{
                    color: withAlpha(THEME.text, 0.62),
                    fontSize: 15,
                    fontWeight: 700,
                    lineHeight: 1.55,
                    whiteSpace: "pre-line",
                  }}
                >
                  {body}
                </div>
                <div
                  style={{
                    color: withAlpha(THEME.text, 0.42),
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: 1.45,
                  }}
                >
                  {helper}
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
                <span>{viewMode === "verified" ? "Continuing to account setup" : "Waiting for confirmation"}</span>
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
