import React from "react";

export function AccountCard({ shared, title, subtitle, aside, children, padding = 16, minHeight }) {
  const { card, THEME } = shared;
  return (
    <section
      style={{
        ...card,
        padding,
        background: THEME.surfaceWarm,
        display: "grid",
        gap: title || subtitle || aside ? 12 : 0,
        minHeight,
      }}
    >
      {title || subtitle || aside ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: aside ? "minmax(0, 1fr) auto" : "minmax(0, 1fr)",
            gap: 12,
            alignItems: "start",
          }}
        >
          <div style={{ minWidth: 0 }}>
            {title ? <div style={{ fontSize: 15, fontWeight: 900, color: THEME.text }}>{title}</div> : null}
            {subtitle ? (
              <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.5, color: THEME.textFaint, fontWeight: 700 }}>{subtitle}</div>
            ) : null}
          </div>
          {aside ? <div>{aside}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function AccountLabel({ shared, children, style }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 800,
        color: shared.THEME.textFaint,
        marginBottom: 6,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function AccountReadOnlyField({ shared, label, value, helper, actions }) {
  const { THEME, withAlpha } = shared;
  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${THEME.border}`,
        background: withAlpha(THEME.text, 0.025),
        padding: "12px 14px",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: actions ? "minmax(0, 1fr) auto" : "minmax(0, 1fr)", gap: 10, alignItems: "start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: THEME.textFaint }}>{label}</div>
          <div
            style={{
              marginTop: 5,
              fontSize: 14,
              fontWeight: 900,
              color: THEME.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {value}
          </div>
          {helper ? <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.45, color: THEME.textFaint }}>{helper}</div> : null}
        </div>
        {actions ? <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>{actions}</div> : null}
      </div>
    </div>
  );
}

export function AccountMetricGrid({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

export function AccountMetricCard({ shared, label, value, helper }) {
  const { card, THEME, withAlpha } = shared;
  return (
    <div
      style={{
        ...card,
        padding: "14px 16px",
        minHeight: 106,
        background: withAlpha(THEME.text, 0.025),
        display: "grid",
        alignContent: "space-between",
        gap: 10,
      }}
    >
      <div style={{ fontSize: 12, color: THEME.textFaint, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 18, lineHeight: 1.08, fontWeight: 950, color: THEME.text, letterSpacing: "-0.025em" }}>{value}</div>
      {helper ? <div style={{ fontSize: 12, lineHeight: 1.45, color: THEME.textFaint }}>{helper}</div> : null}
    </div>
  );
}

export function AccountValueGrid({ items }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
      {items}
    </div>
  );
}

export function AccountValueItem({ shared, label, value, helper, strong = false }) {
  const { THEME } = shared;
  return (
    <div>
      <div style={{ fontSize: 12, color: THEME.textFaint, fontWeight: 700 }}>{label}</div>
      <div style={{ marginTop: 4, fontWeight: 900, fontSize: strong ? 18 : 15, color: THEME.text, letterSpacing: strong ? "-0.025em" : undefined }}>
        {value}
      </div>
      {helper ? <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.45, color: THEME.textFaint }}>{helper}</div> : null}
    </div>
  );
}

export function AccountStatusPill({ shared, tone = "neutral", children }) {
  const { btnSmallPill, THEME, withAlpha } = shared;
  const toneMap = {
    neutral: { border: THEME.border, color: THEME.textFaint },
    muted: { border: THEME.border, color: THEME.textFaint },
    success: { border: withAlpha(THEME.accent, 0.5), color: THEME.accent },
    accent: { border: withAlpha(THEME.accent, 0.5), color: THEME.accent },
    warning: { border: withAlpha("#E49D3A", 0.55), color: "#E49D3A" },
    info: { border: withAlpha("#6FA8FF", 0.55), color: "#6FA8FF" },
    danger: { border: withAlpha("#FF6E7A", 0.45), color: "#FF6E7A" },
  };
  const mapped = toneMap[tone] || toneMap.neutral;
  return (
    <span
      style={{
        ...btnSmallPill,
        height: 24,
        padding: "0 8px",
        borderColor: mapped.border,
        background: "transparent",
        color: mapped.color,
        cursor: "default",
        fontSize: 11,
      }}
    >
      {children}
    </span>
  );
}

export function AccountActionMessage({ shared, state, message, align = "left" }) {
  if (!message) return null;
  const { THEME } = shared;
  const color =
    state === "error" ? "#FF6E7A" : state === "success" ? THEME.accent : THEME.textFaint;
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 800,
        color,
        textAlign: align,
      }}
    >
      {message}
    </div>
  );
}

export function AccountEmptyState({ shared, title, children }) {
  const { THEME, withAlpha } = shared;
  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px dashed ${withAlpha(THEME.text, 0.14)}`,
        background: withAlpha(THEME.text, 0.02),
        padding: "14px 16px",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 900, color: THEME.text }}>{title}</div>
      <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: THEME.textFaint }}>{children}</div>
    </div>
  );
}
