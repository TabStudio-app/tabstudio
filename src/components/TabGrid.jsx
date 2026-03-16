import React from "react";
export default function TabGrid({ shared }) {
  const {
    capoFretFocused,
    cellIdleBg,
    cellSize,
    cols,
    cursor,
    firstExportGlowActive,
    formatTapSyncTimestamp,
    gridHighlightRef,
    gridRowScrollRefs,
    gridTargetingActive,
    gridView,
    handleGridRowScroll,
    isCellSelected,
    isDarkMode,
    onCellPointerDown,
    onCellPointerEnter,
    tabbyTourHighlightClassFor,
    tapSyncMode,
    tapSyncNoteTimings,
    tapSyncReplayItemId,
    tapSyncShowTimestamps,
    THEME,
    tuning,
    withAlpha,
  } = shared;

  return (
    <div
      ref={gridHighlightRef}
      className={tabbyTourHighlightClassFor("grid")}
      style={{
        position: "relative",
        marginTop: 14,
      }}
    >
      <div style={{ display: "grid", gap: 10 }}>
        {Array.from({ length: tuning.length }, (_, r) => (
          <div key={`row-${r}`} style={{ display: "grid" }}>
            <div
              className="tab-grid-row-scroll"
              ref={(el) => {
                gridRowScrollRefs.current[r] = el;
              }}
              onScroll={(e) => handleGridRowScroll(r, e)}
              style={{
                display: "grid",
                gridAutoFlow: "column",
                gridAutoColumns: `${cellSize}px`,
                gap: 8,
                overflowX: "auto",
                paddingBottom: 10,
                alignItems: "center",
                width: "100%",
                maxWidth: "100%",
                boxSizing: "border-box",
              }}
            >
              {Array.from({ length: cols }, (_, c) => {
                const val = String(gridView[r]?.[c] ?? "");
                const showGridTargeting = !capoFretFocused && gridTargetingActive;
                const isCursor = showGridTargeting && cursor.r === r && cursor.c === c;
                const selected = showGridTargeting && isCellSelected(r, c);
                const looksNumeric = /^\d{1,2}$/.test(val.trim());
                const looksX = /^[xX]$/.test(val.trim());
                const fontSizeCell = looksNumeric || looksX ? 16 : 14;
                const bg = cellIdleBg;
                const selectedBgTint = withAlpha(THEME.accent, isDarkMode ? 0.08 : 0.06);
                const cursorBgTint = withAlpha(THEME.accent, isDarkMode ? 0.11 : 0.08);
                const replayBgTint = withAlpha(THEME.accent, isDarkMode ? 0.18 : 0.12);
                const noteSyncId = `${r}:${c}`;
                const noteTimestampMs = tapSyncNoteTimings[noteSyncId];
                const noteReplayActive = tapSyncReplayItemId === `note:${noteSyncId}`;
                const noteHasTiming = Number.isFinite(Number(noteTimestampMs));

                return (
                  <div key={c} style={{ position: "relative", width: cellSize, height: cellSize }}>
                    <button
                      className="tab-grid-cell-button"
                      type="button"
                      data-grid-cell="true"
                      data-sync-cell-id={noteSyncId}
                      data-selected={selected ? "true" : "false"}
                      data-cursor={isCursor ? "true" : "false"}
                      data-replay-active={noteReplayActive ? "true" : "false"}
                      data-empty={val === "" ? "true" : "false"}
                      data-column-selector={r === 0 ? "true" : "false"}
                      onPointerDown={(e) => onCellPointerDown(e, r, c)}
                      onPointerEnter={(e) => onCellPointerEnter(e, r, c)}
                      tabIndex={-1}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        borderRadius: 12,
                        border: selected
                          ? `2px solid ${THEME.accent}`
                          : isCursor
                            ? `2px solid ${THEME.accent}`
                            : noteReplayActive
                              ? `2px solid ${THEME.accent}`
                              : `1px solid ${THEME.border}`,
                        background: noteReplayActive ? replayBgTint : selected ? selectedBgTint : isCursor ? cursorBgTint : bg,
                        boxShadow:
                          selected || isCursor || noteReplayActive
                            ? `0 0 0 2px ${withAlpha(THEME.accent, isDarkMode ? 0.24 : 0.16)}`
                            : "none",
                        color: THEME.text,
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
                        fontSize: fontSizeCell,
                        fontWeight: 950,
                        cursor: "pointer",
                        userSelect: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: 1,
                        padding: 0,
                        boxSizing: "border-box",
                        position: "relative",
                        overflow: "hidden",
                        transition: "background 150ms ease, border-color 150ms ease, box-shadow 150ms ease",
                      }}
                    >
                      {firstExportGlowActive && (
                        <span
                          aria-hidden="true"
                          style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: 11,
                            background: `radial-gradient(circle at 50% 48%, ${withAlpha("#FFD166", 0.86)} 0%, ${withAlpha(
                              "#FFD166",
                              0.56
                            )} 44%, ${withAlpha("#FFD166", 0.24)} 72%, ${withAlpha("#FFD166", 0)} 100%)`,
                            boxShadow: "none",
                            animation: "tabstudioFirstExportCellGlow 3600ms cubic-bezier(0.2, 0.72, 0.2, 1) forwards",
                            pointerEvents: "none",
                          }}
                        />
                      )}
                      {looksNumeric && val !== "" && (
                        <span
                          key={`cell-input-flash:${r}:${c}:${val}`}
                          aria-hidden="true"
                          style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: 11,
                            border: `1px solid ${withAlpha(THEME.accent, isDarkMode ? 0.58 : 0.46)}`,
                            background: withAlpha(THEME.accent, isDarkMode ? 0.14 : 0.09),
                            animation: "tabstudioCellInputFlash 100ms ease-out forwards",
                            pointerEvents: "none",
                          }}
                        />
                      )}
                      {val === "" ? (
                        "\u00A0"
                      ) : (() => {
                        const trimmed = val.trim();
                        const bendMatch = /^(\d+)b\((1\/2|1)\)$/.exec(trimmed);

                        let mainText = trimmed;
                        let supText = "";

                        if (bendMatch) {
                          mainText = bendMatch[1];
                          supText = bendMatch[2] === "1/2" ? "½" : "1";
                        }

                        return (
                          <span
                            style={{
                              position: "relative",
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <span>{mainText}</span>
                            {supText && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: 4,
                                  right: 5,
                                  fontSize: 11,
                                }}
                              >
                                {supText}
                              </span>
                            )}
                          </span>
                        );
                      })()}
                    </button>
                    {tapSyncShowTimestamps && tapSyncMode === "note" && noteHasTiming && (
                      <div
                        style={{
                          position: "absolute",
                          right: -2,
                          bottom: -3,
                          padding: "1px 4px",
                          borderRadius: 999,
                          border: `1px solid ${withAlpha(THEME.accent, 0.65)}`,
                          background: THEME.surfaceWarm,
                          color: THEME.accent,
                          fontSize: 10,
                          fontWeight: 900,
                          lineHeight: 1.1,
                          pointerEvents: "none",
                        }}
                      >
                        {formatTapSyncTimestamp(noteTimestampMs)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
