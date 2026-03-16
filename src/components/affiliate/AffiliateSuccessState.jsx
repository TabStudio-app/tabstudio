import React, { useEffect, useState } from "react";
import tabbyDark from "../../assets/tabby-dark-v1-transparent.png";
import { TabbySpeechBubble } from "../TabbyAssistant";

const SUCCESS_MINT = "#34d399";

export default function AffiliateSuccessState({ theme, withAlpha, onBackToProjects }) {
  const [tabbyFloatUp, setTabbyFloatUp] = useState(false);
  const [backHover, setBackHover] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setTabbyFloatUp((value) => !value), 2200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        textAlign: "center",
        minHeight: 540,
        position: "relative",
        paddingBottom: 28,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 58,
          height: 58,
          margin: "0 auto",
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: SUCCESS_MINT,
          color: "#ffffff",
          boxShadow: `0 0 0 1px ${withAlpha(SUCCESS_MINT, 0.34)}`,
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12.4 9.2 16.5 19 7.5"
            stroke="currentColor"
            strokeWidth="2.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div style={{ display: "grid", gap: 10, justifyItems: "center" }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: withAlpha(theme.text, 0.48),
          }}
        >
          Affiliate Application
        </div>
        <h2 style={{ margin: 0, fontSize: 34, lineHeight: 1.05, letterSpacing: "-0.03em", fontWeight: 950 }}>
          Application received
        </h2>
        <p
          style={{
            margin: 0,
            maxWidth: 500,
            fontSize: 15,
            lineHeight: 1.65,
            color: withAlpha(theme.text, 0.7),
            fontWeight: 600,
          }}
        >
          Thanks for applying to the TabStudio Creator Program. We&apos;ll review your content and get back to you soon.
        </p>
        <p
          style={{
            margin: 0,
            maxWidth: 500,
            fontSize: 13,
            lineHeight: 1.6,
            color: withAlpha(theme.text, 0.54),
            fontWeight: 700,
          }}
        >
          Approved creators receive a free TabStudio account and creator partnership details after review.
        </p>
      </div>

      <div
        style={{
          justifySelf: "center",
          marginTop: 30,
          width: 264,
          display: "grid",
          justifyItems: "center",
          gap: 12,
          position: "relative",
          transform: `translateY(${tabbyFloatUp ? -6 : 2}px)`,
          transition: "transform 2200ms ease",
          pointerEvents: "none",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            bottom: -6,
            width: 240,
            height: 160,
            transform: "translateX(-50%)",
            borderRadius: "50%",
            background: `radial-gradient(circle at center, ${withAlpha(theme.accent, 0.16)} 0%, ${withAlpha(
              theme.accent,
              0.07
            )} 42%, ${withAlpha(theme.accent, 0)} 76%)`,
            filter: "blur(22px)",
            pointerEvents: "none",
          }}
        />
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <TabbySpeechBubble
            theme={theme}
            isDark={true}
            accentColor={theme.accent}
            variant="neutral"
            withAlpha={withAlpha}
            bubbleWidth={220}
            bubbleMaxWidth={220}
            tailSide="bottom-center"
            tailOffset={103}
          >
            Thanks for your time - we&apos;ll be in touch soon.
          </TabbySpeechBubble>
        </div>
        <img
          src={tabbyDark}
          alt=""
          style={{
            width: 148,
            maxWidth: "100%",
            display: "block",
            filter: "drop-shadow(0 14px 26px rgba(0,0,0,0.26))",
            userSelect: "none",
          }}
        />
      </div>

      <button
        type="button"
        onClick={onBackToProjects}
        onMouseEnter={() => setBackHover(true)}
        onMouseLeave={() => setBackHover(false)}
        onFocus={() => setBackHover(true)}
        onBlur={() => setBackHover(false)}
        style={{
          justifySelf: "center",
          minHeight: 44,
          marginTop: 12,
          padding: "0 18px",
          borderRadius: 11,
          border: `1px solid ${withAlpha(theme.text, backHover ? 0.18 : 0.12)}`,
          background: withAlpha(theme.text, backHover ? 0.08 : 0.04),
          color: theme.text,
          fontSize: 15,
          fontWeight: 900,
          cursor: "pointer",
          transform: backHover ? "translateY(-1px)" : "translateY(0)",
          transition: "background 180ms ease, border-color 180ms ease, transform 180ms ease",
        }}
      >
        Back to TabStudio
      </button>
    </div>
  );
}
