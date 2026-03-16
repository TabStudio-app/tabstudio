import React, { useEffect, useMemo, useRef, useState } from "react";
import { menuItem, menuItemSelected, menuPanel, menuTriggerCompact } from "../../utils/uiTokens";
import ExportChevron from "./ExportChevron";

export default function ExportCompactSelect({ value, options, onChange, THEME, withAlpha, width = "100%" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerStyle = useMemo(() => menuTriggerCompact(THEME), [THEME]);
  const panelStyle = useMemo(() => menuPanel(THEME), [THEME]);
  const itemStyle = useMemo(
    () => menuItem(THEME, { padding: "0 10px", borderRadius: 10, fontWeight: 850, fontSize: 12, height: 32 }),
    [THEME]
  );
  const itemSelectedStyle = useMemo(
    () =>
      menuItemSelected(THEME, {
        padding: "0 10px",
        borderRadius: 10,
        fontWeight: 900,
        fontSize: 12,
        height: 32,
        borderColor: withAlpha(THEME.accent, 0.74),
        background: withAlpha(THEME.accent, THEME.isDark ? 0.14 : 0.09),
        color: THEME.text,
        boxShadow: `0 0 0 1px ${withAlpha(THEME.accent, THEME.isDark ? 0.16 : 0.1)}`,
      }),
    [THEME, withAlpha]
  );
  const selectedOption = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative", width, minWidth: 0 }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        style={{
          ...triggerStyle,
          width: "100%",
          minWidth: 0,
          color: THEME.text,
          background: THEME.surfaceWarm,
          position: "relative",
          paddingRight: 34,
        }}
      >
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedOption?.label ?? ""}
        </span>
        <ExportChevron open={open} color={THEME.text} anchored right={10} />
      </button>
      {open ? (
        <div
          role="listbox"
          style={{
            ...panelStyle,
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: "100%",
            zIndex: 6,
            display: "grid",
            gap: 6,
            padding: 8,
          }}
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={selected ? itemSelectedStyle : itemStyle}
              >
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
