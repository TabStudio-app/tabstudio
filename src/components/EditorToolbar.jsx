import React from "react";
import { tabColsAdjustButtonClass } from "../utils/uiStyles";
import { buttonMicro, menuItem, menuItemSelected, menuPanelLarge, menuTriggerCompact, toolbarControlText } from "../utils/uiTokens";

export default function EditorToolbar({ shared }) {
  const {
    actionDeleteBtn,
    actionEditBtn,
    allChords,
    applyChordToSelectedColumn,
    btnPrimary,
    btnSecondary,
    chordName,
    chordsBtnRef,
    chordsOpen,
    chordsPanelRef,
    chordsPanelShiftX,
    chordsSection,
    chordsSectionRef,
    clearAll,
    clearColsAutoCommitTimer,
    colsControlRef,
    colsDragRef,
    colsInput,
    colsInputRef,
    colsRapidClickRef,
    colsReplaceOnTypeRef,
    commitColsInput,
    completeRow,
    completeRowBtnRef,
    cursorRef,
    EditIcon,
    effectivePresetChords,
    field,
    fillSelectedColumnWith,
    focusKeyCapture,
    gridRef,
    handleColsTripleClickReset,
    hasGridContent,
    insertBtnRef,
    insertIntoSelectedCell,
    insertOpen,
    insertPanelRef,
    insertPanelShiftX,
    insertSectionRef,
    INSERT_OPTIONS,
    lastAppliedChordId,
    MAX_COLS,
    MIN_COLS,
    nudgeCols,
    openEditChordModal,
    pillMono,
    pressHandlers,
    pressedBtnId,
    pressVisual,
    repeatLastChord,
    requestDeleteUserChord,
    saveChordFromSelectedColumn,
    scheduleColsAutoCommit,
    selectedChordId,
    setCell,
    setChordName,
    setChordsOpen,
    setChordsSection,
    setCols,
    setColsInput,
    setColsReplaceOnType,
    setInsertOpen,
    setOverwriteNext,
    setSelectedChordId,
    standard,
    tabbyTourHighlightClassFor,
    THEME,
    toolbarMenuBtn,
    toolbarToggleVisual,
    tr,
    userChords,
    withAlpha,
  } = shared;

  const microButton = buttonMicro(THEME);
  const largeMenuPanelStyle = menuPanelLarge(THEME);
  const defaultMenuItemStyle = menuItem(THEME, { padding: "9px 10px", fontWeight: 850 });
  const chordMenuItemStyle = menuItem(THEME, { padding: "0 38px 0 10px", borderRadius: 12, height: 38 });
  const chordSelectedMenuItemStyle = menuItemSelected(THEME, {
    padding: "0 38px 0 10px",
    borderRadius: 12,
    height: 38,
    borderColor: withAlpha(THEME.accent, 0.75),
    background: withAlpha(THEME.accent, 0.1),
    color: THEME.accent,
    boxShadow: `inset 0 0 0 1px ${withAlpha(THEME.accent, 0.22)}`,
  });
  const chordCustomMenuItemStyle = menuItem(THEME, { padding: "0 66px 0 10px", borderRadius: 12, height: 38 });
  const chordCustomSelectedMenuItemStyle = menuItemSelected(THEME, {
    padding: "0 66px 0 10px",
    borderRadius: 12,
    height: 38,
    borderColor: withAlpha(THEME.accent, 0.75),
    background: withAlpha(THEME.accent, 0.1),
    color: THEME.accent,
    boxShadow: `inset 0 0 0 1px ${withAlpha(THEME.accent, 0.22)}`,
  });
  const compactTriggerStyle = menuTriggerCompact(THEME);
  const toolbarControlTextStyle = toolbarControlText();

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
      <div
        ref={colsControlRef}
        className={tabbyTourHighlightClassFor("idea-tools")}
        style={{
          display: "flex",
          alignItems: "center",
          border: `1px solid ${THEME.border}`,
          borderRadius: 14,
          overflow: "hidden",
          background: THEME.surfaceWarm,
          height: 42,
          boxSizing: "border-box",
        }}
      >
        <button
          className={tabColsAdjustButtonClass}
          type="button"
          onClick={() => setCols((c) => Math.max(MIN_COLS, c - 1))}
          {...pressHandlers("colsDec")}
          style={{
            width: 42,
            height: 42,
            border: "none",
            outline: "none",
            boxShadow: "none",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 1000,
            fontSize: 20,
            lineHeight: 1,
            color: THEME.text,
            padding: 0,
            ...(pressedBtnId === "colsDec"
              ? {
                  color: THEME.accent,
                  transform: "translateY(1px)",
                  textShadow: `0 0 8px ${withAlpha(THEME.accent, 0.35)}`,
                }
              : {
                  transform: "translateY(0)",
                  textShadow: "none",
                }),
            transition: "transform 100ms ease, color 120ms ease, text-shadow 120ms ease",
          }}
          title="Decrease columns"
          aria-label="Decrease columns"
        >
          −
        </button>

        <div style={{ width: 1, height: "100%", background: THEME.border }} />

        <input
          ref={colsInputRef}
          className="tab-cols-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={colsInput}
          onMouseDown={(e) => {
            if (handleColsTripleClickReset(e)) {
              e.preventDefault();
              return;
            }
            clearColsAutoCommitTimer();
            setColsReplaceOnType(true);
            colsReplaceOnTypeRef.current = true;
          }}
          onClick={(e) => {
            if (handleColsTripleClickReset(e)) {
              e.preventDefault();
            }
          }}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            colsDragRef.current = {
              active: true,
              pointerId: e.pointerId,
              lastY: e.clientY,
              carry: 0,
            };
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {}
          }}
          onPointerMove={(e) => {
            const drag = colsDragRef.current;
            if (!drag.active || drag.pointerId !== e.pointerId) return;
            const deltaPx = drag.lastY - e.clientY;
            drag.lastY = e.clientY;
            drag.carry += deltaPx;
            const stepPx = 10;
            if (Math.abs(drag.carry) < stepPx) return;
            const steps = drag.carry > 0 ? Math.floor(drag.carry / stepPx) : Math.ceil(drag.carry / stepPx);
            drag.carry -= steps * stepPx;
            nudgeCols(steps);
          }}
          onPointerUp={(e) => {
            const drag = colsDragRef.current;
            if (drag.pointerId !== e.pointerId) return;
            drag.active = false;
            drag.pointerId = null;
            drag.carry = 0;
            try {
              e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {}
          }}
          onPointerCancel={(e) => {
            const drag = colsDragRef.current;
            if (drag.pointerId !== e.pointerId) return;
            drag.active = false;
            drag.pointerId = null;
            drag.carry = 0;
          }}
          onSelect={(e) => {
            const len = String(colsInput ?? "").length;
            try {
              e.currentTarget.setSelectionRange(len, len);
            } catch {}
          }}
          onDragStart={(e) => e.preventDefault()}
          onFocus={() => {
            clearColsAutoCommitTimer();
            setColsReplaceOnType(true);
            colsReplaceOnTypeRef.current = true;
          }}
          onChange={(e) => {
            const raw = String(e.target.value ?? "").replace(/[^\d]/g, "");
            setColsInput(raw);
            scheduleColsAutoCommit(raw);
          }}
          onBlur={() => {
            clearColsAutoCommitTimer();
            commitColsInput();
            setColsReplaceOnType(false);
            colsReplaceOnTypeRef.current = false;
            colsRapidClickRef.current = { count: 0, lastTs: 0 };
          }}
          onKeyDown={(e) => {
            if (/^\d$/.test(e.key)) {
              e.preventDefault();
              const replace = colsReplaceOnTypeRef.current;
              setColsInput((prev) => {
                const base = replace ? "" : String(prev ?? "");
                const nextRaw = `${base}${e.key}`.replace(/[^\d]/g, "");
                scheduleColsAutoCommit(nextRaw);
                return nextRaw;
              });
              if (replace) {
                setColsReplaceOnType(false);
                colsReplaceOnTypeRef.current = false;
              }
              return;
            }
            if (e.key === "Backspace") {
              e.preventDefault();
              const nextRaw = String(colsInput ?? "").slice(0, -1);
              setColsReplaceOnType(false);
              colsReplaceOnTypeRef.current = false;
              setColsInput(nextRaw);
              scheduleColsAutoCommit(nextRaw);
              return;
            }
            if (e.key === "Delete") {
              e.preventDefault();
              setColsReplaceOnType(false);
              colsReplaceOnTypeRef.current = false;
              setColsInput("");
              clearColsAutoCommitTimer();
              return;
            }
            if (e.key === "Enter") {
              e.preventDefault();
              clearColsAutoCommitTimer();
              commitColsInput();
              setColsReplaceOnType(false);
              colsReplaceOnTypeRef.current = false;
              e.currentTarget.blur();
              focusKeyCapture();
              return;
            }
            if (e.key === "Tab") return;
            e.preventDefault();
          }}
          style={{
            width: 92,
            height: 42,
            border: "none",
            outline: "none",
            boxShadow: "none",
            caretColor: "transparent",
            cursor: "pointer",
            userSelect: "none",
            WebkitUserSelect: "none",
            textAlign: "center",
            fontWeight: 900,
            fontSize: 16,
            background: "transparent",
            color: THEME.text,
            boxSizing: "border-box",
          }}
        />

        <div style={{ width: 1, height: "100%", background: THEME.border }} />

        <button
          className={tabColsAdjustButtonClass}
          type="button"
          onClick={() => setCols((c) => Math.min(MAX_COLS, c + 1))}
          {...pressHandlers("colsInc")}
          style={{
            width: 42,
            height: 42,
            border: "none",
            outline: "none",
            boxShadow: "none",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 1000,
            fontSize: 20,
            lineHeight: 1,
            color: THEME.text,
            padding: 0,
            ...(pressedBtnId === "colsInc"
              ? {
                  color: THEME.accent,
                  transform: "translateY(1px)",
                  textShadow: `0 0 8px ${withAlpha(THEME.accent, 0.35)}`,
                }
              : {
                  transform: "translateY(0)",
                  textShadow: "none",
                }),
            transition: "transform 100ms ease, color 120ms ease, text-shadow 120ms ease",
          }}
          title="Increase columns"
          aria-label="Increase columns"
        >
          +
        </button>
      </div>

      <div
        ref={chordsSectionRef}
        className={tabbyTourHighlightClassFor("chords")}
        style={{ position: "relative", marginLeft: 18 }}
      >
        <button
          ref={chordsBtnRef}
          type="button"
          onClick={() => setChordsOpen((v) => !v)}
          disabled={!standard}
          title={
            standard
              ? "Chord tools (6-string guitar)"
              : "Chords currently only available for 6-string guitar"
          }
          style={{
            ...toolbarMenuBtn,
            ...toolbarToggleVisual(chordsOpen),
            ...toolbarControlTextStyle,
            cursor: standard ? "pointer" : "not-allowed",
            opacity: standard ? 1 : 0.55,
          }}
        >
          <span>{tr("Chords", "Acordes")}</span>
          <span style={{ opacity: 0.95 }}>{chordsOpen ? "▲" : "▼"}</span>
        </button>

        {chordsOpen && (
          <div
            ref={chordsPanelRef}
            style={{
              position: "absolute",
              top: 50,
              left: 0,
              transform: `translateX(${chordsPanelShiftX}px)`,
              zIndex: 1000,
              width: "min(860px, calc(100vw - 36px))",
              maxHeight: "min(620px, calc(100vh - 120px))",
              ...largeMenuPanelStyle,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontWeight: 950 }}>Chord tools</div>
                <div style={{ fontSize: 12, color: THEME.textFaint }}>
                  Use shared chord presets and saved chord shapes for the current tuning. Custom chords you save from the
                  selected column are stored per tuning in this browser.
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setChordsOpen(false);
                  focusKeyCapture();
                }}
                style={{ ...microButton }}
              >
                Close
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(220px, 1fr) 110px 1fr",
                gap: 10,
                alignItems: "end",
                marginTop: 12,
              }}
            >
              <div>
                <input
                  value={chordName}
                  onChange={(e) => setChordName(e.target.value)}
                  placeholder="Chord name (e.g. Em, G, Cadd9)"
                  style={{ ...field, minWidth: 0 }}
                />
              </div>

              <button type="button" onClick={saveChordFromSelectedColumn} style={btnSecondary}>
                Save
              </button>

              <button
                type="button"
                onClick={applyChordToSelectedColumn}
                disabled={!selectedChordId}
                style={{
                  ...btnPrimary,
                  cursor: selectedChordId ? "pointer" : "not-allowed",
                  opacity: selectedChordId ? 1 : 0.55,
                  justifySelf: "start",
                  minWidth: 220,
                  height: 42,
                }}
              >
                Apply to selected column
              </button>
            </div>

            <div
              style={{
                marginTop: 12,
                borderTop: `1px solid ${THEME.border}`,
                paddingTop: 12,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                flex: 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                <div style={{ fontWeight: 950 }}>Chords</div>
                <div style={{ display: "inline-flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setChordsSection("presets")}
                    style={{
                      ...compactTriggerStyle,
                      borderColor: chordsSection === "presets" ? THEME.accent : THEME.border,
                      color: chordsSection === "presets" ? THEME.accent : THEME.text,
                    }}
                  >
                    Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => setChordsSection("custom")}
                    style={{
                      ...compactTriggerStyle,
                      borderColor: chordsSection === "custom" ? THEME.accent : THEME.border,
                      color: chordsSection === "custom" ? THEME.accent : THEME.text,
                    }}
                  >
                    Custom
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 10,
                  minHeight: 0,
                  flex: 1,
                  overflowY: "auto",
                  overscrollBehavior: "contain",
                  paddingRight: 4,
                }}
                onWheel={(e) => e.stopPropagation()}
              >
                {chordsSection === "presets"
                  ? effectivePresetChords.map((c) => {
                      const selected = selectedChordId === c.id;
                      return (
                        <div
                          key={c.id}
                          style={{
                            position: "relative",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedChordId(c.id)}
                            style={{
                              ...(selected ? chordSelectedMenuItemStyle : chordMenuItemStyle),
                              justifyContent: "flex-start",
                              gap: 8,
                              width: "100%",
                            }}
                          >
                            <span
                              style={{
                                minWidth: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {c.name}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditChordModal(c)}
                            style={{
                              ...actionEditBtn,
                              position: "absolute",
                              right: 5,
                              top: "50%",
                              transform: "translateY(-50%)",
                              height: 28,
                              minWidth: 28,
                              width: 28,
                              padding: 0,
                              fontSize: 10,
                            }}
                            title={`Edit ${c.name} shape`}
                            aria-label={`Edit ${c.name} shape`}
                          >
                            <EditIcon size={13} />
                          </button>
                        </div>
                      );
                    })
                  : userChords.length === 0
                    ? (
                      <div
                        style={{
                          gridColumn: "1 / -1",
                          fontSize: 12,
                          color: THEME.textFaint,
                          padding: "6px 2px",
                        }}
                      >
                        No saved chords yet. Save one from the selected column above.
                      </div>
                    )
                    : userChords.map((c) => {
                        const selected = selectedChordId === c.id;
                        return (
                          <div
                            key={c.id}
                            style={{
                              position: "relative",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedChordId(c.id)}
                              style={{
                                ...(selected ? chordCustomSelectedMenuItemStyle : chordCustomMenuItemStyle),
                                justifyContent: "flex-start",
                                gap: 8,
                                minWidth: 0,
                                width: "100%",
                              }}
                            >
                              <span
                                style={{
                                  minWidth: 0,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {c.name}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditChordModal(c)}
                              style={{
                                ...actionEditBtn,
                                position: "absolute",
                                right: 37,
                                top: "50%",
                                transform: "translateY(-50%)",
                                height: 28,
                                minWidth: 28,
                                width: 28,
                                padding: 0,
                                fontSize: 10,
                              }}
                              title={`Edit ${c.name} shape`}
                              aria-label={`Edit ${c.name} shape`}
                            >
                              <EditIcon size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                requestDeleteUserChord(c.id);
                              }}
                              title="Delete saved chord"
                              style={{
                                ...actionDeleteBtn,
                                position: "absolute",
                                right: 5,
                                top: "50%",
                                transform: "translateY(-50%)",
                                height: 28,
                                minWidth: 28,
                                width: 28,
                                fontSize: 16,
                                padding: 0,
                              }}
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
              </div>
            </div>
          </div>
        )}
      </div>

      {standard && lastAppliedChordId && (
        <button
          type="button"
          onClick={repeatLastChord}
          title="Repeat last chord into the next column"
          aria-label="Repeat last chord into the next column"
          style={{
            ...btnSecondary,
            ...toolbarControlTextStyle,
            height: 42,
            padding: "0 14px",
          }}
        >
          {tr("Repeat", "Repetir")}
        </button>
      )}

      <div
        ref={insertSectionRef}
        className={tabbyTourHighlightClassFor("insert")}
        style={{ position: "relative", marginLeft: 6 }}
      >
        <button
          ref={insertBtnRef}
          type="button"
          onClick={() => setInsertOpen((v) => !v)}
          title="Insert a technique/symbol (+ opens this menu)"
          style={{
            ...toolbarMenuBtn,
            ...toolbarToggleVisual(insertOpen),
            ...toolbarControlTextStyle,
          }}
        >
          <span>{tr("Insert", "Insertar")}</span>
          <span style={{ opacity: 0.95 }}>{insertOpen ? "▲" : "▼"}</span>
        </button>

        {insertOpen && (
          <div
            ref={insertPanelRef}
            style={{
              position: "absolute",
              top: 50,
              left: 0,
              transform: `translateX(${insertPanelShiftX}px)`,
              zIndex: 1000,
              width: "min(560px, calc(100vw - 36px))",
              maxHeight: "min(560px, calc(100vh - 150px))",
              ...largeMenuPanelStyle,
              display: "grid",
              gridTemplateRows: "auto minmax(0,1fr) auto",
              gap: 8,
              overflow: "hidden",
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <div style={{ fontWeight: 950 }}>Insert</div>
              <button
                type="button"
                onClick={() => {
                  setInsertOpen(false);
                  focusKeyCapture();
                }}
                style={{ ...microButton }}
              >
                Close
              </button>
            </div>
            <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", overflowY: "auto", paddingRight: 2 }}>
              {INSERT_OPTIONS.map((opt) => (
                <button
                  key={`${opt.mode}:${opt.insert}`}
                  type="button"
                  onClick={() => {
                    if (opt.mode === "column") fillSelectedColumnWith(opt.insert);
                    else insertIntoSelectedCell(opt.insert);
                  }}
                  style={{
                    ...defaultMenuItemStyle,
                  }}
                >
                  <span>{opt.label}</span>
                  <span style={{ ...pillMono, color: THEME.textFaint, opacity: 0.9 }}>{opt.insert}</span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  const { r, c } = cursorRef.current;
                  const cur = String(gridRef.current?.[r]?.[c] ?? "");
                  const trimmed = cur.trim();
                  if (!trimmed) {
                    setInsertOpen(false);
                    focusKeyCapture();
                    return;
                  }
                  let newVal = trimmed;
                  if (!(trimmed.startsWith("(") && trimmed.endsWith(")"))) {
                    newVal = `(${trimmed})`;
                  }
                  setCell(r, c, newVal);
                  setOverwriteNext(false);
                  setInsertOpen(false);
                  focusKeyCapture();
                }}
                style={{
                  ...defaultMenuItemStyle,
                }}
              >
                <span>Harmonic</span>
                <span style={{ ...pillMono, color: THEME.textFaint, opacity: 0.9 }}>(12)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {hasGridContent && (
        <button
          type="button"
          onClick={clearAll}
          {...pressHandlers("clearAll")}
          style={{
            ...btnSecondary,
            ...pressVisual(pressedBtnId === "clearAll"),
            transition: "transform 100ms ease, background 120ms ease, border-color 120ms ease, color 120ms ease",
          }}
        >
          {tr("Clear All", "Limpiar todo")}
        </button>
      )}

      <button
        ref={completeRowBtnRef}
        className={tabbyTourHighlightClassFor("complete-row")}
        type="button"
        onClick={completeRow}
        {...pressHandlers("completeRow")}
        style={{
          ...btnSecondary,
          ...pressVisual(pressedBtnId === "completeRow"),
          ...toolbarControlTextStyle,
          height: 42,
          marginLeft: "auto",
          transition: "transform 100ms ease, background 120ms ease, border-color 120ms ease, color 120ms ease",
        }}
      >
        {tr("Complete Row", "Completar fila")}
      </button>
    </div>
  );
}
