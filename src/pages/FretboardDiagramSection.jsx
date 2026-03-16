import React, { useEffect, useMemo, useState } from "react";
import {
  PNG_EXPORT_PADDING_OPTIONS,
  getPngExportPaddingPixels,
  PNG_EXPORT_SIZE_OPTIONS,
  getPngExportTargetWidth,
  normalizePngExportPadding,
  normalizePngExportSize,
  getTransparentPreviewSurface,
} from "../features/export/exportHelpers";
import ExportCompactSelect from "../components/export/ExportCompactSelect";
import ExportChevron from "../components/export/ExportChevron";
import { editorOptionClass } from "../utils/uiStyles";
import {
  buttonMicro,
  buttonPrimary,
  cardDense,
  menuItem,
  menuItemSelected,
  menuPanelLarge,
  menuTriggerCompact,
  menuPanel,
  metadataFieldInteraction,
  metadataTriggerText,
  modalCard,
  modalCloseButton,
  modalHeader,
  modalOverlay,
  toolbarControlText,
} from "../utils/uiTokens";

const DIAGRAM_WIDTH = 420;
const DIAGRAM_HEIGHT = 520;
const DIAGRAM_MARGIN_X = 92;
const DIAGRAM_TOP = 116;
const FRETBOARD_HEIGHT = 272;
const FRET_SPACING = FRETBOARD_HEIGHT / 5;

function sanitizeChordName(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function createEmptyStringFrets(stringCount) {
  return Array(Math.max(1, Number(stringCount) || 0)).fill("");
}

function sanitizeFretValue(value) {
  const trimmed = String(value ?? "").trim().toLowerCase();
  if (!trimmed) return "";
  if (trimmed === "x") return "x";
  const digits = trimmed.replace(/[^\d]/g, "").slice(0, 2);
  return digits;
}

function getThicknessMetrics(thicknessId) {
  if (thicknessId === "A") return { strokeWidth: 2, dotRadius: 11, markerRadius: 8, nutWidth: 4 };
  if (thicknessId === "C") return { strokeWidth: 4, dotRadius: 13, markerRadius: 9, nutWidth: 7 };
  return { strokeWidth: 3, dotRadius: 12, markerRadius: 8.5, nutWidth: 5.5 };
}

function thicknessFontWeightFor(thicknessId) {
  if (thicknessId === "A") return 500;
  if (thicknessId === "C") return 900;
  return 700;
}

function normalizeFretArray(values, stringCount) {
  const next = Array.isArray(values) ? values.map((value) => sanitizeFretValue(value)).slice(0, stringCount) : [];
  while (next.length < stringCount) next.push("");
  return next;
}

function normalizeNoteArray(values, stringCount, fallback = "") {
  const next = Array.isArray(values) ? values.map((value) => String(value || "").trim()).slice(0, stringCount) : [];
  while (next.length < stringCount) next.push(fallback);
  return next;
}

function buildTuningId(instrumentId, tuningLabel, tuning) {
  return [String(instrumentId || "gtr6"), ...(Array.isArray(tuningLabel) ? tuningLabel : [])]
    .map((part) => String(part || "").trim())
    .join("|");
}

function formatLowToHighString(lowToHigh) {
  return (Array.isArray(lowToHigh) ? lowToHigh : []).map((part) => String(part || "").trim()).join(" ");
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getDiagramGeometry(stringFrets, stringCount) {
  const parsed = stringFrets.map((value) => {
    const normalized = sanitizeFretValue(value);
    if (normalized === "x") return { type: "muted", raw: "x" };
    if (normalized === "") return { type: "empty", raw: "" };
    const fret = Number.parseInt(normalized, 10);
    if (!Number.isFinite(fret)) return { type: "empty", raw: "" };
    if (fret === 0) return { type: "open", fret: 0, raw: "0" };
    return { type: "fretted", fret, raw: String(fret) };
  });

  const frettedValues = parsed.filter((entry) => entry.type === "fretted").map((entry) => entry.fret);
  const baseFret = frettedValues.length > 0 ? Math.max(1, Math.min(...frettedValues)) : 1;
  const displayBaseFret = baseFret > 1 ? baseFret : 1;
  const safeStringCount = Math.max(1, Number(stringCount) || 1);
  const stringSpacing = safeStringCount > 1 ? (DIAGRAM_WIDTH - DIAGRAM_MARGIN_X * 2) / (safeStringCount - 1) : 0;
  const stringXs = Array.from({ length: safeStringCount }, (_, index) => DIAGRAM_MARGIN_X + index * stringSpacing);
  const fretYs = Array.from({ length: 6 }, (_, index) => DIAGRAM_TOP + index * FRET_SPACING);

  return {
    parsed,
    displayBaseFret,
    stringXs,
    fretYs,
  };
}

function buildChordDiagramSvgMarkup({
  chordName,
  stringFrets,
  tuningLabels,
  stringCount,
  imageThickness,
  lineColor,
  backgroundMode,
  backgroundColor,
  includeLabels = true,
  includeChordName = true,
  brandingText = "",
}) {
  const safeStringCount = Math.max(1, Number(stringCount) || 1);
  const safeFrets = normalizeFretArray(stringFrets, safeStringCount);
  const safeLabels = normalizeNoteArray(tuningLabels, safeStringCount);
  const renderedFrets = safeFrets.slice().reverse();
  const renderedLabels = safeLabels.slice();

  const { parsed, displayBaseFret, stringXs, fretYs } = getDiagramGeometry(renderedFrets, safeStringCount);
  const { strokeWidth, dotRadius, markerRadius, nutWidth } = getThicknessMetrics(imageThickness);
  const markerY = DIAGRAM_TOP - 24;
  const tuningFontSize = imageThickness === "A" ? 13 : imageThickness === "C" ? 17 : 15;
  const tuningFontWeight = imageThickness === "A" ? 600 : imageThickness === "C" ? 900 : 700;
  const backgroundRect =
    backgroundMode === "solid"
      ? `<rect x="0" y="0" width="${DIAGRAM_WIDTH}" height="${DIAGRAM_HEIGHT}" fill="${escapeXml(backgroundColor)}" rx="24" ry="24" />`
      : "";
  const stringLines = stringXs
    .map(
      (x) =>
        `<line x1="${x}" y1="${DIAGRAM_TOP}" x2="${x}" y2="${DIAGRAM_TOP + FRETBOARD_HEIGHT}" stroke="${escapeXml(lineColor)}" stroke-width="${strokeWidth}" stroke-linecap="round" />`
    )
    .join("");
  const fretLines = fretYs
    .map((y, index) => {
      const width = index === 0 && displayBaseFret === 1 ? nutWidth : strokeWidth;
      return `<line x1="${stringXs[0]}" y1="${y}" x2="${stringXs[stringXs.length - 1]}" y2="${y}" stroke="${escapeXml(lineColor)}" stroke-width="${width}" stroke-linecap="round" />`;
    })
    .join("");
  const tuningText = includeLabels
    ? renderedLabels
        .map(
          (label, index) =>
            `<text x="${stringXs[index]}" y="${DIAGRAM_TOP + FRETBOARD_HEIGHT + 34}" font-size="${tuningFontSize}" font-weight="${tuningFontWeight}" text-anchor="middle" fill="${escapeXml(
              lineColor
            )}" opacity="0.72">${escapeXml(String(label || "").toUpperCase())}</text>`
        )
        .join("")
    : "";
  const markers = parsed
    .map((entry, index) => {
      const x = stringXs[index];
      if (entry.type === "open") {
        return `<circle cx="${x}" cy="${markerY}" r="${markerRadius}" fill="none" stroke="${escapeXml(lineColor)}" stroke-width="${strokeWidth}" />`;
      }
      if (entry.type === "muted") {
        const size = markerRadius - 1;
        return [
          `<line x1="${x - size}" y1="${markerY - size}" x2="${x + size}" y2="${markerY + size}" stroke="${escapeXml(lineColor)}" stroke-width="${strokeWidth}" stroke-linecap="round" />`,
          `<line x1="${x + size}" y1="${markerY - size}" x2="${x - size}" y2="${markerY + size}" stroke="${escapeXml(lineColor)}" stroke-width="${strokeWidth}" stroke-linecap="round" />`,
        ].join("");
      }
      if (entry.type === "fretted") {
        const y = DIAGRAM_TOP + (entry.fret - displayBaseFret + 0.5) * FRET_SPACING;
        return `<circle cx="${x}" cy="${y}" r="${dotRadius}" fill="${escapeXml(lineColor)}" />`;
      }
      return "";
    })
    .join("");
  const baseFretText =
    displayBaseFret > 1
      ? `<text x="42" y="${DIAGRAM_TOP + FRET_SPACING * 0.65}" font-size="18" font-weight="800" text-anchor="middle" fill="${escapeXml(
          lineColor
        )}">${displayBaseFret}fr</text>`
      : "";
  const cleanBrandingText = String(brandingText || "").trim();
  const brandingLine = cleanBrandingText
    ? `<text x="${DIAGRAM_WIDTH / 2}" y="${DIAGRAM_HEIGHT - 18}" font-size="12" font-weight="700" text-anchor="middle" fill="${escapeXml(
        lineColor
      )}" opacity="0.78">${escapeXml(cleanBrandingText)}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${DIAGRAM_WIDTH}" height="${DIAGRAM_HEIGHT}" viewBox="0 0 ${DIAGRAM_WIDTH} ${DIAGRAM_HEIGHT}" fill="none">
    ${backgroundRect}
    ${includeChordName && chordName ? `<text x="${DIAGRAM_WIDTH / 2}" y="42" font-size="28" font-weight="900" text-anchor="middle" fill="${escapeXml(lineColor)}">${escapeXml(chordName)}</text>` : ""}
    ${tuningText}
    ${stringLines}
    ${fretLines}
    ${markers}
    ${baseFretText}
    ${brandingLine}
  </svg>`;
}

function SvgPreview({ markup, style = {} }) {
  return <div style={style} dangerouslySetInnerHTML={{ __html: markup }} />;
}

export default function FretboardDiagramSection({
  resetOnOpenKey,
  headerContent,
  THEME,
  btnSecondary,
  field,
  withAlpha,
  normalizeHexColorOrFallback,
  tuning,
  tuningLabel,
  instrumentId,
  currentInstrument,
  groupedInstruments,
  favInstrumentIds,
  favouriteInstruments,
  toggleFavouriteInstrument,
  handleInstrumentChange,
  chordToolEnabled,
  currentPresetChords,
  sharedStandardPresetChords,
  currentUserChords,
  allUserChords,
  saveCustomChordToLibrary,
  availableChordTunings,
  saveChordExportTuning,
  chordDiagramPrefs,
  saveChordDiagramPrefs,
  includeBranding,
  setIncludeBranding,
  exportBrandingLocked,
  useAffiliateBranding,
  setUseAffiliateBranding,
  hasAffiliateBranding,
  exportBrandingText,
}) {
  const resolvedPrefs = chordDiagramPrefs || {};
  const denseCard = cardDense(THEME);
  const microButton = buttonMicro(THEME);
  const primaryButton = buttonPrimary(THEME);
  const panelStyle = menuPanel(THEME);
  const [chordName, setChordName] = useState("");
  const [stringFrets, setStringFrets] = useState(() => createEmptyStringFrets(Math.max(1, Number(currentInstrument?.stringCount) || 0)));
  const [diagramBgMode, setDiagramBgMode] = useState(resolvedPrefs.backgroundMode === "solid" ? "solid" : "transparent");
  const [diagramBgColor, setDiagramBgColor] = useState(String(resolvedPrefs.backgroundColor || "#ffffff"));
  const [diagramLineColor, setDiagramLineColor] = useState(
    String(resolvedPrefs.lineColor || resolvedPrefs.textColor || "#ffffff")
  );
  const [diagramThickness, setDiagramThickness] = useState(
    ["A", "B", "C"].includes(String(resolvedPrefs.lineThickness || "")) ? String(resolvedPrefs.lineThickness) : "B"
  );
  const [diagramExportSize, setDiagramExportSize] = useState(normalizePngExportSize(resolvedPrefs.exportSize));
  const [diagramExportPadding, setDiagramExportPadding] = useState(normalizePngExportPadding(resolvedPrefs.exportPadding));
  const [showDiagramChordName, setShowDiagramChordName] = useState(resolvedPrefs.showChordName !== false);
  const [showDiagramTuning, setShowDiagramTuning] = useState(resolvedPrefs.showTuning !== false);
  const [statusText, setStatusText] = useState("");
  const [hoveredStringIndex, setHoveredStringIndex] = useState(-1);
  const [buttonHoverKey, setButtonHoverKey] = useState("");
  const [accordionHoverKey, setAccordionHoverKey] = useState("");
  const [openSection, setOpenSection] = useState("");
  const [chordSource, setChordSource] = useState("library");
  const [selectedSourceChordId, setSelectedSourceChordId] = useState("");
  const [manualInputOpen, setManualInputOpen] = useState(false);
  const [instrumentMenuOpen, setInstrumentMenuOpen] = useState(false);
  const [expandedInstrumentGroup, setExpandedInstrumentGroup] = useState(null);
  const [tuningMenuOpen, setTuningMenuOpen] = useState(false);
  const [chordsMenuOpen, setChordsMenuOpen] = useState(false);
  const [chordsSection, setChordsSection] = useState("presets");
  const [customTuningOpen, setCustomTuningOpen] = useState(false);
  const [customTuningName, setCustomTuningName] = useState("");
  const exportInstrumentStringCount = Math.max(1, Number(currentInstrument?.stringCount) || 0);
  const defaultLowToHigh = useMemo(() => {
    const next = Array.isArray(tuning) ? [...tuning].reverse() : [];
    return normalizeNoteArray(next, exportInstrumentStringCount);
  }, [tuning, exportInstrumentStringCount]);
  const [customTuningLowToHigh, setCustomTuningLowToHigh] = useState(() => defaultLowToHigh);
  const EXPORT_SECTION_GAP = 12;
  const EXPORT_CARD_HEIGHT = "calc(100% - 42px)";
  const PREVIEW_CARD_PADDING = 12;
  const PREVIEW_SURFACE_PADDING = 12;
  const initialLowToHigh = defaultLowToHigh;
  const filteredAvailableTunings =
    Array.isArray(availableChordTunings) && availableChordTunings.length > 0
      ? availableChordTunings.filter(
          (option) => Array.isArray(option?.lowToHigh) && option.lowToHigh.length === exportInstrumentStringCount
        )
      : [];
  const resolvedAvailableTunings = filteredAvailableTunings.length > 0
    ? filteredAvailableTunings
    : [{ id: "standard", name: "Standard", lowToHigh: initialLowToHigh }];
  const initialExportTuning =
    resolvedAvailableTunings.find((option) => (option.lowToHigh || []).join("|") === initialLowToHigh.join("|")) ||
    resolvedAvailableTunings[0];
  const [selectedTuningOption, setSelectedTuningOption] = useState(initialExportTuning);
  const exportLowToHigh = normalizeNoteArray(selectedTuningOption?.lowToHigh, exportInstrumentStringCount);
  const exportTuningName = String(selectedTuningOption?.name || tuningLabel || "Custom");
  const tuningLabels = [...exportLowToHigh];
  const manualInputLabels = [...exportLowToHigh].reverse();
  const supportsPresetChords = Boolean(chordToolEnabled) && String(instrumentId || "") === "gtr6" && tuningLabels.length === 6;
  const currentTuningId = buildTuningId(instrumentId, exportLowToHigh);
  const currentTuningIsStandard =
    String(instrumentId || "") === "gtr6" &&
    exportLowToHigh.length === 6 &&
    exportLowToHigh.every((note, index) => String(note || "").trim().toUpperCase() === ["E", "A", "D", "G", "B", "E"][index]);
  const tuningPresetChords = currentTuningIsStandard ? (Array.isArray(sharedStandardPresetChords) ? sharedStandardPresetChords : []) : [];
  const tuningUserChords = useMemo(
    () =>
      (Array.isArray(allUserChords) ? allUserChords : []).filter((chord) => {
        const tuningId = String(chord?.tuningId || "");
        if (tuningId) return tuningId === currentTuningId;
        return currentTuningIsStandard;
      }),
    [allUserChords, currentTuningId, currentTuningIsStandard]
  );
  const sharedChordOptions = useMemo(
    () => [
      ...tuningPresetChords.map((chord) => ({ ...chord, sourceType: "preset" })),
      ...tuningUserChords.map((chord) => ({ ...chord, sourceType: "custom" })),
    ],
    [tuningPresetChords, tuningUserChords]
  );
  const normalizedChordName = sanitizeChordName(chordName);
  const svgMarkup = useMemo(
    () =>
      buildChordDiagramSvgMarkup({
        chordName: normalizedChordName || "Chord",
        stringFrets,
        tuningLabels,
        stringCount: exportInstrumentStringCount,
        imageThickness: diagramThickness,
        lineColor: normalizeHexColorOrFallback(diagramLineColor, "#ffffff"),
        backgroundMode: diagramBgMode,
        backgroundColor: normalizeHexColorOrFallback(diagramBgColor, "#ffffff"),
        includeChordName: showDiagramChordName,
        includeLabels: showDiagramTuning,
        brandingText: includeBranding ? exportBrandingText : "",
      }),
    [
      chordName,
      stringFrets,
      tuningLabels,
      diagramThickness,
      normalizeHexColorOrFallback,
      diagramLineColor,
      diagramBgMode,
      diagramBgColor,
      normalizedChordName,
      exportInstrumentStringCount,
      showDiagramChordName,
      showDiagramTuning,
      includeBranding,
      exportBrandingText,
    ]
  );
  const previewMarkup = useMemo(
    () =>
      svgMarkup.replace(
        "<svg ",
        '<svg preserveAspectRatio="xMidYMid meet" width="100%" height="100%" '
      ),
    [svgMarkup]
  );
  const diagramExportSizeLabel = useMemo(
    () => PNG_EXPORT_SIZE_OPTIONS.find((option) => option.value === diagramExportSize)?.label || "Original Size",
    [diagramExportSize]
  );

  useEffect(() => {
    setOpenSection("");
  }, [resetOnOpenKey]);

  useEffect(() => {
    if (instrumentMenuOpen) {
      setExpandedInstrumentGroup(null);
    }
  }, [instrumentMenuOpen]);

  useEffect(() => {
    setSelectedTuningOption((current) => {
      const nextMatch =
        resolvedAvailableTunings.find((option) => String(option?.id || "") === String(current?.id || "")) ||
        resolvedAvailableTunings.find((option) => (option.lowToHigh || []).join("|") === initialLowToHigh.join("|")) ||
        resolvedAvailableTunings[0];
      return nextMatch || current;
    });
    setStringFrets((current) => normalizeFretArray(current, exportInstrumentStringCount));
    setCustomTuningLowToHigh((current) => {
      if (!current.length || current.length !== exportInstrumentStringCount) return defaultLowToHigh;
      return normalizeNoteArray(current, exportInstrumentStringCount);
    });
  }, [initialLowToHigh, resolvedAvailableTunings, exportInstrumentStringCount, defaultLowToHigh]);

  useEffect(() => {
    if (chordSource === "manual") return;
    if (sharedChordOptions.length === 0) {
      setSelectedSourceChordId("");
      setChordName("");
      setStringFrets(createEmptyStringFrets(exportInstrumentStringCount));
      return;
    }
    if (sharedChordOptions.some((chord) => chord.id === selectedSourceChordId)) return;
    setSelectedSourceChordId(sharedChordOptions[0].id);
  }, [chordSource, selectedSourceChordId, sharedChordOptions, exportInstrumentStringCount]);

  useEffect(() => {
    saveChordDiagramPrefs?.({
      backgroundMode: diagramBgMode,
      backgroundColor: normalizeHexColorOrFallback(diagramBgColor, "#ffffff"),
      lineColor: normalizeHexColorOrFallback(diagramLineColor, "#ffffff"),
      textColor: normalizeHexColorOrFallback(diagramLineColor, "#ffffff"),
      lineThickness: diagramThickness,
      exportSize: diagramExportSize,
      exportPadding: diagramExportPadding,
      showChordName: showDiagramChordName,
      showTuning: showDiagramTuning,
    });
  }, [
    diagramBgMode,
    diagramBgColor,
    diagramLineColor,
    diagramThickness,
    diagramExportSize,
    diagramExportPadding,
    showDiagramChordName,
    showDiagramTuning,
    normalizeHexColorOrFallback,
    saveChordDiagramPrefs,
  ]);

  useEffect(() => {
    if (chordSource !== "library") return;
    const chord = sharedChordOptions.find((entry) => entry.id === selectedSourceChordId);
    if (!chord) return;
    setChordName(String(chord.name || ""));
    if (Array.isArray(chord.frets) && chord.frets.length === exportInstrumentStringCount) {
      setStringFrets(normalizeFretArray(chord.frets, exportInstrumentStringCount));
      return;
    }
    setStringFrets(createEmptyStringFrets(exportInstrumentStringCount));
    setStatusText(`"${String(chord.name || "Chord")}" does not match the current ${exportInstrumentStringCount}-string instrument.`);
  }, [chordSource, selectedSourceChordId, sharedChordOptions, exportInstrumentStringCount]);

  const handleFretChange = (index, value) => {
    const nextValue = sanitizeFretValue(value);
    setStringFrets((current) => {
      const next = current.slice();
      next[index] = nextValue;
      return next;
    });
  };

  const exportPng = () => {
    if (!normalizedChordName) {
      setStatusText("Enter a chord name before exporting.");
      return;
    }
    const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const originalWidth = DIAGRAM_WIDTH * 2;
      const originalHeight = DIAGRAM_HEIGHT * 2;
      const padding = getPngExportPaddingPixels(diagramExportPadding);
      const targetWidth = getPngExportTargetWidth(diagramExportSize) || originalWidth;
      const innerWidth = Math.max(1, targetWidth - padding.x * 2);
      const scale = innerWidth / originalWidth;
      canvas.width = Math.max(1, Math.round(targetWidth));
      canvas.height = Math.max(1, Math.round(originalHeight * scale + padding.y * 2));
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        setStatusText("Unable to prepare PNG export.");
        return;
      }
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, padding.x, padding.y, canvas.width - padding.x * 2, canvas.height - padding.y * 2);
      const downloadUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const safeName = (normalizedChordName || "chord").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "chord";
      link.href = downloadUrl;
      link.download = `${safeName}-diagram.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setStatusText(`Exported ${normalizedChordName}-diagram.png`);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setStatusText("Unable to export diagram PNG.");
    };
    image.src = url;
  };

  const saveManualChord = () => {
    if (chordSource !== "manual") return;
    const id = saveCustomChordToLibrary(normalizedChordName, stringFrets, {
      selectSavedChord: false,
      instrumentId,
      tuningId: currentTuningId,
      tuningName: exportTuningName,
      stringCount: exportInstrumentStringCount,
    });
    if (!id) {
      setStatusText("Enter a chord name and shape before saving to your chord library.");
      return false;
    }
    setStatusText(`Saved ${normalizedChordName} to chords for ${exportTuningName}.`);
    setSelectedSourceChordId(id);
    setChordSource("library");
    setManualInputOpen(false);
    return true;
  };

  const saveExportTuning = () => {
    const next = saveChordExportTuning(customTuningName, customTuningLowToHigh);
    if (!next) {
      setStatusText(`Enter a tuning name and ${exportInstrumentStringCount} notes before saving a custom tuning.`);
      return;
    }
    setSelectedTuningOption(next);
    setCustomTuningOpen(false);
    setCustomTuningName("");
    setCustomTuningLowToHigh(defaultLowToHigh);
    setStatusText(`Saved ${next.name} tuning for chord diagrams.`);
  };

  const renderSectionToggle = (active, label, onClick) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...microButton,
        height: 34,
        borderColor: active ? withAlpha(THEME.accent, 0.74) : THEME.border,
        background: active ? withAlpha(THEME.accent, THEME.isDark ? 0.14 : 0.09) : THEME.surfaceWarm,
        color: active ? THEME.text : THEME.textFaint,
        boxShadow: active ? `0 0 0 1px ${withAlpha(THEME.accent, THEME.isDark ? 0.16 : 0.1)}` : "none",
      }}
    >
      {label}
    </button>
  );

  const exportPrimaryButtonStyle = ({ disabled = false, hovered = false } = {}) => ({
    ...primaryButton,
    width: "100%",
    borderColor: withAlpha(THEME.accent, 0.74),
    background: hovered && !disabled ? withAlpha(THEME.accent, THEME.isDark ? 0.12 : 0.08) : THEME.surfaceWarm,
    color: disabled ? withAlpha(THEME.text, 0.4) : THEME.text,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: hovered && !disabled ? `inset 0 0 0 1px ${withAlpha(THEME.accent, THEME.isDark ? 0.22 : 0.16)}` : `0 0 0 1px ${withAlpha(THEME.accent, THEME.isDark ? 0.16 : 0.1)}`,
    transition: "border-color 120ms ease, background 120ms ease, color 120ms ease, box-shadow 120ms ease, opacity 120ms ease",
    fontWeight: 900,
  });

  const choiceButtonStyle = (active, hovered = false, { height = 34 } = {}) => ({
    ...microButton,
    height,
    borderColor: active ? withAlpha(THEME.accent, 0.74) : hovered ? withAlpha(THEME.accent, 0.42) : THEME.border,
    color: active ? THEME.text : THEME.textFaint,
    background: active ? withAlpha(THEME.accent, THEME.isDark ? 0.09 : 0.06) : THEME.surfaceWarm,
    boxShadow: active ? `inset 0 0 0 1px ${withAlpha(THEME.accent, THEME.isDark ? 0.18 : 0.12)}` : "none",
  });

  const accordionTriggerStyle = (key, open) => ({
    ...field,
    width: "100%",
    ...metadataFieldInteraction(THEME, withAlpha, { focused: open, hovered: accordionHoverKey === key && !open }),
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    textAlign: "left",
    cursor: "pointer",
    position: "relative",
    paddingRight: 40,
  });

  const accordionLabelStyle = metadataTriggerText(THEME, withAlpha);
  const largeMenuPanelStyle = menuPanelLarge(THEME);
  const compactTriggerStyle = menuTriggerCompact(THEME);
  const toolbarControlTextStyle = toolbarControlText();
  const modalOverlayStyle = modalOverlay({ background: "rgba(0,0,0,0.35)", zIndex: 5000, padding: 16 });
  const modalCardStyle = modalCard(THEME, { width: 520, maxWidth: "min(520px, calc(100vw - 32px))" });
  const modalHeaderStyle = modalHeader({ marginBottom: 8 });
  const modalCloseStyle = modalCloseButton(THEME);
  const tuningMenuItemStyle = menuItem(THEME);
  const tuningMenuItemSelectedStyle = menuItemSelected(THEME);
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
  const chordCustomMenuItemStyle = menuItem(THEME, { padding: "0 10px", borderRadius: 12, height: 38 });
  const chordCustomSelectedMenuItemStyle = menuItemSelected(THEME, {
    padding: "0 10px",
    borderRadius: 12,
    height: 38,
    borderColor: withAlpha(THEME.accent, 0.75),
    background: withAlpha(THEME.accent, 0.1),
    color: THEME.accent,
    boxShadow: `inset 0 0 0 1px ${withAlpha(THEME.accent, 0.22)}`,
  });
  const checkboxRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minHeight: 30,
    fontSize: 13,
    color: THEME.text,
    cursor: "pointer",
    userSelect: "none",
  };
  const checkboxVisualStyle = (checked) => ({
    width: 18,
    height: 18,
    borderRadius: 6,
    border: `1px solid ${checked ? withAlpha(THEME.accent, 0.82) : THEME.border}`,
    background: checked ? withAlpha(THEME.accent, THEME.isDark ? 0.24 : 0.14) : THEME.surfaceWarm,
    color: checked ? THEME.text : "transparent",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 900,
    lineHeight: 1,
    flexShrink: 0,
    boxShadow: checked ? `0 0 0 1px ${withAlpha(THEME.accent, THEME.isDark ? 0.16 : 0.1)}` : "none",
  });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(340px, 420px) minmax(0, 1fr)",
        gap: EXPORT_SECTION_GAP,
        minHeight: 0,
        height: "100%",
      }}
    >
      <div
        style={{
          ...denseCard,
          display: "grid",
          gridTemplateRows: "minmax(0,1fr) auto",
          gap: 14,
          minHeight: 0,
          height: EXPORT_CARD_HEIGHT,
          alignSelf: "start",
          padding: 16,
          overflow: "visible",
        }}
      >
        <div
          style={{
            display: "grid",
            gap: 14,
            minHeight: 0,
            overflowY: instrumentMenuOpen || tuningMenuOpen || chordsMenuOpen ? "visible" : "auto",
            overflowX: "visible",
            paddingRight: 4,
            alignContent: "start",
            position: "relative",
            zIndex: instrumentMenuOpen || tuningMenuOpen || chordsMenuOpen ? 20 : "auto",
          }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            {headerContent}
            <div style={{ display: "grid", gap: 10, alignItems: "start" }}>
              <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
                <div style={{ position: "relative", minWidth: 0, flex: 1 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setInstrumentMenuOpen((current) => !current);
                      setTuningMenuOpen(false);
                      setChordsMenuOpen(false);
                    }}
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
                      borderColor: instrumentMenuOpen ? THEME.accent : THEME.border,
                      boxShadow: instrumentMenuOpen ? `0 0 0 3px ${withAlpha(THEME.accent, 0.16)}` : "none",
                      gap: 10,
                      position: "relative",
                      paddingRight: 40,
                    }}
                  >
                    <span style={{ minWidth: 0, fontWeight: 800 }}>
                      {currentInstrument ? `${currentInstrument.stringCount} String ${currentInstrument.group}` : "Instrument"}
                    </span>
                    <ExportChevron open={instrumentMenuOpen} color={THEME.text} anchored />
                  </button>
                  {instrumentMenuOpen ? (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        left: 0,
                        zIndex: 2000,
                        width: "100%",
                        maxHeight: "min(680px, calc(100vh - 180px))",
                        ...largeMenuPanelStyle,
                        display: "grid",
                        gridTemplateRows: "auto minmax(0,1fr)",
                        gap: 8,
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ fontWeight: 950, fontSize: 18 }}>Instruments</div>
                        <button type="button" onClick={() => setInstrumentMenuOpen(false)} style={{ ...microButton }}>
                          Close
                        </button>
                      </div>
                      <div style={{ maxHeight: 420, overflowY: "auto", paddingRight: 4, display: "grid", gap: 6 }}>
                        {[
                          { group: "Favourites", items: Array.isArray(favouriteInstruments) ? favouriteInstruments : [], isFavourites: true },
                          ...((Array.isArray(groupedInstruments) ? groupedInstruments : []).map((group) => ({ ...group, isFavourites: false }))),
                        ].map(({ group, items, isFavourites }) => {
                          const expanded = expandedInstrumentGroup === group;
                          return (
                            <div key={group} style={{ marginBottom: 6 }}>
                              <button
                                type="button"
                                onClick={() => setExpandedInstrumentGroup((prev) => (prev === group ? null : group))}
                                style={{
                                  ...btnSecondary,
                                  width: "100%",
                                  height: 42,
                                  padding: "0 10px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  borderRadius: 12,
                                  borderColor: expanded ? THEME.accent : THEME.border,
                                  background: THEME.surfaceWarm,
                                  cursor: "pointer",
                                  fontSize: 16,
                                  lineHeight: 1,
                                  fontWeight: 900,
                                  color: THEME.text,
                                  boxSizing: "border-box",
                                  boxShadow: expanded ? `inset 0 0 0 1px ${withAlpha(THEME.accent, 0.22)}` : "none",
                                }}
                              >
                                <span>{group}</span>
                                <span style={{ fontSize: 13, opacity: 0.95 }}>{expanded ? "▲" : "▼"}</span>
                              </button>
                              {expanded ? (
                                <div style={{ display: "grid", gap: 6, padding: "6px 4px 2px" }}>
                                  {isFavourites && items.length === 0 ? (
                                    <div
                                      style={{
                                        fontSize: 12,
                                        color: THEME.textFaint,
                                        lineHeight: 1.4,
                                        fontWeight: 700,
                                        padding: "10px 10px 12px",
                                        border: `1px solid ${THEME.border}`,
                                        borderRadius: 12,
                                        background: THEME.surfaceWarm,
                                      }}
                                    >
                                      You haven&apos;t added any favourites yet. Click the star next to an instrument to add it here.
                                    </div>
                                  ) : (
                                    items.map((inst) => {
                                      const active = inst.id === instrumentId;
                                      const fav = Array.isArray(favInstrumentIds) && favInstrumentIds.includes(inst.id);
                                      return (
                                        <div
                                          key={inst.id}
                                          style={{
                                            display: "grid",
                                            gridTemplateColumns: "minmax(0,1fr) auto",
                                            gap: 6,
                                            alignItems: "center",
                                          }}
                                        >
                                          <button
                                            type="button"
                                            className={editorOptionClass}
                                            aria-selected={active}
                                            onClick={() => {
                                              handleInstrumentChange?.(inst.id);
                                              setInstrumentMenuOpen(false);
                                              setTuningMenuOpen(false);
                                              setChordsMenuOpen(false);
                                              setSelectedSourceChordId("");
                                              setChordSource("library");
                                              setManualInputOpen(false);
                                            }}
                                            style={{
                                              ...(active
                                                ? menuItemSelected(THEME, {
                                                    padding: "9px 10px",
                                                    borderRadius: 12,
                                                    fontWeight: 800,
                                                    fontSize: 13,
                                                    color: THEME.accent,
                                                    boxShadow: `inset 0 0 0 1px ${withAlpha(THEME.accent, 0.2)}`,
                                                  })
                                                : menuItem(THEME, {
                                                    padding: "9px 10px",
                                                    borderRadius: 12,
                                                    fontWeight: 800,
                                                    fontSize: 13,
                                                  })),
                                              gap: 8,
                                            }}
                                          >
                                            <span>{`${inst.stringCount} String ${inst.group}`}</span>
                                            {isFavourites ? (
                                              <span />
                                            ) : (
                                              <span style={{ fontSize: 12, color: THEME.textFaint, fontWeight: 800 }}>
                                                {inst.stringCount} strings
                                              </span>
                                            )}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => toggleFavouriteInstrument?.(inst.id)}
                                            style={{
                                              width: 28,
                                              height: 28,
                                              border: `1px solid ${THEME.border}`,
                                              borderRadius: 8,
                                              background: "transparent",
                                              cursor: "pointer",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              padding: 0,
                                              opacity: fav ? 1 : 0.9,
                                            }}
                                            title={fav ? "Remove from favourites" : "Add to favourites"}
                                          >
                                            <span
                                              style={{
                                                color: fav ? THEME.starActive : THEME.textFaint,
                                                fontSize: 16,
                                              }}
                                            >
                                              {fav ? "★" : "☆"}
                                            </span>
                                          </button>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div style={{ position: "relative", minWidth: 0, flex: 1 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setTuningMenuOpen((current) => !current);
                      setInstrumentMenuOpen(false);
                      setChordsMenuOpen(false);
                    }}
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
                    borderColor: tuningMenuOpen ? THEME.accent : THEME.border,
                    boxShadow: tuningMenuOpen ? `0 0 0 3px ${withAlpha(THEME.accent, 0.16)}` : "none",
                    gap: 10,
                    position: "relative",
                    paddingRight: 40,
                    }}
                  >
                    <span style={{ minWidth: 0, fontWeight: 800 }}>
                      {exportTuningName}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", marginLeft: "auto", paddingRight: 20 }}>
                      <span style={{ color: THEME.textFaint, fontSize: 12, opacity: 0.72, fontWeight: 900, whiteSpace: "nowrap" }}>
                        {formatLowToHighString(exportLowToHigh)}
                      </span>
                    </span>
                    <ExportChevron open={tuningMenuOpen} color={THEME.text} anchored />
                  </button>
                  {tuningMenuOpen ? (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        left: 0,
                        zIndex: 2000,
                        width: "100%",
                        maxHeight: "min(680px, calc(100vh - 180px))",
                        ...largeMenuPanelStyle,
                        display: "grid",
                        gridTemplateRows: "auto minmax(0,1fr) auto",
                        gap: 8,
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ fontWeight: 950, fontSize: 18 }}>Tunings</div>
                        <button type="button" onClick={() => setTuningMenuOpen(false)} style={{ ...microButton }}>
                          Close
                        </button>
                      </div>
                      <div style={{ maxHeight: 420, overflowY: "auto", paddingRight: 4, display: "grid", gap: 6 }}>
                        {resolvedAvailableTunings.map((option) => {
                          const active = String(option?.id || "") === String(selectedTuningOption?.id || "");
                          const optionLabels = formatLowToHighString(option.lowToHigh);
                          return (
                            <div
                              key={option.id}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr auto",
                                gap: 8,
                                alignItems: "center",
                              }}
                            >
                              <button
                                type="button"
                                className={editorOptionClass}
                                aria-selected={active}
                                onClick={() => {
                                  setSelectedTuningOption(option);
                                  setTuningMenuOpen(false);
                                  setChordsMenuOpen(false);
                                  setSelectedSourceChordId("");
                                  setChordSource("library");
                                  setManualInputOpen(false);
                                }}
                                style={{
                                  ...(active ? tuningMenuItemSelectedStyle : tuningMenuItemStyle),
                                  minWidth: 0,
                                }}
                              >
                                <span>{option.name}</span>
                                <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 900, color: THEME.textFaint }}>{optionLabels}</span>
                              </button>
                              {String(option.id || "").startsWith("user_tuning_") ? <span /> : <span />}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: "grid", gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomTuningName("");
                            setCustomTuningLowToHigh(exportLowToHigh);
                            setCustomTuningOpen(true);
                          }}
                          style={{ ...btnSecondary, width: "fit-content" }}
                        >
                          + Add custom tuning
                        </button>
                        <div style={{ fontSize: 12, color: THEME.textFaint }}>
                          Saved chords and tunings stay grouped by the selected instrument and tuning.
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setChordsMenuOpen((current) => !current);
                      setInstrumentMenuOpen(false);
                      setTuningMenuOpen(false);
                    }}
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
                      height: 42,
                      padding: "0 14px",
                      cursor: "pointer",
                      opacity: 1,
                      borderColor: chordsMenuOpen ? THEME.accent : THEME.border,
                      boxShadow: chordsMenuOpen ? `0 0 0 3px ${withAlpha(THEME.accent, 0.16)}` : "none",
                      color: THEME.text,
                      gap: 10,
                      position: "relative",
                      paddingRight: 40,
                    }}
                  >
                    <span style={{ flex: 1, textAlign: "left", fontWeight: 800 }}>Chords</span>
                    <ExportChevron open={chordsMenuOpen} color={THEME.text} anchored />
                  </button>
                  {chordsMenuOpen ? (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        left: 0,
                        zIndex: 2000,
                        width: "min(860px, calc(100vw - 120px))",
                        maxHeight: "min(620px, calc(100vh - 220px))",
                        ...largeMenuPanelStyle,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ display: "grid", gap: 4 }}>
                          <div style={{ fontWeight: 950 }}>Chord tools</div>
                          <div style={{ fontSize: 12, color: THEME.textFaint }}>
                            Use shared chord presets and saved chord shapes for the current tuning. Selecting a chord loads it into
                            the diagram preview.
                          </div>
                        </div>
                        <button type="button" onClick={() => setChordsMenuOpen(false)} style={{ ...microButton }}>
                          Close
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
                        >
                          {chordsSection === "presets"
                            ? tuningPresetChords.length === 0
                              ? (
                                <div style={{ gridColumn: "1 / -1", fontSize: 12, color: THEME.textFaint, padding: "6px 2px" }}>
                                  No shared preset chords are available for this instrument and tuning yet.
                                </div>
                              )
                              : tuningPresetChords.map((chord) => {
                                const selected = selectedSourceChordId === chord.id;
                                return (
                                  <button
                                    key={chord.id}
                                    type="button"
                                    onClick={() => {
                                      setChordSource("library");
                                      setSelectedSourceChordId(chord.id);
                                      setChordsMenuOpen(false);
                                      setManualInputOpen(false);
                                    }}
                                    style={{
                                      ...(selected ? chordSelectedMenuItemStyle : chordMenuItemStyle),
                                      justifyContent: "flex-start",
                                      gap: 8,
                                      width: "100%",
                                    }}
                                  >
                                    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {chord.name}
                                    </span>
                                  </button>
                                );
                              })
                            : tuningUserChords.length === 0
                              ? (
                                <div style={{ gridColumn: "1 / -1", fontSize: 12, color: THEME.textFaint, padding: "6px 2px" }}>
                                  No saved chords yet for this tuning.
                                </div>
                              )
                              : tuningUserChords.map((chord) => {
                                  const selected = selectedSourceChordId === chord.id;
                                  return (
                                    <button
                                      key={chord.id}
                                      type="button"
                                      onClick={() => {
                                        setChordSource("library");
                                        setSelectedSourceChordId(chord.id);
                                        setChordsMenuOpen(false);
                                        setManualInputOpen(false);
                                      }}
                                      style={{
                                        ...(selected ? chordCustomSelectedMenuItemStyle : chordCustomMenuItemStyle),
                                        justifyContent: "flex-start",
                                        gap: 8,
                                        width: "100%",
                                      }}
                                    >
                                      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {chord.name}
                                      </span>
                                    </button>
                                  );
                                })}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setOpenSection((current) => (current === "export" ? "" : "export"))}
              onPointerEnter={() => setAccordionHoverKey("export")}
              onPointerLeave={() => setAccordionHoverKey((current) => (current === "export" ? "" : current))}
              style={accordionTriggerStyle("export", openSection === "export")}
            >
              <span style={accordionLabelStyle}>Export Settings</span>
              <ExportChevron open={openSection === "export"} color={THEME.text} anchored />
            </button>
            {openSection === "export" ? (
              <div style={{ ...panelStyle, marginTop: 8, display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 12, color: THEME.textFaint }}>Size</div>
                  <ExportCompactSelect
                    value={diagramExportSize}
                    options={PNG_EXPORT_SIZE_OPTIONS}
                    onChange={setDiagramExportSize}
                    THEME={THEME}
                    withAlpha={withAlpha}
                    width="100%"
                  />
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 12, color: THEME.textFaint }}>Padding</div>
                  <ExportCompactSelect
                    value={diagramExportPadding}
                    options={PNG_EXPORT_PADDING_OPTIONS}
                    onChange={setDiagramExportPadding}
                    THEME={THEME}
                    withAlpha={withAlpha}
                    width="100%"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setOpenSection((current) => (current === "display" ? "" : "display"))}
              onPointerEnter={() => setAccordionHoverKey("display")}
              onPointerLeave={() => setAccordionHoverKey((current) => (current === "display" ? "" : current))}
              style={accordionTriggerStyle("display", openSection === "display")}
            >
              <span style={accordionLabelStyle}>Display Settings</span>
              <ExportChevron open={openSection === "display"} color={THEME.text} anchored />
            </button>
            {openSection === "display" ? (
              <div style={{ ...panelStyle, marginTop: 8, display: "grid", gap: 10 }}>
                <div style={{ fontSize: 12, color: THEME.textFaint }}>To display:</div>
                <label style={{ ...checkboxRowStyle, cursor: exportBrandingLocked ? "not-allowed" : "pointer", opacity: exportBrandingLocked ? 0.72 : 1 }}>
                  <input
                    type="checkbox"
                    checked={showDiagramChordName}
                    onChange={(event) => setShowDiagramChordName(event.target.checked)}
                    style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 1, height: 1 }}
                  />
                  <span aria-hidden="true" style={checkboxVisualStyle(showDiagramChordName)}>✓</span>
                  <span>Chord Name</span>
                </label>
                <label style={checkboxRowStyle}>
                  <input
                    type="checkbox"
                    checked={showDiagramTuning}
                    onChange={(event) => setShowDiagramTuning(event.target.checked)}
                    style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 1, height: 1 }}
                  />
                  <span aria-hidden="true" style={checkboxVisualStyle(showDiagramTuning)}>✓</span>
                  <span>Tuning</span>
                </label>
              </div>
            ) : null}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setOpenSection((current) => (current === "text" ? "" : "text"))}
              onPointerEnter={() => setAccordionHoverKey("text")}
              onPointerLeave={() => setAccordionHoverKey((current) => (current === "text" ? "" : current))}
              style={accordionTriggerStyle("text", openSection === "text")}
            >
              <span style={accordionLabelStyle}>Text Settings</span>
              <ExportChevron open={openSection === "text"} color={THEME.text} anchored />
            </button>
            {openSection === "text" ? (
              <div style={{ ...panelStyle, marginTop: 8, display: "grid", gap: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: THEME.textFaint }}>
                  Line / text color
                  <input
                    type="color"
                    value={normalizeHexColorOrFallback(diagramLineColor, "#ffffff")}
                    onChange={(event) => setDiagramLineColor(event.target.value)}
                    style={{ width: 38, height: 26, padding: 0, border: "none", background: "transparent" }}
                  />
                </label>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: THEME.text }}>Line thickness</div>
                  <div style={{ fontSize: 12, color: THEME.textFaint }}>Choose the line weight for chord diagrams.</div>
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {[
                    { id: "A", title: "Thin", detail: "lighter print lines" },
                    { id: "B", title: "Medium", detail: "balanced default weight" },
                    { id: "C", title: "Bold", detail: "heavier print lines" },
                  ].map(({ id, title, detail }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDiagramThickness(id)}
                      onPointerEnter={() => setButtonHoverKey(`thickness-${id}`)}
                      onPointerLeave={() => setButtonHoverKey((current) => (current === `thickness-${id}` ? "" : current))}
                      style={{
                        ...choiceButtonStyle(diagramThickness === id, buttonHoverKey === `thickness-${id}`, { height: 46 }),
                        fontFamily:
                          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        letterSpacing: "0.01em",
                        justifyItems: "center",
                      }}
                    >
                      <span
                        style={{
                          display: "grid",
                          gap: 1,
                          textAlign: "center",
                          lineHeight: 1.05,
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: thicknessFontWeightFor(id) }}>{title}</span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: diagramThickness === id ? THEME.text : THEME.textFaint,
                            letterSpacing: "0.005em",
                          }}
                        >
                          {detail}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setOpenSection((current) => (current === "background" ? "" : "background"))}
              onPointerEnter={() => setAccordionHoverKey("background")}
              onPointerLeave={() => setAccordionHoverKey((current) => (current === "background" ? "" : current))}
              style={accordionTriggerStyle("background", openSection === "background")}
            >
              <span style={accordionLabelStyle}>Background Settings</span>
              <ExportChevron open={openSection === "background"} color={THEME.text} anchored />
            </button>
            {openSection === "background" ? (
              <div style={{ ...panelStyle, marginTop: 8, display: "grid", gap: 10 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {renderSectionToggle(diagramBgMode === "transparent", "Transparent", () => setDiagramBgMode("transparent"))}
                  {renderSectionToggle(diagramBgMode === "solid", "Solid Color", () => setDiagramBgMode("solid"))}
                </div>
                {diagramBgMode === "solid" ? (
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: THEME.textFaint }}>
                    Background color
                    <input
                      type="color"
                      value={normalizeHexColorOrFallback(diagramBgColor, "#ffffff")}
                      onChange={(event) => setDiagramBgColor(event.target.value)}
                      style={{ width: 38, height: 26, padding: 0, border: "none", background: "transparent" }}
                    />
                  </label>
                ) : null}
              </div>
            ) : null}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setOpenSection((current) => (current === "branding" ? "" : "branding"))}
              onPointerEnter={() => setAccordionHoverKey("branding")}
              onPointerLeave={() => setAccordionHoverKey((current) => (current === "branding" ? "" : current))}
              style={accordionTriggerStyle("branding", openSection === "branding")}
            >
              <span style={accordionLabelStyle}>Branding</span>
              <ExportChevron open={openSection === "branding"} color={THEME.text} anchored />
            </button>
            {openSection === "branding" ? (
              <div style={{ ...panelStyle, marginTop: 8, display: "grid", gap: 10 }}>
                <label style={checkboxRowStyle}>
                  <input
                    type="checkbox"
                    checked={includeBranding}
                    disabled={exportBrandingLocked}
                    onChange={(event) => setIncludeBranding(event.target.checked)}
                    style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 1, height: 1 }}
                  />
                  <span aria-hidden="true" style={checkboxVisualStyle(includeBranding)}>✓</span>
                  <span>Include TabStudio link</span>
                </label>
                {exportBrandingLocked ? <div style={{ fontSize: 11, color: THEME.textFaint }}>Included on Band exports</div> : null}
                {hasAffiliateBranding ? (
                  <label style={{ ...checkboxRowStyle, cursor: includeBranding ? "pointer" : "not-allowed", opacity: includeBranding ? 1 : 0.55 }}>
                    <input
                      type="checkbox"
                      checked={useAffiliateBranding}
                      disabled={!includeBranding}
                      onChange={(event) => setUseAffiliateBranding(event.target.checked)}
                      style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 1, height: 1 }}
                    />
                    <span aria-hidden="true" style={checkboxVisualStyle(includeBranding && useAffiliateBranding)}>✓</span>
                    <span>Use my affiliate link</span>
                  </label>
                ) : null}
                {includeBranding ? <div style={{ fontSize: 11, color: THEME.textFaint }}>{exportBrandingText}</div> : null}
              </div>
            ) : null}
          </div>

        </div>

        <div style={{ display: "grid", gap: 8, marginTop: "auto", alignSelf: "end", paddingTop: 4 }}>
          <div style={{ fontSize: 12, color: THEME.textFaint, minHeight: 16 }}>{statusText}</div>
          <button
            type="button"
            onClick={exportPng}
            onPointerEnter={() => setButtonHoverKey("export")}
            onPointerLeave={() => setButtonHoverKey((current) => (current === "export" ? "" : current))}
            style={exportPrimaryButtonStyle({ hovered: buttonHoverKey === "export" })}
          >
            Export PNG
          </button>
        </div>
      </div>

          <div style={{ display: "grid", minHeight: 0, height: EXPORT_CARD_HEIGHT, alignSelf: "start" }}>
            <div
              style={{
                ...denseCard,
                display: "grid",
                gridTemplateRows: "auto minmax(0, 1fr)",
                gap: 8,
                minHeight: 0,
                height: "100%",
                padding: 12,
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "grid", gap: 2 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: THEME.textFaint }}>
                    {`Diagram Preview (${diagramExportSizeLabel})`}
                  </div>
                  <div style={{ fontSize: 12, color: THEME.textFaint }}>
                    {normalizedChordName ? `${exportTuningName} tuning • ${normalizedChordName}` : `${exportTuningName} tuning`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setManualInputOpen((current) => {
                      const next = !current;
                      if (next) {
                        setChordName("");
                        setStringFrets(createEmptyStringFrets(exportInstrumentStringCount));
                      }
                      setChordSource(next ? "manual" : "library");
                      return next;
                    });
                    setChordsMenuOpen(false);
                    setTuningMenuOpen(false);
                  }}
                  style={{
                    ...microButton,
                    height: 34,
                    flexShrink: 0,
                    borderColor: manualInputOpen ? withAlpha(THEME.accent, 0.74) : THEME.border,
                    background: manualInputOpen ? withAlpha(THEME.accent, THEME.isDark ? 0.14 : 0.09) : THEME.surfaceWarm,
                    color: manualInputOpen ? THEME.text : THEME.textFaint,
                  }}
                >
                  Manual Input
                </button>
              </div>
              <div
                style={{
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 12,
                  minHeight: 0,
                  height: "100%",
                  padding: PREVIEW_SURFACE_PADDING,
                  boxSizing: "border-box",
                  background: THEME.surface,
                  display: "grid",
                  placeItems: "center",
                  overflow: "auto",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: 240,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: "min(100%, 420px)",
                      height: "min(100%, 520px)",
                      maxWidth: "100%",
                      maxHeight: "100%",
                      borderRadius: 10,
                      border: `1px solid ${withAlpha(THEME.accent, 0.4)}`,
                      boxShadow: `0 14px 28px ${withAlpha("#000000", THEME.isDark ? 0.28 : 0.14)}`,
                      overflow: "hidden",
                      ...(diagramBgMode === "transparent"
                        ? getTransparentPreviewSurface(normalizeHexColorOrFallback(diagramLineColor, "#ffffff"))
                        : { background: normalizeHexColorOrFallback(diagramBgColor, "#ffffff") }),
                    }}
                  >
                    <SvgPreview
                      markup={previewMarkup}
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "grid",
                        placeItems: "center",
                        padding: PREVIEW_CARD_PADDING,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {manualInputOpen ? (
            <div
              style={modalOverlayStyle}
              onPointerDown={(event) => {
                if (event.target !== event.currentTarget) return;
                setManualInputOpen(false);
                setChordSource("library");
              }}
            >
              <div
                style={modalCardStyle}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <div style={modalHeaderStyle}>
                  <div>
                    <div style={{ fontWeight: 950, fontSize: 16 }}>Manual chord input</div>
                    <div style={{ fontSize: 12, color: THEME.textFaint, marginTop: 2 }}>
                      Enter a chord name and shape for {exportTuningName}. Use <b>x</b> for muted strings and <b>0</b> for open strings.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setManualInputOpen(false);
                      setChordSource("library");
                    }}
                    style={modalCloseStyle}
                  >
                    Close
                  </button>
                </div>

                <div style={{ display: "grid", gap: 10, marginTop: 6 }}>
                  <input
                    type="text"
                    value={chordName}
                    onChange={(event) => setChordName(event.target.value)}
                    placeholder="Chord Name"
                    style={{
                      ...field,
                      fontWeight: String(chordName || "").trim() ? 800 : 500,
                      fontStyle: String(chordName || "").trim() ? "normal" : "italic",
                      color: THEME.text,
                    }}
                  />

                  <div
                    style={{
                      padding: 10,
                      borderRadius: 14,
                      border: `1px solid ${THEME.border}`,
                      background: THEME.surfaceWarm,
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    {manualInputLabels.map((label, index) => (
                      <div
                        key={`manual-modal-${label}-${index}`}
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 80,
                            fontSize: 12,
                            color: THEME.textFaint,
                            textAlign: "right",
                            fontWeight: 900,
                          }}
                        >
                          {index === 0 ? `High ${label}` : index === tuningLabels.length - 1 ? `Low ${label}` : label}
                        </div>
                        <input
                          type="text"
                          inputMode="text"
                          value={stringFrets[index] ?? ""}
                          onChange={(event) => handleFretChange(index, event.target.value)}
                          onMouseEnter={() => setHoveredStringIndex(index)}
                          onMouseLeave={() => setHoveredStringIndex((current) => (current === index ? -1 : current))}
                          placeholder="x"
                          style={{
                            width: 52,
                            height: 42,
                            borderRadius: 12,
                            border: `1px solid ${hoveredStringIndex === index ? withAlpha(THEME.accent, 0.42) : THEME.border}`,
                            background:
                              hoveredStringIndex === index ? withAlpha(THEME.accent, THEME.isDark ? 0.08 : 0.05) : THEME.surfaceWarm,
                            color: THEME.text,
                            boxSizing: "border-box",
                            textAlign: "center",
                            fontSize: 18,
                            fontWeight: 900,
                            outline: "none",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 12,
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        saveManualChord();
                      }}
                      style={{ ...btnSecondary, height: 38, padding: "0 12px" }}
                    >
                      Save to Chord Library
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setManualInputOpen(false);
                        setChordSource("library");
                      }}
                      style={{ ...btnSecondary, height: 38, padding: "0 12px" }}
                    >
                      Cancel
                    </button>
                  </div>

                  <div style={{ fontSize: 11, color: THEME.textFaint }}>
                    Saved custom chords appear in the shared editor chord list for this tuning.
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          {customTuningOpen ? (
            <div
              style={modalOverlayStyle}
              onPointerDown={(event) => {
                if (event.target !== event.currentTarget) return;
                setCustomTuningOpen(false);
              }}
            >
              <div
                style={modalCardStyle}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <div style={modalHeaderStyle}>
                  <div>
                    <div style={{ fontWeight: 950, fontSize: 16 }}>Add custom tuning</div>
                    <div style={{ fontSize: 12, color: THEME.textFaint, marginTop: 2 }}>
                      Enter a tuning name and {exportInstrumentStringCount} notes. Top field is the high string, bottom field is the low string.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomTuningOpen(false)}
                    style={modalCloseStyle}
                  >
                    Close
                  </button>
                </div>

                <div style={{ display: "grid", gap: 10, marginTop: 6 }}>
                  <input
                    value={customTuningName}
                    onChange={(event) => setCustomTuningName(event.target.value)}
                    placeholder="Custom Tuning Name"
                    style={{
                      ...field,
                      fontWeight: String(customTuningName || "").trim() ? 800 : 500,
                      fontStyle: String(customTuningName || "").trim() ? "normal" : "italic",
                      color: THEME.text,
                    }}
                  />

                  <div
                    style={{
                      padding: 10,
                      borderRadius: 14,
                      border: `1px solid ${THEME.border}`,
                      background: THEME.surfaceWarm,
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    {customTuningLowToHigh.map((note, index) => (
                      <div
                        key={`custom-tuning-modal-${index}`}
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 80,
                            fontSize: 12,
                            color: THEME.textFaint,
                            textAlign: "right",
                            fontWeight: 900,
                          }}
                        >
                          {index === 0
                            ? `High ${customTuningLowToHigh[index] || "String"}`
                            : index === customTuningLowToHigh.length - 1
                              ? `Low ${customTuningLowToHigh[index] || "String"}`
                              : `String ${customTuningLowToHigh.length - index}`}
                        </div>
                        <input
                          value={note}
                          onChange={(event) => {
                            const next = customTuningLowToHigh.slice();
                            next[index] = String(event.target.value || "").trim();
                            setCustomTuningLowToHigh(next);
                          }}
                          placeholder="E"
                          style={{
                            ...field,
                            width: 84,
                            textAlign: "center",
                            fontWeight: String(note || "").trim() ? 800 : 500,
                            fontStyle: String(note || "").trim() ? "normal" : "italic",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 12,
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        saveExportTuning();
                      }}
                      style={{ ...btnSecondary, height: 38, padding: "0 12px" }}
                    >
                      Save Tuning
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomTuningOpen(false)}
                      style={{ ...btnSecondary, height: 38, padding: "0 12px" }}
                    >
                      Cancel
                    </button>
                  </div>

                  <div style={{ fontSize: 11, color: THEME.textFaint }}>
                    Saved custom tunings appear in this export tuning list and stay separated from other tunings.
                  </div>
                </div>
              </div>
            </div>
          ) : null}
    </div>
  );
}
