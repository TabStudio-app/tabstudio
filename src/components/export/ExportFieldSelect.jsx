import React, { useEffect, useMemo, useRef, useState } from "react";
import { menuItem, menuItemSelected, menuPanel } from "../../utils/uiTokens";
import ExportChevron from "./ExportChevron";

export default function ExportFieldSelect({ value, options, onChange, THEME, withAlpha, field, label, width = "100%" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const panelStyle = useMemo(() => menuPanel(THEME), [THEME]);
  const itemStyle = useMemo(
    () => menuItem(THEME, { padding: "0 10px", borderRadius: 12, height: 38 }),
    [THEME]
  );
  const itemSelectedStyle = useMemo(
    () =>
      menuItemSelected(THEME, {
        padding: "0 10px",
        borderRadius: 12,
        height: 38,
        borderColor: withAlpha(THEME.accent, 0.75),
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
      if (!rootRef.current?.contains(event.target)) setOpen(false);
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
          ...field,
          width: "100%",
          textAlign: "left",
          fontWeight: 800,
          fontFamily: "inherit",
          fontSize: 16,
          lineHeight: 1.2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          borderColor: open ? THEME.accent : THEME.border,
          boxShadow: open ? `0 0 0 3px ${withAlpha(THEME.accent, 0.16)}` : "none",
          color: THEME.text,
          gap: 10,
          position: "relative",
          paddingRight: 40,
        }}
      >
        <span style={{ flex: 1, minWidth: 0, fontWeight: 800 }}>{label}</span>
        <span style={{ display: "inline-flex", alignItems: "center", minWidth: 0, marginLeft: "auto", paddingRight: 20 }}>
          <span style={{ color: THEME.textFaint, fontSize: 12, opacity: 0.72, fontWeight: 900, whiteSpace: "nowrap" }}>
            {selectedOption?.label ?? ""}
          </span>
        </span>
        <ExportChevron open={open} color={THEME.text} anchored />
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
            zIndex: 2000,
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
