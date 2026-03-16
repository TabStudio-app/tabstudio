import React from "react";
import { buttonMicro, drawerPanel } from "../utils/uiTokens";

export default function SettingsPanel({ shared }) {
  const {
    ACCENT_PRESETS,
    AvatarSilhouetteIcon,
    SHORTCUTS_ACTION_ES,
    SHORTCUTS_CATEGORY_FILTERS,
    SHORTCUTS_DESC_ES,
    SHORTCUTS_SCOPE_ES,
    TABBY_ASSIST_MINT,
    TABBY_ASSIST_MINT_STRONG,
    TABSTUDIO_TUTORIAL_URL,
    accountAvatarDataUrl,
    accountSummaryName,
    accountSummaryTier,
    activeAccent,
    accentColorId,
    btnSecondary,
    commitDefaultColsInput,
    defaultColsInput,
    editorHasMembership,
    filteredShortcuts,
    getAvatarInitials,
    gridTabbyHidden,
    isDarkMode,
    isLoggedIn,
    languageFooterHover,
    openResetEditorSettingsDialog,
    openSettingsAccountEntry,
    pillMono,
    profileFooterHover,
    resolvedTheme,
    scrollScope,
    setAccentColorId,
    setAboutOpen,
    setDefaultColsInput,
    setFaqsOpen,
    setLanguageFooterHover,
    setProfileFooterHover,
    setScrollScope,
    setSettingsAccentHoverId,
    setSettingsFullscreen,
    setSettingsLanguageOpen,
    setSettingsLanguagePreview,
    setSettingsOpen,
    setShortcutsCategoryFilter,
    setShortcutsOpen,
    setShortcutsShowBoth,
    setShowCapoControl,
    setShowTempoControl,
    setTabWritingOpen,
    setTabbyAssistantVisible,
    setThemeMode,
    setTabCopyMode,
    settingsAccordionCardStyle,
    settingsAccentHoverId,
    settingsControlRowStyle,
    settingsExpandedContentStyle,
    settingsExpandHandleRef,
    settingsFullscreen,
    settingsHintTextStyle,
    settingsLanguageBtnRef,
    settingsLanguageMenuRef,
    settingsLanguageOpen,
    settingsLanguagePreview,
    settingsOpen,
    settingsPanelRef,
    settingsPanelWidth,
    settingsPanelWidthCss,
    settingsSectionToggleVisual,
    settingsSubgroupHeadingStyle,
    settingsSubgroupStyle,
    shortcutPlatform,
    shortcutsAutoShowBoth,
    shortcutsCategoryFilter,
    shortcutsDisplayBoth,
    shortcutsOpen,
    shortcutsShowBoth,
    showCapoControl,
    showTempoControl,
    tabCopyMode,
    tabWritingOpen,
    themeMode,
    THEME,
    tr,
    withAlpha,
  } = shared;

  if (!settingsOpen) return null;

  const languages = [
    { id: "en", name: "English (US)", available: true },
    { id: "es", name: "Spanish (Español)", available: false },
    { id: "zh-Hans", name: "Mandarin Chinese", available: false },
    { id: "fr", name: "French", available: false },
    { id: "de", name: "German", available: false },
    { id: "pt", name: "Portuguese", available: false },
    { id: "ar", name: "Arabic", available: false },
    { id: "ja", name: "Japanese", available: false },
    { id: "ru", name: "Russian", available: false },
    { id: "ko", name: "Korean", available: false },
  ];
  const activeLanguage = languages.find((l) => l.id === settingsLanguagePreview) || languages[0];
  const availableLanguages = languages.filter((l) => l.available);
  const upcomingLanguages = languages.filter((l) => !l.available);
  const microButton = buttonMicro(THEME);
  const drawerPanelStyle = drawerPanel(THEME, {
    fullscreen: settingsFullscreen,
    width: settingsFullscreen ? "100vw" : settingsPanelWidthCss,
    padding: settingsFullscreen ? "16px 16px 14px" : "14px 12px 12px",
  });

  return (
    <>
      {settingsFullscreen && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            background: withAlpha(THEME.bg, isDarkMode ? 0.52 : 0.36),
            backdropFilter: "blur(3px)",
            zIndex: 89,
          }}
        />
      )}
      <aside
        ref={settingsPanelRef}
        style={{
          ...drawerPanelStyle,
        }}
      >
        <div
          style={{
            marginBottom: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            order: 0,
            borderBottom: settingsFullscreen ? `1px solid ${THEME.border}` : "none",
            paddingBottom: settingsFullscreen ? 10 : 0,
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 950, letterSpacing: -0.3 }}>Settings</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              onClick={() => {
                setSettingsOpen(false);
                setSettingsFullscreen(false);
              }}
              style={{ ...microButton }}
            >
              Close
            </button>
          </div>
        </div>

        <div
          className="tabstudio-settings-scrollbar"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            scrollbarGutter: "stable",
            paddingRight: 8,
            paddingBottom: 12,
          }}
        >
          <div
            style={{
              marginTop: 10,
              borderRadius: 12,
              border: `1px solid ${THEME.border}`,
              background: THEME.surfaceWarm,
              padding: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              order: 0,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 900, color: THEME.text }}>
              {tr("Tabby Assistant", "Asistente Tabby")}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={!gridTabbyHidden}
              onClick={() => setTabbyAssistantVisible(gridTabbyHidden)}
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
                margin: 0,
                cursor: "pointer",
                lineHeight: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 999,
                  border: `1px solid ${!gridTabbyHidden ? withAlpha(TABBY_ASSIST_MINT_STRONG, 0.88) : THEME.border}`,
                  background: !gridTabbyHidden ? TABBY_ASSIST_MINT : withAlpha(THEME.text, isDarkMode ? 0.22 : 0.16),
                  display: "inline-flex",
                  alignItems: "center",
                  padding: 2,
                  boxSizing: "border-box",
                  transition: "background 140ms ease, border-color 140ms ease",
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#ffffff",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.28)",
                    transform: !gridTabbyHidden ? "translateX(20px)" : "translateX(0)",
                    transition: "transform 140ms ease",
                    display: "block",
                  }}
                />
              </span>
            </button>
          </div>

          <div style={{ ...settingsAccordionCardStyle(shortcutsOpen), order: 1 }}>
            <button
              type="button"
              onClick={() =>
                setShortcutsOpen((v) => {
                  const next = !v;
                  if (next) {
                    setTabWritingOpen(false);
                    setAboutOpen(false);
                    setFaqsOpen(false);
                  }
                  return next;
                })
              }
              style={{
                width: "100%",
                ...btnSecondary,
                height: 44,
                padding: "0 12px",
                borderRadius: 0,
                border: "none",
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 16,
                fontWeight: 900,
                lineHeight: 1,
                boxSizing: "border-box",
                ...settingsSectionToggleVisual(shortcutsOpen),
              }}
            >
              <span>{tr("Shortcuts & Tips", "Atajos y consejos")}</span>
              <span style={{ fontSize: 12, opacity: 0.95 }}>{shortcutsOpen ? "▲" : "▼"}</span>
            </button>
            {shortcutsOpen && (
              <div style={settingsExpandedContentStyle}>
                <div style={settingsSubgroupStyle}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <div style={settingsHintTextStyle}>
                      {shortcutsAutoShowBoth
                        ? tr("Showing both shortcut sets", "Mostrando ambos conjuntos de atajos")
                        : tr("Showing", "Mostrando")}
                      {!shortcutsAutoShowBoth && (
                        <>
                          {" "}
                          <b style={{ color: THEME.text }}>{shortcutPlatform === "mac" ? "macOS" : tr("Windows", "Windows")}</b>{" "}
                          {tr("shortcuts for your device", "atajos para tu dispositivo")}
                        </>
                      )}
                    </div>
                    {!shortcutsAutoShowBoth && (
                      <button
                        type="button"
                        onClick={() => setShortcutsShowBoth((v) => !v)}
                        style={{
                          ...btnSecondary,
                          height: 28,
                          padding: "0 8px",
                          fontSize: 11,
                          fontWeight: 850,
                          borderColor: shortcutsShowBoth ? withAlpha(THEME.accent, 0.6) : THEME.border,
                          color: shortcutsShowBoth ? THEME.accent : THEME.text,
                        }}
                      >
                        {shortcutsShowBoth ? tr("Show detected only", "Mostrar solo detectado") : tr("Show both", "Mostrar ambos")}
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    {SHORTCUTS_CATEGORY_FILTERS.map((filter) => {
                      const active = shortcutsCategoryFilter === filter.id;
                      const label =
                        filter.id === "all"
                          ? tr("All", "Todo")
                          : filter.id === "global"
                            ? tr("Global", "Global")
                            : filter.id === "grid"
                              ? tr("Grid", "Cuadrícula")
                              : filter.id === "song-inputs"
                                ? tr("Song Inputs", "Campos de canción")
                                : filter.id === "navigation"
                                  ? tr("Navigation", "Navegación")
                                  : tr("Editing", "Edición");
                      return (
                        <button
                          key={filter.id}
                          type="button"
                          onClick={() => setShortcutsCategoryFilter(filter.id)}
                          style={{
                            ...btnSecondary,
                            height: 28,
                            padding: "0 10px",
                            fontSize: 11,
                            fontWeight: 850,
                            borderColor: active ? withAlpha(THEME.accent, 0.62) : THEME.border,
                            background: active ? withAlpha(THEME.accent, isDarkMode ? 0.14 : 0.1) : "transparent",
                            color: active ? THEME.accent : THEME.textFaint,
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div
                    style={{
                      maxHeight: settingsFullscreen ? 440 : 300,
                      overflowY: "auto",
                      paddingRight: 2,
                      display: "grid",
                      gap: settingsFullscreen ? 10 : 6,
                      gridTemplateColumns: settingsFullscreen ? "repeat(auto-fit, minmax(280px, 1fr))" : "minmax(0, 1fr)",
                      alignItems: "stretch",
                    }}
                  >
                    {filteredShortcuts.map((item) => (
                      <div
                        key={`${item.action}-${item.win}-${item.mac}`}
                        style={{
                          display: "grid",
                          gap: 6,
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: `1px solid ${THEME.border}`,
                          background: THEME.surfaceWarm,
                          boxSizing: "border-box",
                          minHeight: settingsFullscreen ? 132 : undefined,
                          alignContent: "start",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontWeight: 900 }}>{tr(item.action, SHORTCUTS_ACTION_ES[item.action])}</span>
                          <span style={{ fontSize: 11, fontWeight: 900, color: THEME.accent, whiteSpace: "nowrap" }}>
                            {tr(item.scope, SHORTCUTS_SCOPE_ES[item.scope])}
                          </span>
                        </div>
                        {shortcutsDisplayBoth ? (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 10, color: THEME.textFaint, fontWeight: 900, textTransform: "uppercase" }}>Windows</div>
                              <div style={{ ...pillMono, fontSize: 12, color: THEME.text }}>{item.win}</div>
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 10, color: THEME.textFaint, fontWeight: 900, textTransform: "uppercase" }}>macOS</div>
                              <div style={{ ...pillMono, fontSize: 12, color: THEME.text }}>{item.mac}</div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 10, color: THEME.textFaint, fontWeight: 900, textTransform: "uppercase" }}>
                              {shortcutPlatform === "mac" ? "macOS" : "Windows"}
                            </div>
                            <div style={{ ...pillMono, fontSize: 12, color: THEME.text }}>
                              {shortcutPlatform === "mac" ? item.mac : item.win}
                            </div>
                          </div>
                        )}
                        <div style={{ color: THEME.textFaint, lineHeight: 1.35 }}>
                          {tr(item.description, SHORTCUTS_DESC_ES[item.description])}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={settingsHintTextStyle}>
                    {tr(
                      "This table is the master shortcut reference for TabStudio (Windows + macOS).",
                      "Esta tabla es la referencia principal de atajos para TabStudio (Windows + macOS)."
                    )}
                  </div>
                  {editorHasMembership && (
                    <a
                      href={TABSTUDIO_TUTORIAL_URL}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        ...btnSecondary,
                        minHeight: 34,
                        padding: "8px 10px",
                        borderRadius: 10,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        justifyContent: "center",
                      }}
                    >
                      <span aria-hidden="true" style={{ display: "inline-flex", lineHeight: 1 }}>
                        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                          <rect x="0.5" y="0.5" width="15" height="11" rx="2.6" fill="#FF0033" stroke="#FF335E" />
                          <path d="M6.3 3.5L10.6 6L6.3 8.5V3.5Z" fill="#ffffff" />
                        </svg>
                      </span>
                      <span style={{ fontWeight: 850 }}>
                        {tr("TabStudio - Full Video on How to Use", "TabStudio - Video completo de cómo usarlo")}
                      </span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              ...settingsAccordionCardStyle(tabWritingOpen),
              order: 2,
            }}
          >
            <button
              type="button"
              onClick={() =>
                setTabWritingOpen((v) => {
                  const next = !v;
                  if (next) {
                    setShortcutsOpen(false);
                    setAboutOpen(false);
                    setFaqsOpen(false);
                  }
                  return next;
                })
              }
              style={{
                width: "100%",
                ...btnSecondary,
                height: 44,
                padding: "0 12px",
                borderRadius: 0,
                border: "none",
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 16,
                fontWeight: 900,
                lineHeight: 1,
                boxSizing: "border-box",
                ...settingsSectionToggleVisual(tabWritingOpen),
              }}
            >
              <span>{tr("Tab Settings", "Ajustes de tablatura")}</span>
              <span style={{ fontSize: 12, opacity: 0.95 }}>{tabWritingOpen ? "▲" : "▼"}</span>
            </button>
            {tabWritingOpen && (
              <div style={settingsExpandedContentStyle}>
                <div style={settingsSubgroupStyle}>
                  <div style={settingsSubgroupHeadingStyle}>Tab Key Behaviour</div>
                  <label style={settingsControlRowStyle}>
                    <input type="radio" name="tab-behaviour" checked={tabCopyMode === "move"} onChange={() => setTabCopyMode("move")} />
                    <span>Tab - Move to next cell</span>
                  </label>
                  <label style={settingsControlRowStyle}>
                    <input type="radio" name="tab-behaviour" checked={tabCopyMode === "copy"} onChange={() => setTabCopyMode("copy")} />
                    <span>Auto-Duplicate on Tab</span>
                  </label>
                  <div style={settingsHintTextStyle}>
                    If Auto-Duplicate is enabled, Tab also copies the current cell value into the next cell.
                  </div>
                </div>

                <div style={settingsSubgroupStyle}>
                  <div style={settingsSubgroupHeadingStyle}>Horizontal Scroll</div>
                  <label style={settingsControlRowStyle}>
                    <input type="radio" name="scroll-scope" checked={scrollScope === "all"} onChange={() => setScrollScope("all")} />
                    <span>Scroll all rows together</span>
                  </label>
                  <label style={settingsControlRowStyle}>
                    <input type="radio" name="scroll-scope" checked={scrollScope === "selected"} onChange={() => setScrollScope("selected")} />
                    <span>Scroll selected row only</span>
                  </label>
                </div>

                <div style={settingsSubgroupStyle}>
                  <div style={settingsSubgroupHeadingStyle}>Song Details Controls</div>
                  <label style={settingsControlRowStyle}>
                    <input type="checkbox" checked={showCapoControl} onChange={(e) => setShowCapoControl(e.target.checked)} />
                    <span>Show Capo</span>
                  </label>
                  <label style={settingsControlRowStyle}>
                    <input type="checkbox" checked={showTempoControl} onChange={(e) => setShowTempoControl(e.target.checked)} />
                    <span>Show Tempo</span>
                  </label>
                </div>

                <div style={settingsSubgroupStyle}>
                  <div style={settingsSubgroupHeadingStyle}>Appearance</div>
                  <div
                    style={{
                      ...settingsControlRowStyle,
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontWeight: 800, color: THEME.text }}>
                      {resolvedTheme === "dark" ? "Dark mode" : "Light mode"}
                    </span>
                    <div
                      role="group"
                      aria-label="Theme mode"
                      style={{
                        display: "inline-flex",
                        gap: 10,
                        alignItems: "center",
                        padding: "2px 0",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setThemeMode("light")}
                        aria-pressed={themeMode === "light"}
                        title="Light mode"
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: 0,
                          width: 28,
                          height: 28,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: themeMode === "light" ? "#E09C22" : THEME.textFaint,
                          cursor: "pointer",
                          outline: "none",
                          textShadow: themeMode === "light" ? "0 0 8px rgba(244,173,58,0.3)" : "none",
                          transition: "color 140ms ease, text-shadow 140ms ease, transform 140ms ease",
                          transform: themeMode === "light" ? "scale(1.04)" : "scale(1)",
                        }}
                      >
                        <span style={{ fontSize: 20, fontWeight: 900, lineHeight: 1 }}>☀</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setThemeMode("dark")}
                        aria-pressed={themeMode === "dark"}
                        title="Dark mode"
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: 0,
                          width: 28,
                          height: 28,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: themeMode === "dark" ? "#BFD2FF" : THEME.textFaint,
                          cursor: "pointer",
                          outline: "none",
                          textShadow: themeMode === "dark" ? "0 0 8px rgba(168,190,255,0.28)" : "none",
                          transition: "color 140ms ease, text-shadow 140ms ease, transform 140ms ease",
                          transform: themeMode === "dark" ? "scale(1.04)" : "scale(1)",
                        }}
                      >
                        <span style={{ fontSize: 20, fontWeight: 900, lineHeight: 1 }}>☾</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 10, marginTop: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ fontWeight: 800, color: THEME.text }}>Accent color</span>
                      <span style={{ fontSize: 11, color: THEME.textFaint, fontWeight: 800 }}>{activeAccent.label}</span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, 24px)",
                        gap: 10,
                        alignItems: "center",
                        justifyContent: "start",
                      }}
                    >
                      {ACCENT_PRESETS.map((preset) => {
                        if (isDarkMode && preset.id === "black") return null;
                        if (!isDarkMode && preset.id === "white") return null;
                        const active = preset.id === accentColorId;
                        const hovered = settingsAccentHoverId === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setAccentColorId(preset.id)}
                            onPointerEnter={() => setSettingsAccentHoverId(preset.id)}
                            onPointerLeave={() => setSettingsAccentHoverId((prev) => (prev === preset.id ? "" : prev))}
                            title={preset.label}
                            aria-pressed={active}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 999,
                              border: `1px solid ${
                                active
                                  ? withAlpha(THEME.accent, 0.88)
                                  : hovered
                                    ? withAlpha(THEME.text, isDarkMode ? 0.36 : 0.28)
                                    : THEME.border
                              }`,
                              background: preset.hex,
                              boxShadow: active
                                ? `0 0 0 2px ${withAlpha(THEME.accent, isDarkMode ? 0.24 : 0.18)}, inset 0 0 0 1px rgba(255,255,255,0.18)`
                                : hovered
                                  ? `0 0 0 2px ${withAlpha(THEME.text, isDarkMode ? 0.12 : 0.08)}, inset 0 0 0 1px rgba(255,255,255,0.15)`
                                  : "inset 0 0 0 1px rgba(255,255,255,0.14)",
                              cursor: "pointer",
                              outline: "none",
                              padding: 0,
                              transition: "border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease",
                              transform: hovered ? "translateY(-1px)" : "translateY(0)",
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={settingsSubgroupStyle}>
                  <div style={settingsSubgroupHeadingStyle}>Editor Input</div>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontWeight: 800, color: THEME.text }}>Default columns</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={defaultColsInput}
                        onChange={(e) => {
                          const raw = String(e.target.value ?? "").replace(/[^\d]/g, "");
                          setDefaultColsInput(raw);
                        }}
                        onBlur={commitDefaultColsInput}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            commitDefaultColsInput();
                            e.currentTarget.blur();
                          }
                        }}
                        style={{
                          width: 72,
                          height: 32,
                          borderRadius: 10,
                          border: `1px solid ${THEME.border}`,
                          textAlign: "center",
                          fontWeight: 900,
                          background: THEME.surfaceWarm,
                          color: THEME.text,
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <span style={settingsHintTextStyle}>Used for new rows.</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 2,
                    paddingTop: 8,
                    borderTop: `1px solid ${THEME.border}`,
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    onClick={openResetEditorSettingsDialog}
                    style={{
                      ...btnSecondary,
                      height: 30,
                      padding: "0 10px",
                      borderRadius: 9,
                      fontSize: 11,
                      fontWeight: 800,
                      color: THEME.textFaint,
                      background: "transparent",
                      borderColor: withAlpha(THEME.text, isDarkMode ? 0.2 : 0.14),
                    }}
                  >
                    Reset to Default Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            order: 98,
            position: "relative",
            flexShrink: 0,
            paddingTop: 12,
            borderTop: `1px solid ${THEME.border}`,
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ position: "relative" }}>
            <button
              ref={settingsLanguageBtnRef}
              type="button"
              onClick={() => setSettingsLanguageOpen((v) => !v)}
              onPointerEnter={() => setLanguageFooterHover(true)}
              onPointerLeave={() => setLanguageFooterHover(false)}
              style={{
                minHeight: 42,
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                borderRadius: 12,
                border: `1px solid ${
                  languageFooterHover || settingsLanguageOpen ? withAlpha(THEME.text, isDarkMode ? 0.22 : 0.16) : THEME.border
                }`,
                background:
                  languageFooterHover || settingsLanguageOpen
                    ? withAlpha(THEME.text, isDarkMode ? 0.08 : 0.045)
                    : withAlpha(THEME.text, isDarkMode ? 0.03 : 0.02),
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                transition: "background 120ms ease, border-color 120ms ease",
              }}
              aria-expanded={settingsLanguageOpen}
              aria-label="Language menu"
            >
              <span style={{ fontSize: 14, lineHeight: 1.1, fontWeight: 900, color: THEME.text }}>
                {tr("Language", "Idioma")}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: THEME.textFaint }}>{activeLanguage.name}</span>
                <span style={{ fontSize: 12, opacity: 0.95 }}>{settingsLanguageOpen ? "▲" : "▼"}</span>
              </span>
            </button>

            {settingsLanguageOpen && (
              <div
                ref={settingsLanguageMenuRef}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: "calc(100% + 8px)",
                  zIndex: 5,
                  display: "grid",
                  gap: 6,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 12,
                  padding: 8,
                  background: THEME.surfaceWarm,
                  boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
                  maxHeight: 300,
                  overflowY: "auto",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: THEME.textFaint }}>
                  {tr(
                    "Not in your language yet? Contact us at Support@tabstudio.app to help us release it faster",
                    "¿Aún no está en tu idioma? Contáctanos en Support@tabstudio.app para ayudarnos a lanzarlo más rápido"
                  )}
                </div>

                {availableLanguages.map((lang) => {
                  const active = settingsLanguagePreview === lang.id;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => {
                        setSettingsLanguagePreview(lang.id);
                        setSettingsLanguageOpen(false);
                      }}
                      style={{
                        width: "100%",
                        minHeight: 34,
                        padding: "7px 10px",
                        borderRadius: 10,
                        border: `1px solid ${active ? withAlpha(THEME.accent, 0.7) : THEME.border}`,
                        background: active ? withAlpha(THEME.accent, 0.08) : "transparent",
                        color: active ? THEME.accent : THEME.text,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 13,
                        fontWeight: 850,
                        cursor: "pointer",
                      }}
                    >
                      <span>{lang.name}</span>
                      {active ? <span style={{ fontSize: 14, fontWeight: 900, color: THEME.accent }}>✓</span> : <span />}
                    </button>
                  );
                })}

                <div style={{ height: 1, background: THEME.border, margin: "2px 0" }} />
                {upcomingLanguages.map((lang) => (
                  <div
                    key={lang.id}
                    style={{
                      width: "100%",
                      minHeight: 32,
                      padding: "6px 10px",
                      borderRadius: 10,
                      border: `1px solid ${THEME.border}`,
                      color: THEME.textFaint,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 13,
                      fontWeight: 800,
                      opacity: 0.86,
                      boxSizing: "border-box",
                    }}
                  >
                    <span>{lang.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 900 }}>{tr("Coming soon", "Próximamente")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={openSettingsAccountEntry}
            onPointerEnter={() => setProfileFooterHover(true)}
            onPointerLeave={() => setProfileFooterHover(false)}
            title="Account & billing"
            style={{
              padding: "11px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              order: 99,
              borderRadius: 12,
              border: `1px solid ${
                profileFooterHover ? withAlpha(THEME.text, isDarkMode ? 0.26 : 0.18) : withAlpha(THEME.text, isDarkMode ? 0.18 : 0.12)
              }`,
              background: profileFooterHover
                ? withAlpha(THEME.text, isDarkMode ? 0.11 : 0.06)
                : withAlpha(THEME.text, isDarkMode ? 0.06 : 0.035),
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
              transition: "background 140ms ease, border-color 140ms ease",
              boxShadow: profileFooterHover ? `0 8px 18px ${withAlpha("#000000", isDarkMode ? 0.26 : 0.12)}` : "none",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                border: `1px solid ${THEME.border}`,
                background: THEME.surfaceWarm,
                color: THEME.textFaint,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 900,
                flexShrink: 0,
                overflow: "hidden",
              }}
              aria-hidden="true"
            >
              {isLoggedIn && accountAvatarDataUrl ? (
                <img src={accountAvatarDataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : isLoggedIn ? (
                getAvatarInitials(accountSummaryName)
              ) : (
                <AvatarSilhouetteIcon size={16} strokeWidth={1.8} />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, lineHeight: 1.1, fontWeight: 900, color: THEME.text }}>{accountSummaryName}</div>
              <div style={{ marginTop: 3, fontSize: 12, lineHeight: 1.1, color: THEME.textFaint, fontWeight: 800 }}>
                {accountSummaryTier}
              </div>
            </div>
          </button>
        </div>
      </aside>
      {!settingsFullscreen && (
        <button
          ref={settingsExpandHandleRef}
          type="button"
          onClick={() => setSettingsFullscreen(true)}
          title="Open settings fullscreen"
          aria-label="Open settings fullscreen"
          style={{
            position: "fixed",
            top: "50%",
            left: `min(${settingsPanelWidth}px, calc(100vw - 16px))`,
            transform: "translate(-50%, -50%)",
            width: 22,
            height: 44,
            borderRadius: 10,
            border: `1px solid ${THEME.border}`,
            background: THEME.surfaceWarm,
            color: THEME.textFaint,
            fontSize: 14,
            fontWeight: 850,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 91,
            boxShadow: `0 6px 12px ${withAlpha("#000000", isDarkMode ? 0.2 : 0.12)}`,
            padding: 0,
            transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
          }}
        >
          ▶
        </button>
      )}
    </>
  );
}
