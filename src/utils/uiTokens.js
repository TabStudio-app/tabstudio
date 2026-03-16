export function buttonBase(theme) {
  return {
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    background: theme.surfaceWarm,
    outline: "none",
    cursor: "pointer",
    fontWeight: 900,
    color: theme.text,
    height: 42,
    padding: "0 14px",
    lineHeight: 1,
    boxSizing: "border-box",
  };
}

export function buttonPrimary(theme) {
  return {
    ...buttonBase(theme),
    borderColor: theme.accent,
    boxShadow: "0 8px 18px rgba(0,0,0,0.06)",
  };
}

export function buttonSecondary(theme) {
  return {
    ...buttonBase(theme),
    borderColor: theme.border,
  };
}

export function buttonPill(theme) {
  return {
    borderRadius: 999,
    border: `1px solid ${theme.border}`,
    background: theme.surfaceWarm,
    outline: "none",
    cursor: "pointer",
    fontWeight: 800,
    color: theme.text,
    height: 28,
    padding: "0 10px",
    lineHeight: 1,
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  };
}

export function buttonMicro(theme) {
  return {
    ...buttonSecondary(theme),
    height: 32,
    padding: "0 12px",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 900,
    color: theme.textFaint,
  };
}

export function cardBase(theme) {
  return {
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    background: theme.surfaceWarm,
    padding: 12,
    boxShadow: "0 12px 28px rgba(0,0,0,0.05)",
  };
}

export function cardDense(theme) {
  return {
    ...cardBase(theme),
    padding: 10,
  };
}

export function inputEditor(theme) {
  return {
    width: "100%",
    height: 42,
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    padding: "0 10px",
    fontWeight: 800,
    background: theme.surfaceWarm,
    color: theme.text,
    outline: "none",
    boxSizing: "border-box",
  };
}

export function inputEditorCompact(theme) {
  return {
    ...inputEditor(theme),
    height: 30,
    minWidth: 98,
    padding: "0 8px",
    fontSize: 12,
    borderRadius: 8,
  };
}

export function inputImmersive({
  focused = false,
  hovered = false,
  minHeight = 44,
  padding = "0 12px",
  fontSize = 16,
  fontWeight = 700,
} = {}) {
  return {
    width: "100%",
    minHeight,
    borderRadius: 10,
    border: `1px solid ${
      focused
        ? "rgba(66,201,149,0.6)"
        : hovered
          ? "rgba(255,255,255,0.18)"
          : "rgba(255,255,255,0.08)"
    }`,
    background: "rgba(18,18,18,0.95)",
    color: "#ffffff",
    caretColor: "#ffffff",
    WebkitTextFillColor: "#ffffff",
    padding,
    fontSize,
    fontWeight,
    boxSizing: "border-box",
    outline: "none",
    transition: "border 0.15s ease, box-shadow 0.15s ease",
    boxShadow: focused ? "0 0 0 2px rgba(66,201,149,0.15)" : "none",
  };
}

export function inputLabel(theme) {
  return {
    fontSize: 13,
    color: theme.textFaint,
    fontWeight: 800,
  };
}

export function inputHintText(theme) {
  return {
    fontSize: 12,
    color: theme.textMuted ?? theme.textFaint,
    fontWeight: 700,
  };
}

export function inputErrorText() {
  return {
    fontSize: 12,
    color: "#FF6E7A",
    fontWeight: 800,
  };
}

export function metadataTriggerText(theme, withAlpha, { placeholder = false } = {}) {
  return {
    color: placeholder ? withAlpha(theme.text, 0.52) : theme.text,
    opacity: placeholder ? 0.92 : 1,
    fontWeight: 800,
    fontSize: 16,
    lineHeight: 1.2,
  };
}

export function metadataFieldInteraction(theme, withAlpha, { focused = false, hovered = false } = {}) {
  return {
    borderColor: focused ? theme.accent : hovered ? withAlpha(theme.accent, 0.46) : theme.border,
    boxShadow: focused ? `0 0 0 3px ${withAlpha(theme.accent, 0.16)}` : "none",
  };
}

export function gridCellHoverVisual(withAlpha, { isDarkMode = false, accent } = {}) {
  return {
    default: {
      borderColor: withAlpha(accent, 0.52),
      background: withAlpha(accent, isDarkMode ? 0.08 : 0.055),
      boxShadow: `0 0 0 1px ${withAlpha(accent, isDarkMode ? 0.16 : 0.11)}`,
    },
    empty: {
      borderColor: withAlpha(accent, 0.58),
      background: withAlpha(accent, isDarkMode ? 0.11 : 0.075),
      boxShadow: `0 0 0 1px ${withAlpha(accent, isDarkMode ? 0.18 : 0.12)}`,
    },
    columnSelector: {
      borderColor: withAlpha(accent, 0.6),
      background: withAlpha(accent, isDarkMode ? 0.12 : 0.08),
      boxShadow: `0 0 0 1px ${withAlpha(accent, isDarkMode ? 0.19 : 0.13)}`,
    },
    active: {
      borderColor: withAlpha(accent, 0.72),
      background: withAlpha(accent, isDarkMode ? 0.14 : 0.09),
      boxShadow: `0 0 0 2px ${withAlpha(accent, isDarkMode ? 0.24 : 0.16)}`,
    },
    selectedHover: {
      background: withAlpha(accent, isDarkMode ? 0.2 : 0.13),
    },
  };
}

export function modalMiniInputHoverVisual(withAlpha, { isDarkMode = false, accent } = {}) {
  return {
    borderColor: withAlpha(accent, 0.44),
    background: withAlpha(accent, isDarkMode ? 0.06 : 0.045),
    boxShadow: `0 0 0 1px ${withAlpha(accent, isDarkMode ? 0.12 : 0.09)}`,
  };
}

export function toolbarControlText() {
  return {
    fontSize: 16,
    fontWeight: 900,
    lineHeight: 1,
  };
}

export function menuPanel(theme) {
  return {
    background: theme.surfaceWarm,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    boxShadow: "0 24px 70px rgba(0,0,0,0.18)",
    padding: 10,
    boxSizing: "border-box",
  };
}

export function menuPanelLarge(theme) {
  return {
    ...menuPanel(theme),
  };
}

export function menuItem(theme, { padding = "10px 10px", borderRadius = 14, fontWeight = 900, fontSize, height } = {}) {
  return {
    textAlign: "left",
    padding,
    borderRadius,
    border: `1px solid ${theme.border}`,
    background: theme.surfaceWarm,
    cursor: "pointer",
    fontWeight,
    color: theme.text,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    boxSizing: "border-box",
    ...(fontSize ? { fontSize } : {}),
    ...(height ? { height } : {}),
  };
}

export function menuItemSelected(
  theme,
  {
    padding = "10px 10px",
    borderRadius = 14,
    fontWeight = 900,
    fontSize,
    height,
    borderColor = theme.accent,
    background = theme.surfaceWarm,
    color = theme.text,
    boxShadow = "none",
  } = {}
) {
  return {
    ...menuItem(theme, { padding, borderRadius, fontWeight, fontSize, height }),
    border: `1px solid ${borderColor}`,
    background,
    color,
    boxShadow,
  };
}

export function menuTriggerCompact(theme) {
  return {
    ...buttonSecondary(theme),
    height: 32,
    padding: "0 12px",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 900,
  };
}

export function menuTrigger(theme) {
  return {
    ...buttonSecondary(theme),
    height: 42,
    minWidth: 136,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  };
}

export function modalOverlay({ background = "rgba(0,0,0,0.35)", zIndex = 5000, padding } = {}) {
  return {
    position: "fixed",
    inset: 0,
    background,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex,
    ...(padding != null ? { padding, boxSizing: "border-box" } : {}),
  };
}

export function modalCard(theme, { width = 420, maxWidth = "90vw", borderRadius = 18, boxShadow = "0 24px 70px rgba(0,0,0,0.32)", padding = 16 } = {}) {
  return {
    width,
    maxWidth,
    borderRadius,
    background: theme.surfaceWarm,
    border: `1px solid ${theme.border}`,
    boxShadow,
    padding,
    boxSizing: "border-box",
  };
}

export function modalCardLarge(theme, { width = "calc(100vw - 32px)", height = "calc(100vh - 32px)", borderRadius = 16, boxShadow = "0 24px 72px rgba(0,0,0,0.34)", padding = 14 } = {}) {
  return {
    width,
    height,
    borderRadius,
    background: theme.surfaceWarm,
    border: `1px solid ${theme.border}`,
    boxShadow,
    padding,
    boxSizing: "border-box",
  };
}

export function modalHeader({ gap = 8, marginBottom = 0, alignItems = "center", justifyContent = "space-between" } = {}) {
  return {
    display: "flex",
    justifyContent,
    alignItems,
    gap,
    ...(marginBottom ? { marginBottom } : {}),
  };
}

export function modalCloseButton(theme, { iconOnly = false } = {}) {
  if (iconOnly) {
    return {
      width: 34,
      height: 34,
      borderRadius: 10,
      border: `1px solid ${theme.border}`,
      background: "transparent",
      color: theme.text,
      fontSize: 20,
      lineHeight: 1,
      fontWeight: 700,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 0,
    };
  }
  return {
    ...buttonMicro(theme),
  };
}

export function drawerPanel(theme, { fullscreen = false, width = "100vw", borderRadius = "0 16px 16px 0", boxShadow = "0 18px 48px rgba(0,0,0,0.22)", padding = "14px 12px 12px" } = {}) {
  return {
    width,
    minWidth: 0,
    borderRadius: fullscreen ? 0 : borderRadius,
    border: fullscreen ? "none" : `1px solid ${theme.border}`,
    background: theme.surfaceWarm,
    boxShadow: fullscreen ? "none" : boxShadow,
    padding,
    boxSizing: "border-box",
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 90,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };
}

export function headerPageShell(theme, layout) {
  const leftReserveWidth =
    layout.leftReserveWidth != null
      ? layout.leftReserveWidth
      : (layout.logoWidth || 0) + (layout.leftGap || 0) + (layout.sloganWidth || 0);
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: layout.gap,
    height: layout.minHeight,
    minHeight: layout.minHeight,
    position: "sticky",
    top: 0,
    zIndex: 50,
    padding: `${layout.paddingY}px ${layout.paddingX}px`,
    paddingLeft: leftReserveWidth + layout.paddingX + layout.gap,
    boxSizing: "border-box",
    flexShrink: 0,
    background: theme.bg,
    borderBottom: `1px solid ${theme.border}`,
    boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
  };
}

export function headerPageLogo(layout) {
  return {
    width: layout.logoWidth,
    height: layout.logoHeight,
    overflow: "hidden",
    borderRadius: 4,
    flexShrink: 0,
    position: "relative",
    top: 1,
    cursor: "pointer",
    border: "none",
    background: "transparent",
    padding: 0,
  };
}

export function headerPageRightGroup(layout) {
  return {
    display: "flex",
    gap: layout.rightGap,
    alignItems: "center",
    justifyContent: "flex-end",
    marginLeft: "auto",
    minWidth: layout.rightReserveWidth || 0,
    flexWrap: "nowrap",
    flexShrink: 0,
  };
}

export function buttonHeaderText(theme, withAlpha, { hovered = false } = {}) {
  return {
    minHeight: 36,
    height: 36,
    border: "none",
    background: "transparent",
    color: hovered ? withAlpha(theme.text, 0.95) : withAlpha(theme.text, 0.78),
    boxShadow: "none",
    outline: "none",
    fontSize: 16,
    fontWeight: 600,
    padding: "0 2px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    lineHeight: 1,
    transition: "color 0.15s ease",
  };
}

export function buttonHeaderIcon(theme, withAlpha, { hovered = false, pressed = false, iconOnly = false } = {}) {
  const background = pressed
    ? withAlpha("#FFFFFF", 0.08)
    : hovered
      ? withAlpha("#FFFFFF", 0.05)
      : "transparent";
  const borderColor = pressed
    ? withAlpha("#FFFFFF", 0.18)
    : hovered
      ? withAlpha("#FFFFFF", 0.12)
      : "transparent";
  const color = hovered || pressed ? withAlpha(theme.text, 0.95) : withAlpha(theme.text, 0.78);
  return {
    minHeight: iconOnly ? 38 : 36,
    height: iconOnly ? 38 : 36,
    minWidth: iconOnly ? 38 : 0,
    width: iconOnly ? 38 : "auto",
    borderRadius: 10,
    border: `1px solid ${borderColor}`,
    background,
    color,
    boxShadow: "none",
    outline: "none",
    fontSize: iconOnly ? 17 : 16,
    fontWeight: 600,
    padding: iconOnly ? 0 : "0 14px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxSizing: "border-box",
    transition: "all 0.15s ease",
    lineHeight: 1,
  };
}

export function secondaryTabButton(theme, withAlpha, { active = false, hovered = false, isDarkMode = false } = {}) {
  const borderColor = active
    ? withAlpha(theme.accent, 0.72)
    : hovered
      ? withAlpha(theme.text, isDarkMode ? 0.16 : 0.12)
      : theme.border;
  const background = active
    ? withAlpha(theme.accent, isDarkMode ? 0.14 : 0.09)
    : hovered
      ? withAlpha(theme.text, isDarkMode ? 0.05 : 0.03)
      : "transparent";
  return {
    minHeight: 36,
    padding: "0 14px",
    borderRadius: 999,
    border: `1px solid ${borderColor}`,
    background,
    color: theme.text,
    fontSize: 13,
    fontWeight: active ? 900 : 850,
    cursor: "pointer",
    lineHeight: 1,
    boxSizing: "border-box",
    boxShadow: active ? `0 0 0 2px ${withAlpha(theme.accent, isDarkMode ? 0.12 : 0.08)}` : "none",
    transition: "border-color 160ms ease, background 160ms ease, box-shadow 160ms ease, color 160ms ease",
  };
}

export function faqRowVisual(theme, withAlpha, { open = false, hovered = false, isDarkMode = false } = {}) {
  const borderColor = open
    ? withAlpha(theme.accent, 0.6)
    : hovered
      ? withAlpha(theme.text, isDarkMode ? 0.16 : 0.12)
      : theme.border;
  const background = open
    ? withAlpha(theme.text, isDarkMode ? 0.02 : 0.018)
    : hovered
      ? withAlpha(theme.text, isDarkMode ? 0.03 : 0.02)
      : theme.surfaceWarm;
  return {
    borderRadius: 14,
    border: `1px solid ${borderColor}`,
    background,
    overflow: "hidden",
    boxShadow: open ? `0 0 0 2px ${withAlpha(theme.accent, isDarkMode ? 0.1 : 0.07)}` : "none",
    transition: "border-color 160ms ease, background 160ms ease, box-shadow 180ms ease",
  };
}

export function featureListItem(
  theme,
  withAlpha,
  { active = false, focused = false, hovered = false, isDarkMode = false, padding = "9px 11px", gap = 6 } = {}
) {
  return {
    appearance: "none",
    width: "100%",
    textAlign: "left",
    outline: "none",
    WebkitTapHighlightColor: "transparent",
    borderRadius: 10,
    border: `1px solid ${
      active
        ? withAlpha(theme.accent, 0.82)
        : focused
          ? withAlpha(theme.accent, 0.72)
          : hovered
            ? withAlpha(theme.accent, 0.62)
            : theme.border
    }`,
    background: theme.surfaceWarm,
    padding,
    display: "grid",
    gap,
    boxShadow: active
      ? `0 0 0 2px ${withAlpha(theme.accent, isDarkMode ? 0.18 : 0.12)}`
      : focused
        ? `0 0 0 2px ${withAlpha(theme.accent, isDarkMode ? 0.16 : 0.1)}`
        : hovered
          ? `0 0 0 1px ${withAlpha(theme.accent, isDarkMode ? 0.14 : 0.1)}`
          : "none",
    transition: "box-shadow 180ms ease, border-color 180ms ease, filter 160ms ease",
    filter: hovered ? "brightness(1.02)" : "none",
    cursor: "pointer",
    boxSizing: "border-box",
  };
}

export function featureListIconBadge(theme, withAlpha, { isDarkMode = false } = {}) {
  return {
    width: 20,
    height: 20,
    borderRadius: 999,
    border: `1px solid ${theme.border}`,
    background: withAlpha(theme.text, isDarkMode ? 0.1 : 0.06),
    color: theme.text,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    flexShrink: 0,
  };
}

export function featureListTitle(theme) {
  return {
    color: theme.text,
    fontWeight: 900,
    fontSize: 13,
    lineHeight: 1.25,
  };
}

export function featureListDescription(theme, { lineClamp = 3, fontSize = 12, lineHeight = 1.4, paddingLeft = 28 } = {}) {
  return {
    color: theme.textFaint,
    lineHeight,
    fontSize,
    display: "-webkit-box",
    WebkitLineClamp: lineClamp,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    paddingLeft,
  };
}
