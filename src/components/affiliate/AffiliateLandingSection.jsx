import React from "react";

export default function AffiliateLandingSection({
  eyebrow,
  title,
  description,
  items = [],
  theme,
  withAlpha,
}) {
  return (
    <section
      style={{
        borderRadius: 22,
        border: `1px solid ${withAlpha(theme.text, 0.1)}`,
        background: withAlpha(theme.surfaceWarm ?? theme.surface, 0.84),
        boxShadow: "0 24px 60px rgba(0,0,0,0.24)",
        padding: "28px clamp(20px, 4vw, 34px)",
        display: "grid",
        gap: 18,
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        {eyebrow ? (
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: withAlpha(theme.text, 0.52),
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        <h2
          style={{
            margin: 0,
            fontSize: "clamp(28px, 4vw, 38px)",
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            fontWeight: 950,
            color: theme.text,
          }}
        >
          {title}
        </h2>
        {description ? (
          <p
            style={{
              margin: 0,
              maxWidth: 760,
              color: withAlpha(theme.text, 0.72),
              fontSize: 16,
              lineHeight: 1.65,
              fontWeight: 600,
            }}
          >
            {description}
          </p>
        ) : null}
      </div>

      {items.length ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {items.map((item) => (
            <div
              key={item.title}
              style={{
                borderRadius: 16,
                border: `1px solid ${withAlpha(theme.text, 0.08)}`,
                background: withAlpha(theme.text, 0.035),
                padding: "18px 16px",
                display: "grid",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: theme.accent,
                }}
              >
                {item.kicker}
              </div>
              <div style={{ fontSize: 20, lineHeight: 1.15, fontWeight: 900, color: theme.text }}>{item.title}</div>
              <div style={{ fontSize: 15, lineHeight: 1.6, fontWeight: 600, color: withAlpha(theme.text, 0.68) }}>
                {item.body}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
