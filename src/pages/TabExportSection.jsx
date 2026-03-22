import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supportFormFieldClass } from "../utils/uiStyles";
import {
  buttonMicro,
  buttonPrimary,
  cardDense,
  metadataFieldInteraction,
  metadataTriggerText,
  menuPanel,
  modalCardLarge,
  modalCloseButton,
  modalHeader,
  modalOverlay,
} from "../utils/uiTokens";
import {
  PNG_EXPORT_PADDING_OPTIONS,
  PNG_EXPORT_SIZE_OPTIONS,
  getTransparentPreviewSurface,
} from "../features/export/exportHelpers";
import ExportCompactSelect from "../components/export/ExportCompactSelect";
import ExportChevron from "../components/export/ExportChevron";
import FretboardDiagramSection from "./FretboardDiagramSection";

function ExportCheckboxRow({ checked, onChange, children, THEME, withAlpha, disabled = false, trailing = null }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        minHeight: 30,
        fontSize: 12,
        color: disabled ? withAlpha(THEME.text, 0.4) : THEME.textFaint,
        cursor: disabled ? "not-allowed" : "pointer",
        userSelect: "none",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
          width: 1,
          height: 1,
        }}
      />
      <span
        aria-hidden="true"
        style={{
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
          opacity: disabled ? 0.45 : 1,
        }}
      >
        ✓
      </span>
      <span style={{ flex: 1, minWidth: 0, color: disabled ? withAlpha(THEME.text, 0.45) : THEME.text }}>{children}</span>
      {trailing}
    </label>
  );
}

export default function TabExportSection({
  exportModalOpen,
  onRequestClose,
  THEME,
  card,
  btnSecondary,
  field,
  withAlpha,
  userState,
  userPlanType,
  canExportPngTabs,
  updateUserState,
  TABBY_ASSIST_MINT,
  normalizeHexColorOrFallback,
  formatTapSyncTimestamp,
  collectVideoSyncNoteSequence,
  makeExportRowLabel,
  showMembershipGateToast,
  exportFormat,
  setExportFormat,
  pdfSettingsOpenSection,
  setPdfSettingsOpenSection,
  completedRows,
  pdfRowGrouping,
  setPdfRowGrouping,
  imageThickness,
  setImageThickness,
  pdfShowArtist,
  setPdfShowArtist,
  pdfShowAlbum,
  setPdfShowAlbum,
  pdfShowSong,
  setPdfShowSong,
  pdfShowInstrument,
  setPdfShowInstrument,
  pdfShowTuning,
  setPdfShowTuning,
  pdfShowCapo,
  setPdfShowCapo,
  showTempoControl,
  pdfShowTempo,
  setPdfShowTempo,
  exportPdfNow,
  setExportPdfHover,
  exportPdfHover,
  pdfPreviewScale,
  setPdfPreviewScale,
  pdfPreviewLayout,
  videoPlaybackSpeed,
  setVideoPlaybackSpeed,
  videoBgMode,
  setVideoBgMode,
  videoBgColor,
  setVideoBgColor,
  videoAnimationStyle,
  setVideoAnimationStyle,
  videoBrandingMode,
  setVideoBrandingMode,
  handleVideoAudioFileChange,
  videoAudioName,
  videoAudioUrl,
  videoAudioRef,
  videoAudioPlaybackRate,
  setVideoAudioPlaybackRate,
  selectedExportCount,
  selectedExportVideoNoteCount,
  selectedExportMissingVideoSyncCount,
  setImageExportRowIds,
  imageExportRowIds,
  videoSyncTimings,
  toggleImageExportRow,
  clearVideoSyncRow,
  startVideoSyncRecording,
  videoSyncRecording,
  stopVideoSyncRecording,
  recordNextVideoSyncPoint,
  clearVideoSyncAll,
  videoExportProgress,
  videoExportBusy,
  canExportVideoNow,
  exportVideoNow,
  selectedExportVideoNotes,
  videoSyncCursorIndex,
  imageSettingsOpenSection,
  setImageSettingsOpenSection,
  imageShowRowNames,
  setImageShowRowNames,
  imageMultiExportMode,
  setImageMultiExportMode,
  canUseTapToSync,
  setTapSyncOpen,
  tapSyncOpen,
  tapSyncMode,
  setTapSyncMode,
  tapSyncShowTimestamps,
  setTapSyncShowTimestamps,
  tapSyncReplayDuration,
  setTapSyncReplayDuration,
  tapSyncReplaceOnClick,
  setTapSyncReplaceOnClick,
  tapSyncAutoScroll,
  setTapSyncAutoScroll,
  startTapSyncRecording,
  tapSyncReplayRunning,
  replayTapSync,
  clearTapSyncForMode,
  redoTapSync,
  tapSyncStatusText,
  tapSyncTimingCount,
  tapSyncNoteTimings,
  tapSyncRowTimings,
  imageBgMode,
  setImageBgMode,
  imageExportSize,
  setImageExportSize,
  imageExportPadding,
  setImageExportPadding,
  imageBgColor,
  setImageBgColor,
  imageTextColor,
  setImageTextColor,
  imageTextOutline,
  setImageTextOutline,
  imageShowArtist,
  setImageShowArtist,
  imageShowAlbum,
  setImageShowAlbum,
  imageShowSong,
  setImageShowSong,
  imageShowInstrument,
  setImageShowInstrument,
  imageShowTuning,
  setImageShowTuning,
  imageShowCapo,
  setImageShowCapo,
  imageShowTempo,
  setImageShowTempo,
  imageShowBranding,
  setImageShowBranding,
  exportBrandingLocked,
  exportUseAffiliateBranding,
  setExportUseAffiliateBranding,
  exportAffiliateLinkText,
  exportBrandingText,
  imageExportProgress,
  imageExportBusy,
  exportImagesNow,
  imagePreviewMetaText,
  imagePreviewBusy,
  imagePreviewUrl,
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
  onRecordExportEvent,
}) {
  const pdfWorkspaceRef = useRef(null);
  const pdfPanStateRef = useRef({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const exportFormatMenuRef = useRef(null);
  const denseCard = cardDense(THEME);
  const microButton = buttonMicro(THEME);
  const primaryButton = buttonPrimary(THEME);
  const exportMenuPanelStyle = menuPanel(THEME);
  const exportModalOverlayStyle = modalOverlay({
    background: "rgba(0,0,0,0.4)",
    zIndex: 5200,
    padding: "0 16px 16px",
  });
  const exportModalCardStyle = modalCardLarge(THEME);
  const exportModalHeaderStyle = modalHeader({ gap: 10, alignItems: "center", justifyContent: "flex-start" });
  const exportModalCloseStyle = modalCloseButton(THEME, { iconOnly: true });
  const EXPORT_HEADER_CLEARANCE = 54;
  const EXPORT_SECTION_GAP = 12;
  const EXPORT_CARD_HEIGHT = "calc(100% - 42px)";
  const PREVIEW_CARD_PADDING = 12;
  const PREVIEW_SURFACE_PADDING = 12;
  const activeSurface = withAlpha(THEME.accent, THEME.isDark ? 0.14 : 0.09);
  const activeBorder = withAlpha(THEME.accent, 0.74);
  const activeShadow = `0 0 0 1px ${withAlpha(THEME.accent, THEME.isDark ? 0.16 : 0.1)}`;
  const [showPrintMargins, setShowPrintMargins] = useState(true);
  const [pdfPageIndex, setPdfPageIndex] = useState(0);
  const [pdfZoomPreset, setPdfZoomPreset] = useState("fit");
  const [pdfPreviewViewport, setPdfPreviewViewport] = useState({ width: 0, height: 0 });
  const [pdfPanOffset, setPdfPanOffset] = useState({ x: 0, y: 0 });
  const [pdfExportStatus, setPdfExportStatus] = useState("");
  const [videoSettingsOpenSection, setVideoSettingsOpenSection] = useState("");
  const [accordionHoverKey, setAccordionHoverKey] = useState("");
  const [buttonHoverKey, setButtonHoverKey] = useState("");
  const [exportFormatMenuOpen, setExportFormatMenuOpen] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState("");
  const hasAffiliateExportBranding = Boolean(String(exportAffiliateLinkText || "").trim());
  const chordDiagramPrefs = userState?.profile?.chordDiagramExportPrefs || null;
  const saveChordDiagramPrefs = useCallback(
    (nextPrefs) => {
      updateUserState?.((prev) => ({
        ...prev,
        profile: {
          ...(prev?.profile || {}),
          chordDiagramExportPrefs: {
            ...(prev?.profile?.chordDiagramExportPrefs || {}),
            ...(nextPrefs || {}),
          },
        },
      }));
    },
    [updateUserState]
  );
  const choiceButtonStyle = (active, hovered = false, { height = 34, disabled = false } = {}) => ({
    ...microButton,
    height,
    borderColor: active ? activeBorder : hovered ? withAlpha(THEME.accent, 0.42) : THEME.border,
    color: disabled ? withAlpha(THEME.text, 0.38) : active ? THEME.text : THEME.textFaint,
    background: active ? withAlpha(THEME.accent, THEME.isDark ? 0.09 : 0.06) : THEME.surfaceWarm,
    fontWeight: active ? 900 : microButton.fontWeight,
    boxShadow: active ? `inset 0 0 0 1px ${withAlpha(THEME.accent, THEME.isDark ? 0.18 : 0.12)}` : "none",
    opacity: disabled ? 0.5 : 1,
    transition: "border-color 120ms ease, background 120ms ease, color 120ms ease, box-shadow 120ms ease",
  });
  const exportPrimaryButtonStyle = ({ disabled = false, hovered = false } = {}) => ({
    ...primaryButton,
    borderColor: activeBorder,
    background: hovered && !disabled ? withAlpha(THEME.accent, THEME.isDark ? 0.12 : 0.08) : THEME.surfaceWarm,
    color: disabled ? withAlpha(THEME.text, 0.4) : THEME.text,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: hovered && !disabled ? `inset 0 0 0 1px ${withAlpha(THEME.accent, THEME.isDark ? 0.22 : 0.16)}` : activeShadow,
    transition: "border-color 120ms ease, background 120ms ease, color 120ms ease, box-shadow 120ms ease, opacity 120ms ease",
    fontWeight: 900,
  });
  const accentActionButtonStyle = ({ disabled = false, hovered = false } = {}) => ({
    ...btnSecondary,
    borderColor: hovered || !disabled ? activeBorder : THEME.border,
    color: hovered || !disabled ? THEME.text : withAlpha(THEME.text, 0.4),
    background: hovered || !disabled ? activeSurface : THEME.surfaceWarm,
    boxShadow: hovered || !disabled ? activeShadow : "none",
    opacity: disabled ? 0.55 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
  });
  const accordionShellStyle = (open) => ({
    position: "relative",
    overflow: "visible",
    background: "transparent",
    border: "none",
    boxShadow: "none",
    zIndex: open ? 8 : 1,
  });
  const accordionTriggerStyle = (open, hovered = false) => ({
    ...field,
    width: "100%",
    ...metadataFieldInteraction(THEME, withAlpha, { focused: open, hovered: hovered && !open }),
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
  const accordionTriggerHandlers = (key) => ({
    onPointerEnter: () => setAccordionHoverKey(key),
    onPointerLeave: () => setAccordionHoverKey((current) => (current === key ? "" : current)),
  });
  const accordionTriggerContent = (label, open) => (
    <>
      <span style={accordionLabelStyle}>{label}</span>
      <ExportChevron open={open} color={THEME.text} anchored />
    </>
  );
  const exportAccordionTriggerStyle = (key, open) =>
    accordionTriggerStyle(open, accordionHoverKey === key);
  const exportButtonHandlers = (key) => ({
    onPointerEnter: () => setButtonHoverKey(key),
    onPointerLeave: () => setButtonHoverKey((current) => (current === key ? "" : current)),
  });
  const panelSectionStackStyle = {
    display: "grid",
    gap: 14,
  };
  const panelGroupStyle = {
    display: "grid",
    gap: 6,
  };
  const panelSectionLabelStyle = {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: "0.02em",
    color: THEME.text,
  };
  const exportPanelLabelStyle = {
    fontSize: 13,
    fontWeight: 900,
    color: THEME.text,
    letterSpacing: "0.01em",
  };
  const exportPanelHelperStyle = {
    fontSize: 12,
    color: THEME.textFaint,
    lineHeight: 1.4,
  };
  const panelValueStyle = {
    fontSize: 13,
    color: THEME.textFaint,
    lineHeight: 1.35,
  };
  const pdfThicknessWeightFor = (id) =>
    id === "A" ? 500 : id === "C" ? 900 : 700;
  const segmentedButtonsRowStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 6,
    alignItems: "stretch",
  };
  const accordionContentStyle = {
    ...exportMenuPanelStyle,
    position: "relative",
    marginTop: 8,
    width: "100%",
    zIndex: 1,
  };
  const accordionPanelBodyStyle = {
    display: "grid",
    gap: 6,
    marginTop: 10,
    maxHeight: 320,
    overflowY: "auto",
    overscrollBehavior: "contain",
    paddingRight: 4,
  };
  const compactPanelMaxHeight = "min(220px, calc(100vh - 440px))";
  const mediumPanelMaxHeight = "min(260px, calc(100vh - 400px))";
  const largePanelMaxHeight = "min(320px, calc(100vh - 360px))";
  const extraLargePanelMaxHeight = "min(360px, calc(100vh - 320px))";
  const exportFormatOptions = [
    { id: "pdf", title: "PDF", detail: "Printable sheet" },
    { id: "image", title: "PNG", detail: "Image export for videos" },
    { id: "chord-diagram", title: "Chord Diagram", detail: "Create and export fretboard diagrams" },
  ];
  const isCreatorOnlyExportFormat = useCallback((formatId) => formatId === "image" || formatId === "chord-diagram", []);
  const handleSelectExportFormat = useCallback(
    (formatId) => {
      if (userPlanType === "band" && isCreatorOnlyExportFormat(formatId) && !canExportPngTabs) {
        showMembershipGateToast("creator-export");
        setExportFormatMenuOpen(false);
        return;
      }
      setSelectedExportFormat(formatId);
      setExportFormat(formatId);
      setPdfSettingsOpenSection("");
      setImageSettingsOpenSection("");
      setVideoSettingsOpenSection("");
      setExportFormatMenuOpen(false);
    },
    [
      canExportPngTabs,
      setExportFormat,
      setImageSettingsOpenSection,
      setPdfSettingsOpenSection,
      setVideoSettingsOpenSection,
      showMembershipGateToast,
      isCreatorOnlyExportFormat,
      userPlanType,
    ]
  );
  const activeExportFormat = selectedExportFormat;
  const selectedExportFormatOption = exportFormatOptions.find((option) => option.id === activeExportFormat) || null;
  const exportFormatSelector = (
    <div
      ref={exportFormatMenuRef}
      style={{
        ...accordionShellStyle(exportFormatMenuOpen),
        zIndex: exportFormatMenuOpen ? 12 : 1,
      }}
    >
      <button
        type="button"
        onClick={() => setExportFormatMenuOpen((current) => !current)}
        style={exportAccordionTriggerStyle("export-format", exportFormatMenuOpen)}
        {...accordionTriggerHandlers("export-format")}
      >
        <span style={accordionLabelStyle}>
          {selectedExportFormatOption ? selectedExportFormatOption.title : "Choose Export Format"}
        </span>
        <ExportChevron open={exportFormatMenuOpen} color={THEME.text} anchored />
      </button>
      {exportFormatMenuOpen && (
        <div
          style={{
            ...exportMenuPanelStyle,
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            width: "100%",
            zIndex: 2000,
            maxHeight: 280,
            overflowY: "auto",
          }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            {exportFormatOptions.map((option) => {
              const active = activeExportFormat === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    handleSelectExportFormat(option.id);
                  }}
                  {...exportButtonHandlers(`format-${option.id}`)}
                  style={{
                    ...choiceButtonStyle(active, buttonHoverKey === `format-${option.id}`, { height: 48 }),
                    display: "grid",
                    justifyItems: "start",
                    alignContent: "center",
                    gap: 2,
                    padding: "6px 12px",
                    borderRadius: 14,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 900, lineHeight: 1.05 }}>{option.title}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.1, color: active ? THEME.text : THEME.textFaint }}>
                    {option.detail}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
  const exportFormatIntro = (
    <div style={{ display: "grid", gap: 8 }}>
      {exportFormatSelector}
      <div style={exportPanelHelperStyle}>Choose PDF, PNG, or CHORD DIAGRAM to begin exporting.</div>
    </div>
  );
  const pdfPages = pdfPreviewLayout.pages || [];
  const pageCount = pdfPages.length;
  const currentPdfPageIndex = Math.min(Math.max(pdfPageIndex, 0), Math.max(pageCount - 1, 0));
  const currentPdfPage = pdfPages[currentPdfPageIndex] || { contentLines: [], footerLeft: "", footerRight: "" };
  const pageAspectRatio = pdfPreviewLayout.pageH / pdfPreviewLayout.pageW;
  const fitScale = useMemo(() => {
    if (!pdfPreviewViewport.width || !pdfPreviewViewport.height || !pdfPreviewLayout.pageW || !pdfPreviewLayout.pageH) return 0.58;
    const widthScale = Math.max(0.1, (pdfPreviewViewport.width - 64) / pdfPreviewLayout.pageW);
    const heightScale = Math.max(0.1, (pdfPreviewViewport.height - 64) / pdfPreviewLayout.pageH);
    return Math.min(widthScale, heightScale);
  }, [pdfPreviewLayout.pageH, pdfPreviewLayout.pageW, pdfPreviewViewport.height, pdfPreviewViewport.width]);
  const pdfZoomScale =
    pdfZoomPreset === "fit"
      ? fitScale
      : pdfZoomPreset === "actual"
        ? 1
        : Number(pdfZoomPreset) / 100;
  const pageDisplayWidth = pdfPreviewLayout.pageW * pdfZoomScale;
  const pageDisplayHeight = pdfPreviewLayout.pageH * pdfZoomScale;

  useEffect(() => {
    setPdfPageIndex((current) => Math.min(Math.max(current, 0), Math.max(pageCount - 1, 0)));
  }, [pageCount]);

  useEffect(() => {
    const node = pdfWorkspaceRef.current;
    if (!node) return undefined;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setPdfPreviewViewport({ width: rect.width, height: rect.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setPdfPanOffset({ x: 0, y: 0 });
  }, [currentPdfPageIndex, pdfZoomPreset]);

  useEffect(() => {
    if (!exportModalOpen) return;
    setSelectedExportFormat("");
    setExportFormatMenuOpen(false);
  }, [exportModalOpen]);

  useEffect(() => {
    if (!exportModalOpen) return;
    if (userPlanType !== "band" || canExportPngTabs) return;
    setSelectedExportFormat((current) => {
      if (!isCreatorOnlyExportFormat(current)) return current;
      return "pdf";
    });
    setExportFormat((current) => (isCreatorOnlyExportFormat(current) ? "pdf" : current));
  }, [canExportPngTabs, exportModalOpen, isCreatorOnlyExportFormat, setExportFormat, userPlanType]);

  useEffect(() => {
    if (!exportModalOpen) return undefined;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [exportModalOpen]);

  useEffect(() => {
    if (!exportFormatMenuOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!exportFormatMenuRef.current?.contains(event.target)) {
        setExportFormatMenuOpen(false);
      }
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [exportFormatMenuOpen]);

  useEffect(() => {
    if (!pdfPanStateRef.current.dragging) return undefined;
    const handlePointerMove = (event) => {
      const state = pdfPanStateRef.current;
      if (!state.dragging) return;
      const maxX = Math.max(0, (pageDisplayWidth - pdfPreviewViewport.width) / 2);
      const maxY = Math.max(0, (pageDisplayHeight - pdfPreviewViewport.height) / 2);
      const nextX = state.originX + (event.clientX - state.startX);
      const nextY = state.originY + (event.clientY - state.startY);
      setPdfPanOffset({
        x: Math.min(maxX, Math.max(-maxX, nextX)),
        y: Math.min(maxY, Math.max(-maxY, nextY)),
      });
    };
    const handlePointerUp = () => {
      pdfPanStateRef.current.dragging = false;
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [pageDisplayHeight, pageDisplayWidth, pdfPreviewViewport.height, pdfPreviewViewport.width]);

  const renderPdfPreviewPage = (pageData, pageIndex, scale = pdfZoomScale) => (
    <div key={`pdf-preview-page-${pageIndex}`} style={{ display: "grid", gap: 6, justifyItems: "center" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: THEME.textFaint }}>
        A4 • Page {pageIndex + 1} of {pdfPreviewLayout.pages.length}
      </div>
      <div
        style={{
          width: `${pdfPreviewLayout.pageW * scale}px`,
          minHeight: `${pdfPreviewLayout.pageH * scale}px`,
          background: "#fff",
          color: "#111",
          borderRadius: 8,
          boxShadow: "0 10px 30px rgba(0,0,0,0.28)",
          padding: `${pdfPreviewLayout.margin * scale}px`,
          boxSizing: "border-box",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            minHeight: "100%",
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: `${Math.max(7, pdfPreviewLayout.fontSize * scale)}px`,
            lineHeight: `${Math.max(8, pdfPreviewLayout.lineH * scale)}px`,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: `${pdfPreviewLayout.footerReserved * scale}px`,
            }}
          >
            {(pageData.contentLines || []).map((ln, lineIndex) => (
              <div
                key={`pdf-preview-page-${pageIndex}-line-${lineIndex}`}
                style={{
                  whiteSpace: "pre",
                  fontWeight:
                    imageThickness === "A"
                      ? 500
                      : imageThickness === "C"
                        ? 900
                        : ln?.font === "F2"
                          ? 800
                          : 500,
                }}
              >
                {String(ln?.text || "").length ? String(ln.text) : "\u00A0"}
              </div>
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: `${pdfPreviewLayout.footerBottomInset * scale}px`,
              right: `${Math.max(56, 110 * scale)}px`,
            }}
          >
            <div style={{ whiteSpace: "pre", fontWeight: 500, overflow: "hidden", textOverflow: "clip", color: "rgba(0,0,0,0.58)" }}>
              {pageData.footerLeft || "\u00A0"}
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              right: 0,
              bottom: `${pdfPreviewLayout.footerBottomInset * scale}px`,
              width: `${Math.max(48, 100 * scale)}px`,
              textAlign: "right",
            }}
          >
            <div style={{ whiteSpace: "pre", fontWeight: 500, color: "rgba(0,0,0,0.58)" }}>{pageData.footerRight || "\u00A0"}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const openPdfPrintPreview = () => {
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=980,height=1280");
    if (!printWindow) return;
    const pageMarkup = pdfPreviewLayout.pages
      .map((pageData, pageIndex) => {
        const lineMarkup = (pageData.contentLines || [])
          .map((ln) => {
            const weight =
              imageThickness === "A"
                ? 500
                : imageThickness === "C"
                  ? 900
                  : ln?.font === "F2"
                    ? 800
                    : 500;
            const text = String(ln?.text || "").length ? String(ln.text) : "\u00A0";
            return `<div style="white-space:pre;font-weight:${weight};">${text
              .replaceAll("&", "&amp;")
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;")}</div>`;
          })
          .join("");
        const marginMm = (pdfPreviewLayout.margin / pdfPreviewLayout.pageW) * 210;
        const footerReservedMm = (pdfPreviewLayout.footerReserved / pdfPreviewLayout.pageW) * 210;
        const footerBottomInsetMm = (pdfPreviewLayout.footerBottomInset / pdfPreviewLayout.pageW) * 210;
        const fontSizePt = (pdfPreviewLayout.fontSize / 96) * 72;
        const lineHeightPt = (pdfPreviewLayout.lineH / 96) * 72;
        return `
          <section class="page-wrap">
            <div class="page-label">A4 • Page ${pageIndex + 1} of ${pdfPreviewLayout.pages.length}</div>
            <div class="page">
              <div class="page-content" style="padding:${marginMm}mm ${marginMm}mm ${marginMm + footerReservedMm}mm;font-size:${fontSizePt}pt;line-height:${lineHeightPt}pt;">
                ${lineMarkup}
              </div>
              <div class="page-footer page-footer-left" style="left:${marginMm}mm;right:${marginMm + 28}mm;bottom:${marginMm + footerBottomInsetMm}mm;font-size:${fontSizePt}pt;line-height:${lineHeightPt}pt;color:rgba(0,0,0,0.58);">
                ${String(pageData.footerLeft || "")
                  .replaceAll("&", "&amp;")
                  .replaceAll("<", "&lt;")
                  .replaceAll(">", "&gt;")}
              </div>
              <div class="page-footer page-footer-right" style="right:${marginMm}mm;bottom:${marginMm + footerBottomInsetMm}mm;width:24mm;font-size:${fontSizePt}pt;line-height:${lineHeightPt}pt;color:rgba(0,0,0,0.58);">
                ${String(pageData.footerRight || "")
                  .replaceAll("&", "&amp;")
                  .replaceAll("<", "&lt;")
                  .replaceAll(">", "&gt;")}
              </div>
            </div>
          </section>
        `;
      })
      .join("");

    printWindow.document.write(`<!doctype html>
      <html>
        <head>
          <title>TabStudio PDF Print Preview</title>
          <style>
            @page { size: A4; margin: 0; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              background: #111214;
              color: #f5f5f5;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }
            .shell {
              min-height: 100vh;
              padding: 24px;
              display: grid;
              gap: 18px;
              justify-items: center;
              align-content: start;
            }
            .toolbar {
              width: min(960px, 100%);
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
            }
            .print-btn {
              border: 1px solid rgba(255,255,255,0.18);
              background: #202226;
              color: #fff;
              border-radius: 12px;
              height: 42px;
              padding: 0 16px;
              font-weight: 800;
              cursor: pointer;
            }
            .pages {
              width: 100%;
              display: grid;
              gap: 18px;
              justify-items: center;
            }
            .page-wrap {
              display: grid;
              gap: 8px;
              justify-items: center;
            }
            .page-label {
              font-size: 12px;
              font-weight: 800;
              color: rgba(255,255,255,0.72);
            }
            .page {
              width: 210mm;
              min-height: 297mm;
              background: #fff;
              color: #111;
              position: relative;
              box-shadow: 0 16px 40px rgba(0,0,0,0.32);
            }
            .page-content {
              width: 100%;
              min-height: 297mm;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            }
            .page-footer {
              position: absolute;
              overflow: hidden;
            }
            .page-footer-left {
              white-space: pre;
            }
            .page-footer-right {
              white-space: pre;
              text-align: right;
            }
            @media print {
              body { background: #fff; }
              .toolbar, .page-label { display: none; }
              .shell { padding: 0; gap: 0; }
              .pages { gap: 0; }
              .page { box-shadow: none; break-after: page; }
              .page:last-child { break-after: auto; }
            }
          </style>
        </head>
        <body>
          <div class="shell">
            <div class="toolbar">
              <div>A4 print preview</div>
              <button class="print-btn" onclick="window.print()">Print</button>
            </div>
            <div class="pages">${pageMarkup}</div>
          </div>
        </body>
      </html>`);
    printWindow.document.close();
  };
  const handlePdfExport = async () => {
    setPdfExportStatus("Exporting PDF...");
    try {
      await Promise.resolve(exportPdfNow());
      setPdfExportStatus("✓ PDF Ready");
      window.setTimeout(() => setPdfExportStatus(""), 2400);
    } catch {
      setPdfExportStatus("Unable to export PDF");
      window.setTimeout(() => setPdfExportStatus(""), 2800);
    }
  };
  const resetPdfLayout = () => {
    setPdfRowGrouping("fill");
    setImageThickness("B");
    setShowPrintMargins(true);
    setPdfZoomPreset("fit");
    setPdfPageIndex(0);
    setPdfPanOffset({ x: 0, y: 0 });
    setPdfSettingsOpenSection("song");
  };

  const toggleImageSettingsSection = (sectionId) => {
    setImageSettingsOpenSection((current) => (current === sectionId ? "" : sectionId));
  };

  const togglePdfSettingsSection = (sectionId) => {
    setPdfSettingsOpenSection((current) => (current === sectionId ? "" : sectionId));
  };

  const toggleVideoSettingsSection = (sectionId) => {
    setVideoSettingsOpenSection((current) => (current === sectionId ? "" : sectionId));
  };

  if (!exportModalOpen) return null;

  return (
            <div
              style={{
                ...exportModalOverlayStyle,
              }}
              onPointerDown={(e) => {
                if (e.target !== e.currentTarget) return;
                onRequestClose();
              }}
            >
              <div
                style={{
                  ...exportModalCardStyle,
                  height: "calc(100vh - 64px)",
                  maxHeight: "calc(100vh - 64px)",
                  position: "relative",
                  overflow: "hidden",
                  padding: `${EXPORT_HEADER_CLEARANCE + EXPORT_SECTION_GAP}px 18px 18px`,
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div style={{ ...exportModalHeaderStyle, position: "absolute", top: 14, left: 14, right: 14, zIndex: 2 }}>
                  <button
                    type="button"
                    onClick={onRequestClose}
                    style={exportModalCloseStyle}
                    aria-label="Close export modal"
                    title="Close"
                  >
                    ×
                  </button>
                  <div>
                    <div style={{ fontWeight: 950, fontSize: 18, color: THEME.text }}>Export</div>
                  </div>
                </div>

                {!activeExportFormat ? (
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
                      }}
                    >
                      <div style={{ display: "grid", gap: 12, alignContent: "start", minHeight: 0 }}>
                        {exportFormatIntro}
                      </div>
                      <div style={{ display: "grid", gap: 10, marginTop: "auto", alignSelf: "end", paddingTop: 12 }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            disabled
                            style={{ ...exportPrimaryButtonStyle({ hovered: false, disabled: true }), width: "100%" }}
                          >
                            Export
                          </button>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        ...denseCard,
                        display: "grid",
                        gridTemplateRows: "auto minmax(0,1fr)",
                        gap: 8,
                        minHeight: 0,
                        height: EXPORT_CARD_HEIGHT,
                        alignSelf: "start",
                        padding: PREVIEW_CARD_PADDING,
                      }}
                    >
                      <div style={{ display: "grid", gap: 10 }}>
                        <div style={{ display: "grid", gap: 2 }}>
                          <div style={{ fontSize: 12, fontWeight: 900, color: THEME.textFaint }}>Preview</div>
                        </div>
                      </div>
                      <div
                        style={{
                          minHeight: 0,
                          height: "100%",
                          overflow: "hidden",
                          padding: PREVIEW_SURFACE_PADDING,
                          background: "#0f0f10",
                          borderRadius: 12,
                          border: `1px solid ${withAlpha(THEME.text, 0.08)}`,
                          display: "grid",
                          placeItems: "center",
                          boxSizing: "border-box",
                        }}
                      >
                        <div style={{ fontSize: 13, color: THEME.textFaint, textAlign: "center" }}>
                          Choose PDF, PNG, or CHORD DIAGRAM to begin exporting.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeExportFormat === "chord-diagram" ? (
                  <FretboardDiagramSection
                    resetOnOpenKey={activeExportFormat}
                    headerContent={exportFormatIntro}
                    THEME={THEME}
                    btnSecondary={btnSecondary}
                    field={field}
                    withAlpha={withAlpha}
                    imageThickness={imageThickness}
                    setImageThickness={setImageThickness}
                    normalizeHexColorOrFallback={normalizeHexColorOrFallback}
                    tuning={tuning}
                    tuningLabel={tuningLabel}
                    instrumentId={instrumentId}
                    currentInstrument={currentInstrument}
                    groupedInstruments={groupedInstruments}
                    favInstrumentIds={favInstrumentIds}
                    favouriteInstruments={favouriteInstruments}
                    toggleFavouriteInstrument={toggleFavouriteInstrument}
                    handleInstrumentChange={handleInstrumentChange}
                    chordToolEnabled={chordToolEnabled}
                    currentPresetChords={currentPresetChords}
                    sharedStandardPresetChords={sharedStandardPresetChords}
                    currentUserChords={currentUserChords}
                    allUserChords={allUserChords}
                    saveCustomChordToLibrary={saveCustomChordToLibrary}
                    availableChordTunings={availableChordTunings}
                    saveChordExportTuning={saveChordExportTuning}
                    onChordDiagramExported={() => onRecordExportEvent?.("chord")}
                    chordDiagramPrefs={chordDiagramPrefs}
                    saveChordDiagramPrefs={saveChordDiagramPrefs}
                    includeBranding={imageShowBranding}
                    setIncludeBranding={setImageShowBranding}
                    exportBrandingLocked={exportBrandingLocked}
                    useAffiliateBranding={exportUseAffiliateBranding}
                    setUseAffiliateBranding={setExportUseAffiliateBranding}
                    hasAffiliateBranding={hasAffiliateExportBranding}
                    exportBrandingText={exportBrandingText}
                  />
                ) : activeExportFormat === "pdf" ? (
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
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gap: 14,
                          minHeight: 0,
                          overflowY: "auto",
                          paddingRight: 4,
                          alignContent: "start",
                          gridAutoRows: "max-content",
                        }}
                      >
                        {exportFormatIntro}
                        <div style={accordionShellStyle(pdfSettingsOpenSection === "rows")}>
                          <button
                            type="button"
                            onClick={() => togglePdfSettingsSection("rows")}
                            style={exportAccordionTriggerStyle("pdf-rows", pdfSettingsOpenSection === "rows")}
                            {...accordionTriggerHandlers("pdf-rows")}
                          >
                            {accordionTriggerContent("Row Settings", pdfSettingsOpenSection === "rows")}
                          </button>
                          {pdfSettingsOpenSection === "rows" && (
                            <div style={{ ...accordionContentStyle, maxHeight: mediumPanelMaxHeight, overflowY: "auto" }}>
                              <div style={panelSectionStackStyle}>
                                <div style={panelGroupStyle}>
                                  <div style={panelSectionLabelStyle}>Rows included</div>
                                  <div style={panelValueStyle}>
                                    {completedRows.length} completed row{completedRows.length === 1 ? "" : "s"}
                                  </div>
                                </div>
                                <div style={panelGroupStyle}>
                                  <div style={panelSectionLabelStyle}>Row spacing</div>
                                  <div style={panelValueStyle}>Choose how rows fit on each page.</div>
                                </div>
                                <div style={segmentedButtonsRowStyle}>
                                  <button
                                    type="button"
                                    onClick={() => setPdfRowGrouping("fill")}
                                    {...exportButtonHandlers("pdf-group-fill")}
                                    style={choiceButtonStyle(pdfRowGrouping === "fill", buttonHoverKey === "pdf-group-fill", { height: 36 })}
                                  >
                                    Compact
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPdfRowGrouping("grouped")}
                                    {...exportButtonHandlers("pdf-group-grouped")}
                                    style={choiceButtonStyle(pdfRowGrouping === "grouped", buttonHoverKey === "pdf-group-grouped", { height: 36 })}
                                  >
                                    Comfortable
                                  </button>
                                </div>
                                <div style={{ ...panelValueStyle, fontSize: 11 }}>
                                  {pdfRowGrouping === "grouped"
                                    ? "Keeps rows grouped where possible."
                                    : "Fits as many rows as possible on each page."}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div style={accordionShellStyle(pdfSettingsOpenSection === "text")}>
                          <button
                            type="button"
                            onClick={() => togglePdfSettingsSection("text")}
                            style={exportAccordionTriggerStyle("pdf-text", pdfSettingsOpenSection === "text")}
                            {...accordionTriggerHandlers("pdf-text")}
                          >
                            {accordionTriggerContent("Text Settings", pdfSettingsOpenSection === "text")}
                          </button>
                        {pdfSettingsOpenSection === "text" && (
                          <div style={{ ...accordionContentStyle, maxHeight: compactPanelMaxHeight, overflowY: "auto" }}>
                            <div style={panelSectionStackStyle}>
                              <div style={panelGroupStyle}>
                                <div style={panelSectionLabelStyle}>Thickness</div>
                                <div style={panelValueStyle}>Choose the line weight for printed tabs.</div>
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
                                    onClick={() => setImageThickness(id)}
                                    {...exportButtonHandlers(`pdf-thickness-${id}`)}
                                    style={{
                                      ...choiceButtonStyle(imageThickness === id, buttonHoverKey === `pdf-thickness-${id}`, { height: 46 }),
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
                                      <span style={{ fontSize: 14, fontWeight: pdfThicknessWeightFor(id) }}>{title}</span>
                                      <span
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 600,
                                          color: imageThickness === id ? THEME.text : THEME.textFaint,
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
                          </div>
                        )}
                      </div>

                        <div style={accordionShellStyle(pdfSettingsOpenSection === "song")}>
                          <button
                            type="button"
                            onClick={() => togglePdfSettingsSection("song")}
                            style={exportAccordionTriggerStyle("pdf-song", pdfSettingsOpenSection === "song")}
                            {...accordionTriggerHandlers("pdf-song")}
                          >
                            {accordionTriggerContent("Song Details", pdfSettingsOpenSection === "song")}
                          </button>
                          {pdfSettingsOpenSection === "song" && (
                            <div style={{ ...accordionContentStyle, maxHeight: compactPanelMaxHeight, overflowY: "auto" }}>
                              <div style={panelSectionStackStyle}>
                                <div style={{ display: "grid", gap: 4 }}>
                                  <ExportCheckboxRow checked={pdfShowArtist} onChange={setPdfShowArtist} THEME={THEME} withAlpha={withAlpha}>Artist</ExportCheckboxRow>
                                  <ExportCheckboxRow checked={pdfShowAlbum} onChange={setPdfShowAlbum} THEME={THEME} withAlpha={withAlpha}>Album</ExportCheckboxRow>
                                  <ExportCheckboxRow checked={pdfShowSong} onChange={setPdfShowSong} THEME={THEME} withAlpha={withAlpha}>Song name</ExportCheckboxRow>
                                  <ExportCheckboxRow checked={pdfShowInstrument} onChange={setPdfShowInstrument} THEME={THEME} withAlpha={withAlpha}>Instrument</ExportCheckboxRow>
                                  <ExportCheckboxRow checked={pdfShowTuning} onChange={setPdfShowTuning} THEME={THEME} withAlpha={withAlpha}>Tuning</ExportCheckboxRow>
                                  <ExportCheckboxRow checked={pdfShowCapo} onChange={setPdfShowCapo} THEME={THEME} withAlpha={withAlpha}>Capo</ExportCheckboxRow>
                                  {showTempoControl && (
                                    <ExportCheckboxRow checked={pdfShowTempo} onChange={setPdfShowTempo} THEME={THEME} withAlpha={withAlpha}>Tempo</ExportCheckboxRow>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div style={accordionShellStyle(pdfSettingsOpenSection === "branding")}>
                          <button
                            type="button"
                            onClick={() => togglePdfSettingsSection("branding")}
                            style={exportAccordionTriggerStyle("pdf-branding", pdfSettingsOpenSection === "branding")}
                            {...accordionTriggerHandlers("pdf-branding")}
                          >
                            {accordionTriggerContent("Branding", pdfSettingsOpenSection === "branding")}
                          </button>
                          {pdfSettingsOpenSection === "branding" && (
                            <div style={{ ...accordionContentStyle, maxHeight: compactPanelMaxHeight, overflowY: "auto" }}>
                              <div style={panelSectionStackStyle}>
                                <div style={{ display: "grid", gap: 4 }}>
                                  <ExportCheckboxRow
                                    checked={imageShowBranding}
                                    onChange={setImageShowBranding}
                                    THEME={THEME}
                                    withAlpha={withAlpha}
                                    disabled={exportBrandingLocked}
                                  >
                                    Include TabStudio link
                                  </ExportCheckboxRow>
                                  {exportBrandingLocked ? (
                                    <div style={{ fontSize: 11, color: THEME.textFaint }}>Included on Band exports</div>
                                  ) : null}
                                  {hasAffiliateExportBranding ? (
                                    <ExportCheckboxRow
                                      checked={exportUseAffiliateBranding}
                                      onChange={setExportUseAffiliateBranding}
                                      THEME={THEME}
                                      withAlpha={withAlpha}
                                      disabled={!imageShowBranding}
                                    >
                                      Use my affiliate link
                                    </ExportCheckboxRow>
                                  ) : null}
                                </div>
                                {imageShowBranding ? (
                                  <div style={{ fontSize: 11, color: THEME.textFaint }}>{exportBrandingText}</div>
                                ) : null}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>

                        <div style={{ display: "grid", gap: 10, marginTop: "auto", alignSelf: "end", paddingTop: 12 }}>
                          <div style={{ fontSize: 12, color: THEME.textFaint, minHeight: 16 }}>{pdfExportStatus}</div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              onClick={handlePdfExport}
                              onPointerEnter={() => setExportPdfHover(true)}
                              onPointerLeave={() => setExportPdfHover(false)}
                              style={{ ...exportPrimaryButtonStyle({ hovered: exportPdfHover }), width: "100%" }}
                            >
                              Export PDF
                            </button>
                          </div>
                      </div>
                    </div>

                    <div
                      style={{
                        ...denseCard,
                        display: "grid",
                        gridTemplateRows: "auto minmax(0,1fr)",
                        gap: 8,
                        minHeight: 0,
                        height: EXPORT_CARD_HEIGHT,
                        alignSelf: "start",
                        padding: PREVIEW_CARD_PADDING,
                      }}
                    >
                      <div style={{ display: "grid", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                          <div style={{ display: "grid", gap: 2 }}>
                            <div style={{ fontSize: 12, fontWeight: 900, color: THEME.textFaint }}>Preview</div>
                            <div style={{ fontSize: 12, color: THEME.textFaint }}>Paper size: A4</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", paddingRight: 12 }}>
                          <ExportCheckboxRow checked={showPrintMargins} onChange={setShowPrintMargins} THEME={THEME} withAlpha={withAlpha}>
                            Show print margins
                          </ExportCheckboxRow>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
                            <button
                              type="button"
                              onClick={() => setPdfPageIndex((current) => Math.max(0, current - 1))}
                              disabled={currentPdfPageIndex <= 0}
                              style={{ ...microButton, width: 40, minWidth: 40, justifyContent: "center", opacity: currentPdfPageIndex <= 0 ? 0.45 : 1 }}
                            >
                              ←
                            </button>
                            <div style={{ fontSize: 12, fontWeight: 900, color: THEME.text, textAlign: "center", whiteSpace: "nowrap", minWidth: 118 }}>
                              A4 • Page {currentPdfPageIndex + 1} of {Math.max(pageCount, 1)}
                            </div>
                            <button
                              type="button"
                              onClick={() => setPdfPageIndex((current) => Math.min(Math.max(pageCount - 1, 0), current + 1))}
                              disabled={currentPdfPageIndex >= pageCount - 1}
                              style={{ ...microButton, width: 40, minWidth: 40, justifyContent: "center", opacity: currentPdfPageIndex >= pageCount - 1 ? 0.45 : 1 }}
                            >
                              →
                            </button>
                          </div>
                        </div>
                      </div>
                      <div
                        ref={pdfWorkspaceRef}
                        style={{
                          minHeight: 0,
                          height: "100%",
                          overflow: "hidden",
                          padding: PREVIEW_SURFACE_PADDING,
                          background: "#0f0f10",
                          borderRadius: 12,
                          border: `1px solid ${withAlpha(THEME.text, 0.08)}`,
                          display: "grid",
                          placeItems: "center",
                          boxSizing: "border-box",
                        }}
                        onPointerDown={(event) => {
                          if (pdfZoomScale <= fitScale) return;
                          pdfPanStateRef.current = {
                            dragging: true,
                            startX: event.clientX,
                            startY: event.clientY,
                            originX: pdfPanOffset.x,
                            originY: pdfPanOffset.y,
                          };
                        }}
                      >
                        <div
                          style={{
                            width: `${pageDisplayWidth}px`,
                            aspectRatio: `${pdfPreviewLayout.pageW} / ${pdfPreviewLayout.pageH}`,
                            background: "#ffffff",
                            borderRadius: 6,
                            boxShadow: "0 8px 25px rgba(0,0,0,0.35)",
                            position: "relative",
                            overflow: "hidden",
                            transform: `translate(${pdfPanOffset.x}px, ${pdfPanOffset.y}px)`,
                            cursor: pdfZoomScale > fitScale ? (pdfPanStateRef.current.dragging ? "grabbing" : "grab") : "default",
                          }}
                        >
                          {showPrintMargins ? (
                            <div
                              aria-hidden="true"
                              style={{
                                position: "absolute",
                                top: `${(20 / 297) * 100}%`,
                                bottom: `${(20 / 297) * 100}%`,
                                left: `${(20 / 210) * 100}%`,
                                right: `${(20 / 210) * 100}%`,
                                border: "1px dashed rgba(0,0,0,0.15)",
                                pointerEvents: "none",
                              }}
                            />
                          ) : null}
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              padding: `${pdfPreviewLayout.margin * pdfZoomScale}px`,
                              boxSizing: "border-box",
                            }}
                          >
                            <div
                              style={{
                                position: "relative",
                                width: "100%",
                                minHeight: "100%",
                                fontFamily:
                                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                fontSize: `${Math.max(7, pdfPreviewLayout.fontSize * pdfZoomScale)}px`,
                                lineHeight: `${Math.max(8, pdfPreviewLayout.lineH * pdfZoomScale)}px`,
                                color: "#111111",
                              }}
                            >
                              <div
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: `${pdfPreviewLayout.footerReserved * pdfZoomScale}px`,
                                }}
                              >
                                {(currentPdfPage.contentLines || []).map((ln, lineIndex) => (
                                  <div
                                    key={`pdf-preview-page-${currentPdfPageIndex}-line-${lineIndex}`}
                                    style={{
                                      whiteSpace: "pre",
                                      fontWeight:
                                        imageThickness === "A"
                                          ? 500
                                          : imageThickness === "C"
                                            ? 900
                                            : ln?.font === "F2"
                                              ? 800
                                              : 500,
                                    }}
                                  >
                                    {String(ln?.text || "").length ? String(ln.text) : "\u00A0"}
                                  </div>
                                ))}
                              </div>
                              <div
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  bottom: `${pdfPreviewLayout.footerBottomInset * pdfZoomScale}px`,
                                  right: `${Math.max(56, 110 * pdfZoomScale)}px`,
                                }}
                              >
                                <div style={{ whiteSpace: "pre", fontWeight: 500, overflow: "hidden", textOverflow: "clip", color: "rgba(0,0,0,0.58)" }}>
                                  {currentPdfPage.footerLeft || "\u00A0"}
                                </div>
                              </div>
                              <div
                                style={{
                                  position: "absolute",
                                  right: 0,
                                  bottom: `${pdfPreviewLayout.footerBottomInset * pdfZoomScale}px`,
                                  width: `${Math.max(48, 100 * pdfZoomScale)}px`,
                                  textAlign: "right",
                                }}
                              >
                                <div style={{ whiteSpace: "pre", fontWeight: 500, color: "rgba(0,0,0,0.58)" }}>{currentPdfPage.footerRight || "\u00A0"}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeExportFormat === "video" ? (
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
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gap: 10,
                          minHeight: 0,
                          overflowY: "auto",
                          paddingRight: 4,
                          alignContent: "start",
                          gridAutoRows: "max-content",
                        }}
                      >
                        {exportFormatIntro}
                        <div style={accordionShellStyle(videoSettingsOpenSection === "settings")}>
                          <button
                            type="button"
                            onClick={() => toggleVideoSettingsSection("settings")}
                            style={exportAccordionTriggerStyle("video-settings", videoSettingsOpenSection === "settings")}
                            {...accordionTriggerHandlers("video-settings")}
                          >
                            {accordionTriggerContent("Video Settings", videoSettingsOpenSection === "settings")}
                          </button>
                          {videoSettingsOpenSection === "settings" && (
                            <div style={{ ...accordionContentStyle, maxHeight: largePanelMaxHeight, overflowY: "auto" }}>
                              <div style={{ display: "grid", gap: 6 }}>
                                <div style={{ fontSize: 12, color: THEME.textFaint }}>Playback speed</div>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  {[1, 0.75, 0.6].map((speed) => (
                                    <button
                                      key={`video-speed-${speed}`}
                                      type="button"
                                      onClick={() => setVideoPlaybackSpeed(speed)}
                                      {...exportButtonHandlers(`video-speed-${speed}`)}
                                      style={choiceButtonStyle(videoPlaybackSpeed === speed, buttonHoverKey === `video-speed-${speed}`)}
                                    >
                                      {speed}x
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div style={{ display: "grid", gap: 6 }}>
                                <div style={{ fontSize: 12, color: THEME.textFaint }}>Background</div>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  <button
                                    type="button"
                                    onClick={() => setVideoBgMode("transparent")}
                                    {...exportButtonHandlers("video-bg-transparent")}
                                    style={choiceButtonStyle(videoBgMode === "transparent", buttonHoverKey === "video-bg-transparent")}
                                  >
                                    Transparent
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setVideoBgMode("solid")}
                                    {...exportButtonHandlers("video-bg-solid")}
                                    style={choiceButtonStyle(videoBgMode === "solid", buttonHoverKey === "video-bg-solid")}
                                  >
                                    Black / Color
                                  </button>
                                </div>
                                {videoBgMode === "solid" && (
                                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: THEME.textFaint }}>
                                    Background color
                                    <input
                                      type="color"
                                      value={videoBgColor}
                                      onChange={(e) => setVideoBgColor(normalizeHexColorOrFallback(e.target.value, "#000000"))}
                                      style={{ width: 38, height: 26, padding: 0, border: "none", background: "transparent" }}
                                    />
                                  </label>
                                )}
                              </div>
                              <div style={{ display: "grid", gap: 6 }}>
                                <div style={{ fontSize: 12, color: THEME.textFaint }}>Animation style</div>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  {[
                                    ["row", "Row highlight"],
                                    ["note", "Note highlight"],
                                    ["both", "Row + note"],
                                  ].map(([id, label]) => (
                                    <button
                                      key={`video-anim-${id}`}
                                      type="button"
                                      onClick={() => setVideoAnimationStyle(id)}
                                      {...exportButtonHandlers(`video-anim-${id}`)}
                                      style={choiceButtonStyle(videoAnimationStyle === id, buttonHoverKey === `video-anim-${id}`)}
                                    >
                                      {label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div style={{ display: "grid", gap: 6 }}>
                                <div style={{ fontSize: 12, color: THEME.textFaint }}>Creator promotion</div>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  {[
                                    ["clean", "Clean export"],
                                    ["tabstudio", "TabStudio watermark"],
                                    ["affiliate", "Affiliate watermark"],
                                  ].map(([id, label]) => (
                                    <button
                                      key={`video-branding-${id}`}
                                      type="button"
                                      onClick={() => setVideoBrandingMode(id)}
                                      {...exportButtonHandlers(`video-branding-${id}`)}
                                      style={choiceButtonStyle(videoBrandingMode === id, buttonHoverKey === `video-branding-${id}`)}
                                    >
                                      {label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div style={accordionShellStyle(videoSettingsOpenSection === "sync")}>
                          <button
                            type="button"
                            onClick={() => toggleVideoSettingsSection("sync")}
                            style={exportAccordionTriggerStyle("video-sync", videoSettingsOpenSection === "sync")}
                            {...accordionTriggerHandlers("video-sync")}
                          >
                            {accordionTriggerContent("Sync Source", videoSettingsOpenSection === "sync")}
                          </button>
                          {videoSettingsOpenSection === "sync" && (
                            <div style={{ ...accordionContentStyle, maxHeight: mediumPanelMaxHeight, overflowY: "auto" }}>
                              <div style={{ display: "grid", gap: 6 }}>
                                <input
                                  type="file"
                                  accept="audio/*"
                                  onChange={(e) => handleVideoAudioFileChange(e.target.files?.[0] || null)}
                                  className={supportFormFieldClass}
                                />
                                <div style={{ fontSize: 12, color: THEME.textFaint }}>
                                  {videoAudioName ? `Loaded audio: ${videoAudioName}` : "Load an audio track, then sync note-by-note with Space or Tap Next."}
                                </div>
                                {videoAudioUrl && <audio ref={videoAudioRef} src={videoAudioUrl} controls style={{ width: "100%" }} />}
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  {[1, 0.75, 0.5].map((speed) => (
                                    <button
                                      key={`video-audio-speed-${speed}`}
                                      type="button"
                                      onClick={() => setVideoAudioPlaybackRate(speed)}
                                      {...exportButtonHandlers(`video-audio-speed-${speed}`)}
                                      style={choiceButtonStyle(videoAudioPlaybackRate === speed, buttonHoverKey === `video-audio-speed-${speed}`)}
                                    >
                                      Audio {speed}x
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div style={accordionShellStyle(tapSyncOpen)}>
                          <button
                            type="button"
                            onClick={() => {
                              if (!canUseTapToSync) {
                                showMembershipGateToast("tap-sync");
                                return;
                              }
                              setTapSyncOpen((v) => !v);
                            }}
                            style={{
                              ...exportAccordionTriggerStyle("video-tapsync", tapSyncOpen),
                              color: tapSyncOpen ? THEME.text : THEME.text,
                            }}
                            {...accordionTriggerHandlers("video-tapsync")}
                          >
                            {accordionTriggerContent("Tap to Sync", tapSyncOpen)}
                          </button>
                          {tapSyncOpen && (
                            <div style={{ ...accordionContentStyle, gap: 10 }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                                <div style={{ display: "grid", gap: 3 }}>
                                  <div style={{ fontWeight: 950, fontSize: 14 }}>Tap to Sync</div>
                                  <div style={{ fontSize: 12, color: THEME.textFaint }}>
                                    Press Start Sync, then click each note or row in time as the music plays.
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                  <button
                                    type="button"
                                    onClick={() => setTapSyncMode("note")}
                                    {...exportButtonHandlers("tap-sync-note")}
                                    style={choiceButtonStyle(tapSyncMode === "note", buttonHoverKey === "tap-sync-note", { height: 32 })}
                                  >
                                    Note Sync
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTapSyncMode("row")}
                                    {...exportButtonHandlers("tap-sync-row")}
                                    style={choiceButtonStyle(tapSyncMode === "row", buttonHoverKey === "tap-sync-row", { height: 32 })}
                                  >
                                    Row Sync
                                  </button>
                                </div>
                              </div>

                              <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
                                <ExportCheckboxRow checked={tapSyncShowTimestamps} onChange={setTapSyncShowTimestamps} THEME={THEME} withAlpha={withAlpha}>
                                  Show timestamps on synced items
                                </ExportCheckboxRow>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: THEME.textFaint, flexWrap: "wrap" }}>
                                  <span style={{ color: THEME.text }}>Replay highlight duration</span>
                                  <ExportCompactSelect
                                    value={tapSyncReplayDuration}
                                    onChange={setTapSyncReplayDuration}
                                    options={[
                                      { value: "short", label: "Short" },
                                      { value: "medium", label: "Medium" },
                                      { value: "long", label: "Long" },
                                    ]}
                                    THEME={THEME}
                                    withAlpha={withAlpha}
                                    width={108}
                                  />
                                </div>
                                <ExportCheckboxRow checked={tapSyncReplaceOnClick} onChange={setTapSyncReplaceOnClick} THEME={THEME} withAlpha={withAlpha}>
                                  Replace Existing Timestamps on Click
                                </ExportCheckboxRow>
                                <ExportCheckboxRow checked={tapSyncAutoScroll} onChange={setTapSyncAutoScroll} THEME={THEME} withAlpha={withAlpha}>
                                  Replay Auto-Scroll
                                </ExportCheckboxRow>
                              </div>

                              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                <button type="button" onClick={startTapSyncRecording} disabled={tapSyncRecording} style={{ ...btnSecondary, height: 34, opacity: tapSyncRecording ? 0.6 : 1 }}>
                                  Start Sync
                                </button>
                                <button type="button" onClick={stopTapSyncRecording} disabled={!tapSyncRecording} style={{ ...btnSecondary, height: 34, opacity: tapSyncRecording ? 1 : 0.6 }}>
                                  Stop Sync
                                </button>
                                <button type="button" onClick={replayTapSync} disabled={tapSyncReplayRunning} style={{ ...btnSecondary, height: 34, opacity: tapSyncReplayRunning ? 0.6 : 1 }}>
                                  Replay Preview
                                </button>
                                <button type="button" onClick={() => clearTapSyncForMode(tapSyncMode)} style={{ ...btnSecondary, height: 34 }}>
                                  Clear Timings
                                </button>
                                <button type="button" onClick={redoTapSync} style={{ ...btnSecondary, height: 34 }}>
                                  Redo Sync
                                </button>
                                <span style={{ fontSize: 12, color: THEME.textFaint, marginLeft: "auto" }}>{tapSyncStatusText}</span>
                              </div>

                              <div style={{ ...card, padding: 8 }}>
                                {tapSyncTimingCount === 0 ? (
                                  <div style={{ fontSize: 12, color: THEME.textFaint }}>No sync timings recorded yet.</div>
                                ) : (
                                  <div style={{ display: "grid", gap: 6 }}>
                                    {tapSyncMode === "note"
                                      ? Object.entries(tapSyncNoteTimings)
                                          .sort((a, b) => Number(a[1]) - Number(b[1]))
                                          .map(([id, ms]) => (
                                            <div key={id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                              <span style={{ color: THEME.textFaint }}>Cell {id.replace(":", ", ")}</span>
                                              <span style={{ color: THEME.text }}>{formatTapSyncTimestamp(ms)}</span>
                                            </div>
                                          ))
                                      : Object.entries(tapSyncRowTimings)
                                          .sort((a, b) => Number(a[1]) - Number(b[1]))
                                          .map(([id, ms]) => {
                                            const row = completedRows.find((x) => String(x.id) === String(id));
                                            return (
                                              <div key={id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                                <span style={{ color: THEME.textFaint }}>{row?.name || "Row"}</span>
                                                <span style={{ color: THEME.text }}>{formatTapSyncTimestamp(ms)}</span>
                                              </div>
                                            );
                                          })}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div style={accordionShellStyle(videoSettingsOpenSection === "rows")}>
                          <button
                            type="button"
                            onClick={() => toggleVideoSettingsSection("rows")}
                            style={exportAccordionTriggerStyle("video-rows", videoSettingsOpenSection === "rows")}
                            {...accordionTriggerHandlers("video-rows")}
                          >
                            {accordionTriggerContent("Row Selection + Sync", videoSettingsOpenSection === "rows")}
                          </button>
                          {videoSettingsOpenSection === "rows" && (
                            <div style={{ ...accordionContentStyle, maxHeight: extraLargePanelMaxHeight, overflowY: "auto" }}>
                              <div style={{ fontSize: 12, color: THEME.textFaint }}>
                                {selectedExportCount} rows selected · {selectedExportVideoNoteCount} notes · {selectedExportMissingVideoSyncCount} unsynced
                              </div>
                              <button
                                type="button"
                                onClick={() => setImageExportRowIds([])}
                                style={{ ...btnSecondary, justifySelf: "start", height: 30, padding: "0 10px", fontSize: 13 }}
                              >
                                Clear selection
                              </button>
                              <div style={{ ...card, borderRadius: 10, padding: 8, display: "grid", gap: 6, maxHeight: 180, overflowY: "auto" }}>
                                {completedRows.length === 0 ? (
                                  <div style={{ fontSize: 12, color: THEME.textFaint }}>No completed rows yet.</div>
                                ) : (
                                  completedRows.map((row, idx) => {
                                    const checked = imageExportRowIds.includes(row.id);
                                    const rowLabel = makeExportRowLabel(row, idx);
                                    const rowNotes = collectVideoSyncNoteSequence([row]);
                                    const missingForRow = rowNotes.filter((n) => !Number.isFinite(Number(videoSyncTimings[n.id]))).length;
                                    return (
                                      <div key={`video-row-pick-${row.id}`} style={{ display: "grid", gap: 4 }}>
                                        <ExportCheckboxRow
                                          checked={checked}
                                          onChange={() => toggleImageExportRow(row.id)}
                                          THEME={THEME}
                                          withAlpha={withAlpha}
                                          trailing={
                                            checked ? (
                                              <span style={{ marginLeft: "auto", fontSize: 11, color: missingForRow ? THEME.textFaint : TABBY_ASSIST_MINT }}>
                                                {missingForRow ? `${missingForRow} missing` : "Synced"}
                                              </span>
                                            ) : null
                                          }
                                        >
                                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 800 }}>
                                            {rowLabel}
                                          </span>
                                        </ExportCheckboxRow>
                                        {checked && (
                                          <button
                                            type="button"
                                            onClick={() => clearVideoSyncRow(row.id)}
                                            style={{ ...btnSecondary, height: 28, justifySelf: "start", fontSize: 11, padding: "0 8px" }}
                                          >
                                            Clear row sync
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <button type="button" onClick={startVideoSyncRecording} style={{ ...btnSecondary, height: 34 }} disabled={videoSyncRecording}>
                                  Start Sync
                                </button>
                                <button type="button" onClick={stopVideoSyncRecording} style={{ ...btnSecondary, height: 34 }} disabled={!videoSyncRecording}>
                                  Stop Sync
                                </button>
                                <button type="button" onClick={recordNextVideoSyncPoint} style={{ ...btnSecondary, height: 34 }} disabled={!videoSyncRecording}>
                                  Tap Next (Space)
                                </button>
                                <button type="button" onClick={clearVideoSyncAll} style={{ ...btnSecondary, height: 34 }}>
                                  Clear All Timings
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "grid", gap: 10, marginTop: "auto", alignSelf: "end", paddingTop: 12 }}>
                        <div style={{ fontSize: 12, color: THEME.textFaint, minHeight: 16 }}>{videoExportProgress}</div>
                        <button
                          type="button"
                          disabled={videoExportBusy || !canExportVideoNow}
                          onClick={exportVideoNow}
                          style={accentActionButtonStyle({ disabled: videoExportBusy || !canExportVideoNow })}
                        >
                          {videoExportBusy ? "Exporting..." : "Export Video"}
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        ...denseCard,
                        display: "grid",
                        gridTemplateRows: "auto minmax(0,1fr)",
                        gap: 10,
                        minHeight: 0,
                        height: EXPORT_CARD_HEIGHT,
                        alignSelf: "start",
                        padding: PREVIEW_CARD_PADDING,
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 900, color: THEME.textFaint }}>Preview</div>
                      <div
                        style={{
                          border: `1px solid ${THEME.border}`,
                          borderRadius: 12,
                          minHeight: 0,
                          height: "100%",
                          padding: PREVIEW_SURFACE_PADDING,
                          background: THEME.surface,
                          overflow: "auto",
                          display: "grid",
                          alignContent: "start",
                          gap: 10,
                          boxSizing: "border-box",
                        }}
                      >
                        <div style={{ fontSize: 12, color: THEME.textFaint }}>
                          1920 x 1080 video export. Playback is row-by-row with synced note highlights.
                        </div>
                        <div style={{ fontSize: 12, color: THEME.textFaint }}>
                          Next sync target:{" "}
                          <b style={{ color: THEME.text }}>
                            {selectedExportVideoNotes[videoSyncCursorIndex]
                              ? `${selectedExportVideoNotes[videoSyncCursorIndex].rowName || "Row"} · string ${selectedExportVideoNotes[videoSyncCursorIndex].stringIndex + 1}, col ${selectedExportVideoNotes[videoSyncCursorIndex].colIndex + 1}`
                              : "All selected notes synced"}
                          </b>
                        </div>
                        <div style={{ ...card, padding: 8, display: "grid", gap: 6 }}>
                          {selectedExportVideoNoteCount <= 0 ? (
                            <div style={{ fontSize: 12, color: THEME.textFaint }}>Select rows with notes to enable sync.</div>
                          ) : (
                            <div style={{ display: "grid", gap: 4 }}>
                              <div style={{ fontSize: 12, color: THEME.textFaint }}>
                                Synced notes: {selectedExportVideoNoteCount - selectedExportMissingVideoSyncCount} / {selectedExportVideoNoteCount}
                              </div>
                              <div style={{ fontSize: 12, color: THEME.textFaint }}>
                                Missing sync: {selectedExportMissingVideoSyncCount}
                              </div>
                              <div style={{ fontSize: 12, color: THEME.textFaint }}>
                                Export speed: {videoPlaybackSpeed}x
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
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
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gap: 10,
                          minHeight: 0,
                          overflowY: "auto",
                          paddingRight: 4,
                          alignContent: "start",
                          gridAutoRows: "max-content",
                        }}
                      >
                        {exportFormatIntro}
                        <div style={accordionShellStyle(imageSettingsOpenSection === "rows")}>
                        <button
                          type="button"
                          onClick={() => toggleImageSettingsSection("rows")}
                          style={exportAccordionTriggerStyle("image-rows", imageSettingsOpenSection === "rows")}
                          {...accordionTriggerHandlers("image-rows")}
                        >
                          {accordionTriggerContent("Row Settings", imageSettingsOpenSection === "rows")}
                        </button>
                        {imageSettingsOpenSection === "rows" && (
                          <div style={{ ...accordionContentStyle, maxHeight: largePanelMaxHeight, overflowY: "auto" }}>
                            <div style={{ fontSize: 13, color: THEME.text }}>
                              {selectedExportCount} row{selectedExportCount === 1 ? "" : "s"} selected
                            </div>
                            <ExportCheckboxRow checked={imageShowRowNames} onChange={setImageShowRowNames} THEME={THEME} withAlpha={withAlpha}>
                              Show row names
                            </ExportCheckboxRow>
                            <button
                              type="button"
                              onClick={() => {
                                setImageExportRowIds([]);
                              }}
                              style={{ ...btnSecondary, justifySelf: "start", height: 30, padding: "0 10px", fontSize: 13 }}
                            >
                              Clear selection
                            </button>
                            {selectedExportCount > 1 && (
                              <div style={{ display: "grid", gap: 8, marginTop: 2 }}>
                                <div style={{ fontSize: 12, fontWeight: 900, color: THEME.textFaint }}>Multi-row export</div>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <button
                                    type="button"
                                    onClick={() => setImageMultiExportMode("individual")}
                                    {...exportButtonHandlers("image-mode-individual")}
                                    style={choiceButtonStyle(imageMultiExportMode === "individual", buttonHoverKey === "image-mode-individual")}
                                  >
                                    Export rows individually
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setImageMultiExportMode("combined")}
                                    {...exportButtonHandlers("image-mode-combined")}
                                    style={choiceButtonStyle(imageMultiExportMode === "combined", buttonHoverKey === "image-mode-combined")}
                                  >
                                    Export as single image
                                  </button>
                                </div>
                              </div>
                            )}
                            <div
                              style={{
                                ...card,
                                borderRadius: 10,
                                padding: 8,
                                display: "grid",
                                gap: 6,
                                maxHeight: compactPanelMaxHeight,
                                overflowY: "auto",
                              }}
                            >
                              {completedRows.length === 0 ? (
                                <div style={{ fontSize: 12, color: THEME.textFaint }}>No completed rows yet.</div>
                              ) : (
                                completedRows.map((row, idx) => {
                                  const checked = imageExportRowIds.includes(row.id);
                                  const rowLabel = makeExportRowLabel(row, idx);
                                  return (
                                    <ExportCheckboxRow key={row.id} checked={checked} onChange={() => toggleImageExportRow(row.id)} THEME={THEME} withAlpha={withAlpha}>
                                      <span
                                        style={{
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          fontWeight: 800,
                                        }}
                                      >
                                        {rowLabel}
                                      </span>
                                    </ExportCheckboxRow>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={accordionShellStyle(imageSettingsOpenSection === "export")}>
                        <button
                          type="button"
                          onClick={() => toggleImageSettingsSection("export")}
                          style={exportAccordionTriggerStyle("image-export", imageSettingsOpenSection === "export")}
                          {...accordionTriggerHandlers("image-export")}
                        >
                          {accordionTriggerContent("Export Settings", imageSettingsOpenSection === "export")}
                        </button>
                        {imageSettingsOpenSection === "export" && (
                          <div style={{ ...accordionContentStyle, maxHeight: compactPanelMaxHeight, overflowY: "auto" }}>
                            <div style={{ display: "grid", gap: 10 }}>
                              <div style={{ display: "grid", gap: 8 }}>
                                <div style={{ fontSize: 12, color: THEME.textFaint }}>Size</div>
                                <ExportCompactSelect
                                  value={imageExportSize}
                                  options={PNG_EXPORT_SIZE_OPTIONS}
                                  onChange={setImageExportSize}
                                  THEME={THEME}
                                  withAlpha={withAlpha}
                                  width="100%"
                                />
                              </div>
                              <div style={{ display: "grid", gap: 8 }}>
                                <div style={{ fontSize: 12, color: THEME.textFaint }}>Padding</div>
                                <ExportCompactSelect
                                  value={imageExportPadding}
                                  options={PNG_EXPORT_PADDING_OPTIONS}
                                  onChange={setImageExportPadding}
                                  THEME={THEME}
                                  withAlpha={withAlpha}
                                  width="100%"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={accordionShellStyle(imageSettingsOpenSection === "text")}>
                        <button
                          type="button"
                          onClick={() => toggleImageSettingsSection("text")}
                          style={exportAccordionTriggerStyle("image-text", imageSettingsOpenSection === "text")}
                          {...accordionTriggerHandlers("image-text")}
                        >
                          {accordionTriggerContent("Text Settings", imageSettingsOpenSection === "text")}
                        </button>
                        {imageSettingsOpenSection === "text" && (
                          <div style={{ ...accordionContentStyle, maxHeight: mediumPanelMaxHeight, overflowY: "auto" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: THEME.textFaint }}>
                              Text color
                              <input
                                type="color"
                                value={imageTextColor}
                                onChange={(e) => setImageTextColor(normalizeHexColorOrFallback(e.target.value, "#ffffff"))}
                                style={{ width: 38, height: 26, padding: 0, border: "none", background: "transparent" }}
                              />
                            </label>
                            <div style={{ fontSize: 12, color: THEME.textFaint }}>Thickness</div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {[
                                ["A", "A (Thin)"],
                                ["B", "B (Medium)"],
                                ["C", "C (Thick)"],
                              ].map(([id, label]) => (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={() => setImageThickness(id)}
                                  {...exportButtonHandlers(`image-thickness-${id}`)}
                                  style={choiceButtonStyle(imageThickness === id, buttonHoverKey === `image-thickness-${id}`, { height: 34 })}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                            <div style={{ fontSize: 12, color: THEME.textFaint }}>Text outline</div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {[
                                ["off", "Off"],
                                ["subtle", "Subtle"],
                                ["strong", "Strong"],
                              ].map(([id, label]) => (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={() => setImageTextOutline(id)}
                                  {...exportButtonHandlers(`image-outline-${id}`)}
                                  style={choiceButtonStyle(imageTextOutline === id, buttonHoverKey === `image-outline-${id}`, { height: 34 })}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={accordionShellStyle(imageSettingsOpenSection === "background")}>
                        <button
                          type="button"
                          onClick={() => toggleImageSettingsSection("background")}
                          style={exportAccordionTriggerStyle("image-background", imageSettingsOpenSection === "background")}
                          {...accordionTriggerHandlers("image-background")}
                        >
                          {accordionTriggerContent("Background Settings", imageSettingsOpenSection === "background")}
                        </button>
                        {imageSettingsOpenSection === "background" && (
                          <div style={{ ...accordionContentStyle, maxHeight: compactPanelMaxHeight, overflowY: "auto" }}>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                type="button"
                                onClick={() => setImageBgMode("transparent")}
                                {...exportButtonHandlers("image-bg-transparent")}
                                style={choiceButtonStyle(imageBgMode === "transparent", buttonHoverKey === "image-bg-transparent")}
                              >
                                Transparent
                              </button>
                              <button
                                type="button"
                                onClick={() => setImageBgMode("solid")}
                                {...exportButtonHandlers("image-bg-solid")}
                                style={choiceButtonStyle(imageBgMode === "solid", buttonHoverKey === "image-bg-solid")}
                              >
                                Solid colour
                              </button>
                            </div>
                            {imageBgMode === "solid" && (
                              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: THEME.textFaint }}>
                                Background color
                                <input
                                  type="color"
                                  value={imageBgColor}
                                  onChange={(e) => setImageBgColor(normalizeHexColorOrFallback(e.target.value, "#000000"))}
                                  style={{ width: 38, height: 26, padding: 0, border: "none", background: "transparent" }}
                                />
                              </label>
                            )}
                          </div>
                        )}
                      </div>

                      <div style={accordionShellStyle(imageSettingsOpenSection === "details")}>
                        <button
                          type="button"
                          onClick={() => toggleImageSettingsSection("details")}
                          style={exportAccordionTriggerStyle("image-details", imageSettingsOpenSection === "details")}
                          {...accordionTriggerHandlers("image-details")}
                        >
                          {accordionTriggerContent("Song Details", imageSettingsOpenSection === "details")}
                        </button>
                        {imageSettingsOpenSection === "details" && (
                          <div style={{ ...accordionContentStyle, gap: 4, fontSize: 12, color: THEME.textFaint, maxHeight: compactPanelMaxHeight, overflowY: "auto" }}>
                            <ExportCheckboxRow checked={imageShowArtist} onChange={setImageShowArtist} THEME={THEME} withAlpha={withAlpha}>Artist</ExportCheckboxRow>
                            <ExportCheckboxRow checked={imageShowAlbum} onChange={setImageShowAlbum} THEME={THEME} withAlpha={withAlpha}>Album</ExportCheckboxRow>
                            <ExportCheckboxRow checked={imageShowSong} onChange={setImageShowSong} THEME={THEME} withAlpha={withAlpha}>Song name</ExportCheckboxRow>
                            <ExportCheckboxRow checked={imageShowInstrument} onChange={setImageShowInstrument} THEME={THEME} withAlpha={withAlpha}>Instrument</ExportCheckboxRow>
                            <ExportCheckboxRow checked={imageShowTuning} onChange={setImageShowTuning} THEME={THEME} withAlpha={withAlpha}>Tuning</ExportCheckboxRow>
                            <ExportCheckboxRow checked={imageShowCapo} onChange={setImageShowCapo} THEME={THEME} withAlpha={withAlpha}>Capo</ExportCheckboxRow>
                            {showTempoControl && (
                              <ExportCheckboxRow checked={imageShowTempo} onChange={setImageShowTempo} THEME={THEME} withAlpha={withAlpha}>Tempo</ExportCheckboxRow>
                            )}
                          </div>
                        )}
                      </div>

                      <div style={accordionShellStyle(imageSettingsOpenSection === "branding")}>
                        <button
                          type="button"
                          onClick={() => toggleImageSettingsSection("branding")}
                          style={exportAccordionTriggerStyle("image-branding", imageSettingsOpenSection === "branding")}
                          {...accordionTriggerHandlers("image-branding")}
                        >
                          {accordionTriggerContent("Branding", imageSettingsOpenSection === "branding")}
                        </button>
                        {imageSettingsOpenSection === "branding" && (
                          <div style={{ ...accordionContentStyle, gap: 4, fontSize: 12, color: THEME.textFaint, maxHeight: compactPanelMaxHeight, overflowY: "auto" }}>
                            <ExportCheckboxRow
                              checked={imageShowBranding}
                              onChange={setImageShowBranding}
                              THEME={THEME}
                              withAlpha={withAlpha}
                              disabled={exportBrandingLocked}
                            >
                              Include TabStudio link
                            </ExportCheckboxRow>
                            {exportBrandingLocked ? (
                              <div style={{ fontSize: 11, color: THEME.textFaint }}>Included on Band exports</div>
                            ) : null}
                            {hasAffiliateExportBranding ? (
                              <ExportCheckboxRow
                                checked={exportUseAffiliateBranding}
                                onChange={setExportUseAffiliateBranding}
                                THEME={THEME}
                                withAlpha={withAlpha}
                                disabled={!imageShowBranding}
                              >
                                Use my affiliate link
                              </ExportCheckboxRow>
                            ) : null}
                            {imageShowBranding ? <div style={{ fontSize: 11, color: THEME.textFaint }}>{exportBrandingText}</div> : null}
                          </div>
                        )}
                      </div>

                      </div>

                      <div style={{ display: "grid", gap: 8, marginTop: "auto", alignSelf: "end" }}>
                        <div style={{ fontSize: 12, color: THEME.textFaint, minHeight: 16 }}>{imageExportProgress}</div>
                        <button
                          type="button"
                          disabled={imageExportBusy || selectedExportCount === 0}
                          onClick={exportImagesNow}
                          style={accentActionButtonStyle({ disabled: imageExportBusy || selectedExportCount === 0 })}
                        >
                          {imageExportBusy ? "Exporting..." : "Export PNG"}
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        ...card,
                        padding: PREVIEW_CARD_PADDING,
                        display: "grid",
                        gridTemplateRows: "auto minmax(0,1fr)",
                        gap: 8,
                        minHeight: 0,
                        height: EXPORT_CARD_HEIGHT,
                        alignSelf: "start",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 900, color: THEME.textFaint }}>Preview</div>
                        <div style={{ fontSize: 11, color: THEME.textFaint, fontWeight: 800, textAlign: "right" }}>
                          {imagePreviewMetaText || (selectedExportCount > 0 ? "Preparing preview..." : "No rows selected")}
                        </div>
                      </div>
                      <div
                      style={{
                        border: `1px solid ${THEME.border}`,
                        borderRadius: 12,
                        padding: PREVIEW_SURFACE_PADDING,
                        minHeight: 0,
                        height: "100%",
                        overflow: "auto",
                        background: THEME.surface,
                        display: "grid",
                        placeItems: "center",
                        boxSizing: "border-box",
                      }}
                      >
                        {selectedExportCount <= 0 ? (
                          <div style={{ fontSize: 12, color: THEME.textFaint }}>Select at least one row to preview export output.</div>
                        ) : imagePreviewBusy ? (
                          <div style={{ fontSize: 12, color: THEME.textFaint }}>Rendering image preview...</div>
                        ) : imagePreviewUrl ? (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "grid",
                              placeItems: "center",
                              minHeight: 240,
                            }}
                          >
                            <div
                              style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                borderRadius: 10,
                                border: `1px solid ${withAlpha(THEME.accent, 0.4)}`,
                                boxShadow: `0 14px 28px ${withAlpha("#000000", THEME.isDark ? 0.28 : 0.14)}`,
                                overflow: "hidden",
                                ...(imageBgMode === "transparent" ? getTransparentPreviewSurface(imageTextColor) : { background: imageBgColor }),
                              }}
                            >
                              <img
                                src={imagePreviewUrl}
                                alt="Export image preview"
                                style={{
                                  display: "block",
                                  maxWidth: "min(100%, 920px)",
                                  maxHeight: "62vh",
                                  width: "auto",
                                  height: "auto",
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: THEME.textFaint }}>Unable to render preview.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
  );
}
