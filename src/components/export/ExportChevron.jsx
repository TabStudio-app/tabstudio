import React from "react";

export default function ExportChevron({ open = false, color = "#ffffff", anchored = false, right = 14 }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 16,
        minWidth: 16,
        height: 16,
        fontSize: 11,
        lineHeight: 1,
        color,
        opacity: 0.95,
        flexShrink: 0,
        ...(anchored
          ? {
              position: "absolute",
              right,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }
          : {}),
      }}
    >
      {open ? "▲" : "▼"}
    </span>
  );
}
