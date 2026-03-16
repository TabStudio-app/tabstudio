export function collectVideoSyncNoteSequence(rows) {
  const out = [];
  for (const row of rows || []) {
    if (!row || row.kind !== "tab") continue;
    const rowGrid = Array.isArray(row.grid) ? row.grid : [];
    for (let r = 0; r < rowGrid.length; r += 1) {
      const line = Array.isArray(rowGrid[r]) ? rowGrid[r] : [];
      for (let c = 0; c < line.length; c += 1) {
        const raw = String(line[c] ?? "").trim();
        if (!raw) continue;
        out.push({
          id: `${row.id}:${r}:${c}`,
          rowId: row.id,
          rowName: String(row.name || ""),
          stringIndex: r,
          colIndex: c,
          value: raw,
        });
      }
    }
  }
  return out;
}

export function formatTapSyncTimestamp(ms) {
  return `${(Number(ms || 0) / 1000).toFixed(2)}s`;
}

export const PNG_EXPORT_SIZE_OPTIONS = [
  { value: "social", label: "Social (Reels / TikTok)" },
  { value: "youtube", label: "YouTube (Landscape)" },
  { value: "original", label: "Original Size" },
];

export const PNG_EXPORT_PADDING_OPTIONS = [
  { value: "tight", label: "Tight" },
  { value: "normal", label: "Normal" },
  { value: "wide", label: "Wide" },
];

export function normalizePngExportSize(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return PNG_EXPORT_SIZE_OPTIONS.some((option) => option.value === normalized) ? normalized : "original";
}

export function normalizePngExportPadding(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return PNG_EXPORT_PADDING_OPTIONS.some((option) => option.value === normalized) ? normalized : "normal";
}

export function getPngExportPaddingPixels(value) {
  const normalized = normalizePngExportPadding(value);
  if (normalized === "tight") return { x: 18, y: 14 };
  if (normalized === "wide") return { x: 58, y: 46 };
  return { x: 34, y: 28 };
}

export function getPngExportTargetWidth(value) {
  const normalized = normalizePngExportSize(value);
  if (normalized === "social") return 900;
  if (normalized === "youtube") return 1400;
  return null;
}

export function getTransparentPreviewSurface(textColor = "#ffffff") {
  const lightText = /^#[0-9a-fA-F]{6}$/.test(String(textColor ?? "").trim())
    ? (() => {
        const safe = String(textColor).trim();
        const r = parseInt(safe.slice(1, 3), 16);
        const g = parseInt(safe.slice(3, 5), 16);
        const b = parseInt(safe.slice(5, 7), 16);
        const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        return luma >= 0.56;
      })()
    : true;
  const cellA = lightText ? "#2f3238" : "#ececec";
  const cellB = lightText ? "#24272d" : "#f8f8f8";
  return {
    backgroundColor: cellA,
    backgroundImage:
      `linear-gradient(45deg, ${cellB} 25%, transparent 25%), ` +
      `linear-gradient(-45deg, ${cellB} 25%, transparent 25%), ` +
      `linear-gradient(45deg, transparent 75%, ${cellB} 75%), ` +
      `linear-gradient(-45deg, transparent 75%, ${cellB} 75%)`,
    backgroundSize: "24px 24px",
    backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0",
  };
}

function pickVideoMimeType() {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return "";
  const preferred = [
    "video/mp4;codecs=h264",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return preferred.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function drawVideoFrame({
  ctx,
  width,
  height,
  rows,
  activeRowId = "",
  activeNoteId = "",
  progressLabel = "",
  backgroundMode = "solid",
  backgroundColor = "#000000",
  textColor = "#ffffff",
  includeBranding = false,
  includeAffiliateBranding = false,
  affiliateCode = "",
  animationStyle = "both",
  normalizeHexColorOrFallback,
  tabbyAssistMint,
  withAlpha,
}) {
  ctx.clearRect(0, 0, width, height);
  if (backgroundMode !== "transparent") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  const fg = normalizeHexColorOrFallback(textColor, "#ffffff");
  const subtle = withAlpha(fg, 0.72);
  const border = withAlpha(fg, 0.22);
  const rowBg = withAlpha(fg, 0.04);
  const activeRowBg = withAlpha(tabbyAssistMint, 0.2);
  const activeCellBg = withAlpha(tabbyAssistMint, 0.5);
  const activeCellBorder = withAlpha(tabbyAssistMint, 0.95);
  const pad = 42;
  const headerH = 54;
  const footerH = 34;
  const bodyTop = pad + headerH;
  const bodyBottom = height - pad - footerH;
  const availableH = Math.max(100, bodyBottom - bodyTop);
  const safeRows = rows.filter((r) => r?.kind === "tab");
  const rowGap = 12;
  const rowH = Math.max(84, Math.floor((availableH - rowGap * Math.max(0, safeRows.length - 1)) / Math.max(1, safeRows.length)));
  const innerPad = 12;

  ctx.fillStyle = fg;
  ctx.font = "700 24px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("TabStudio Video Export", pad, pad + 24);
  ctx.font = "600 13px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillStyle = subtle;
  ctx.fillText(progressLabel || "Rendering playback…", pad, pad + 46);

  safeRows.forEach((row, rowIndex) => {
    const y = bodyTop + rowIndex * (rowH + rowGap);
    const isActiveRow = String(activeRowId) === String(row.id);
    const showRowHighlight = animationStyle === "both" || animationStyle === "row";
    ctx.fillStyle = isActiveRow && showRowHighlight ? activeRowBg : rowBg;
    ctx.strokeStyle = isActiveRow && showRowHighlight ? withAlpha(tabbyAssistMint, 0.68) : border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect?.(pad, y, width - pad * 2, rowH, 12);
    if (!ctx.roundRect) {
      ctx.rect(pad, y, width - pad * 2, rowH);
    }
    ctx.fill();
    ctx.stroke();

    const label = String(row.name || `Row ${rowIndex + 1}`);
    ctx.font = "700 14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillStyle = fg;
    ctx.fillText(label, pad + innerPad, y + 20);

    const rowGrid = Array.isArray(row.grid) ? row.grid : [];
    const strings = rowGrid.length || 1;
    const cols = Math.max(1, Number(row.colsAtTime) || 1);
    const gridTop = y + 26;
    const gridH = rowH - 34;
    const lineGap = gridH / strings;
    const gridLeft = pad + innerPad;
    const gridRight = width - pad - innerPad;
    const cellW = (gridRight - gridLeft) / cols;

    for (let r = 0; r < strings; r += 1) {
      const cy = gridTop + lineGap * r + lineGap * 0.5;
      ctx.strokeStyle = withAlpha(fg, 0.34);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gridLeft, cy);
      ctx.lineTo(gridRight, cy);
      ctx.stroke();
      for (let c = 0; c < cols; c += 1) {
        const value = String(rowGrid?.[r]?.[c] ?? "").trim();
        if (!value) continue;
        const noteId = `${row.id}:${r}:${c}`;
        const showNoteHighlight = animationStyle === "both" || animationStyle === "note";
        const isActiveNote = showNoteHighlight && String(activeNoteId) === noteId;
        const x = gridLeft + c * cellW;
        if (isActiveNote) {
          ctx.fillStyle = activeCellBg;
          ctx.strokeStyle = activeCellBorder;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect?.(x + 1, cy - 12, Math.max(18, cellW - 2), 24, 7);
          if (!ctx.roundRect) ctx.rect(x + 1, cy - 12, Math.max(18, cellW - 2), 24);
          ctx.fill();
          ctx.stroke();
        }
        ctx.fillStyle = fg;
        ctx.font = "700 15px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(value, x + cellW * 0.5, cy);
      }
    }
  });

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = withAlpha(fg, 0.74);
  ctx.font = "600 12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
  if (includeBranding) ctx.fillText("tabstudio.app", pad, height - pad + 8);
  if (includeAffiliateBranding && String(affiliateCode || "").trim()) {
    ctx.fillText(`Affiliate: ${String(affiliateCode).trim()}`, width - pad - 260, height - pad + 8);
  }
}

export async function buildVideoExportBlob({
  rows,
  syncTimingsMs,
  playbackSpeed = 1,
  backgroundMode = "solid",
  backgroundColor = "#000000",
  textColor = "#ffffff",
  includeBranding = false,
  includeAffiliateBranding = false,
  affiliateCode = "",
  animationStyle = "both",
  onProgress,
  normalizeHexColorOrFallback,
  tabbyAssistMint,
  withAlpha,
}) {
  if (typeof window === "undefined") throw new Error("Video export is only available in browser.");
  const notes = collectVideoSyncNoteSequence(rows);
  if (!notes.length) throw new Error("No notes found in selected rows.");
  const missing = notes.find((n) => !Number.isFinite(Number(syncTimingsMs?.[n.id])));
  if (missing) throw new Error("Missing sync timings for selected rows.");

  const sortedNotes = notes
    .map((n) => ({ ...n, timestampMs: Number(syncTimingsMs[n.id]) }))
    .sort((a, b) => a.timestampMs - b.timestampMs);
  const firstTs = sortedNotes[0].timestampMs;
  const normalized = sortedNotes.map((n) => ({ ...n, relMs: Math.max(0, n.timestampMs - firstTs) }));
  const durationMs = Math.max(1200, normalized[normalized.length - 1].relMs + 1200);

  const canvas = document.createElement("canvas");
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to initialize video canvas.");

  const fps = 30;
  const frameInterval = 1000 / fps;
  const mimeType = pickVideoMimeType();
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks = [];
  recorder.ondataavailable = (event) => {
    if (event?.data && event.data.size > 0) chunks.push(event.data);
  };

  recorder.start(Math.max(150, Math.round(frameInterval * 2)));
  const scaledDuration = durationMs / Math.max(0.1, Number(playbackSpeed) || 1);
  const highlightMs = 220;
  let elapsed = 0;
  let frameCount = 0;
  while (elapsed <= scaledDuration + frameInterval) {
    const timelineMs = elapsed * Math.max(0.1, Number(playbackSpeed) || 1);
    let active = normalized[0];
    for (let i = 0; i < normalized.length; i += 1) {
      if (normalized[i].relMs <= timelineMs) active = normalized[i];
      else break;
    }
    const activeNote = normalized.find((n) => timelineMs >= n.relMs && timelineMs <= n.relMs + highlightMs) || active;
    drawVideoFrame({
      ctx,
      width: canvas.width,
      height: canvas.height,
      rows,
      activeRowId: active?.rowId || "",
      activeNoteId: activeNote?.id || "",
      progressLabel: `Frame ${frameCount + 1}`,
      backgroundMode,
      backgroundColor,
      textColor,
      includeBranding,
      includeAffiliateBranding,
      affiliateCode,
      animationStyle,
      normalizeHexColorOrFallback,
      tabbyAssistMint,
      withAlpha,
    });
    frameCount += 1;
    if (typeof onProgress === "function") onProgress({ frame: frameCount, totalFrames: Math.ceil(scaledDuration / frameInterval) });
    await new Promise((resolve) => setTimeout(resolve, frameInterval));
    elapsed += frameInterval;
  }

  await new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = (event) => reject(event?.error || new Error("Video recording failed."));
    recorder.stop();
  });

  const blobType = mimeType || "video/webm";
  return new Blob(chunks, { type: blobType });
}
