import { useEffect, useMemo, useRef, useState } from "react";
import logoLight from "./assets/15.png";
import logoDark from "./assets/16.png";
import heroDark from "./assets/tabstudio-hero-dark.png";
import heroLight from "./assets/tabstudio-hero-light.png";
import tabbyLight from "./assets/tabby-light-v1-transparent.png";
import tabbyDark from "./assets/tabby-dark-v1-transparent.png";

/**
 * App ordering is TOP->BOTTOM strings: [e, B, G, D, A, E] (high → low)
 * Tuning list is shown/stored as LOW → HIGH (E A D G B e)
 * We convert on apply by reversing.
 */

const DEFAULT_TUNING = ["e", "B", "G", "D", "A", "E"]; // high → low (app order)
const DEFAULT_COLS = 32;
const MIN_COLS = 1;
const MAX_COLS = 64;
const DEFAULT_COLS_AUTO_DELAY_MS = 3000;
const MIN_COLS_AUTO_DELAY_MS = 1000;
const MAX_COLS_AUTO_DELAY_MS = 10000;

const LS_USER_TUNINGS_KEY = "tab_editor_user_tunings_v1";
const LS_USER_CHORDS_KEY = "tab_editor_user_chords_v1";
const LS_CHORD_OVERRIDES_KEY = "tab_editor_chord_overrides_v1";
const LS_INSTRUMENT_FAVS_KEY = "tab_editor_instrument_favs_v1";
const LS_ACCENT_COLOR_KEY = "tabstudio_accent_color_v1";
const LS_DEFAULT_COLS_KEY = "tabstudio_default_cols_v1";
const LS_COLS_AUTO_DELAY_MS_KEY = "tabstudio_cols_auto_delay_ms_v1";
const LS_SCROLL_SCOPE_KEY = "tabstudio_scroll_scope_v1";
const LS_THEME_MODE_KEY = "tabstudio_theme_mode";
const LS_TABBY_MODE_KEY = "tabstudio_tabby_mode";
const LS_TABBY_HIGH_SCORE_KEY = "tabstudio_tabby_high_score";
const LS_UI_LANG_KEY = "tabstudio_ui_lang_v1";
const LS_FUN_TABBY_TOGGLE_KEY = "tabstudio_fun_tabby_toggle_v1";
const LS_FUN_PERSONAL_BEST_TOGGLE_KEY = "tabstudio_fun_personal_best_toggle_v1";
const LS_FUN_PARTY_MODE_TOGGLE_KEY = "tabstudio_fun_party_mode_toggle_v1";
const LS_FUN_MODE_MASTER_TOGGLE_KEY = "tabstudio_fun_mode_master_toggle_v1";
const LS_PERSONAL_BEST_COMPLETED_ROWS_KEY = "tabstudio_personal_best_completed_rows";
const LS_TABS_MILESTONES_TRIGGERED_KEY = "tabstudio_tabs_milestones_triggered";
const LS_FIRST_EXPORT_CELEBRATED_KEY = "tabstudio_first_export_celebrated";
const LS_RICKROLL_SEEN_KEY = "tabstudio_rickroll_seen";
const LS_SETTINGS_WIDE_KEY = "tabstudio_settings_wide_v1";
const LS_V1_CHECKLIST_STATE_KEY = "tabstudio_v1_checklist_state";
const LS_V1_CHECKLIST_HIDDEN_KEY = "tabstudio_v1_checklist_hidden";
const LS_V1_CHECKLIST_VERSION_KEY = "tabstudio_v1_checklist_version";
const V1_CHECKLIST_VERSION = "v1";
const TABSTUDIO_TUTORIAL_URL = "https://www.youtube.com/watch?v=Aq5WXmQQooo&list=RDAq5WXmQQooo&start_radio=1";
const TABS_CREATED_MILESTONES = [10, 25, 50, 100, 250, 500, 1000];
const V1_RELEASE_CHECKLIST = [
  {
    id: "phase0",
    title: "PHASE 0 — FREEZE + GUARDRAILS",
    items: [
      { id: "p0_scope_frozen", text: "V1 scope frozen (no new features unless bug-fix / launch-blocker)" },
      { id: "p0_fun_defaults_off", text: "Fun Mode defaults OFF (no surprises for serious users)" },
      { id: "p0_test_ui_removed", text: "All temporary test UI removed (test buttons, dev panels, etc.)" },
      { id: "p0_checklist_only", text: "Checklist is the ONLY internal tool UI accessible via logo" },
    ],
  },
  {
    id: "phase1",
    title: "PHASE 1 — CORE EDITOR SMOKE TEST (MUST PASS)",
    items: [
      { id: "p1_app_loads", text: "App loads without blank screen" },
      { id: "p1_grid_renders", text: "Grid renders correctly (no layout glitches)" },
      { id: "p1_click_cell_focus", text: "Click cell -> cursor/focus behaves correctly" },
      { id: "p1_typing_instant", text: "Typing is instant (no lag)" },
      { id: "p1_multiselect", text: "Multi-select works (mouse drag / modifier selection) and remains stable" },
      { id: "p1_clear_selected", text: "Delete/Backspace clears selected cells safely" },
      { id: "p1_tab_nav", text: "Tab/Shift+Tab navigation works correctly" },
      { id: "p1_arrow_nav", text: "Arrow key navigation works correctly" },
      { id: "p1_undo", text: "Undo works" },
      { id: "p1_redo", text: "Redo works" },
      { id: "p1_complete_row", text: "Complete Row works" },
      { id: "p1_completed_rows_render", text: "Completed rows render correctly" },
      { id: "p1_clear_all_visibility", text: "Clear All only appears when there is something to clear (confirm)" },
    ],
  },
  {
    id: "phase2",
    title: "PHASE 2 — TOOLBAR / MUSICAL CONTROLS",
    items: [
      { id: "p2_instrument", text: "Instrument dropdown works" },
      { id: "p2_columns", text: "Columns control works" },
      { id: "p2_tuning", text: "Tuning dropdown works" },
      { id: "p2_capo", text: "Capo control works" },
      { id: "p2_chords", text: "Chords menu works" },
      { id: "p2_insert", text: "Insert menu works and inserts correctly" },
      { id: "p2_dropdown_consistency", text: "All dropdowns open/close consistently and do not overlap weirdly" },
    ],
  },
  {
    id: "phase3",
    title: "PHASE 3 — SAVE / PROJECTS / EXPORT (CRITICAL)",
    items: [
      { id: "p3_save_btn", text: "Save button works reliably" },
      { id: "p3_save_shortcut", text: "Ctrl/Cmd+S works reliably (if implemented)" },
      { id: "p3_save_feedback", text: "Save feedback shown (success / error)" },
      { id: "p3_projects_open", text: "Projects list opens" },
      { id: "p3_reopen_matches", text: "Can reopen a project and it matches saved state" },
      { id: "p3_new_project", text: "Can create a new project without breaking state" },
      { id: "p3_export_works", text: "Export works (PDF/whatever export exists)" },
      { id: "p3_first_export_once", text: "First Export Glow triggers once (then never again)" },
      { id: "p3_export_state_safe", text: "Export never destroys editor state / selection" },
    ],
  },
  {
    id: "phase4",
    title: "PHASE 4 — DEFAULT \"REWARD\" UX (PROFESSIONAL, NOT GIMMICKY)",
    items: [
      { id: "p4_confetti_10", text: "Milestone confetti triggers at 10 tabs created" },
      { id: "p4_confetti_other", text: "Milestone confetti triggers at 25 / 50 / 100 / 250 / 500 / 1000" },
      { id: "p4_confetti_feel", text: "Confetti duration feels right (~1.5-2.2s), falls and fades, no strobe, no sound" },
      { id: "p4_once_each", text: "Milestones trigger only once each (persisted)" },
      { id: "p4_badges", text: "Account badges show clean pills: 10/25/50/100/250/500/1000 tabs" },
      { id: "p4_badges_wording", text: "Badges have no \"club\" wording and look premium/minimal" },
    ],
  },
  {
    id: "phase5",
    title: "PHASE 5 — UI POLISH CONSISTENCY",
    items: [
      { id: "p5_header_hierarchy", text: "Header hierarchy looks right (Save primary, Projects/Export secondary, utilities subtle)" },
      { id: "p5_cell_style", text: "Selected cell styling looks good (border + subtle tint)" },
      { id: "p5_dark_mode", text: "Works in dark mode default (white selection)" },
      { id: "p5_light_mode", text: "Works in light mode default (black selection)" },
      { id: "p5_accent", text: "Theme color selection works if user sets accent color" },
      { id: "p5_spacing", text: "No visual regressions in spacing/alignment" },
    ],
  },
  {
    id: "phase6",
    title: "PHASE 6 — FUN MODE (OPTIONAL, DISCOVERABLE)",
    items: [
      { id: "p6_fun_master", text: "Fun Mode master toggle works (OFF by default)" },
      { id: "p6_party", text: "Party Mode works (only on manual save) and lasts ~5s" },
      { id: "p6_tabby_shy", text: "Tabby \"shy & rare\" behaviour works (doesn't linger, hides quickly)" },
      { id: "p6_tabby_peek", text: "Tabby peek works on opening Settings (subtle, disappears when approached)" },
      { id: "p6_tabby_dizzy", text: "Tabby dizzy works on rapid instrument switching" },
      { id: "p6_rickroll", text: "Rickroll easter egg works (Fun Mode ON only, new tab, no editor interruption, playful copy only)" },
      { id: "p6_whack", text: "Whack-a-Tabby trigger via \"TABBY\" works and launches the in-grid game" },
      { id: "p6_assets", text: "Tabby assets checklist (ensure required images exist or fallback gracefully)" },
    ],
  },
  {
    id: "phase7",
    title: "PHASE 7 — MOBILE / DESKTOP GATING (TRUST CRITICAL)",
    items: [
      { id: "p7_mobile_landing_only", text: "Mobile users see marketing site only (NOT the editor)" },
      { id: "p7_desktop_editor", text: "Desktop users see editor/app as intended" },
      { id: "p7_mobile_screens", text: "Mobile landing includes screenshots inspired by guitar-pro style (clean, premium)" },
      { id: "p7_mobile_no_blanks", text: "No broken links / blank sections on mobile landing" },
      { id: "p7_mobile_layout", text: "Responsive layout has no sideways scroll / white gaps" },
    ],
  },
  {
    id: "phase8",
    title: "PHASE 8 — PRODUCTION CLEANUP",
    items: [
      { id: "p8_remove_dev", text: "Remove all dev-only UI (test controls, debug panels)" },
      { id: "p8_no_console", text: "No console errors in normal use" },
      { id: "p8_no_leaks", text: "No obvious memory leaks (party/confetti clean up correctly)" },
      { id: "p8_error_handling", text: "Basic error handling: save/export failures show a clear message" },
      { id: "p8_chrome_safari", text: "Final pass Chrome + Safari (especially Mac Safari)" },
    ],
  },
  {
    id: "phase9",
    title: "PHASE 9 — LAUNCH READINESS",
    items: [
      { id: "p9_domain_ssl", text: "Domain + SSL OK" },
      { id: "p9_support_email", text: "Support/contact email shown somewhere appropriate" },
      { id: "p9_pricing", text: "Pricing page ready (if applicable)" },
      { id: "p9_full_flow", text: "Create test user account and do full flow: create -> save -> reopen -> export" },
      { id: "p9_go_review", text: "Final \"V1 GO\" review: nothing feels unfinished/confusing for a first-time user" },
    ],
  },
];

const ACCENT_PRESETS = [
  { id: "red", label: "Red", hex: "#FF5A67" },
  { id: "yellow", label: "Yellow", hex: "#FFD166" },
  { id: "orange", label: "Orange", hex: "#FF9B42" },
  { id: "mint", label: "Mint", hex: "#5BD4A1" },
  { id: "blue", label: "Blue", hex: "#4D8DFF" },
  { id: "purple", label: "Purple", hex: "#9B7BFF" },
  { id: "pink", label: "Pink", hex: "#FF4DB8" },
  { id: "white", label: "White", hex: "#F5F5F5" },
  { id: "black", label: "Black (Best in Light Mode)", hex: "#1E1E1E" },
];

function normNote(s) {
  return String(s ?? "").trim().toLowerCase();
}

function isStandardTuning(tuning) {
  if (!Array.isArray(tuning) || tuning.length !== 6) return false;
  return tuning.map(normNote).join("|") === DEFAULT_TUNING.map(normNote).join("|");
}

// Frets: allow blank, 0–24
function clampFret(text) {
  if (text === "") return "";
  const n = Number(text);
  if (!Number.isFinite(n)) return "";
  if (n < 0) return "0";
  if (n > 24) return "24";
  return String(n);
}

function makeBlankGrid(rows, cols) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ""));
}
function clone2D(a) {
  return a.map((r) => r.slice());
}

function lowToHighToApp(lowToHigh) {
  // input LOW→HIGH like ["E","A","D","G","B","E"] -> app HIGH→LOW
  return (lowToHigh ?? []).slice().reverse().map((s) => String(s ?? "").trim());
}
function appToLowToHigh(appTuning) {
  return (appTuning ?? []).slice().reverse().map((s) => String(s ?? "").trim());
}
function formatLowToHighString(arr) {
  return (arr ?? []).map((s) => String(s ?? "").trim()).join(" ");
}

function hexToRgb(hex) {
  const clean = String(hex ?? "").trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const n = Number.parseInt(clean, 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
}
function withAlpha(hex, alpha) {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(91,212,161,${alpha})`;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}
function clampColsValue(value, fallback = DEFAULT_COLS) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(MIN_COLS, Math.min(MAX_COLS, Math.round(n)));
}
function clampColsAutoDelayMs(value, fallback = DEFAULT_COLS_AUTO_DELAY_MS) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(MIN_COLS_AUTO_DELAY_MS, Math.min(MAX_COLS_AUTO_DELAY_MS, Math.round(n)));
}
function readLocalStorageBool(key, fallback = false) {
  try {
    const raw = String(localStorage.getItem(key) ?? "").trim().toLowerCase();
    if (raw === "true") return true;
    if (raw === "false") return false;
  } catch {}
  return fallback;
}
function readLocalStorageObject(key, fallback = {}) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = JSON.parse(String(raw ?? "{}"));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  } catch {}
  return fallback;
}
function readMilestonesTriggered() {
  try {
    const raw = localStorage.getItem(LS_TABS_MILESTONES_TRIGGERED_KEY);
    const parsed = JSON.parse(String(raw ?? "[]"));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}
function countTabsInLibraryData(data) {
  let total = 0;
  for (const band of Array.isArray(data) ? data : []) {
    for (const album of Array.isArray(band?.albums) ? band.albums : []) {
      for (const song of Array.isArray(album?.songs) ? album.songs : []) {
        total += Array.isArray(song?.tabs) ? song.tabs.length : 0;
      }
    }
  }
  return total;
}
function formatTuningName(name) {
  const raw = String(name ?? "").trim();
  const m = /^(.*?)(?:\s*\(([^)]+)\))$/.exec(raw);
  if (!m) return raw;
  const base = String(m[1] ?? "").trim();
  const inner = String(m[2] ?? "").trim();
  // Remove note-list suffixes like "(E A D G)" from labels; keep non-note suffixes like "(Alt)".
  if (/^[A-Ga-g](?:[#b])?(?:\s+[A-Ga-g](?:[#b])?)*$/.test(inner)) return base || raw;
  return raw;
}

// -------- Instruments & Tunings --------

const INSTRUMENTS = [
  { id: "gtr6", group: "Guitar", label: "Guitar (6)", stringCount: 6 },
  { id: "gtr7", group: "Guitar", label: "Guitar (7)", stringCount: 7 },

  { id: "bass4", group: "Bass", label: "Bass (4)", stringCount: 4 },
  { id: "bass5", group: "Bass", label: "Bass (5)", stringCount: 5 },
  { id: "bass6", group: "Bass", label: "Bass (6)", stringCount: 6 },

  { id: "banjo4", group: "Banjo", label: "Banjo (4)", stringCount: 4 },
  { id: "banjo5", group: "Banjo", label: "Banjo (5)", stringCount: 5 },
  { id: "banjo6", group: "Banjo", label: "Banjo (6)", stringCount: 6 },

  { id: "uke4", group: "Ukulele", label: "Ukulele (4)", stringCount: 4 },
];

// 6-string guitar tunings (what you already had)
const TUNING_PRESETS_GTR6 = [
  { id: "standard", name: "Standard", lowToHigh: ["E", "A", "D", "G", "B", "E"] },

  { id: "drop_d", name: "Drop D", lowToHigh: ["D", "A", "D", "G", "B", "E"] },
  { id: "drop_csharp_alt", name: "Drop C# (Alt)", lowToHigh: ["C#", "A", "D", "G", "B", "E"] },
  { id: "drop_csharp", name: "Drop C#", lowToHigh: ["C#", "G#", "C#", "F#", "A#", "D#"] },
  { id: "drop_c", name: "Drop C", lowToHigh: ["C", "G", "C", "F", "A", "D"] },
  { id: "drop_b", name: "Drop B", lowToHigh: ["B", "Gb", "B", "E", "Ab", "Db"] },
  { id: "drop_a", name: "Drop A", lowToHigh: ["A", "E", "A", "D", "Gb", "B"] },

  { id: "open_g", name: "Open G", lowToHigh: ["D", "G", "D", "G", "B", "D"] },
  { id: "open_f", name: "Open F", lowToHigh: ["F", "A", "C", "F", "C", "F"] },
  { id: "open_e", name: "Open E", lowToHigh: ["E", "B", "E", "G#", "B", "E"] },
  { id: "open_d", name: "Open D", lowToHigh: ["D", "A", "D", "F#", "A", "D"] },
  { id: "open_c", name: "Open C", lowToHigh: ["C", "G", "C", "G", "C", "E"] },
  { id: "open_a", name: "Open A", lowToHigh: ["E", "A", "E", "A", "C#", "E"] },

  { id: "half_up", name: "Half step up", lowToHigh: ["E#", "A#", "D#", "G#", "B#", "E#"] },
  { id: "half_down", name: "Half step down", lowToHigh: ["Eb", "Ab", "Db", "Gb", "Bb", "Eb"] },
  { id: "full_down", name: "Full step down", lowToHigh: ["D", "G", "C", "F", "A", "D"] },

  { id: "dadgad", name: "DADGAD", lowToHigh: ["D", "A", "D", "G", "A", "D"] },
];

// 7-string guitar
const TUNING_PRESETS_GTR7 = [
  { id: "gtr7_standard", name: "Standard (B E A D G B E)", lowToHigh: ["B", "E", "A", "D", "G", "B", "E"] },
  { id: "gtr7_drop_a", name: "Drop A (A E A D G B E)", lowToHigh: ["A", "E", "A", "D", "G", "B", "E"] },
];

// Bass
const TUNING_PRESETS_BASS4 = [
  { id: "bass4_standard", name: "Standard (E A D G)", lowToHigh: ["E", "A", "D", "G"] },
  { id: "bass4_drop_d", name: "Drop D (D A D G)", lowToHigh: ["D", "A", "D", "G"] },
  { id: "bass4_full_down", name: "Full step down (D G C F)", lowToHigh: ["D", "G", "C", "F"] },
];

const TUNING_PRESETS_BASS5 = [
  { id: "bass5_standard", name: "Standard (B E A D G)", lowToHigh: ["B", "E", "A", "D", "G"] },
  { id: "bass5_high_c", name: "High C (E A D G C)", lowToHigh: ["E", "A", "D", "G", "C"] },
  { id: "bass5_drop_a", name: "Drop A (A E A D G)", lowToHigh: ["A", "E", "A", "D", "G"] },
  { id: "bass5_drop_c", name: "Drop C (C G C F A)", lowToHigh: ["C", "G", "C", "F", "A"] },
  { id: "bass5_drop_d", name: "Drop D (D E A D G)", lowToHigh: ["D", "E", "A", "D", "G"] },
  { id: "bass5_eb_standard", name: "Eb Standard (Bb Eb Ab Db Gb)", lowToHigh: ["Bb", "Eb", "Ab", "Db", "Gb"] },
];

const TUNING_PRESETS_BASS6 = [
  { id: "bass6_standard", name: "Standard (B E A D G C)", lowToHigh: ["B", "E", "A", "D", "G", "C"] },
  { id: "bass6_high_f", name: "High F (E A D G C F)", lowToHigh: ["E", "A", "D", "G", "C", "F"] },
];

// Banjos
const TUNING_PRESETS_BANJO4 = [
  { id: "banjo4_tenor_c", name: "Tenor C (C G D A)", lowToHigh: ["C", "G", "D", "A"] },
  { id: "banjo4_tenor_irish", name: "Tenor Irish (G D A E)", lowToHigh: ["G", "D", "A", "E"] },
  { id: "banjo4_plectrum", name: "Plectrum (C G B D)", lowToHigh: ["C", "G", "B", "D"] },
  { id: "banjo4_chicago", name: "Chicago (D G B E)", lowToHigh: ["D", "G", "B", "E"] },
];

const TUNING_PRESETS_BANJO5 = [
  { id: "banjo5_open_g", name: "Open G (G D G B D)", lowToHigh: ["G", "D", "G", "B", "D"] },
  { id: "banjo5_double_c", name: "Double C (G C G C D)", lowToHigh: ["G", "C", "G", "C", "D"] },
  { id: "banjo5_sawmill", name: "Sawmill (G D G C D)", lowToHigh: ["G", "D", "G", "C", "D"] },
  { id: "banjo5_open_d", name: "Open D (F# D F# A D)", lowToHigh: ["F#", "D", "F#", "A", "D"] },
];

const TUNING_PRESETS_BANJO6 = [
  {
    id: "banjo6_standard",
    name: "Standard (E A D G B E)",
    lowToHigh: ["E", "A", "D", "G", "B", "E"],
  },
  {
    id: "banjo6_open_g",
    name: "Open G (D G D G B D)",
    lowToHigh: ["D", "G", "D", "G", "B", "D"],
  },
  {
    id: "banjo6_five_string_style",
    name: "5-string style (g G D G B D)",
    lowToHigh: ["G", "G", "D", "G", "B", "D"],
  },
];

// Ukulele
const TUNING_PRESETS_UKE4 = [
  { id: "uke_standard_high_g", name: "Standard (High G)", lowToHigh: ["G", "C", "E", "A"] },
  { id: "uke_low_g", name: "Low G", lowToHigh: ["G", "C", "E", "A"] },
  { id: "uke_d_tuning", name: "D tuning", lowToHigh: ["A", "D", "F#", "B"] },
  { id: "uke_baritone", name: "Baritone", lowToHigh: ["D", "G", "B", "E"] },
];

// Built-in chord presets (for now: 6-string guitar standard only)
const PRESET_CHORDS = [
  { id: "preset_C", name: "C", frets: ["0", "1", "0", "2", "3", "x"] },
  { id: "preset_Cm", name: "Cm", frets: ["3", "4", "5", "5", "3", "x"] },

  { id: "preset_D", name: "D", frets: ["2", "3", "2", "0", "x", "x"] },
  { id: "preset_Dm", name: "Dm", frets: ["1", "3", "2", "0", "x", "x"] },

  { id: "preset_E", name: "E", frets: ["0", "0", "1", "2", "2", "0"] },
  { id: "preset_Em", name: "Em", frets: ["0", "0", "0", "2", "2", "0"] },

  { id: "preset_F", name: "F", frets: ["1", "1", "2", "3", "3", "1"] },

  { id: "preset_G", name: "G", frets: ["3", "0", "0", "0", "2", "3"] },

  { id: "preset_A", name: "A", frets: ["0", "2", "2", "2", "0", "x"] },
  { id: "preset_Am", name: "Am", frets: ["0", "1", "2", "2", "0", "x"] },

  { id: "preset_B", name: "B", frets: ["2", "4", "4", "4", "2", "x"] },
  { id: "preset_Bm", name: "Bm", frets: ["2", "3", "4", "4", "2", "x"] },
];

const INSERT_OPTIONS = [
  { label: "Muted note", insert: "x", mode: "cell" },
  { label: "Palm mute", insert: "PM", mode: "cell" },
  { label: "Slide up", insert: "/", mode: "cell" },
  { label: "Slide down", insert: "\\", mode: "cell" },
  { label: "Hammer-on", insert: "h", mode: "cell" },
  { label: "Pull-off", insert: "p", mode: "cell" },
  { label: "Vibrato", insert: "~", mode: "cell" },
  { label: "Bend (b)", insert: "b", mode: "cell" },

  { label: "End", insert: "|", mode: "column" },
  { label: "Rest", insert: "-", mode: "column" },
];

const SHORTCUTS_REFERENCE = [
  { action: "Undo", win: "Ctrl+Z", mac: "Cmd+Z", scope: "Global", description: "Undo the most recent change." },
  {
    action: "Redo",
    win: "Ctrl+Shift+Z / Ctrl+Y",
    mac: "Cmd+Shift+Z",
    scope: "Global",
    description: "Redo the last undone change.",
  },
  { action: "Save project", win: "Ctrl+S", mac: "Cmd+S", scope: "Global", description: "Open Save Tab Project flow." },
  { action: "Open Projects", win: "Ctrl+O", mac: "Cmd+O", scope: "Global", description: "Open Projects & Library." },
  { action: "Export", win: "Ctrl+E", mac: "Cmd+E", scope: "Global", description: "Export current tab as PDF." },
  {
    action: "Open Settings",
    win: "Ctrl+,",
    mac: "Cmd+,",
    scope: "Global",
    description: "Open the Settings sidebar.",
  },
  {
    action: "Open Shortcuts & Tips",
    win: "Ctrl+/",
    mac: "Cmd+/",
    scope: "Global",
    description: "Open Settings and expand Shortcuts & Tips.",
  },
  {
    action: "Focus Song name",
    win: "Ctrl+1",
    mac: "Cmd+1",
    scope: "Grid",
    description: "Focus the Song name input from the editor.",
  },
  {
    action: "Focus Artist",
    win: "Ctrl+2",
    mac: "Cmd+2",
    scope: "Grid",
    description: "Focus the Artist input from the editor.",
  },
  {
    action: "Return focus to grid",
    win: "Esc",
    mac: "Esc",
    scope: "Song inputs",
    description: "Blur Song/Artist input and restore grid focus.",
  },
  {
    action: "Complete row",
    win: "Enter",
    mac: "Enter",
    scope: "Grid",
    description: "Commit current tab writer row to Completed Rows.",
  },
  {
    action: "Complete row + next string",
    win: "Shift+Enter",
    mac: "Shift+Enter",
    scope: "Grid",
    description: "Complete row and place cursor one string lower in new grid.",
  },
  {
    action: "Clear current row",
    win: "Ctrl+Backspace",
    mac: "Cmd+Backspace",
    scope: "Grid",
    description: "Clear the current tab writer row (with confirm if not empty).",
  },
  {
    action: "Open Instrument menu",
    win: "Ctrl+Shift+I",
    mac: "Cmd+Shift+I",
    scope: "Grid",
    description: "Toggle Instrument dropdown.",
  },
  {
    action: "Open Tuning menu",
    win: "Ctrl+Shift+T",
    mac: "Cmd+Shift+T",
    scope: "Grid",
    description: "Toggle Tuning dropdown.",
  },
  {
    action: "Open Capo menu",
    win: "Ctrl+Shift+C",
    mac: "Cmd+Shift+C",
    scope: "Grid",
    description: "Toggle Capo dropdown.",
  },
  {
    action: "Open Chords menu",
    win: "Ctrl+K",
    mac: "Cmd+K",
    scope: "Grid",
    description: "Toggle Chords menu.",
  },
  {
    action: "Open Insert menu",
    win: "Ctrl+I",
    mac: "Cmd+I",
    scope: "Grid",
    description: "Toggle Insert menu.",
  },
  {
    action: "Insert key trigger: Bend",
    win: "B",
    mac: "B",
    scope: "Insert menu",
    description: "Insert bend symbol in selected cell(s).",
  },
  {
    action: "Insert key trigger: Slide",
    win: "S",
    mac: "S",
    scope: "Insert menu",
    description: "Insert slide symbol in selected cell(s).",
  },
  {
    action: "Insert key trigger: Hammer-on",
    win: "H",
    mac: "H",
    scope: "Insert menu",
    description: "Insert hammer-on symbol in selected cell(s).",
  },
  {
    action: "Insert key trigger: Pull-off",
    win: "P",
    mac: "P",
    scope: "Insert menu",
    description: "Insert pull-off symbol in selected cell(s).",
  },
  {
    action: "Insert key trigger: Vibrato",
    win: "V",
    mac: "V",
    scope: "Insert menu",
    description: "Insert vibrato symbol in selected cell(s).",
  },
  {
    action: "Insert key trigger: Text marker",
    win: "T",
    mac: "T",
    scope: "Insert menu",
    description: "Insert text marker in selected cell(s).",
  },
  { action: "Move selection", win: "Arrow keys", mac: "Arrow keys", scope: "Grid", description: "Move between cells." },
  {
    action: "Extend selection",
    win: "Shift+Arrow keys",
    mac: "Shift+Arrow keys",
    scope: "Grid",
    description: "Extend current multi-cell selection.",
  },
  { action: "Move right", win: "Tab", mac: "Tab", scope: "Grid", description: "Move one column right." },
  { action: "Move left", win: "Shift+Tab", mac: "Shift+Tab", scope: "Grid", description: "Move one column left." },
  {
    action: "Jump string row",
    win: "Ctrl+Up / Ctrl+Down",
    mac: "Cmd+Up / Cmd+Down",
    scope: "Grid",
    description: "Move up/down one string while keeping column.",
  },
  {
    action: "Enter fret values",
    win: "0-9",
    mac: "0-9",
    scope: "Grid",
    description: "Type fret numbers into selected cell(s).",
  },
  {
    action: "Clear selected cells",
    win: "Delete / Backspace",
    mac: "Delete / Backspace",
    scope: "Grid",
    description: "Clear selected cell(s).",
  },
  {
    action: "Copy selected cells",
    win: "Ctrl+C",
    mac: "Cmd+C",
    scope: "Grid",
    description: "Copy selected cells to clipboard.",
  },
  {
    action: "Select all grid cells",
    win: "Ctrl+A",
    mac: "Cmd+A",
    scope: "Grid",
    description: "Select all cells in the current tab grid.",
  },
  {
    action: "Add/remove random cells",
    win: "Ctrl+Click",
    mac: "Cmd+Click",
    scope: "Grid",
    description: "Toggle random multi-selection per cell.",
  },
  {
    action: "Open Insert quickly",
    win: "+",
    mac: "+",
    scope: "Grid",
    description: "Open Insert menu.",
  },
  {
    action: "Move selected completed row(s)",
    win: "Ctrl+Up / Ctrl+Down",
    mac: "Cmd+Up / Cmd+Down",
    scope: "Completed Rows",
    description: "Move selected completed row(s) up or down.",
  },
  {
    action: "Duplicate selected completed row(s)",
    win: "Ctrl+D",
    mac: "Cmd+D",
    scope: "Completed Rows",
    description: "Duplicate selected completed row(s).",
  },
  {
    action: "Delete selected completed row(s)",
    win: "Ctrl+Delete / Ctrl+Backspace",
    mac: "Cmd+Delete / Cmd+Backspace",
    scope: "Completed Rows",
    description: "Delete selected completed row(s).",
  },
  {
    action: "Reset Columns to default",
    win: "Triple-click Columns value",
    mac: "Triple-click Columns value",
    scope: "Toolbar",
    description: "Reset column count to your default value.",
  },
  {
    action: "Close open menu/modal",
    win: "Esc",
    mac: "Esc",
    scope: "Global",
    description: "Close top-most menu, modal, or panel.",
  },
];

const SHORTCUTS_ACTION_ES = {
  Undo: "Deshacer",
  Redo: "Rehacer",
  "Save project": "Guardar proyecto",
  "Open Projects": "Abrir proyectos",
  Export: "Exportar",
  "Open Settings": "Abrir ajustes",
  "Open Shortcuts & Tips": "Abrir atajos y consejos",
  "Focus Song name": "Enfocar nombre de la canción",
  "Focus Artist": "Enfocar artista",
  "Return focus to grid": "Volver a la cuadrícula",
  "Complete row": "Completar fila",
  "Complete row + next string": "Completar fila + siguiente cuerda",
  "Clear current row": "Limpiar fila actual",
  "Open Instrument menu": "Abrir menú de instrumento",
  "Open Tuning menu": "Abrir menú de afinación",
  "Open Capo menu": "Abrir menú de cejilla",
  "Open Chords menu": "Abrir menú de acordes",
  "Open Insert menu": "Abrir menú Insertar",
  "Insert key trigger: Bend": "Atajo Insertar: Bend",
  "Insert key trigger: Slide": "Atajo Insertar: Slide",
  "Insert key trigger: Hammer-on": "Atajo Insertar: Hammer-on",
  "Insert key trigger: Pull-off": "Atajo Insertar: Pull-off",
  "Insert key trigger: Vibrato": "Atajo Insertar: Vibrato",
  "Insert key trigger: Text marker": "Atajo Insertar: Marcador de texto",
  "Move selection": "Mover selección",
  "Extend selection": "Extender selección",
  "Move right": "Mover a la derecha",
  "Move left": "Mover a la izquierda",
  "Jump string row": "Saltar fila de cuerda",
  "Enter fret values": "Introducir trastes",
  "Clear selected cells": "Limpiar celdas seleccionadas",
  "Copy selected cells": "Copiar celdas seleccionadas",
  "Select all grid cells": "Seleccionar todas las celdas de la cuadrícula",
  "Add/remove random cells": "Añadir/quitar celdas aleatorias",
  "Open Insert quickly": "Abrir Insertar rápido",
  "Move selected completed row(s)": "Mover filas completadas seleccionadas",
  "Duplicate selected completed row(s)": "Duplicar filas completadas seleccionadas",
  "Delete selected completed row(s)": "Eliminar filas completadas seleccionadas",
  "Reset Columns to default": "Restablecer columnas por defecto",
  "Close open menu/modal": "Cerrar menú/modal abierto",
};

const SHORTCUTS_SCOPE_ES = {
  Global: "Global",
  Grid: "Cuadrícula",
  "Song inputs": "Campos de canción",
  "Insert menu": "Menú Insertar",
  "Completed Rows": "Filas completadas",
  Toolbar: "Barra de herramientas",
};

const SHORTCUTS_DESC_ES = {
  "Undo the most recent change.": "Deshacer el cambio más reciente.",
  "Redo the last undone change.": "Rehacer el último cambio deshecho.",
  "Open Save Tab Project flow.": "Abrir flujo de guardar proyecto de tablatura.",
  "Open Projects & Library.": "Abrir Proyectos y biblioteca.",
  "Export current tab as PDF.": "Exportar la tablatura actual como PDF.",
  "Open the Settings sidebar.": "Abrir la barra lateral de ajustes.",
  "Open Settings and expand Shortcuts & Tips.": "Abrir Ajustes y desplegar Atajos y consejos.",
  "Focus the Song name input from the editor.": "Enfocar el campo Nombre de la canción desde el editor.",
  "Focus the Artist input from the editor.": "Enfocar el campo Artista desde el editor.",
  "Blur Song/Artist input and restore grid focus.": "Quitar foco de Canción/Artista y volver a la cuadrícula.",
  "Commit current tab writer row to Completed Rows.": "Guardar la fila actual en Filas completadas.",
  "Complete row and place cursor one string lower in new grid.": "Completar la fila y mover el cursor una cuerda abajo.",
  "Clear the current tab writer row (with confirm if not empty).": "Limpiar la fila actual (con confirmación si no está vacía).",
  "Toggle Instrument dropdown.": "Alternar el menú de instrumento.",
  "Toggle Tuning dropdown.": "Alternar el menú de afinación.",
  "Toggle Capo dropdown.": "Alternar el menú de cejilla.",
  "Toggle Chords menu.": "Alternar el menú de acordes.",
  "Toggle Insert menu.": "Alternar el menú Insertar.",
  "Insert bend symbol in selected cell(s).": "Insertar símbolo de bend en celdas seleccionadas.",
  "Insert slide symbol in selected cell(s).": "Insertar símbolo de slide en celdas seleccionadas.",
  "Insert hammer-on symbol in selected cell(s).": "Insertar símbolo de hammer-on en celdas seleccionadas.",
  "Insert pull-off symbol in selected cell(s).": "Insertar símbolo de pull-off en celdas seleccionadas.",
  "Insert vibrato symbol in selected cell(s).": "Insertar símbolo de vibrato en celdas seleccionadas.",
  "Insert text marker in selected cell(s).": "Insertar marcador de texto en celdas seleccionadas.",
  "Move between cells.": "Moverse entre celdas.",
  "Extend current multi-cell selection.": "Extender la selección múltiple actual.",
  "Move one column right.": "Mover una columna a la derecha.",
  "Move one column left.": "Mover una columna a la izquierda.",
  "Move up/down one string while keeping column.": "Mover arriba/abajo una cuerda manteniendo columna.",
  "Type fret numbers into selected cell(s).": "Escribir números de traste en celdas seleccionadas.",
  "Clear selected cell(s).": "Limpiar celda(s) seleccionada(s).",
  "Copy selected cells to clipboard.": "Copiar celdas seleccionadas al portapapeles.",
  "Select all cells in the current tab grid.": "Seleccionar todas las celdas de la cuadrícula actual.",
  "Toggle random multi-selection per cell.": "Alternar selección aleatoria por celda.",
  "Open Insert menu.": "Abrir menú Insertar.",
  "Move selected completed row(s) up or down.": "Mover filas completadas seleccionadas arriba/abajo.",
  "Duplicate selected completed row(s).": "Duplicar filas completadas seleccionadas.",
  "Delete selected completed row(s).": "Eliminar filas completadas seleccionadas.",
  "Reset column count to your default value.": "Restablecer número de columnas al valor por defecto.",
  "Close top-most menu, modal, or panel.": "Cerrar menú, modal o panel superior.",
};

function centerPad(str, width, fill = " ") {
  const s = String(str ?? "");
  if (s.length >= width) return s;
  const total = width - s.length;
  const left = Math.floor(total / 2);
  const right = total - left;
  return fill.repeat(left) + s + fill.repeat(right);
}

function buildClassicTabText(appTuningHighToLow, grid, cols) {
  const tuning = appTuningHighToLow;

  // Compute column widths on the raw cell text so ASCII tab like "1b(1/2)" stays aligned.
  const colWidths = Array.from({ length: cols }, (_, c) => {
    let w = 1;
    for (let r = 0; r < tuning.length; r++) {
      const raw = String(grid?.[r]?.[c] ?? "");
      const trimmed = raw.trim();
      const width = trimmed === "" ? 1 : trimmed.length;
      w = Math.max(w, width);
    }
    return w;
  });

  return tuning
    .map((label, r) => {
      const cells = Array.from({ length: cols }, (_, c) => {
        const raw = String(grid?.[r]?.[c] ?? "");
        const trimmed = raw.trim();
        const w = colWidths[c];

        if (trimmed === "") {
          return "-".repeat(w);
        }

        return centerPad(trimmed, w, " ");
      });
      return `${label}|${cells.join("-")}|`;
    })
    .join("\n");
}


function buildRowTabWithRepeat(row) {
  if (!row || row.kind === "note") {
    return "";
  }
  const base = buildClassicTabText(row.tuningAtTime, row.grid, row.colsAtTime);
  const count = row.repeatCount && row.repeatCount > 1 ? row.repeatCount : 1;
  if (count === 1) return base;

  const lines = String(base ?? "").split("\n");
  if (!lines.length) return base;

  // Append a small repeat block like |x4| on the right side of the tab.
  const mid = Math.floor(lines.length / 2);
  const label = `x${count}`;
  const minBlockWidth = 2;
  const blockWidth = Math.max(minBlockWidth, label.length);

  function padLabel(text) {
    if (text.length >= blockWidth) return text.slice(0, blockWidth);
    const left = Math.floor((blockWidth - text.length) / 2);
    const right = blockWidth - text.length - left;
    return "-".repeat(left) + text + "-".repeat(right);
  }

  const updatedLines = lines.map((line, idx) => {
    const inner = idx === mid ? padLabel(label) : "-".repeat(blockWidth);
    let baseLine = String(line ?? "");
    // Avoid doubling the trailing bar: base lines already end with '|'
    if (baseLine.endsWith("|")) {
      baseLine = baseLine.slice(0, -1);
    }
    return `${baseLine}|${inner}|`;
  });

  return updatedLines.join("\n");
}

function safeLoadUserTunings() {
  try {
    const raw = localStorage.getItem(LS_USER_TUNINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (t) =>
          t &&
          typeof t.id === "string" &&
          typeof t.name === "string" &&
          Array.isArray(t.lowToHigh) &&
          t.lowToHigh.length === 6
      )
      .map((t) => ({
        id: t.id,
        name: t.name,
        lowToHigh: t.lowToHigh.map((x) => String(x ?? "").trim()),
      }));
  } catch {
    return [];
  }
}

function safeLoadUserChords() {
  try {
    const raw = localStorage.getItem(LS_USER_CHORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (c) =>
          c &&
          typeof c.id === "string" &&
          typeof c.name === "string" &&
          Array.isArray(c.frets) &&
          c.frets.length === 6
      )
      .map((c) => ({
        id: c.id,
        name: c.name,
        frets: c.frets.map((x) => String(x ?? "").trim()),
      }));
  } catch {
    return [];
  }
}

function safeLoadChordOverrides() {
  try {
    const raw = localStorage.getItem(LS_CHORD_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out = {};
    for (const [id, v] of Object.entries(parsed)) {
      if (!v || !Array.isArray(v.frets) || v.frets.length !== 6) continue;
      out[id] = {
        frets: v.frets.map((x) => String(x ?? "").trim()),
      };
    }
    return out;
  } catch {
    return {};
  }
}

function eventPathIncludes(e, node) {
  if (!node) return false;
  const path = typeof e.composedPath === "function" ? e.composedPath() : null;
  if (path && Array.isArray(path)) return path.includes(node);
  let cur = e.target;
  while (cur) {
    if (cur === node) return true;
    cur = cur.parentNode;
  }
  return false;
}

/** -------- PDF helpers (unchanged from previous version) -------- */

function toAsciiSafe(str) {
  const s = String(str ?? "");
  const normalized = s
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("‘", "'")
    .replaceAll("’", "'");

  let out = "";
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    // Normalize whitespace: keep spaces, but turn tabs/newlines into single spaces.
    if (code === 9 || code === 10 || code === 13) {
      out += " ";
    } else if (code >= 32 && code <= 126) {
      // Standard printable ASCII.
      out += normalized[i];
    } else if (code === 0xbd || code === 0xb9) {
      // Allow a couple of extended glyphs we actually use:
      // 0xbd: "½"  (half bend)
      // 0xb9: "¹"  (superscript 1 for full bend)
      out += normalized[i];
    } else {
      // Fallback for truly unsupported characters.
      out += "?";
    }
  }
  return out;
}function pdfEscapeLiteral(str) {
  const s = toAsciiSafe(str);
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapMonospaceLine(line, maxChars) {
  const s = String(line ?? "");
  if (maxChars <= 10) return [s];
  if (s.length <= maxChars) return [s];
  const out = [];
  let i = 0;
  while (i < s.length) {
    out.push(s.slice(i, i + maxChars));
    i += maxChars;
  }
  return out;
}

function strToBytesLatin1(s) {
  const text = String(s ?? "");
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) out[i] = text.charCodeAt(i) & 0xff;
  return out;
}

function concatBytes(chunks) {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

function buildPdfBytes({
  title,
  artist,
  tuningLabel,
  capoEnabled,
  capoFret,
  completedRows,
  showSong = true,
  showArtist = true,
  showTuning = true,
  showCapo = true,
  showHeaderBranding = true,
}) {
  const pageW = 595.28;
  const pageH = 841.89;
  const margin = 56;

  const fontSize = 11;
  const lineH = 14;

  const usableW = pageW - margin * 2;
  const maxChars = Math.max(40, Math.floor(usableW / (fontSize * 0.6)));

  function wrapLineToObjects(text, font = "F1") {
    const wrapped = wrapMonospaceLine(String(text ?? ""), maxChars);
    return wrapped.map((w) => ({ text: w, font }));
  }

  const blocks = [];

  // Header block (no export ID/time)
  {
    const b = [];

    if (showHeaderBranding) {
      b.push(...wrapLineToObjects("TabStudio", "F2"));
      b.push(...wrapLineToObjects("A better way to write tabs.", "F1"));
      b.push(...wrapLineToObjects("", "F1"));
    }

    const cleanTitle = String(title ?? "").trim();
    const cleanArtist = String(artist ?? "").trim();
    const metaParts = [];
    if (showSong && cleanTitle) metaParts.push(`Song: ${cleanTitle}`);
    if (showArtist && cleanArtist) metaParts.push(`Artist: ${cleanArtist}`);
    if (metaParts.length > 0) b.push(...wrapLineToObjects(metaParts.join(" | "), "F1"));

    const cleanTuning = String(tuningLabel ?? "").trim();
    const infoParts = [];
    if (showTuning && cleanTuning) infoParts.push(`Tuning: ${cleanTuning}`);
    if (showCapo && capoEnabled && capoFret) infoParts.push(`Capo: ${capoFret}`);
    if (infoParts.length > 0) b.push(...wrapLineToObjects(infoParts.join(" | "), "F1"));

    b.push(...wrapLineToObjects("", "F1"));
    blocks.push(b);
  }

  // Row / note blocks
  if (!completedRows || completedRows.length === 0) {
    blocks.push(wrapLineToObjects("(No completed rows yet)", "F1"));
  } else {
    for (const row of completedRows) {
      const b = [];
      const isNote = row.kind === "note";
      const rowTitle = row?.name ? String(row.name) : isNote ? "Note" : "Row";
      b.push(...wrapLineToObjects(rowTitle, "F2"));

      if (isNote) {
        const noteText = String(row.noteText ?? "");
        const noteLines = noteText.length === 0 ? [""] : noteText.split(/\r?\n/);
        for (const line of noteLines) b.push(...wrapLineToObjects(line, "F1"));
      } else {
        const tabText = buildRowTabWithRepeat(row);
        const tabLines = String(tabText ?? "").split("\n");
        for (const l of tabLines) b.push(...wrapLineToObjects(l, "F1"));
      }

      b.push(...wrapLineToObjects("", "F1"));
      blocks.push(b);
    }
  }

  const linesPerPageRaw = Math.max(10, Math.floor((pageH - margin * 2) / lineH));
  const contentLinesPerPage = Math.max(1, linesPerPageRaw - 1);

  const pages = [];
  let current = [];
  let used = 0;

  function flushPage() {
    pages.push(current);
    current = [];
    used = 0;
  }

  for (const block of blocks) {
    const blockLen = block.length;

    if (used > 0 && used + blockLen > contentLinesPerPage) flushPage();

    if (blockLen > contentLinesPerPage) {
      let i = 0;
      while (i < block.length) {
        const slice = block.slice(i, i + contentLinesPerPage);
        if (used > 0) flushPage();
        current.push(...slice);
        used += slice.length;
        i += contentLinesPerPage;
        flushPage();
      }
      continue;
    }

    current.push(...block);
    used += blockLen;
  }
  if (current.length) pages.push(current);
  if (pages.length === 0) pages.push([]);

  const pageStreams = pages.map((pageLines, pageIndex) => {
    const x = margin;
    const yStart = pageH - margin;

    const footerText = `tabstudio.app • A better way to write tabs. • Page ${pageIndex + 1} / ${pages.length}`;
    const footer = { text: footerText, font: "F1" };
    const contentLines = pageLines.slice();
    while (contentLines.length < contentLinesPerPage) contentLines.push({ text: "", font: "F1" });
    contentLines.push(footer);

    let stream = "";
    stream += "BT\n";
    stream += `/F1 ${fontSize} Tf\n`;
    stream += `1 0 0 1 ${x.toFixed(2)} ${yStart.toFixed(2)} Tm\n`;

    let currentFont = "F1";
    for (let i = 0; i < contentLines.length; i++) {
      const ln = contentLines[i] || { text: "", font: "F1" };
      if (ln.font && ln.font !== currentFont) {
        currentFont = ln.font;
        stream += `/${currentFont} ${fontSize} Tf\n`;
      }
      const safe = pdfEscapeLiteral(ln.text ?? "");
      stream += `(${safe}) Tj\n`;
      if (i !== contentLines.length - 1) stream += `0 ${(-lineH).toFixed(2)} Td\n`;
    }
    stream += "ET\n";
    return stream;
  });

  const objects = [];
  const addObj = (body) => {
    objects.push(body);
    return objects.length;
  };

  const fontObjNum1 = addObj(`<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>`);
  const fontObjNum2 = addObj(`<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>`);

  const pagesObjNum = addObj(`<< /Type /Pages /Kids [] /Count 0 >>`);
  const catalogObjNum = addObj(`<< /Type /Catalog /Pages ${pagesObjNum} 0 R >>`);

  const pageObjNums = [];

  for (let i = 0; i < pageStreams.length; i++) {
    const streamText = pageStreams[i];
    const streamBytes = strToBytesLatin1(streamText);

    const contentObjNum = addObj(`<< /Length ${streamBytes.length} >>\nstream\n${streamText}\nendstream`);

    const pageObjNum = addObj(
      `<< /Type /Page /Parent ${pagesObjNum} 0 R /MediaBox [0 0 ${pageW.toFixed(
        2
      )} ${pageH.toFixed(
        2
      )}] /Resources << /Font << /F1 ${fontObjNum1} 0 R /F2 ${fontObjNum2} 0 R >> >> /Contents ${contentObjNum} 0 R >>`
    );

    pageObjNums.push(pageObjNum);
  }

  const kids = pageObjNums.map((n) => `${n} 0 R`).join(" ");
  objects[pagesObjNum - 1] = `<< /Type /Pages /Kids [ ${kids} ] /Count ${pageObjNums.length} >>`;

  const chunks = [];
  chunks.push(strToBytesLatin1("%PDF-1.4\n"));
  chunks.push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  const offsets = [0];
  let bytePos = chunks.reduce((n, c) => n + c.length, 0);

  for (let i = 0; i < objects.length; i++) {
    offsets.push(bytePos);
    const objNum = i + 1;
    const objChunk = strToBytesLatin1(`${objNum} 0 obj\n${objects[i]}\nendobj\n`);
    chunks.push(objChunk);
    bytePos += objChunk.length;
  }

  const xrefStart = bytePos;

  let xref = `xref\n0 ${objects.length + 1}\n`;
  xref += `0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    const off = String(offsets[i]).padStart(10, "0");
    xref += `${off} 00000 n \n`;
  }

  const trailer =
    `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjNum} 0 R >>\n` +
    `startxref\n${xrefStart}\n%%EOF`;

  chunks.push(strToBytesLatin1(xref));
  chunks.push(strToBytesLatin1(trailer));

  return concatBytes(chunks);
}

function downloadPdf(bytes, filename) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function trimGridToContent(grid2d, minCols = 1) {
  const g = clone2D(grid2d ?? []);
  if (!g.length) return { cols: minCols, grid: g };

  const rows = g.length;
  const cols = Math.max(...g.map((r) => (Array.isArray(r) ? r.length : 0)), 0);

  let last = -1;
  for (let c = 0; c < cols; c++) {
    let used = false;
    for (let r = 0; r < rows; r++) {
      const v = String(g?.[r]?.[c] ?? "").trim();
      if (v !== "") {
        used = true;
        break;
      }
    }
    if (used) last = c;
  }

  const keep = Math.max(minCols, last + 1);
  const out = g.map((r) => (Array.isArray(r) ? r.slice(0, keep) : []));
  return { cols: keep, grid: out };
}

// MOCK ONLY: Step-4 UI data for Projects & Library (no persistence yet).
const MOCK_LIBRARY = [
  {
    id: "band_solo",
    name: "My Solo Project",
    albums: [
      {
        id: "album_midnight_demos",
        name: "Midnight Demos",
        songs: [
          {
            id: "song_neon_rain",
            name: "Neon Rain",
            tabs: [
              { id: "tab_neon_rain_guitar", name: "Neon Rain - Guitar tab" },
              { id: "tab_neon_rain_bass", name: "Neon Rain - Bass tab" },
            ],
          },
          {
            id: "song_static_hearts",
            name: "Static Hearts",
            tabs: [{ id: "tab_static_hearts_guitar", name: "Static Hearts - Guitar tab" }],
          },
          {
            id: "song_low_tide",
            name: "Low Tide",
            tabs: [{ id: "tab_low_tide_guitar", name: "Low Tide - Guitar tab" }],
          },
        ],
      },
      {
        id: "album_live_sessions",
        name: "Live Sessions",
        songs: [
          {
            id: "song_open_road",
            name: "Open Road",
            tabs: [
              { id: "tab_open_road_guitar", name: "Open Road - Guitar tab" },
              { id: "tab_open_road_lead", name: "Open Road - Lead guitar tab" },
            ],
          },
          {
            id: "song_half_moon",
            name: "Half Moon",
            tabs: [{ id: "tab_half_moon_guitar", name: "Half Moon - Guitar tab" }],
          },
          {
            id: "song_pulse",
            name: "Pulse",
            tabs: [{ id: "tab_pulse_guitar", name: "Pulse - Guitar tab" }],
          },
        ],
      },
    ],
  },
  {
    id: "band_b",
    name: "Band B",
    albums: [
      {
        id: "album_b_sides",
        name: "B-Sides Vol. 1",
        songs: [
          {
            id: "song_paper_planes",
            name: "Paper Planes",
            tabs: [
              { id: "tab_paper_planes_guitar", name: "Paper Planes - Guitar tab" },
              { id: "tab_paper_planes_bass", name: "Paper Planes - Bass tab" },
            ],
          },
          {
            id: "song_concrete_sky",
            name: "Concrete Sky",
            tabs: [{ id: "tab_concrete_sky_guitar", name: "Concrete Sky - Guitar tab" }],
          },
        ],
      },
      {
        id: "album_northbound",
        name: "Northbound",
        songs: [
          {
            id: "song_northbound",
            name: "Northbound",
            tabs: [
              { id: "tab_northbound_guitar", name: "Northbound - Guitar tab" },
              { id: "tab_northbound_bass", name: "Northbound - Bass tab" },
            ],
          },
          {
            id: "song_hold_fast",
            name: "Hold Fast",
            tabs: [{ id: "tab_hold_fast_guitar", name: "Hold Fast - Guitar tab" }],
          },
          {
            id: "song_blacklight",
            name: "Blacklight",
            tabs: [{ id: "tab_blacklight_guitar", name: "Blacklight - Guitar tab" }],
          },
        ],
      },
    ],
  },
];


const LIGHT_THEME = {
  bg: "#F7F6F3",
  surfaceWarm: "#FFFEFB",
  border: "#E6E0D7",
  text: "#161411",
  textFaint: "rgba(22,20,17,0.55)",
  accent: "#5BD4A1",
  accentSoft: "rgba(91,212,161,0.16)",
  danger: "#B00020",
  dangerBg: "#FFEAEA",
  starActive: "#F5C518",
};

const DARK_THEME = {
  bg: "#080808",
  surfaceWarm: "#141414",
  border: "#2A2A2A",
  text: "#F5F5F5",
  textFaint: "rgba(245,245,245,0.6)",
  accent: "#5BD4A1",
  accentSoft: "rgba(91,212,161,0.16)",
  danger: "#FF4B6A",
  dangerBg: "rgba(255,75,106,0.12)",
  starActive: "#F5C518",
};

export default function App() {
  const getSystemTheme = () => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === "undefined") return "system";
    try {
      const stored = window.localStorage.getItem(LS_THEME_MODE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") return stored;
    } catch {}
    return "system";
  });
  const [resolvedTheme, setResolvedTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    try {
      const stored = window.localStorage.getItem(LS_THEME_MODE_KEY);
      if (stored === "light" || stored === "dark") return stored;
    } catch {}
    return getSystemTheme();
  });
  const isDarkMode = resolvedTheme === "dark";
  const [accentColorId, setAccentColorId] = useState(() => {
    try {
      const stored = localStorage.getItem(LS_ACCENT_COLOR_KEY);
      if (ACCENT_PRESETS.some((p) => p.id === stored)) return stored;
    } catch {}
    return isDarkMode ? "white" : "black";
  });
  const [defaultCols, setDefaultCols] = useState(() => {
    try {
      const stored = localStorage.getItem(LS_DEFAULT_COLS_KEY);
      return clampColsValue(stored, DEFAULT_COLS);
    } catch {
      return DEFAULT_COLS;
    }
  });
  const [defaultColsInput, setDefaultColsInput] = useState(String(defaultCols));
  const [colsAutoDelayMs, setColsAutoDelayMs] = useState(() => {
    try {
      const stored = localStorage.getItem(LS_COLS_AUTO_DELAY_MS_KEY);
      return clampColsAutoDelayMs(stored, DEFAULT_COLS_AUTO_DELAY_MS);
    } catch {
      return DEFAULT_COLS_AUTO_DELAY_MS;
    }
  });
  const [colsAutoDelayInput, setColsAutoDelayInput] = useState(String(Math.round(colsAutoDelayMs / 1000)));
  const activeAccent = ACCENT_PRESETS.find((p) => p.id === accentColorId) || ACCENT_PRESETS[0];
  const BASE_THEME = isDarkMode ? DARK_THEME : LIGHT_THEME;
  const THEME = {
    ...BASE_THEME,
    accent: activeAccent.hex,
    accentSoft: withAlpha(activeAccent.hex, isDarkMode ? 0.2 : 0.16),
  };

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LS_THEME_MODE_KEY, themeMode);
      }
    } catch {}
    const nextResolvedTheme = themeMode === "system" ? getSystemTheme() : themeMode;
    setResolvedTheme(nextResolvedTheme);
  }, [themeMode]);

  useEffect(() => {
    if (themeMode !== "system" || typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event) => setResolvedTheme(event.matches ? "dark" : "light");
    setResolvedTheme(media.matches ? "dark" : "light");
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }
    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, [themeMode]);

  useEffect(() => {
    if (isDarkMode && accentColorId === "black") {
      setAccentColorId("white");
      return;
    }
    if (!isDarkMode && accentColorId === "white") {
      setAccentColorId("black");
    }
  }, [isDarkMode, accentColorId]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_ACCENT_COLOR_KEY, accentColorId);
    } catch {}
  }, [accentColorId]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_DEFAULT_COLS_KEY, String(defaultCols));
    } catch {}
  }, [defaultCols]);
  useEffect(() => setDefaultColsInput(String(defaultCols)), [defaultCols]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_COLS_AUTO_DELAY_MS_KEY, String(colsAutoDelayMs));
    } catch {}
  }, [colsAutoDelayMs]);
  useEffect(() => setColsAutoDelayInput(String(Math.round(colsAutoDelayMs / 1000))), [colsAutoDelayMs]);

  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-tabstudio-global", "true");
    style.textContent = `
      html, body, #root { width: 100%; min-height: 100%; margin: 0; }
      body { background: ${THEME.bg}; }
      :root {
        --tabstudio-accent: ${THEME.accent};
        --tabstudio-focus-ring: ${withAlpha(THEME.accent, isDarkMode ? 0.62 : 0.5)};
      }
      .tab-cols-input { -moz-appearance: textfield; appearance: textfield; }
      .tab-cols-input::-webkit-outer-spin-button,
      .tab-cols-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      .tab-grid-row-scroll {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .tab-grid-row-scroll::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
      }
      .tab-editor-surface {
        position: relative;
        isolation: isolate;
      }
      button:focus,
      input:focus,
      textarea:focus,
      select:focus {
        outline: none !important;
      }
      button:focus-visible,
      input:focus-visible,
      textarea:focus-visible,
      select:focus-visible {
        outline: none !important;
        border-color: var(--tabstudio-accent) !important;
        box-shadow: 0 0 0 2px var(--tabstudio-focus-ring) !important;
      }
      @keyframes tabbyImpactCrack {
        0% { opacity: 0; transform: scaleX(0.2); }
        20% { opacity: 0.95; transform: scaleX(1); }
        100% { opacity: 0; transform: scaleX(1.22); }
      }
      @keyframes tabbyImpactDust {
        0% { opacity: 0.85; transform: translate(0, 0) scale(0.55); }
        100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1.38); }
      }
      @keyframes tabbyDebrisFly {
        0% { opacity: 0.95; transform: translate(0, 0) rotate(var(--r0)); }
        100% { opacity: 0.9; transform: translate(var(--dx), var(--dy)) rotate(var(--r1)); }
      }
      @keyframes tabbyDebrisFade {
        0% { opacity: 0.9; }
        100% { opacity: 0; }
      }
      @keyframes tabstudioConfettiBurst {
        0% {
          opacity: 0;
          transform: translate(0, 0) rotate(0deg);
        }
        4% {
          opacity: 1;
        }
        6% {
          opacity: 1;
          transform: translate(var(--xPeak), var(--yPeak)) rotate(var(--rotPeak, 160deg));
        }
        10% {
          opacity: 0.98;
          transform: translate(var(--xApexEase), var(--yApexEase)) rotate(var(--rotApexEase, 160deg));
        }
        22% {
          opacity: 0.96;
          transform: translate(var(--xMid1), var(--yMid1)) rotate(var(--rotMid1, 110deg));
        }
        44% {
          opacity: 0.88;
          transform: translate(var(--xMid2), var(--yMid2)) rotate(var(--rotMid2, 170deg));
        }
        66% {
          opacity: 0.76;
          transform: translate(var(--xMid3), var(--yMid3)) rotate(var(--rotMid3, 220deg));
        }
        84% {
          opacity: 0.62;
          transform: translate(var(--xNearFloor), var(--yNearFloor)) rotate(var(--rotNearFloor, 250deg));
        }
        93% {
          opacity: 0.42;
          transform: translate(var(--xFade), var(--yFade)) rotate(var(--rotFade, 280deg));
        }
        97% {
          opacity: 0.18;
        }
        100% {
          opacity: 0;
          transform: translate(var(--xEnd), var(--yEnd)) rotate(var(--rotEnd, 300deg));
        }
      }
      @keyframes tabstudioMilestoneToast {
        0% { opacity: 0; transform: translateY(8px); }
        15% { opacity: 1; transform: translateY(0); }
        78% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(4px); }
      }
      @keyframes tabstudioFirstExportGlow {
        0% { opacity: 0; }
        15% { opacity: 1; }
        80% { opacity: 0.92; }
        100% { opacity: 0; }
      }
      @keyframes tabstudioFirstExportCellGlow {
        0% { opacity: 0; }
        24% { opacity: 0.6; }
        42% { opacity: 0.76; }
        56% { opacity: 0.62; }
        80% { opacity: 0.28; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, [THEME.bg, THEME.accent, isDarkMode]);

  useEffect(() => {
    document.title = "TabStudio – tab editor";
  }, []);

  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const accountFullName = "Harry Bolton";
  const accountTier = "Plus";
  const accountEmail = "harry@tabstudio.app";
  const accountMemberSince = "January 12, 2025";
  const accountRenewalDate = "April 1, 2026";
  const accountBillingCycle = "Monthly";
  const [profileDisplayName, setProfileDisplayName] = useState("Harry Bolton");
  const [profileHandle, setProfileHandle] = useState("@harrybolton");
  const [profileBio, setProfileBio] = useState("Guitar-first songwriter and tab creator.");
  const [profileWebsite, setProfileWebsite] = useState("https://tabstudio.app/harry");
  const [securityEmail, setSecurityEmail] = useState(accountEmail);
  const [securityTwoFactorEnabled, setSecurityTwoFactorEnabled] = useState(false);
  const [subscriptionAutoRenew, setSubscriptionAutoRenew] = useState(true);
  const [billingEmail, setBillingEmail] = useState(accountEmail);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState("Visa •••• 4242");
  const recentSessions = [
    { device: "MacBook Pro · Chrome", location: "Tokyo, JP", when: "Active now" },
    { device: "iPhone · Safari", location: "Tokyo, JP", when: "2 hours ago" },
    { device: "Windows Desktop · Edge", location: "London, UK", when: "4 days ago" },
  ];
  const recentInvoices = [
    { id: "INV-1082", date: "March 1, 2026", amount: "$12.00", status: "Paid" },
    { id: "INV-1114", date: "April 1, 2026", amount: "$12.00", status: "Upcoming" },
    { id: "INV-1045", date: "February 1, 2026", amount: "$12.00", status: "Paid" },
    { id: "INV-0997", date: "December 1, 2025", amount: "$12.00", status: "Refunded" },
  ];

  // Instruments
  const [instrumentId, setInstrumentId] = useState("gtr6");
  const [favInstrumentIds, setFavInstrumentIds] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_INSTRUMENT_FAVS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((id) => typeof id === "string");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_INSTRUMENT_FAVS_KEY, JSON.stringify(favInstrumentIds));
    } catch {}
  }, [favInstrumentIds]);

  const currentInstrument = useMemo(
    () => INSTRUMENTS.find((i) => i.id === instrumentId) || INSTRUMENTS[0],
    [instrumentId]
  );

  const groupedInstruments = useMemo(() => {
    const map = new Map();
    for (const inst of INSTRUMENTS) {
      if (!map.has(inst.group)) map.set(inst.group, []);
      map.get(inst.group).push(inst);
    }
    return Array.from(map.entries()).map(([group, items]) => ({ group, items }));
  }, []);

  const favouriteInstruments = useMemo(
    () => INSTRUMENTS.filter((i) => favInstrumentIds.includes(i.id)),
    [favInstrumentIds]
  );

  const [instrumentOpen, setInstrumentOpen] = useState(false);
  const instrumentBtnRef = useRef(null);
  const instrumentPanelRef = useRef(null);

  // Which instrument family (Guitar / Bass / Banjo / Ukulele) is expanded in the picker
  const [expandedInstrumentGroup, setExpandedInstrumentGroup] = useState(null);

  useEffect(() => {
    if (instrumentOpen) {
      // When opening the panel, start with all groups collapsed for a cleaner first view
      setExpandedInstrumentGroup(null);
    }
  }, [instrumentOpen]);

  // Capo
  const [capoEnabled, setCapoEnabled] = useState(false);
  const [capoFret, setCapoFret] = useState("");
  const [capoOpen, setCapoOpen] = useState(false);
  const [capoFretFocused, setCapoFretFocused] = useState(false);
  const [capoReplaceOnType, setCapoReplaceOnType] = useState(false);
  const capoBtnRef = useRef(null);
  const capoPanelRef = useRef(null);
  const capoInputRef = useRef(null);
  const capoReplaceOnTypeRef = useRef(false);
  const repeatOverwriteRef = useRef(false);


  // Tunings
  const [userTunings, setUserTunings] = useState(() => safeLoadUserTunings());
  useEffect(() => {
    try {
      localStorage.setItem(LS_USER_TUNINGS_KEY, JSON.stringify(userTunings));
    } catch {}
  }, [userTunings]);

  const [userChords, setUserChords] = useState(() => safeLoadUserChords());
  useEffect(() => {
    try {
      localStorage.setItem(LS_USER_CHORDS_KEY, JSON.stringify(userChords));
    } catch {}
  }, [userChords]);

  const [presetChordOverrides, setPresetChordOverrides] = useState(() => safeLoadChordOverrides());
  useEffect(() => {
    try {
      localStorage.setItem(LS_CHORD_OVERRIDES_KEY, JSON.stringify(presetChordOverrides));
    } catch {}
  }, [presetChordOverrides]);

  function getInstrumentTuningPresets(instId) {
    switch (instId) {
      case "gtr6":
        return TUNING_PRESETS_GTR6;
      case "gtr7":
        return TUNING_PRESETS_GTR7;
      case "bass4":
        return TUNING_PRESETS_BASS4;
      case "bass5":
        return TUNING_PRESETS_BASS5;
      case "bass6":
        return TUNING_PRESETS_BASS6;
      case "banjo4":
        return TUNING_PRESETS_BANJO4;
      case "banjo5":
        return TUNING_PRESETS_BANJO5;
      case "banjo6":
        return TUNING_PRESETS_BANJO6;
      case "uke4":
        return TUNING_PRESETS_UKE4;
      default:
        return TUNING_PRESETS_GTR6;
    }
  }

  const orderedPresetTunings = useMemo(() => {
    const base = getInstrumentTuningPresets(instrumentId);
    if (instrumentId === "gtr6") {
      const preferred = ["standard", "drop_d", "open_g", "open_d"];
      const map = new Map(base.map((t) => [t.id, t]));
      const top = preferred.map((id) => map.get(id)).filter(Boolean);
      const rest = base.filter((t) => !preferred.includes(t.id));
      return [...top, ...rest];
    }
    return base;
  }, [instrumentId]);

  const allTunings = useMemo(() => {
    const extras =
      currentInstrument.stringCount === 6
        ? userTunings
        : []; // custom tunings currently for 6-string only
    return [...orderedPresetTunings, ...extras];
  }, [orderedPresetTunings, userTunings, currentInstrument.stringCount]);

  const [tuning, setTuning] = useState(DEFAULT_TUNING);
  const [tuningLabel, setTuningLabel] = useState("Standard");
  const [tuningOpen, setTuningOpen] = useState(false);

  const [cols, setCols] = useState(defaultCols);
  const [colsInput, setColsInput] = useState(String(defaultCols));
  const [colsReplaceOnType, setColsReplaceOnType] = useState(false);
  const [grid, setGrid] = useState(() => makeBlankGrid(6, defaultCols));
  const [cursor, setCursor] = useState({ r: 0, c: 0 });
  const [gridTargetingActive, setGridTargetingActive] = useState(true);
  const [pressedBtnId, setPressedBtnId] = useState("");
  const [headerHoverBtn, setHeaderHoverBtn] = useState("");

  const [overwriteNext, setOverwriteNext] = useState(false);
  const overwriteNextRef = useRef(false);
  useEffect(() => void (overwriteNextRef.current = overwriteNext), [overwriteNext]);

  const [completedRows, setCompletedRows] = useState([]);
  const [selectedRowIds, setSelectedRowIds] = useState(() => new Set());
  const [completedRowsOpen, setCompletedRowsOpen] = useState(true);
  const [rowDeleteConfirmIds, setRowDeleteConfirmIds] = useState(null);
  const [rowDeleteConfirmSource, setRowDeleteConfirmSource] = useState("");

  const [insertOpen, setInsertOpen] = useState(false);
  const insertBtnRef = useRef(null);
  const insertPanelRef = useRef(null);

  const [chordsOpen, setChordsOpen] = useState(false);
  const chordsBtnRef = useRef(null);
  const chordsPanelRef = useRef(null);
  const [chordName, setChordName] = useState("");
  const [selectedChordId, setSelectedChordId] = useState("");
  const [lastAppliedChordId, setLastAppliedChordId] = useState("");

  // Edit chord modal
  const [editChordModalOpen, setEditChordModalOpen] = useState(false);
  const [editChordTargetId, setEditChordTargetId] = useState("");
  const [editChordIsPreset, setEditChordIsPreset] = useState(false);
  const [editChordNameHeader, setEditChordNameHeader] = useState("");
  const [editChordFrets, setEditChordFrets] = useState(() => ["", "", "", "", "", ""]);

  // Custom tuning modal
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customLowToHigh, setCustomLowToHigh] = useState(() => ["E", "A", "D", "G", "B", "E"]); // storage

  const [renamingRowId, setRenamingRowId] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");
  const renameInputRef = useRef(null);

  const lastAddedNoteIdRef = useRef(null);
  const noteTextAreaRefs = useRef({});
  const clearRowSelectionOnNextPointerRef = useRef(false);



  const keyCaptureRef = useRef(null);
  const colsInputRef = useRef(null);
  const colsAutoCommitTimerRef = useRef(null);
  const colsReplaceOnTypeRef = useRef(false);
  const gridRowScrollRefs = useRef([]);
  const syncingRowScrollRef = useRef(false);

  const cursorRef = useRef(cursor);
  const colsRef = useRef(cols);
  const gridRef = useRef(grid);
  useEffect(() => void (cursorRef.current = cursor), [cursor]);
  useEffect(() => void (colsRef.current = cols), [cols]);
  useEffect(() => void (gridRef.current = grid), [grid]);
  useEffect(() => void (colsReplaceOnTypeRef.current = colsReplaceOnType), [colsReplaceOnType]);
  useEffect(() => void (capoReplaceOnTypeRef.current = capoReplaceOnType), [capoReplaceOnType]);
  useEffect(() => setColsInput(String(cols)), [cols]);
  useEffect(() => {
    gridRowScrollRefs.current = gridRowScrollRefs.current.slice(0, tuning.length);
  }, [tuning.length]);

  useEffect(() => {
    const id = lastAddedNoteIdRef.current;
    if (!id) return;
    const el = noteTextAreaRefs.current?.[id];
    if (el && typeof el.focus === "function") {
      // Small timeout to ensure layout has settled before scrolling.
      setTimeout(() => {
        try {
          el.focus();
          if (typeof el.scrollIntoView === "function") {
            el.scrollIntoView({ block: "center", behavior: "smooth" });
          }
        } catch {}
      }, 10);
    }
    // Clear the marker so we don't re-focus on unrelated renders.
    lastAddedNoteIdRef.current = null;
  }, [completedRows]);

  const tuningBtnRef = useRef(null);
  const tuningPanelRef = useRef(null);

  const standard = currentInstrument.id === "gtr6" && isStandardTuning(tuning);

  const effectivePresetChords = useMemo(() => {
    return PRESET_CHORDS.map((c) => {
      const override = presetChordOverrides[c.id];
      if (!override) return c;
      return { ...c, frets: override.frets.slice() };
    });
  }, [presetChordOverrides]);

  const allChords = useMemo(() => [...effectivePresetChords, ...userChords], [effectivePresetChords, userChords]);

  const gridView = useMemo(
    () =>
      grid.map((row) => {
        const copy = row.slice(0, cols);
        while (copy.length < cols) copy.push("");
        return copy;
      }),
    [grid, cols]
  );
  const hasGridContent = useMemo(
    () => gridView.some((row) => row.some((cell) => String(cell ?? "").trim() !== "")),
    [gridView]
  );

  // Multi-cell selection
  const [cellSelection, setCellSelection] = useState(null);
  const [randomCellSelection, setRandomCellSelection] = useState(() => new Set());
  const selectingRef = useRef(false);

  const selectionBounds = useMemo(() => {
    if (!cellSelection) return null;
    const r1 = Math.min(cellSelection.r1, cellSelection.r2);
    const r2 = Math.max(cellSelection.r1, cellSelection.r2);
    const c1 = Math.min(cellSelection.c1, cellSelection.c2);
    const c2 = Math.max(cellSelection.c1, cellSelection.c2);
    return { r1, r2, c1, c2 };
  }, [cellSelection]);

  const hasRangeSelection =
    !!selectionBounds && !(selectionBounds.r1 === selectionBounds.r2 && selectionBounds.c1 === selectionBounds.c2);
  const hasCellSelection = hasRangeSelection || randomCellSelection.size > 0;

  function cellKey(r, c) {
    return `${r}:${c}`;
  }

  function parseCellKey(key) {
    const [rs, cs] = String(key ?? "").split(":");
    const r = Number(rs);
    const c = Number(cs);
    if (!Number.isFinite(r) || !Number.isFinite(c)) return null;
    return { r, c };
  }

  function getSelectedCellCoords() {
    if (randomCellSelection.size > 0) {
      const cells = [];
      randomCellSelection.forEach((k) => {
        const parsed = parseCellKey(k);
        if (parsed) cells.push(parsed);
      });
      return cells;
    }
    if (!selectionBounds) return [];
    const cells = [];
    for (let rr = selectionBounds.r1; rr <= selectionBounds.r2; rr++) {
      for (let cc = selectionBounds.c1; cc <= selectionBounds.c2; cc++) {
        cells.push({ r: rr, c: cc });
      }
    }
    return cells;
  }

  function getSelectionAnchor() {
    const cells = getSelectedCellCoords();
    if (!cells.length) return null;
    return cells.reduce((best, cur) => {
      if (!best) return cur;
      if (cur.r < best.r) return cur;
      if (cur.r === best.r && cur.c < best.c) return cur;
      return best;
    }, null);
  }

  function isCellSelected(r, c) {
    if (randomCellSelection.has(cellKey(r, c))) return true;
    if (!selectionBounds) return false;
    return r >= selectionBounds.r1 && r <= selectionBounds.r2 && c >= selectionBounds.c1 && c <= selectionBounds.c2;
  }

  function clearCellSelection() {
    setCellSelection(null);
    setRandomCellSelection(new Set());
    selectingRef.current = false;
  }

  // Undo / Redo
const undoStackRef = useRef([]);
const redoStackRef = useRef([]);
const editingCellRef = useRef(null); // tracks the cell for the current typing session

  function pushUndoSnapshot(snapshot) {
    undoStackRef.current.push(snapshot);
    if (undoStackRef.current.length > 250) undoStackRef.current.shift();
  }

  function snapshotNow() {
    return { grid: clone2D(gridRef.current), cursor: { ...cursorRef.current } };
  }

  function commitGridChange(nextGrid, nextCursor = null) {
    pushUndoSnapshot(snapshotNow());
    redoStackRef.current = [];
    setGrid(nextGrid);
    if (nextCursor) setCursor(nextCursor);
  }

  function undo() {
    const stack = undoStackRef.current;
    if (!stack.length) return;
    const prev = stack.pop();
    redoStackRef.current.push(snapshotNow());
    setGrid(prev.grid);
    setCursor(prev.cursor);
    clearCellSelection();
    setOverwriteNext(true);
    focusKeyCapture();
  }

  function redo() {
    const stack = redoStackRef.current;
    if (!stack.length) return;
    const next = stack.pop();
    pushUndoSnapshot(snapshotNow());
    setGrid(next.grid);
    setCursor(next.cursor);
    clearCellSelection();
    setOverwriteNext(true);
    focusKeyCapture();
  }

  // A saved tab project will include metadata and editor state:
  // id, name, artist, band, album, createdAt, updatedAt, instrument,
  // column count, tuning, capo, grid data, completed rows, and PDF options.
  function buildCurrentTabSnapshot() {
    const nowIso = new Date().toISOString();
    return {
      id: `tab_${Date.now()}`,
      name: String(songTitle || "").trim(),
      artist: String(artist || "").trim(),
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  }

  function handleSaveTabClick() {
    const snapshot = buildCurrentTabSnapshot();
    console.log("Current tab snapshot:", snapshot);
    console.log(
      "Future behavior: this snapshot will be stored as structured JSON under Band -> Album -> Song in Projects & Library."
    );
    const defaultBand = libraryData[0] || null;
    const defaultAlbum = defaultBand?.albums?.[0] || null;
    setSaveSnapshotDraft(snapshot);
    setSaveTargetSongName(snapshot.name || "Untitled Song");
    setSaveTargetBandId(defaultBand?.id || "");
    setSaveTargetAlbumId(defaultAlbum?.id || "");
    setSaveProjectOpen(true);
  }

  function moveArrayItem(list, fromIndex, toIndex) {
    const arr = Array.isArray(list) ? list.slice() : [];
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= arr.length || toIndex >= arr.length) return arr;
    if (fromIndex === toIndex) return arr;
    const [moved] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, moved);
    return arr;
  }

  function reorderLibraryBands(fromIndex, toIndex) {
    setLibraryData((prev) => moveArrayItem(prev, fromIndex, toIndex));
  }

  function reorderLibraryAlbums(fromIndex, toIndex) {
    if (!selectedLibraryBandId) return;
    setLibraryData((prev) =>
      prev.map((band) =>
        band.id !== selectedLibraryBandId
          ? band
          : {
              ...band,
              albums: moveArrayItem(band.albums || [], fromIndex, toIndex),
            }
      )
    );
  }

  function reorderLibrarySongs(fromIndex, toIndex) {
    if (!selectedLibraryBandId || !selectedLibraryAlbumId) return;
    setLibraryData((prev) =>
      prev.map((band) =>
        band.id !== selectedLibraryBandId
          ? band
          : {
              ...band,
              albums: (band.albums || []).map((album) =>
                album.id !== selectedLibraryAlbumId
                  ? album
                  : {
                      ...album,
                      songs: moveArrayItem(album.songs || [], fromIndex, toIndex),
                    }
              ),
            }
      )
    );
  }

  function handleOpenTabClick() {
    setSelectedLibraryBandId("");
    setSelectedLibraryAlbumId("");
    setSelectedLibrarySongId("");
    setProjectsLibraryOpen(true);
  }

  function triggerTabsCreatedMilestone(milestoneValue) {
    const surfaceRect = editorSurfaceRef.current?.getBoundingClientRect?.();
    const gridRect = tabbyGridRef.current?.getBoundingClientRect?.();
    const width = Math.max(420, Math.round(gridRect?.width || surfaceRect?.width || 1100));
    const height = Math.max(220, Math.round(gridRect?.height || 520));
    const gridTopInSurface =
      surfaceRect && gridRect
        ? Math.max(0, Math.round(gridRect.top - surfaceRect.top))
        : 0;
    const gridLeftInSurface =
      surfaceRect && gridRect
        ? Math.max(0, Math.round(gridRect.left - surfaceRect.left))
        : 0;

    const palette = ["#5BD4A1", "#4D8DFF", "#9B7BFF", "#FFD166", "#FF9B42", "#FF5A67", "#7AF7D0", "#7EC8FF"];
    const particleCount = 185;
    const particles = Array.from({ length: particleCount }, (_, i) => {
      const startX = Math.random() * width;
      const startY = Math.max(8, height - (22 + Math.random() * 24));
      const riseAmount = height * (0.36 + Math.random() * 0.54);
      const yPeak = -Math.min(Math.max(24, riseAmount), Math.max(30, startY - 8));
      const xPeak = -80 + Math.random() * 160;
      const yApexEase = yPeak + (6 + Math.random() * 16);
      const xApexEase = xPeak + (-16 + Math.random() * 32);

      const floorY = height - (5 + Math.random() * 10);
      const yFloor = Math.max(10, floorY - startY);
      const span = yFloor - yPeak;
      const fadeFraction = 0.28 + Math.random() * 0.68;
      const endFraction = Math.min(0.995, fadeFraction + 0.015 + Math.random() * 0.09);
      const f1 = fadeFraction * (0.12 + Math.random() * 0.28);
      const f2 = fadeFraction * (0.36 + Math.random() * 0.32);
      const f3 = fadeFraction * (0.62 + Math.random() * 0.26);
      const fNearFloor = Math.min(fadeFraction - 0.01, fadeFraction * (0.84 + Math.random() * 0.14));

      const yMid1 = yPeak + span * f1;
      const yMid2 = yPeak + span * f2;
      const yMid3 = yPeak + span * f3;
      const yNearFloor = yPeak + span * fNearFloor;
      const yFade = yPeak + span * fadeFraction;
      const yEnd = yPeak + span * endFraction;

      const xDrift = -150 + Math.random() * 300;
      const swaySign = Math.random() > 0.5 ? 1 : -1;
      const swayA = (10 + Math.random() * 16) * swaySign;
      const swayB = (12 + Math.random() * 18) * -swaySign;
      const swayC = (8 + Math.random() * 16) * swaySign;
      const swayD = (6 + Math.random() * 14) * -swaySign;
      const xMid1 = xPeak + xDrift * (0.18 + Math.random() * 0.2) + swayA;
      const xMid2 = xPeak + xDrift * (0.4 + Math.random() * 0.24) + swayB;
      const xMid3 = xPeak + xDrift * (0.64 + Math.random() * 0.2) + swayC;
      const xNearFloor = xPeak + xDrift * (0.82 + Math.random() * 0.14) + swayD;
      const xFade = xPeak + xDrift * (0.95 + Math.random() * 0.08) + swayC * 0.45;
      const xEnd = xPeak + xDrift * (1.02 + Math.random() * 0.08) + swayD * 0.35;

      const size = 4 + Math.random() * 6;
      const duration = 8600 + Math.random() * 8800;
      const delay = Math.random() * 4800;
      const rotPeak = `${Math.round((Math.random() * 2 - 1) * 260)}deg`;
      const rotMid1 = `${Math.round((Math.random() * 2 - 1) * 340)}deg`;
      const rotMid2 = `${Math.round((Math.random() * 2 - 1) * 420)}deg`;
      const rotMid3 = `${Math.round((Math.random() * 2 - 1) * 500)}deg`;
      const rotNearFloor = `${Math.round((Math.random() * 2 - 1) * 560)}deg`;
      const rotFade = `${Math.round((Math.random() * 2 - 1) * 620)}deg`;
      const rotEnd = `${Math.round((Math.random() * 2 - 1) * 680)}deg`;
      const color = palette[Math.floor(Math.random() * palette.length)];
      return {
        id: `p_${Date.now()}_${i}_${Math.random().toString(16).slice(2)}`,
        startX,
        startY,
        xPeak,
        yPeak,
        xApexEase,
        yApexEase,
        xMid1,
        yMid1,
        xMid2,
        yMid2,
        xMid3,
        yMid3,
        xNearFloor,
        yNearFloor,
        xFade,
        yFade,
        xEnd,
        yEnd,
        size,
        duration,
        delay,
        rotPeak,
        rotApexEase: `${Math.round((Math.random() * 2 - 1) * 300)}deg`,
        rotMid1,
        rotMid2,
        rotMid3,
        rotNearFloor,
        rotFade,
        rotEnd,
        color,
      };
    });

    setMilestoneConfetti({
      id: `burst_${Date.now()}`,
      milestoneValue,
      left: gridLeftInSurface,
      top: gridTopInSurface,
      width,
      height,
      particles,
    });
    setMilestoneToast(`Milestone reached - ${milestoneValue} tabs created.`);

    if (milestoneConfettiTimerRef.current) clearTimeout(milestoneConfettiTimerRef.current);
    milestoneConfettiTimerRef.current = setTimeout(() => {
      setMilestoneConfetti(null);
    }, 18400);

    if (milestoneToastTimerRef.current) clearTimeout(milestoneToastTimerRef.current);
    milestoneToastTimerRef.current = setTimeout(() => {
      setMilestoneToast("");
    }, 2000);
  }

  function triggerFirstExportGlow({ showToast = true } = {}) {
    setFirstExportGlowActive(true);
    if (firstExportGlowTimerRef.current) clearTimeout(firstExportGlowTimerRef.current);
    firstExportGlowTimerRef.current = setTimeout(() => {
      setFirstExportGlowActive(false);
    }, 4200);
    if (showToast) {
      setMilestoneToast("First export complete.");
      if (milestoneToastTimerRef.current) clearTimeout(milestoneToastTimerRef.current);
      milestoneToastTimerRef.current = setTimeout(() => {
        setMilestoneToast("");
      }, 2000);
    }
  }

  function showQuickToast(message, durationMs = 1800) {
    setMilestoneToast(message);
    if (milestoneToastTimerRef.current) clearTimeout(milestoneToastTimerRef.current);
    milestoneToastTimerRef.current = setTimeout(() => {
      setMilestoneToast("");
    }, durationMs);
  }

  function toggleChecklistItem(itemId) {
    if (!itemId) return;
    setV1ChecklistState((prev) => ({
      ...(prev || {}),
      [itemId]: !prev?.[itemId],
    }));
  }

  function hideChecklistItem(itemId) {
    if (!itemId) return;
    setV1ChecklistHidden((prev) => ({
      ...(prev || {}),
      [itemId]: true,
    }));
    setV1ChecklistState((prev) => {
      if (!prev?.[itemId]) return prev || {};
      const next = { ...(prev || {}) };
      delete next[itemId];
      return next;
    });
  }

  function resetChecklistState() {
    setV1ChecklistState({});
    try {
      localStorage.removeItem(LS_V1_CHECKLIST_STATE_KEY);
    } catch {}
  }

  function restoreChecklistDefaults() {
    setV1ChecklistHidden({});
    setV1ChecklistState({});
    try {
      localStorage.removeItem(LS_V1_CHECKLIST_HIDDEN_KEY);
      localStorage.removeItem(LS_V1_CHECKLIST_STATE_KEY);
      localStorage.setItem(LS_V1_CHECKLIST_VERSION_KEY, V1_CHECKLIST_VERSION);
    } catch {}
  }

  function openRickrollWithToasts({ showFollowup = true } = {}) {
    let seenBefore = false;
    try {
      seenBefore = String(localStorage.getItem(LS_RICKROLL_SEEN_KEY) || "").toLowerCase() === "true";
    } catch {}
    showQuickToast(seenBefore ? "You already fell for this." : "Preparing reward...", 900);
    window.setTimeout(() => {
      try {
        window.open(TABSTUDIO_TUTORIAL_URL, "_blank", "noopener,noreferrer");
      } catch {}
      try {
        localStorage.setItem(LS_RICKROLL_SEEN_KEY, "true");
      } catch {}
      if (!showFollowup) return;
      if (rickrollFollowupToastTimerRef.current) clearTimeout(rickrollFollowupToastTimerRef.current);
      rickrollFollowupToastTimerRef.current = setTimeout(() => {
        showQuickToast("Tabby warned you.", 1700);
        rickrollFollowupToastTimerRef.current = null;
      }, 350);
    }, 420);
  }

  function showTabbyBubble(message, durationMs = 2000) {
    setTabbyBubbleMessage(message);
    if (tabbyBubbleTimerRef.current) clearTimeout(tabbyBubbleTimerRef.current);
    tabbyBubbleTimerRef.current = setTimeout(() => {
      setTabbyBubbleMessage("");
      tabbyBubbleTimerRef.current = null;
    }, durationMs);
  }

  function handleTabbyShyEasterClick() {
    if (!funModeMasterEnabled || !funTabbyEnabled || !isTabbyGameActive) return;
    const now = Date.now();
    const stepStillValid = tabbyEasterStep === 1 && now - tabbyEasterStepTsRef.current <= 10000;
    if (!stepStillValid) {
      setTabbyEasterStep(1);
      tabbyEasterStepTsRef.current = now;
      showTabbyBubble("please don't click me...", 2000);
      return;
    }
    setTabbyEasterStep(0);
    tabbyEasterStepTsRef.current = 0;
    showTabbyBubble("okay... but don't tell anyone...", 1800);
    openRickrollWithToasts({ showFollowup: false });
  }

  function triggerPartyGridEffect({ durationMs = 5000 } = {}) {
    if (partyGridIntervalRef.current) {
      clearInterval(partyGridIntervalRef.current);
      partyGridIntervalRef.current = null;
    }
    if (partyGridStopTimerRef.current) {
      clearTimeout(partyGridStopTimerRef.current);
      partyGridStopTimerRef.current = null;
    }
    if (partyGridFadeTimerRef.current) {
      clearTimeout(partyGridFadeTimerRef.current);
      partyGridFadeTimerRef.current = null;
    }

    const rowCount = Math.max(1, tuning.length);
    const colCount = Math.max(1, cols);
    const totalCells = rowCount * colCount;
    const palette = isDarkMode
      ? [
          { bg: withAlpha("#5BD4A1", 0.5), glow: withAlpha("#5BD4A1", 0.62), ring: withAlpha("#B5F5DB", 0.42) },
          { bg: withAlpha("#4D8DFF", 0.46), glow: withAlpha("#4D8DFF", 0.6), ring: withAlpha("#BAD3FF", 0.4) },
          { bg: withAlpha("#9B7BFF", 0.44), glow: withAlpha("#9B7BFF", 0.58), ring: withAlpha("#D8CBFF", 0.4) },
          { bg: withAlpha("#FFD166", 0.48), glow: withAlpha("#FFD166", 0.62), ring: withAlpha("#FFE9B3", 0.42) },
          { bg: withAlpha("#FF9B42", 0.48), glow: withAlpha("#FF9B42", 0.6), ring: withAlpha("#FFD5B0", 0.4) },
          { bg: withAlpha("#FF5A67", 0.42), glow: withAlpha("#FF5A67", 0.56), ring: withAlpha("#FFC2C7", 0.38) },
        ]
      : [
          { bg: withAlpha("#5BD4A1", 0.34), glow: withAlpha("#5BD4A1", 0.38), ring: withAlpha("#4CB789", 0.25) },
          { bg: withAlpha("#4D8DFF", 0.31), glow: withAlpha("#4D8DFF", 0.35), ring: withAlpha("#3F78D9", 0.24) },
          { bg: withAlpha("#9B7BFF", 0.3), glow: withAlpha("#9B7BFF", 0.34), ring: withAlpha("#8162E5", 0.23) },
          { bg: withAlpha("#FFD166", 0.33), glow: withAlpha("#FFD166", 0.37), ring: withAlpha("#D5AE52", 0.24) },
          { bg: withAlpha("#FF9B42", 0.33), glow: withAlpha("#FF9B42", 0.36), ring: withAlpha("#D77F35", 0.24) },
          { bg: withAlpha("#FF5A67", 0.29), glow: withAlpha("#FF5A67", 0.33), ring: withAlpha("#D64C56", 0.22) },
        ];

    const tick = () => {
      const count = Math.max(18, Math.min(56, Math.round(totalCells * 0.12)));
      const next = {};
      for (let i = 0; i < count; i++) {
        const rr = Math.floor(Math.random() * rowCount);
        const cc = Math.floor(Math.random() * colCount);
        next[cellKey(rr, cc)] = palette[Math.floor(Math.random() * palette.length)];
      }
      setPartyGridTints(next);
    };

    const tickMs = 180;
    tick();
    partyGridIntervalRef.current = setInterval(tick, tickMs);
    const stopBeforeFinalMoveMs = Math.max(tickMs, durationMs - tickMs);
    partyGridStopTimerRef.current = setTimeout(() => {
      if (partyGridIntervalRef.current) {
        clearInterval(partyGridIntervalRef.current);
        partyGridIntervalRef.current = null;
      }
      partyGridFadeTimerRef.current = setTimeout(() => {
        setPartyGridTints({});
        partyGridFadeTimerRef.current = null;
      }, tickMs);
      partyGridStopTimerRef.current = null;
    }, stopBeforeFinalMoveMs);
  }

  function handleMockSaveProject() {
    const songName = String(saveTargetSongName || "").trim() || "Untitled Song";
    const tabName = String(saveSnapshotDraft?.name || "").trim() || `${songName} - Tab`;
    const tabId = `tab_saved_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const nowIso = new Date().toISOString();
    const payload = {
      target: {
        bandId: saveTargetBand?.id || null,
        bandName: saveTargetBand?.name || "",
        albumId: saveTargetAlbum?.id || null,
        albumName: saveTargetAlbum?.name || "",
        songName,
      },
      snapshot: saveSnapshotDraft,
      futureStorage:
        "Will be stored as structured JSON under Band -> Album -> Song (locally or via backend in a future update).",
    };

    let tabsCreatedTotal = 0;
    let didCreateTab = false;
    setLibraryData((prev) => {
      const next = (prev || []).map((band) => ({
        ...band,
        albums: (band.albums || []).map((album) => ({
          ...album,
          songs: (album.songs || []).map((song) => ({
            ...song,
            tabs: [...(song.tabs || [])],
          })),
        })),
      }));

      const bandIndex = next.findIndex((band) => band.id === (saveTargetBand?.id || ""));
      if (bandIndex < 0) {
        tabsCreatedTotal = countTabsInLibraryData(next);
        return next;
      }
      const band = next[bandIndex];

      const albumIndex = (band.albums || []).findIndex((album) => album.id === (saveTargetAlbum?.id || ""));
      if (albumIndex < 0) {
        tabsCreatedTotal = countTabsInLibraryData(next);
        return next;
      }
      const album = band.albums[albumIndex];

      const songIndex = (album.songs || []).findIndex(
        (song) => String(song?.name || "").trim().toLowerCase() === songName.toLowerCase()
      );

      const newTab = { id: tabId, name: tabName, createdAt: nowIso, updatedAt: nowIso };

      if (songIndex >= 0) {
        const targetSong = album.songs[songIndex];
        album.songs[songIndex] = {
          ...targetSong,
          tabs: [...(targetSong.tabs || []), newTab],
        };
        didCreateTab = true;
      } else {
        album.songs = [
          ...(album.songs || []),
          {
            id: `song_${Date.now()}_${Math.random().toString(16).slice(2)}`,
            name: songName,
            tabs: [newTab],
          },
        ];
        didCreateTab = true;
      }

      band.albums[albumIndex] = album;
      next[bandIndex] = band;
      tabsCreatedTotal = countTabsInLibraryData(next);
      return next;
    });

    const milestoneReached = didCreateTab && TABS_CREATED_MILESTONES.includes(tabsCreatedTotal);
    if (milestoneReached && !tabsMilestonesTriggered.includes(tabsCreatedTotal)) {
      setTabsMilestonesTriggered((prev) => {
        const next = [...new Set([...(prev || []), tabsCreatedTotal])].sort((a, b) => a - b);
        return next;
      });
      triggerTabsCreatedMilestone(tabsCreatedTotal);
    }

    console.log("Mock save payload:", payload);
    setSaveProjectOpen(false);
    setSaveSoonNotice(
      `Saved: ${payload.target.bandName || "Band"} / ${payload.target.albumName || "Album"} / ${payload.target.songName}`
    );
  }
  useEffect(() => {
    setGrid((prev) => {
      const next = prev.map((r) => r.slice());

      while (next.length < tuning.length) next.push(Array.from({ length: cols }, () => ""));
      while (next.length > tuning.length) next.pop();

      for (let i = 0; i < next.length; i++) {
        while (next[i].length < cols) next[i].push("");
        next[i] = next[i].slice(0, cols);
      }
      return next;
    });

    setCursor((cur) => ({
      r: Math.min(cur.r, Math.max(0, tuning.length - 1)),
      c: Math.min(cur.c, Math.max(0, cols - 1)),
    }));

    clearCellSelection();
  }, [tuning, cols]);

  function focusKeyCapture() {
    const el = keyCaptureRef.current;
    if (!el) return;
    try {
      el.focus({ preventScroll: true });
    } catch {
      try {
        el.focus();
      } catch {}
    }
    requestAnimationFrame(() => {
      try {
        el.focus({ preventScroll: true });
      } catch {
        try {
          el.focus();
        } catch {}
      }
    });
  }

  function shouldStealFocus(target) {
    const tag = target?.tagName;
    if (!tag) return true;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "OPTION" || tag === "BUTTON")
      return false;
    return true;
  }

  function isTextEntryElement(target) {
    const el = target;
    if (!el) return false;
    const tag = String(el.tagName || "").toUpperCase();
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function handleRootPointerDown(e) {
    if (!shouldStealFocus(e.target)) return;
    focusKeyCapture();
  }

  useEffect(() => {
    focusKeyCapture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setCell(r, c, value) {
    const prev = gridRef.current;
    if (!prev[r] || typeof prev[r][c] === "undefined") return;

    const next = prev.map((row) => row.slice());
    next[r][c] = value;
    commitGridChange(next);
  }

  function setManyCells(edits) {
    const prev = gridRef.current;
    const next = prev.map((row) => row.slice());
    let touched = false;
    for (const it of edits) {
      if (!next[it.r] || typeof next[it.r][it.c] === "undefined") continue;
      if (next[it.r][it.c] !== it.v) {
        next[it.r][it.c] = it.v;
        touched = true;
      }
    }
    if (!touched) return;
    commitGridChange(next);
  }

  function moveCursor(dr, dc) {
    clearCellSelection();
    setCursor((cur) => {
      const nr = Math.max(0, Math.min(tuning.length - 1, cur.r + dr));
      const nc = Math.max(0, Math.min(cols - 1, cur.c + dc));
      return { r: nr, c: nc };
    });
  }

  function startCellSelection(r, c) {
    setRandomCellSelection(new Set());
    setCellSelection({ r1: r, c1: c, r2: r, c2: c });
    selectingRef.current = true;
  }

  function updateCellSelection(r, c) {
    setCellSelection((prev) => {
      if (!prev) return { r1: r, c1: c, r2: r, c2: c };
      return { ...prev, r2: r, c2: c };
    });
  }

  function stopCellSelection() {
    selectingRef.current = false;
  }

  useEffect(() => {
    const onUp = () => stopCellSelection();
    window.addEventListener("pointerup", onUp, true);
    window.addEventListener("pointercancel", onUp, true);
    return () => {
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onUp, true);
    };
  }, []);

  useEffect(() => {
    const onPointerDown = () => {
      if (!clearRowSelectionOnNextPointerRef.current) return;
      clearRowSelectionOnNextPointerRef.current = false;
      clearSelection();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  useEffect(() => {
    const onPointerDown = (e) => {
      const insideTabWriter = eventPathIncludes(e, tabWriterAreaRef.current);
      if (insideTabWriter) {
        setGridTargetingActive(true);
        return;
      }
      setGridTargetingActive(false);
      clearCellSelection();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  useEffect(() => {
    if (!rowDeleteConfirmIds) return;
    const onEnter = (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      e.stopPropagation();
      confirmDeleteRows();
    };
    window.addEventListener("keydown", onEnter, true);
    return () => window.removeEventListener("keydown", onEnter, true);
  }, [rowDeleteConfirmIds]);

  function onCellPointerDown(e, r, c) {
    e.preventDefault();
    const additive = e.metaKey || e.ctrlKey;
    setCursor({ r, c });
    setOverwriteNext(true);
    setInsertOpen(false);
    if (additive) {
      selectingRef.current = false;
      const baseSelection = selectionBounds;
      setCellSelection(null);
      const key = cellKey(r, c);
      setRandomCellSelection((prev) => {
        const next = new Set(prev);
        if (next.size === 0 && baseSelection) {
          for (let rr = baseSelection.r1; rr <= baseSelection.r2; rr++) {
            for (let cc = baseSelection.c1; cc <= baseSelection.c2; cc++) {
              next.add(cellKey(rr, cc));
            }
          }
        }
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      focusKeyCapture();
      return;
    }
    startCellSelection(r, c);
    focusKeyCapture();
  }

  function onCellPointerEnter(e, r, c) {
    if (!selectingRef.current) return;
    updateCellSelection(r, c);
  }

  function getSelectedCellsEdits(value = "") {
    const selectedCells = getSelectedCellCoords();
    if (!selectedCells.length) return [];
    const edits = [];
    for (const { r, c } of selectedCells) {
      edits.push({ r, c, v: value });
    }
    return edits;
  }

  async function copySelectionToClipboard() {
    const selectedCells = getSelectedCellCoords();
    if (!selectedCells.length) return;
    const selectedSet = new Set(selectedCells.map(({ r, c }) => cellKey(r, c)));
    const minR = Math.min(...selectedCells.map((p) => p.r));
    const maxR = Math.max(...selectedCells.map((p) => p.r));
    const minC = Math.min(...selectedCells.map((p) => p.c));
    const maxC = Math.max(...selectedCells.map((p) => p.c));
    const lines = [];
    for (let rr = minR; rr <= maxR; rr++) {
      const row = [];
      for (let cc = minC; cc <= maxC; cc++) {
        row.push(selectedSet.has(cellKey(rr, cc)) ? String(gridRef.current?.[rr]?.[cc] ?? "") : "");
      }
      lines.push(row.join("\t"));
    }
    const text = lines.join("\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-10000px";
        ta.style.top = "-10000px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        ta.remove();
      } catch {}
    }
  }

  function insertIntoSelectedCell(insert) {
    // If a range of cells is selected, apply the insert to every selected cell.
    if (hasCellSelection) {
      const prev = gridRef.current;
      const next = prev.map((row) => row.slice());
      const selectedCells = getSelectedCellCoords();
      for (const { r: rr, c: cc } of selectedCells) {
        const current = String(next?.[rr]?.[cc] ?? "");
        next[rr][cc] = current === "" ? insert : current + insert;
      }

      commitGridChange(next);
      setOverwriteNext(false);
      setInsertOpen(false);
      focusKeyCapture();
      return;
    }

    // Otherwise, apply to the single active cell and advance as before.
    const { r, c } = cursorRef.current;
    const current = String(gridRef.current?.[r]?.[c] ?? "");
    const next = current === "" ? insert : current + insert;
    setCell(r, c, next);

    setOverwriteNext(false);

    const advances =
      insert === "h" || insert === "p" || insert === "/" || insert === "\\" || insert === "b";
    if (advances) moveCursor(0, 1);

    setInsertOpen(false);
    focusKeyCapture();
  }

function fillSelectedColumnWith(value) {
    const col = cursorRef.current.c;
    const prev = gridRef.current;
    const next = prev.map((row) => row.slice());
    for (let r = 0; r < tuning.length; r++) next[r][col] = value;
    commitGridChange(next);
    setOverwriteNext(true);
    setInsertOpen(false);
    focusKeyCapture();
  }

  function applyTuningOption(t) {
    const app = lowToHighToApp(t.lowToHigh);
    if (app.length !== tuning.length || app.some((x) => !String(x).trim())) {
      // if length differs, trust instrument definition and rebuild
      const newGrid = makeBlankGrid(app.length, colsRef.current || defaultCols);
      undoStackRef.current = [];
      redoStackRef.current = [];
      setGrid(newGrid);
      setCursor({ r: 0, c: 0 });
    }
    setTuning(app);
    setTuningLabel(formatTuningName(t.name));
    setTuningOpen(false);
    setCustomOpen(false);
    setOverwriteNext(false);
    focusKeyCapture();
  }

  function resetCustomFormToCurrent() {
    setCustomName("");
    setCustomLowToHigh(appToLowToHigh(tuning));
  }

  function saveCustomTuning() {
    const name = customName.trim();
    if (!name) return;
    const lowToHigh = customLowToHigh.map((s) => String(s ?? "").trim()).slice(0, 6);
    if (lowToHigh.length !== 6 || lowToHigh.some((s) => !s)) return;

    const id = `user_tuning_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const next = { id, name, lowToHigh };

    setUserTunings((prev) => [...prev, next]);
    setCustomOpen(false);
    applyTuningOption(next);
  }

  function deleteUserTuning(id) {
    const ok = window.confirm("Delete this saved tuning?");
    if (!ok) return;
    setUserTunings((prev) => prev.filter((t) => t.id !== id));
  }

  function getColumnValues(col) {
    return Array.from({ length: tuning.length }, (_, r) => String(gridRef.current?.[r]?.[col] ?? ""));
  }

  function saveChordFromSelectedColumn() {
    if (!standard) return;
    const name = chordName.trim();
    if (!name) return;
    const col = cursorRef.current.c;
    const values = getColumnValues(col);
    if (!values.some((x) => x.trim() !== "")) return;

    const id = `userChord_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setUserChords((prev) => [...prev, { id, name, frets: values.map((v) => v.trim()) }]);
    setChordName("");
    setSelectedChordId(id);
    focusKeyCapture();
  }

  function deleteUserChord(id) {
    const ok = window.confirm("Delete this saved chord?");
    if (!ok) return;
    setUserChords((prev) => prev.filter((c) => c.id !== id));
    setSelectedChordId((cur) => (cur === id ? "" : cur));
    setLastAppliedChordId((cur) => (cur === id ? "" : cur));
    focusKeyCapture();
  }

  function applyChordIdToSelectedColumn(chordId) {
    if (!standard) return;
    const chord = allChords.find((c) => c.id === chordId);
    if (!chord) return;

    const col = cursorRef.current.c;
    const prev = gridRef.current;
    const next = prev.map((row) => row.slice());
    for (let r = 0; r < tuning.length; r++) {
      const v = chord.frets?.[r] ?? "";
      next[r][col] = v;
    }

    const cur = cursorRef.current;
    const nextCursor = { r: cur.r, c: Math.min(colsRef.current - 1, cur.c + 1) };
    commitGridChange(next, nextCursor);

    setLastAppliedChordId(chordId);
    setOverwriteNext(true);
    focusKeyCapture();
  }

  function applyChordToSelectedColumn() {
    if (!selectedChordId) return;
    applyChordIdToSelectedColumn(selectedChordId);
    setChordsOpen(true);
  }

  function repeatLastChord() {
    if (!lastAppliedChordId) return;
    applyChordIdToSelectedColumn(lastAppliedChordId);
  }

  function completeRow({ advanceToNextString = false } = {}) {
    const id = `row_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const trimmed = trimGridToContent(gridView, 1);
    const currentCursor = cursorRef.current;
    const nextRowIndex = advanceToNextString ? Math.min(tuning.length - 1, currentCursor.r + 1) : 0;

    setCompletedRows((prev) => {
      const nextIndex = prev.length + 1;
      const defaultName = `Row ${nextIndex} – ${currentInstrument.label}`;
      const snapshot = {
        id,
        kind: "tab",
        name: defaultName,
        repeatCount: 1,
        tuningAtTime: tuning.slice(),
        colsAtTime: trimmed.cols,
        grid: trimmed.grid,
        instrumentIdAtTime: currentInstrument.id,
        instrumentLabelAtTime: currentInstrument.label,
      };
      return [...prev, snapshot];
    });

    const nextGrid = makeBlankGrid(tuning.length, cols);
    commitGridChange(nextGrid, { r: nextRowIndex, c: 0 });

    setCompletedRowsOpen(true);
    setOverwriteNext(true);
    setInsertOpen(false);
    clearCellSelection();
    focusKeyCapture();
  }


  function addNoteRow() {
    const id = `note_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setCompletedRows((prev) => {
      const noteIndex = prev.filter((r) => r.kind === "note").length + 1;
      const snapshot = {
        id,
        kind: "note",
        name: `Note ${noteIndex}`,
        noteText: "",
      };
      return [...prev, snapshot];
    });
    lastAddedNoteIdRef.current = id;
    // Ensure the Completed rows panel is open so the user sees the new note.
    setCompletedRowsOpen(true);
    // Scroll/focus happens in an effect after render.
  }


  function updateNoteText(id, text) {
    const value = String(text ?? "");
    setCompletedRows((prev) => prev.map((r) => (r.id === id ? { ...r, noteText: value } : r)));
  }

  function insertIntoNoteText(id, symbol) {
    const row = completedRows.find((r) => r.id === id && r.kind === "note");
    if (!row) return;

    const textarea = noteTextAreaRefs.current?.[id];
    const currentText = String(row.noteText ?? "");
    let start = currentText.length;
    let end = currentText.length;
    if (
      textarea &&
      typeof textarea.selectionStart === "number" &&
      typeof textarea.selectionEnd === "number"
    ) {
      start = textarea.selectionStart;
      end = textarea.selectionEnd;
    }

    const nextText = `${currentText.slice(0, start)}${symbol}${currentText.slice(end)}`;
    updateNoteText(id, nextText);

    requestAnimationFrame(() => {
      const el = noteTextAreaRefs.current?.[id];
      if (!el) return;
      const caret = start + symbol.length;
      try {
        el.focus();
        el.setSelectionRange(caret, caret);
      } catch {}
    });
  }

  function updateRowRepeat(id, raw) {
    const str = String(raw ?? "").trim();
    const parsed = parseInt(str, 10);
    const n = !isFinite(parsed) || parsed <= 0 ? 1 : Math.min(parsed, 99);
    setCompletedRows((prev) => prev.map((r) => (r.id === id ? { ...r, repeatCount: n } : r)));
  }

  function nudgeRowRepeat(id, delta) {
    setCompletedRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const current = Math.max(1, Math.min(99, Number(r.repeatCount ?? 1) || 1));
        const next = Math.max(1, Math.min(99, current + delta));
        return { ...r, repeatCount: next };
      })
    );
  }

  function resetRowRepeat(id) {
    setCompletedRows((prev) => prev.map((r) => (r.id === id ? { ...r, repeatCount: 1 } : r)));
  }

  function editCompletedRow(id) {
    const row = completedRows.find((x) => x.id === id);
    if (!row) return;

    setTuning(row.tuningAtTime.slice());
    setCols(row.colsAtTime);

    const matchingPresets = getInstrumentTuningPresets(instrumentId);
    const match = matchingPresets.find((t) => {
      const app = lowToHighToApp(t.lowToHigh);
      return app.map(normNote).join("|") === row.tuningAtTime.map(normNote).join("|");
    });
    setTuningLabel(match ? formatTuningName(match.name) : "Custom");

    const next = makeBlankGrid(row.tuningAtTime.length, row.colsAtTime);
    for (let r = 0; r < row.tuningAtTime.length; r++) {
      for (let c = 0; c < row.colsAtTime; c++) next[r][c] = String(row.grid?.[r]?.[c] ?? "");
    }

    undoStackRef.current = [];
    redoStackRef.current = [];
    setGrid(next);
    setCursor({ r: 0, c: 0 });

    setCompletedRows((prev) => prev.filter((x) => x.id !== id));
    setSelectedRowIds((prev) => {
      const nextSet = new Set(prev);
      nextSet.delete(id);
      return nextSet;
    });

    setOverwriteNext(true);
    setInsertOpen(false);
    clearCellSelection();
    focusKeyCapture();
  }

  function requestDeleteRows(ids, source = "") {
    const nextIds = Array.from(new Set((ids || []).filter(Boolean)));
    if (!nextIds.length) return;
    setRowDeleteConfirmIds(nextIds);
    setRowDeleteConfirmSource(source);
  }

  function closeDeleteRowsConfirm() {
    setRowDeleteConfirmIds(null);
    setRowDeleteConfirmSource("");
  }

  function confirmDeleteRows() {
    if (!rowDeleteConfirmIds || rowDeleteConfirmIds.length === 0) return;
    const idsToDelete = new Set(rowDeleteConfirmIds);
    setCompletedRows((prev) => prev.filter((x) => !idsToDelete.has(x.id)));
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      rowDeleteConfirmIds.forEach((id) => next.delete(id));
      return next;
    });
    setRowDeleteConfirmIds(null);
    setRowDeleteConfirmSource("");
  }

  function deleteCompletedRow(id) {
    requestDeleteRows([id], "single");
  }

  function toggleSelectedRow(id) {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllRows() {
    setSelectedRowIds(() => new Set(completedRows.map((r) => r.id)));
  }

  function clearSelection() {
    setSelectedRowIds(() => new Set());
  }

  function moveSelectedCompletedRows(delta) {
    if (selectedRowIds.size === 0 || !completedRows.length) return;
    setCompletedRows((prev) => {
      if (prev.length < 2) return prev;
      const selected = new Set(selectedRowIds);
      const next = prev.slice();

      if (delta < 0) {
        for (let i = 1; i < next.length; i += 1) {
          if (selected.has(next[i].id) && !selected.has(next[i - 1].id)) {
            const tmp = next[i - 1];
            next[i - 1] = next[i];
            next[i] = tmp;
          }
        }
      } else if (delta > 0) {
        for (let i = next.length - 2; i >= 0; i -= 1) {
          if (selected.has(next[i].id) && !selected.has(next[i + 1].id)) {
            const tmp = next[i + 1];
            next[i + 1] = next[i];
            next[i] = tmp;
          }
        }
      }

      return next;
    });
  }

  function deleteSelectedRows() {
    if (selectedRowIds.size === 0) return;
    requestDeleteRows(Array.from(selectedRowIds), "selected");
  }

  function makeRowDuplicate(row) {
    const newId = `row_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    if (row.kind === "note") {
      return {
        ...row,
        id: newId,
        name: row.name ? `${row.name} (copy)` : "Note (copy)",
        noteText: row.noteText ?? "",
      };
    }
    return {
      ...row,
      id: newId,
      name: row.name ? `${row.name} (copy)` : `Row (copy) – ${row.instrumentLabelAtTime || currentInstrument.label}`,
      repeatCount: row.repeatCount ?? 1,
      tuningAtTime: row.tuningAtTime.slice(),
      colsAtTime: row.colsAtTime,
      grid: clone2D(row.grid),
    };
  }

  function duplicateSelectedRows() {
    if (selectedRowIds.size === 0) return;
    clearRowSelectionOnNextPointerRef.current = true;
    let firstNewId = null;
    let firstNewName = "";
    setCompletedRows((prev) => {
      const next = [];
      prev.forEach((row) => {
        next.push(row);
        if (selectedRowIds.has(row.id)) {
          const copy = makeRowDuplicate(row);
          if (!firstNewId) {
            firstNewId = copy.id;
            firstNewName = copy.name ?? "";
          }
          next.push(copy);
        }
      });
      return next;
    });

    if (firstNewId) {
      requestAnimationFrame(() => {
        setRenamingRowId(firstNewId);
        setRenameDraft(firstNewName);
        requestAnimationFrame(() => {
          renameInputRef.current?.focus?.();
          renameInputRef.current?.select?.();
        });
      });
    }
  }

  function startRenameRow(row) {
    setRenamingRowId(row.id);
    setRenameDraft(row.name ?? "");
    requestAnimationFrame(() => {
      renameInputRef.current?.focus?.();
      renameInputRef.current?.select?.();
    });
  }

  function commitRenameRow(id) {
    const name = renameDraft.trim() || "Untitled";
    setCompletedRows((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)));
    setRenamingRowId(null);
    setRenameDraft("");
  }

  function cancelRenameRow() {
    setRenamingRowId(null);
    setRenameDraft("");
  }

  function duplicateRow(rowId) {
    const row = completedRows.find((r) => r.id === rowId);
    if (!row) return;
    clearRowSelectionOnNextPointerRef.current = true;
    const copy = makeRowDuplicate(row);
    const newId = copy.id;

    setCompletedRows((prev) => {
      const idx = prev.findIndex((r) => r.id === rowId);
      if (idx === -1) return [...prev, copy];
      const next = prev.slice();
      next.splice(idx + 1, 0, copy);
      return next;
    });

    requestAnimationFrame(() => {
      setRenamingRowId(newId);
      setRenameDraft(copy.name ?? "");
      requestAnimationFrame(() => {
        renameInputRef.current?.focus?.();
        renameInputRef.current?.select?.();
      });
    });
  }

  // Drag reorder
  const dragRowIdRef = useRef(null);
  function onDragStartRow(e, rowId) {
    dragRowIdRef.current = rowId;
    try {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", rowId);
    } catch {}
  }
  function onDragOverRow(e) {
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = "move";
    } catch {}
  }
  function onDropRow(e, targetRowId) {
    e.preventDefault();
    const srcId = dragRowIdRef.current;
    dragRowIdRef.current = null;
    if (!srcId || srcId === targetRowId) return;

    setCompletedRows((prev) => {
      const srcIndex = prev.findIndex((r) => r.id === srcId);
      const tgtIndex = prev.findIndex((r) => r.id === targetRowId);
      if (srcIndex === -1 || tgtIndex === -1) return prev;

      const next = prev.slice();
      const [moved] = next.splice(srcIndex, 1);
      const insertAt = srcIndex < tgtIndex ? tgtIndex : tgtIndex;
      next.splice(insertAt, 0, moved);
      return next;
    });
  }

  function clearAll() {
    const next = makeBlankGrid(tuning.length, cols);
    commitGridChange(next, { r: 0, c: 0 });
    setOverwriteNext(true);
    setInsertOpen(false);
    clearCellSelection();
    focusKeyCapture();
  }

  function clearCurrentRowWithConfirm() {
    const hasContent = gridRef.current?.some((row) => row.some((cell) => String(cell ?? "").trim() !== ""));
    if (hasContent) {
      const ok = window.confirm("Clear the current tab writer row?");
      if (!ok) return;
    }
    clearAll();
  }

  useEffect(() => {
    if (!insertOpen) return;
    const onDown = (e) => {
      if (eventPathIncludes(e, insertBtnRef.current)) return;
      if (eventPathIncludes(e, insertPanelRef.current)) return;
      setInsertOpen(false);
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [insertOpen]);

  useEffect(() => {
    if (!tuningOpen) return;
    const onDown = (e) => {
      if (eventPathIncludes(e, tuningBtnRef.current)) return;
      if (eventPathIncludes(e, tuningPanelRef.current)) return;
      setTuningOpen(false);
      setCustomOpen(false);
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [tuningOpen]);

  useEffect(() => {
    if (!capoOpen) return;
    const onDown = (e) => {
      if (eventPathIncludes(e, capoBtnRef.current)) return;
      if (eventPathIncludes(e, capoPanelRef.current)) return;
      setCapoOpen(false);
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [capoOpen]);

  useEffect(() => {
    if (!chordsOpen) return;
    const onDown = (e) => {
      if (eventPathIncludes(e, chordsBtnRef.current)) return;
      if (eventPathIncludes(e, chordsPanelRef.current)) return;
      setChordsOpen(false);
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [chordsOpen]);

  useEffect(() => {
    if (!instrumentOpen) return;
    const onDown = (e) => {
      if (eventPathIncludes(e, instrumentBtnRef.current)) return;
      if (eventPathIncludes(e, instrumentPanelRef.current)) return;
      setInstrumentOpen(false);
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [instrumentOpen]);

  // Settings sidebar state
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [shortcutsShowBoth, setShortcutsShowBoth] = useState(false);
  const [tabWritingOpen, setTabWritingOpen] = useState(false);
  const [funModeOpen, setFunModeOpen] = useState(false);
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [accountProfileOpen, setAccountProfileOpen] = useState(false);
  const [projectsLibraryOpen, setProjectsLibraryOpen] = useState(false);
  const [saveProjectOpen, setSaveProjectOpen] = useState(false);
  const [saveSoonNotice, setSaveSoonNotice] = useState("");
  const [tabsMilestonesTriggered, setTabsMilestonesTriggered] = useState(() => readMilestonesTriggered());
  const [milestoneConfetti, setMilestoneConfetti] = useState(null);
  const [milestoneToast, setMilestoneToast] = useState("");
  const [partyGridTints, setPartyGridTints] = useState({});
  const [firstExportGlowActive, setFirstExportGlowActive] = useState(false);
  const [libraryData, setLibraryData] = useState(() =>
    MOCK_LIBRARY.map((band) => ({
      ...band,
      albums: (band.albums || []).map((album) => ({
        ...album,
        songs: (album.songs || []).map((song) => ({
          ...song,
          tabs: [...(song.tabs || [])],
        })),
      })),
    }))
  );
  const [selectedLibraryBandId, setSelectedLibraryBandId] = useState("");
  const [selectedLibraryAlbumId, setSelectedLibraryAlbumId] = useState("");
  const [selectedLibrarySongId, setSelectedLibrarySongId] = useState("");
  const [saveTargetBandId, setSaveTargetBandId] = useState("");
  const [saveTargetAlbumId, setSaveTargetAlbumId] = useState("");
  const [saveTargetSongName, setSaveTargetSongName] = useState("");
  const [saveSnapshotDraft, setSaveSnapshotDraft] = useState(null);
  const [accountProfileSection, setAccountProfileSection] = useState("overview");
  const [profileFooterHover, setProfileFooterHover] = useState(false);
  const [profileFooterFocused, setProfileFooterFocused] = useState(false);
  const [settingsLanguagePreview, setSettingsLanguagePreview] = useState(() => {
    try {
      const raw = String(localStorage.getItem(LS_UI_LANG_KEY) || "en").toLowerCase();
      return raw === "es" ? "es" : "en";
    } catch {
      return "en";
    }
  });
  const [settingsLanguageOpen, setSettingsLanguageOpen] = useState(false);
  const [funModeMasterEnabled, setFunModeMasterEnabled] = useState(() =>
    readLocalStorageBool(LS_FUN_MODE_MASTER_TOGGLE_KEY, false)
  );
  const [funTabbyEnabled, setFunTabbyEnabled] = useState(() => readLocalStorageBool(LS_FUN_TABBY_TOGGLE_KEY, false));
  const [funPersonalBestEnabled, setFunPersonalBestEnabled] = useState(() =>
    readLocalStorageBool(LS_FUN_PERSONAL_BEST_TOGGLE_KEY, false)
  );
  const [funPartyModeEnabled, setFunPartyModeEnabled] = useState(() =>
    readLocalStorageBool(LS_FUN_PARTY_MODE_TOGGLE_KEY, false)
  );
  const [tabbyModeEnabled] = useState(true);
  const [tabbyHighScore, setTabbyHighScore] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_TABBY_HIGH_SCORE_KEY);
      const n = Number.parseInt(String(raw ?? "0"), 10);
      return Number.isFinite(n) && n > 0 ? n : 0;
    } catch {
      return 0;
    }
  });
  const [isTabbyGameActive, setIsTabbyGameActive] = useState(false);
  const [tabbyEasterStep, setTabbyEasterStep] = useState(0);
  const [tabbyBubbleMessage, setTabbyBubbleMessage] = useState("");
  const tabbyEasterStepTsRef = useRef(0);
  const tabbyBubbleTimerRef = useRef(null);
  const rickrollFollowupToastTimerRef = useRef(null);
  const tabbyTriggerRef = useRef({ index: 0, lastTs: 0 });
  const milestoneConfettiTimerRef = useRef(null);
  const milestoneToastTimerRef = useRef(null);
  const firstExportGlowTimerRef = useRef(null);
  const partyGridIntervalRef = useRef(null);
  const partyGridStopTimerRef = useRef(null);
  const partyGridFadeTimerRef = useRef(null);
  const editorSurfaceRef = useRef(null);
  const tabWriterAreaRef = useRef(null);
  const tabbyGridRef = useRef(null);
  const songTitleInputRef = useRef(null);
  const artistInputRef = useRef(null);
  const completedRowsToggleRef = useRef(null);
  const completedRowsActionsRef = useRef(null);
  const completedRowsSectionRef = useRef(null);
  const libraryDragRef = useRef(null);
  const shortcutPlatform = useMemo(() => {
    try {
      const platformRaw =
        String(navigator?.userAgentData?.platform || "") ||
        String(navigator?.platform || "") ||
        String(navigator?.userAgent || "");
      const normalized = platformRaw.toLowerCase();
      if (
        normalized.includes("mac") ||
        normalized.includes("iphone") ||
        normalized.includes("ipad") ||
        normalized.includes("ipod")
      ) {
        return "mac";
      }
      return "win";
    } catch {
      return "win";
    }
  }, []);
  const isSpanishUi = settingsLanguagePreview === "es";
  const tr = (en, es) => (isSpanishUi ? `${es || en} (${en})` : en);
  const visibleChecklistSections = useMemo(
    () =>
      V1_RELEASE_CHECKLIST.map((section) => ({
        ...section,
        items: (section.items || []).filter((item) => !v1ChecklistHidden[item.id]),
      })).filter((section) => section.items.length > 0),
    [v1ChecklistHidden]
  );
  const checklistCounts = useMemo(() => {
    const visibleItems = visibleChecklistSections.flatMap((section) => section.items || []);
    const total = visibleItems.length;
    const complete = visibleItems.reduce((sum, item) => (v1ChecklistState[item.id] ? sum + 1 : sum), 0);
    return { total, complete };
  }, [visibleChecklistSections, v1ChecklistState]);

  const selectedLibraryBand = useMemo(
    () => libraryData.find((b) => b.id === selectedLibraryBandId) || null,
    [libraryData, selectedLibraryBandId]
  );
  const selectedLibraryAlbums = selectedLibraryBand?.albums || [];
  const selectedLibraryAlbum = selectedLibraryAlbums.find((a) => a.id === selectedLibraryAlbumId) || null;
  const selectedLibrarySongs = selectedLibraryAlbum?.songs || [];
  const selectedLibrarySong = selectedLibrarySongs.find((song) => song.id === selectedLibrarySongId) || null;
  const selectedLibraryTabs = selectedLibrarySong?.tabs || [];
  const saveTargetBand = useMemo(
    () => libraryData.find((b) => b.id === saveTargetBandId) || libraryData[0] || null,
    [libraryData, saveTargetBandId]
  );
  const saveTargetAlbums = saveTargetBand?.albums || [];
  const saveTargetAlbum = saveTargetAlbums.find((a) => a.id === saveTargetAlbumId) || saveTargetAlbums[0] || null;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsWide, setSettingsWide] = useState(() => readLocalStorageBool(LS_SETTINGS_WIDE_KEY, false));
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [v1ChecklistState, setV1ChecklistState] = useState(() => readLocalStorageObject(LS_V1_CHECKLIST_STATE_KEY, {}));
  const [v1ChecklistHidden, setV1ChecklistHidden] = useState(() => readLocalStorageObject(LS_V1_CHECKLIST_HIDDEN_KEY, {}));
  const settingsBtnRef = useRef(null);
  const settingsPanelRef = useRef(null);
  const settingsLanguageBtnRef = useRef(null);
  const settingsLanguageMenuRef = useRef(null);
  const settingsPanelWidth = settingsWide ? 440 : 304;
  const settingsPanelWidthCss = `min(${settingsPanelWidth}px, calc(100vw - 16px))`;

  const [tabCopyMode, setTabCopyMode] = useState("move"); // 'move' | 'copy'
  const [scrollScope, setScrollScope] = useState(() => {
    try {
      const stored = localStorage.getItem(LS_SCROLL_SCOPE_KEY);
      if (stored === "selected" || stored === "all") return stored;
    } catch {}
    return "all";
  });
  useEffect(() => {
    if (!saveSoonNotice) return;
    const t = setTimeout(() => setSaveSoonNotice(""), 2600);
    return () => clearTimeout(t);
  }, [saveSoonNotice]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_TABS_MILESTONES_TRIGGERED_KEY, JSON.stringify(tabsMilestonesTriggered));
    } catch {}
  }, [tabsMilestonesTriggered]);

  useEffect(
    () => () => {
      if (milestoneConfettiTimerRef.current) clearTimeout(milestoneConfettiTimerRef.current);
      if (milestoneToastTimerRef.current) clearTimeout(milestoneToastTimerRef.current);
      if (firstExportGlowTimerRef.current) clearTimeout(firstExportGlowTimerRef.current);
      if (partyGridIntervalRef.current) clearInterval(partyGridIntervalRef.current);
      if (partyGridStopTimerRef.current) clearTimeout(partyGridStopTimerRef.current);
      if (partyGridFadeTimerRef.current) clearTimeout(partyGridFadeTimerRef.current);
      if (tabbyBubbleTimerRef.current) clearTimeout(tabbyBubbleTimerRef.current);
      if (rickrollFollowupToastTimerRef.current) clearTimeout(rickrollFollowupToastTimerRef.current);
    },
    []
  );

  useEffect(() => {
    try {
      localStorage.setItem(LS_SCROLL_SCOPE_KEY, scrollScope);
    } catch {}
  }, [scrollScope]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_FUN_MODE_MASTER_TOGGLE_KEY, funModeMasterEnabled ? "true" : "false");
    } catch {}
  }, [funModeMasterEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_FUN_TABBY_TOGGLE_KEY, funTabbyEnabled ? "true" : "false");
    } catch {}
  }, [funTabbyEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_FUN_PERSONAL_BEST_TOGGLE_KEY, funPersonalBestEnabled ? "true" : "false");
    } catch {}
  }, [funPersonalBestEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_FUN_PARTY_MODE_TOGGLE_KEY, funPartyModeEnabled ? "true" : "false");
    } catch {}
  }, [funPartyModeEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_SETTINGS_WIDE_KEY, settingsWide ? "true" : "false");
    } catch {}
  }, [settingsWide]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_V1_CHECKLIST_STATE_KEY, JSON.stringify(v1ChecklistState || {}));
    } catch {}
  }, [v1ChecklistState]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_V1_CHECKLIST_HIDDEN_KEY, JSON.stringify(v1ChecklistHidden || {}));
    } catch {}
  }, [v1ChecklistHidden]);
  useEffect(() => {
    try {
      if (localStorage.getItem(LS_V1_CHECKLIST_VERSION_KEY) !== V1_CHECKLIST_VERSION) {
        localStorage.setItem(LS_V1_CHECKLIST_VERSION_KEY, V1_CHECKLIST_VERSION);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_TABBY_MODE_KEY, tabbyModeEnabled ? "true" : "false");
    } catch {}
  }, [tabbyModeEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_TABBY_HIGH_SCORE_KEY, String(tabbyHighScore));
    } catch {}
  }, [tabbyHighScore]);

  useEffect(() => {
    if (!isTabbyGameActive) {
      setTabbyEasterStep(0);
      tabbyEasterStepTsRef.current = 0;
      setTabbyBubbleMessage("");
      if (tabbyBubbleTimerRef.current) {
        clearTimeout(tabbyBubbleTimerRef.current);
        tabbyBubbleTimerRef.current = null;
      }
      return;
    }
    setTabbyEasterStep(0);
    tabbyEasterStepTsRef.current = 0;
    setTabbyBubbleMessage("");
  }, [isTabbyGameActive]);

  useEffect(() => {
    if (funModeMasterEnabled && funTabbyEnabled) return;
    setTabbyEasterStep(0);
    tabbyEasterStepTsRef.current = 0;
    setTabbyBubbleMessage("");
    if (tabbyBubbleTimerRef.current) {
      clearTimeout(tabbyBubbleTimerRef.current);
      tabbyBubbleTimerRef.current = null;
    }
  }, [funModeMasterEnabled, funTabbyEnabled]);

  useEffect(() => {
    if (!tabbyModeEnabled || isTabbyGameActive) return;
    const onTabbySequence = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = String(e.key ?? "").toLowerCase();
      if (!/^[a-z]$/.test(key)) return;
      const now = Date.now();
      const word = "tabby";
      let { index, lastTs } = tabbyTriggerRef.current;
      if (lastTs && now - lastTs > 1200) index = 0;

      if (key === word[index]) {
        index += 1;
        tabbyTriggerRef.current = { index, lastTs: now };
        // Consume the hidden trigger keys so editor content is never modified by activation typing.
        e.preventDefault();
        e.stopPropagation();
      } else if (key === word[0]) {
        tabbyTriggerRef.current = { index: 1, lastTs: now };
        e.preventDefault();
        e.stopPropagation();
      } else {
        tabbyTriggerRef.current = { index: 0, lastTs: now };
      }

      if (index === word.length) {
        tabbyTriggerRef.current = { index: 0, lastTs: 0 };
        setIsTabbyGameActive(true);
      }
    };
    window.addEventListener("keydown", onTabbySequence, true);
    return () => window.removeEventListener("keydown", onTabbySequence, true);
  }, [tabbyModeEnabled, isTabbyGameActive]);

  useEffect(() => {
    if (!tabbyModeEnabled) tabbyTriggerRef.current = { index: 0, lastTs: 0 };
  }, [tabbyModeEnabled]);

  useEffect(() => {
    if (!settingsOpen) return;
    const onDown = (e) => {
      if (eventPathIncludes(e, settingsBtnRef.current)) return;
      if (eventPathIncludes(e, settingsPanelRef.current)) return;
      setSettingsOpen(false);
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [settingsOpen]);

  useEffect(() => {
    if (!settingsLanguageOpen) return;
    const onDown = (e) => {
      if (eventPathIncludes(e, settingsLanguageBtnRef.current)) return;
      if (eventPathIncludes(e, settingsLanguageMenuRef.current)) return;
      setSettingsLanguageOpen(false);
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [settingsLanguageOpen]);

  useEffect(() => {
    if (!settingsOpen) setSettingsLanguageOpen(false);
  }, [settingsOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_UI_LANG_KEY, settingsLanguagePreview === "es" ? "es" : "en");
    } catch {}
  }, [settingsLanguagePreview]);

  // Global ESC key handler to close overlays/menus in a top-down order.
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key !== "Escape") return;

      const active = document.activeElement;
      if (active && (active === songTitleInputRef.current || active === artistInputRef.current)) {
        e.preventDefault();
        e.stopPropagation();
        try {
          active.blur?.();
        } catch {}
        focusKeyCapture();
        return;
      }

      if (isTabbyGameActive) return;
      e.preventDefault();
      e.stopPropagation();

      if (checklistOpen) {
        setChecklistOpen(false);
        return;
      }

      // Close top-most sub-modal first and keep parent tool open.
      if (editChordModalOpen) {
        setEditChordModalOpen(false);
        setChordsOpen(true);
        try {
          keyCaptureRef.current?.focus?.({ preventScroll: true });
        } catch {
          try {
            keyCaptureRef.current?.focus?.();
          } catch {}
        }
        return;
      }

      if (customOpen) {
        setCustomOpen(false);
        setTuningOpen(true);
        try {
          keyCaptureRef.current?.focus?.({ preventScroll: true });
        } catch {
          try {
            keyCaptureRef.current?.focus?.();
          } catch {}
        }
        return;
      }

      if (saveProjectOpen) {
        setSaveProjectOpen(false);
        return;
      }

      if (rowDeleteConfirmIds) {
        setRowDeleteConfirmIds(null);
        setRowDeleteConfirmSource("");
        return;
      }

      if (accountProfileOpen) {
        setAccountProfileOpen(false);
        return;
      }

      // Then close one open panel at a time.
      if (insertOpen) return void setInsertOpen(false);
      if (chordsOpen) return void setChordsOpen(false);
      if (capoOpen) return void setCapoOpen(false);
      if (tuningOpen) return void setTuningOpen(false);
      if (instrumentOpen) return void setInstrumentOpen(false);
      if (settingsOpen) return void setSettingsOpen(false);
    };

    window.addEventListener("keydown", handleEsc, true);
    return () => window.removeEventListener("keydown", handleEsc, true);
  }, [
    editChordModalOpen,
    customOpen,
    saveProjectOpen,
    rowDeleteConfirmIds,
    accountProfileOpen,
    insertOpen,
    chordsOpen,
    capoOpen,
    tuningOpen,
    instrumentOpen,
    settingsOpen,
    isTabbyGameActive,
    checklistOpen,
  ]);

  useEffect(() => {
    const onGlobalShortcut = (e) => {
      const key = String(e.key ?? "");
      const lower = key.toLowerCase();
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      const activeEl = document.activeElement;
      const target = e.target;
      const isTextEntry = isTextEntryElement(target) || isTextEntryElement(activeEl);
      const inGridScope = !!(activeEl && (activeEl === keyCaptureRef.current || tabWriterAreaRef.current?.contains(activeEl)));
      const inCompletedRowsScope = !!(activeEl && completedRowsSectionRef.current?.contains(activeEl));
      const consume = () => {
        e.preventDefault();
        e.stopPropagation();
      };

      if (lower === "z") {
        consume();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (!e.metaKey && e.ctrlKey && lower === "y") {
        consume();
        redo();
        return;
      }
      if (lower === "s") {
        consume();
        handleSaveTabClick();
        return;
      }
      if (lower === "o") {
        consume();
        handleOpenTabClick();
        return;
      }
      if (lower === "e") {
        consume();
        exportPdfNow();
        return;
      }
      if (key === ",") {
        consume();
        setSettingsOpen(true);
        return;
      }
      if (key === "/" || key === "?") {
        consume();
        setSettingsOpen(true);
        setShortcutsOpen(true);
        setProjectsOpen(false);
        setTabWritingOpen(false);
        setFunModeOpen(false);
        setFaqsOpen(false);
        return;
      }

      if (inCompletedRowsScope && !isTextEntry && (key === "ArrowUp" || key === "ArrowDown")) {
        consume();
        moveSelectedCompletedRows(key === "ArrowUp" ? -1 : 1);
        return;
      }
      if (inCompletedRowsScope && !isTextEntry && lower === "d") {
        consume();
        duplicateSelectedRows();
        return;
      }
      if (inCompletedRowsScope && !isTextEntry && (key === "Delete" || key === "Backspace")) {
        consume();
        deleteSelectedRows();
        return;
      }

      if (!inGridScope) return;

      if (lower === "1") {
        consume();
        songTitleInputRef.current?.focus?.();
        songTitleInputRef.current?.select?.();
        return;
      }
      if (lower === "2") {
        consume();
        artistInputRef.current?.focus?.();
        artistInputRef.current?.select?.();
        return;
      }
      if (key === "Backspace" || key === "Delete") {
        consume();
        clearCurrentRowWithConfirm();
        return;
      }

      if (lower === "k") {
        consume();
        if (standard) {
          const next = !chordsOpen;
          setChordsOpen(next);
          if (next) {
            setInsertOpen(false);
            setCapoOpen(false);
            setTuningOpen(false);
            setInstrumentOpen(false);
          }
        }
        return;
      }

      if (lower === "i" && e.shiftKey) {
        consume();
        const next = !instrumentOpen;
        setInstrumentOpen(next);
        if (next) {
          setInsertOpen(false);
          setCapoOpen(false);
          setTuningOpen(false);
          setChordsOpen(false);
        }
        return;
      }

      if (lower === "t" && e.shiftKey) {
        consume();
        const next = !tuningOpen;
        setTuningOpen(next);
        if (next) {
          setInsertOpen(false);
          setCapoOpen(false);
          setInstrumentOpen(false);
          setChordsOpen(false);
        } else {
          setCustomOpen(false);
        }
        return;
      }

      if (lower === "c" && e.shiftKey) {
        consume();
        const next = !capoOpen;
        setCapoOpen(next);
        if (next) {
          setInsertOpen(false);
          setTuningOpen(false);
          setInstrumentOpen(false);
          setChordsOpen(false);
        }
        return;
      }

      if (lower === "i" && !e.shiftKey) {
        consume();
        const next = !insertOpen;
        setInsertOpen(next);
        if (next) {
          setCapoOpen(false);
          setTuningOpen(false);
          setInstrumentOpen(false);
          setChordsOpen(false);
        }
        return;
      }
    };

    window.addEventListener("keydown", onGlobalShortcut, true);
    return () => window.removeEventListener("keydown", onGlobalShortcut, true);
  }, [
    chordsOpen,
    insertOpen,
    capoOpen,
    tuningOpen,
    instrumentOpen,
    standard,
    isTextEntryElement,
    redo,
    undo,
    handleSaveTabClick,
    handleOpenTabClick,
    exportPdfNow,
    moveSelectedCompletedRows,
    duplicateSelectedRows,
    deleteSelectedRows,
    clearCurrentRowWithConfirm,
  ]);

  const [pdfShowSong, setPdfShowSong] = useState(true);
  const [pdfShowArtist, setPdfShowArtist] = useState(true);
  const [pdfShowTuning, setPdfShowTuning] = useState(true);
  const [pdfShowCapo, setPdfShowCapo] = useState(true);
  const [pdfShowHeaderBranding, setPdfShowHeaderBranding] = useState(true);

  const [compactGrid] = useState(false);
  const [strongCursor] = useState(true);

  useEffect(() => {
    if (!settingsOpen || !tabWritingOpen) return;

    const totalCols = colsRef.current || cols;
    const maxCol = Math.max(0, totalCols - 1);
    const step = (compactGrid ? 32 : 40) + 8; // cell width + column gap
    const sidebarWidth =
      typeof window !== "undefined" ? Math.min(304, Math.max(0, window.innerWidth - 16)) : 304;
    const minVisibleCol = Math.min(maxCol, Math.max(0, Math.ceil((sidebarWidth + 20) / step)));

    setCursor((cur) => {
      if (cur.c >= minVisibleCol) return cur;
      return { ...cur, c: minVisibleCol };
    });
  }, [settingsOpen, tabWritingOpen, compactGrid, cols]);

  function commitColsInput(rawValue = colsInput) {
    const parsed = Number(rawValue);
    const next = Math.max(
      MIN_COLS,
      Math.min(MAX_COLS, Number.isFinite(parsed) && String(rawValue).trim() !== "" ? parsed : colsRef.current)
    );
    setCols(next);
    setColsInput(String(next));
  }
  function commitDefaultColsInput() {
    const next = clampColsValue(defaultColsInput, defaultCols);
    setDefaultCols(next);
    setDefaultColsInput(String(next));
  }
  function commitColsAutoDelayInput() {
    const seconds = Number(colsAutoDelayInput);
    const nextMs = clampColsAutoDelayMs(
      Number.isFinite(seconds) && String(colsAutoDelayInput).trim() !== "" ? seconds * 1000 : colsAutoDelayMs,
      colsAutoDelayMs
    );
    setColsAutoDelayMs(nextMs);
    setColsAutoDelayInput(String(Math.round(nextMs / 1000)));
  }
  function clearColsAutoCommitTimer() {
    if (colsAutoCommitTimerRef.current) {
      window.clearTimeout(colsAutoCommitTimerRef.current);
      colsAutoCommitTimerRef.current = null;
    }
  }
  function scheduleColsAutoCommit(rawValue) {
    const raw = String(rawValue ?? "").replace(/[^\d]/g, "");
    clearColsAutoCommitTimer();
    if (!raw) return;
    if (raw.length >= 2) {
      commitColsInput(raw);
      setColsReplaceOnType(false);
      return;
    }
    colsAutoCommitTimerRef.current = window.setTimeout(() => {
      commitColsInput(raw);
      setColsReplaceOnType(false);
      colsAutoCommitTimerRef.current = null;
    }, colsAutoDelayMs);
  }
  useEffect(() => () => clearColsAutoCommitTimer(), []);

  function validateCapo() {
    if (!capoEnabled) return true;
    if (!capoFret) return true;
    const n = Number(capoFret);
    if (!Number.isFinite(n) || n < 1 || n > 24) {
      window.alert("Error: please enter a capo fret between 1 and 24.");
      setCapoFret("");
      return false;
    }
    setCapoFret(String(n));
    return true;
  }

  function exportPdfNow() {
    const safeTitle = (songTitle || "TabStudio")
      .trim()
      .replace(/[^\w\- ]+/g, "")
      .replace(/\s+/g, " ");
    const filename = `${safeTitle || "TabStudio"} - tabs.pdf`;

    if (!validateCapo()) {
      focusKeyCapture();
      return;
    }

    const capoValueForPdf = capoEnabled && capoFret ? String(Number(capoFret)) : "";

    const bytes = buildPdfBytes({
      title: songTitle.trim(),
      artist: artist.trim(),
      tuningLabel,
      capoEnabled,
      capoFret: capoValueForPdf,
      completedRows,
      showSong: pdfShowSong,
      showArtist: pdfShowArtist,
      showTuning: pdfShowTuning,
      showCapo: pdfShowCapo,
      showHeaderBranding: pdfShowHeaderBranding,
    });

    downloadPdf(bytes, filename);
    try {
      const alreadyCelebrated = String(localStorage.getItem(LS_FIRST_EXPORT_CELEBRATED_KEY) ?? "").toLowerCase() === "true";
      if (!alreadyCelebrated) {
        triggerFirstExportGlow({ showToast: true });
        localStorage.setItem(LS_FIRST_EXPORT_CELEBRATED_KEY, "true");
      }
    } catch {}
    focusKeyCapture();
  }

  function clearSelectedCells() {
    if (!hasCellSelection) return;
    const edits = getSelectedCellsEdits("");
    setManyCells(edits);
    setOverwriteNext(true);
    clearCellSelection();
  }

  function handleGridKeyDown(e) {
    if (e.target !== keyCaptureRef.current) return;

    const isMod = e.metaKey || e.ctrlKey;

    if (isMod && (e.key === "z" || e.key === "Z")) {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
      return;
    }
    if (isMod && (e.key === "y" || e.key === "Y")) {
      e.preventDefault();
      redo();
      return;
    }

    if (isMod && (e.key === "c" || e.key === "C")) {
      if (hasCellSelection) {
        e.preventDefault();
        copySelectionToClipboard();
      }
      return;
    }

    if (isMod && (e.key === "a" || e.key === "A")) {
      e.preventDefault();
      setRandomCellSelection(new Set());
      setCellSelection({
        r1: 0,
        c1: 0,
        r2: Math.max(0, tuning.length - 1),
        c2: Math.max(0, cols - 1),
      });
      setCursor({
        r: 0,
        c: 0,
      });
      setOverwriteNext(true);
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      // Close any overlays / selection that might be open
      closeEditChordModal();
      setCapoOpen(false);
      setInsertOpen(false);
      setChordsOpen(false);
      if (hasCellSelection) {
        clearCellSelection();
      }
      return;
    }

    if (isMod && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      moveCursor(e.key === "ArrowUp" ? -1 : 1, 0);
      setOverwriteNext(true);
      return;
    }

    if (e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      setRandomCellSelection(new Set());
      const cur = cursorRef.current;
      const dr = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
      const dc = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
      const nr = Math.max(0, Math.min(tuning.length - 1, cur.r + dr));
      const nc = Math.max(0, Math.min(cols - 1, cur.c + dc));
      setCellSelection((prev) => {
        if (!prev) return { r1: cur.r, c1: cur.c, r2: nr, c2: nc };
        return { ...prev, r2: nr, c2: nc };
      });
      setCursor({ r: nr, c: nc });
      setOverwriteNext(true);
      return;
    }

    if (e.key === "ArrowUp") return (e.preventDefault(), moveCursor(-1, 0), setOverwriteNext(true));
    if (e.key === "ArrowDown") return (e.preventDefault(), moveCursor(1, 0), setOverwriteNext(true));
    if (e.key === "ArrowLeft") return (e.preventDefault(), moveCursor(0, -1), setOverwriteNext(true));
    if (e.key === "ArrowRight") return (e.preventDefault(), moveCursor(0, 1), setOverwriteNext(true));

    if (e.key === "Enter") {
      e.preventDefault();
      completeRow({ advanceToNextString: e.shiftKey });
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();

      if (e.shiftKey) {
        moveCursor(0, -1);
        setOverwriteNext(true);
        return;
      }

      if (tabCopyMode === "copy") {
        const { r, c } = cursorRef.current;
        const curVal = String(gridRef.current?.[r]?.[c] ?? "");
        const targetCol = Math.max(0, Math.min(colsRef.current - 1, c + 1));

        // At the far right – just stop.
        if (targetCol === c) {
          setOverwriteNext(true);
          return;
        }

        // Empty cell: just move, no copy.
        if (curVal.trim() === "") {
          clearCellSelection();
          setCursor({ r, c: targetCol });
          setOverwriteNext(true);
          return;
        }

        const prev = gridRef.current;
        const next = prev.map((row) => row.slice());

        if (next[r] && typeof next[r][targetCol] !== "undefined") {
          next[r][targetCol] = curVal;
          commitGridChange(next, { r, c: targetCol });
        } else {
          clearCellSelection();
          setCursor({ r, c: targetCol });
        }

        setOverwriteNext(true);
        return;
      }

      // Default: move only
      moveCursor(0, 1);
      setOverwriteNext(true);
      return;
    }

    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      if (hasCellSelection) {
        clearSelectedCells();
        return;
      }
      const { r, c } = cursorRef.current;
      const current = String(gridRef.current?.[r]?.[c] ?? "");
      if (current === "") {
        if (c > 0) moveCursor(0, -1);
        setOverwriteNext(true);
      } else {
        setCell(r, c, "");
        setOverwriteNext(true);
      }
      return;
    }

    if (e.key === "+" || (e.key === "=" && e.shiftKey)) {
      e.preventDefault();
      setInsertOpen(true);
      return;
    }

    if (insertOpen && !isMod && !e.altKey) {
      const trigger = String(e.key ?? "").toLowerCase();
      const insertByKey = {
        b: "b",
        s: "/",
        h: "h",
        p: "p",
        v: "~",
        t: "t",
      };
      const insert = insertByKey[trigger];
      if (insert) {
        e.preventDefault();
        insertIntoSelectedCell(insert);
        return;
      }
    }

    const { r, c } = cursorRef.current;
    const overwrite = overwriteNextRef.current;

   if (/^\d$/.test(e.key)) {
  e.preventDefault();

  // Start or continue grouped edit session
  if (!editingCellRef.current ||
      editingCellRef.current.r !== r ||
      editingCellRef.current.c !== c) {

    // First edit in this cell → capture undo snapshot once
    pushUndoSnapshot(snapshotNow());
    redoStackRef.current = [];
    editingCellRef.current = { r, c };
  }

  if (hasCellSelection) {
    // Fill every selected cell with this fret value
    const edits = getSelectedCellsEdits(clampFret(e.key));
    if (edits.length) {
      setManyCells(edits);
    }
    const anchor = getSelectionAnchor();
    clearCellSelection();
    if (anchor) setCursor({ r: anchor.r, c: anchor.c });
    setOverwriteNext(false);
    return;
  }



  const cur = String(gridRef.current?.[r]?.[c] ?? "");

  const prev = gridRef.current;
  const next = prev.map((row) => row.slice());

  if (overwrite) {
    next[r][c] = clampFret(e.key);
  } else {
    const isNumericOnly = cur !== "" ? /^\d{1,2}$/.test(cur) : true;
    if (isNumericOnly) {
      const nextRaw = (cur + e.key).slice(0, 2);
      next[r][c] = clampFret(nextRaw);
    } else {
      next[r][c] = cur + e.key;
    }
  }

  setGrid(next);
  setOverwriteNext(false);
  return;
}

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();

      if (hasCellSelection) {
        // Fill every selected cell with this character
        const edits = getSelectedCellsEdits(e.key);
        if (edits.length) {
          setManyCells(edits);
        }
        const anchor = getSelectionAnchor();
        clearCellSelection();
        if (anchor) setCursor({ r: anchor.r, c: anchor.c });
        setOverwriteNext(false);
        return;
      }



      const cur = String(gridRef.current?.[r]?.[c] ?? "");
      if (overwrite) {
        setCell(r, c, e.key);
        setOverwriteNext(false);
        return;
      }
      setCell(r, c, cur === "" ? e.key : cur + e.key);
      setOverwriteNext(false);
      return;
    }
  }

  const cellSize = compactGrid ? 32 : 40;
  const cellIdleBg = isDarkMode ? "#1C1C1C" : THEME.surfaceWarm;

  const baseBtn = {
    borderRadius: 12,
    border: `1px solid ${THEME.border}`,
    background: THEME.surfaceWarm,
    outline: "none",
    cursor: "pointer",
    fontWeight: 900,
    color: THEME.text,
    height: 42,
    padding: "0 14px",
    lineHeight: 1,
    boxSizing: "border-box",
  };

  const btnSmallPill = {
    borderRadius: 999,
    border: `1px solid ${THEME.border}`,
    background: THEME.surfaceWarm,
    outline: "none",
    cursor: "pointer",
    fontWeight: 800,
    color: THEME.text,
    height: 28,
    padding: "0 10px",
    lineHeight: 1,
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  };

  const btnSmallPillDanger = {
    ...btnSmallPill,
    borderColor: THEME.dangerBorder ?? "#f1b4b4",
    background: THEME.dangerSoft ?? "#fff5f5",
    color: THEME.dangerText ?? "#b02a2a",
  };
  const btnSmallPillClose = {
    ...btnSmallPill,
    width: "auto",
    height: "auto",
    padding: 0,
    borderRadius: 0,
    border: "none",
    background: "transparent",
    color: THEME.text,
    fontSize: 20,
    lineHeight: 1,
    fontWeight: 950,
    boxShadow: "none",
  };
  const btnSecondary = { ...baseBtn, borderColor: THEME.border };
  const rowDeleteBtn = {
    ...btnSecondary,
    width: 36,
    minWidth: 36,
    height: 36,
    padding: 0,
    fontSize: 22,
    lineHeight: 1,
    fontWeight: 950,
    color: THEME.textFaint,
  };
  const btnPrimary = {
    ...baseBtn,
    borderColor: THEME.accent,
    boxShadow: "0 8px 18px rgba(0,0,0,0.06)",
  };
  const toolbarToggleVisual = (isOpen) =>
    isOpen
      ? {
          borderColor: THEME.accent,
          borderWidth: 2,
          background: THEME.surfaceWarm,
          boxShadow: "none",
        }
      : {
          borderColor: THEME.border,
          borderWidth: 1,
          background: THEME.surfaceWarm,
          boxShadow: "none",
        };
  const toolbarMenuBtn = {
    ...btnSecondary,
    height: 42,
    minWidth: 136,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  };
  const pressVisual = (pressed) =>
    pressed
      ? {
          borderColor: THEME.accent,
          background: THEME.surfaceWarm,
          color: THEME.accent,
          transform: "translateY(1px)",
          boxShadow: "inset 0 2px 6px rgba(0,0,0,0.24)",
        }
      : {
          transform: "translateY(0)",
        };
  const pressHandlers = (id, disabled = false) =>
    disabled
      ? {}
      : {
          onPointerDown: () => setPressedBtnId(id),
          onPointerUp: () => setPressedBtnId(""),
          onPointerLeave: () => setPressedBtnId(""),
          onPointerCancel: () => setPressedBtnId(""),
          onBlur: () => setPressedBtnId(""),
        };

  const handleGridRowScroll = (sourceRow, e) => {
    if (scrollScope !== "all" || syncingRowScrollRef.current) return;
    const sourceLeft = e.currentTarget.scrollLeft;
    syncingRowScrollRef.current = true;
    gridRowScrollRefs.current.forEach((el, idx) => {
      if (!el || idx === sourceRow) return;
      if (Math.abs(el.scrollLeft - sourceLeft) > 0.5) {
        el.scrollLeft = sourceLeft;
      }
    });
    requestAnimationFrame(() => {
      syncingRowScrollRef.current = false;
    });
  };

  useEffect(() => {
    if (scrollScope !== "all") return;
    const firstWithScroll = gridRowScrollRefs.current.find((el) => el && el.scrollLeft > 0) || gridRowScrollRefs.current.find(Boolean);
    if (!firstWithScroll) return;
    const left = firstWithScroll.scrollLeft;
    gridRowScrollRefs.current.forEach((el) => {
      if (!el) return;
      if (Math.abs(el.scrollLeft - left) > 0.5) el.scrollLeft = left;
    });
  }, [scrollScope, cols, tuning.length]);

  const headerTextBtnStyle = (
    id,
    { disabled = false, iconOnly = false, arrow = false, primary = false, activeSelected = false } = {}
  ) => {
    const hovered = headerHoverBtn === id;
    const pressed = pressedBtnId === id;
    const isSavePrimary = primary || id === "saveTab";
    const isSecondaryAction = id === "openTab" || id === "export";
    const isUtility = iconOnly || arrow || id === "settings" || id === "undo" || id === "redo";
    const neutralHoverBg = withAlpha(THEME.text, isDarkMode ? 0.08 : 0.045);
    const neutralHoverBorder = withAlpha(THEME.text, isDarkMode ? 0.22 : 0.16);
    const saveHoverBg = isDarkMode ? withAlpha(THEME.text, 0.13) : withAlpha(THEME.text, 0.09);
    const saveBorder = withAlpha(THEME.text, isDarkMode ? 0.34 : 0.24);
    const isAccentState = activeSelected && !isSavePrimary;
    const baseColor = disabled
      ? THEME.textFaint
      : isSavePrimary
      ? THEME.text
      : isAccentState
      ? THEME.accent
      : isUtility
      ? withAlpha(THEME.text, isDarkMode ? 0.78 : 0.72)
      : isSecondaryAction
      ? withAlpha(THEME.text, isDarkMode ? 0.9 : 0.86)
      : THEME.text;
    const borderColor = disabled
      ? "transparent"
      : isSavePrimary
      ? hovered
        ? withAlpha(THEME.text, isDarkMode ? 0.42 : 0.3)
        : "transparent"
      : isAccentState
      ? withAlpha(THEME.accent, 0.58)
      : hovered
      ? neutralHoverBorder
      : "transparent";
    const background = disabled
      ? "transparent"
      : isSavePrimary
      ? hovered
        ? saveHoverBg
        : "transparent"
      : hovered
      ? neutralHoverBg
      : "transparent";
    return {
      border: `1px solid ${borderColor}`,
      background,
      color: baseColor,
      borderRadius: 12,
      height: 36,
      minWidth: iconOnly ? 38 : arrow ? 38 : 0,
      padding: iconOnly ? "0 8px" : arrow ? "0 8px" : "0 10px",
      lineHeight: 1,
      fontWeight: iconOnly ? 700 : arrow ? 900 : isSavePrimary ? 900 : 840,
      fontSize: iconOnly ? 24 : arrow ? 24 : 16,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      boxSizing: "border-box",
      cursor: disabled ? "not-allowed" : "pointer",
      transform: pressed ? "translateY(1px) scale(0.985)" : hovered && isSavePrimary ? "translateY(-0.5px)" : "translateY(0)",
      position: "relative",
      top: arrow ? 1 : 0,
      boxShadow:
        isSavePrimary && hovered && !disabled
          ? `0 0 0 2px ${withAlpha(THEME.accent, isDarkMode ? 0.15 : 0.11)}`
          : "none",
      transition:
        "transform 180ms ease, background 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease",
    };
  };

  const headerBtnHoverHandlers = (id, disabled = false) =>
    disabled
      ? {}
      : {
          onMouseEnter: () => setHeaderHoverBtn(id),
          onMouseLeave: () => setHeaderHoverBtn((prev) => (prev === id ? "" : prev)),
          onFocus: () => setHeaderHoverBtn(id),
          onBlur: () => setHeaderHoverBtn((prev) => (prev === id ? "" : prev)),
        };

  const card = {
    border: `1px solid ${THEME.border}`,
    borderRadius: 16,
    background: THEME.surfaceWarm,
    padding: 12,
    boxShadow: "0 12px 28px rgba(0,0,0,0.05)",
  };

  const field = {
    width: "100%",
    height: 42,
    borderRadius: 12,
    border: `1px solid ${THEME.border}`,
    padding: "0 10px",
    fontWeight: 800,
    background: THEME.surfaceWarm,
    color: THEME.text,
    outline: "none",
    boxSizing: "border-box",
  };

  const pillMono = {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontWeight: 950,
  };

  const capoLabel = capoEnabled ? "Capo: Yes" : "Capo: No";

  const userTuningsById = useMemo(() => {
    const m = new Map();
    for (const t of userTunings) m.set(t.id, t);
    return m;
  }, [userTunings]);

  const selectionCount = selectedRowIds.size;
  const hasRowSelection = selectionCount > 0;
  const allRowsSelected = completedRows.length > 0 && selectionCount === completedRows.length;
  const deleteConfirmCount = rowDeleteConfirmIds?.length ?? 0;
  const deleteSelectedConfirmOpen = !!rowDeleteConfirmIds && rowDeleteConfirmSource === "selected";
  const iconActionBtnBase = {
    ...btnSecondary,
    width: 44,
    minWidth: 44,
    height: 36,
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  };

  function openEditChordModal(chord) {
    if (!chord) return;
    setEditChordTargetId(chord.id);
    setEditChordIsPreset(PRESET_CHORDS.some((p) => p.id === chord.id));
    setEditChordNameHeader(chord.name || "");
    const frets = (chord.frets ?? []).map((x) => String(x ?? ""));
    const pad = [...frets];
    while (pad.length < 6) pad.push("");
    setEditChordFrets(pad.slice(0, 6));
    setEditChordModalOpen(true);
  }

  function closeEditChordModal() {
    setEditChordModalOpen(false);
    setChordsOpen(true);
    focusKeyCapture();
  }

  function handleSaveEditedChord() {
    const cleaned = editChordFrets.map((v) => String(v ?? "").trim());
    if (!editChordTargetId) {
      closeEditChordModal();
      return;
    }
    if (editChordIsPreset) {
      setPresetChordOverrides((prev) => ({
        ...prev,
        [editChordTargetId]: { frets: cleaned },
      }));
    } else {
      setUserChords((prev) => prev.map((c) => (c.id === editChordTargetId ? { ...c, frets: cleaned } : c)));
    }
    closeEditChordModal();
  }

  function handleResetEditedChordToDefault() {
    if (!editChordIsPreset || !editChordTargetId) return;
    setPresetChordOverrides((prev) => {
      const next = { ...prev };
      delete next[editChordTargetId];
      return next;
    });
    const original = PRESET_CHORDS.find((c) => c.id === editChordTargetId);
    if (original) {
      const frets = (original.frets ?? []).map((x) => String(x ?? ""));
      const pad = [...frets];
      while (pad.length < 6) pad.push("");
      setEditChordFrets(pad.slice(0, 6));
    }
  }

  const editChordLabelStrings = DEFAULT_TUNING;

  // Custom tuning modal helpers (for now uses 6-string layout)
  const customAppNotes = lowToHighToApp(customLowToHigh);
  function setCustomAppNote(index, value) {
    setCustomLowToHigh((prev) => {
      const app = lowToHighToApp(prev);
      const nextApp = app.slice();
      nextApp[index] = value;
      return appToLowToHigh(nextApp);
    });
  }

  function toggleFavouriteInstrument(id) {
    setFavInstrumentIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }

  function handleInstrumentChange(nextId) {
    if (nextId === instrumentId) return;

    const nextInstrument = INSTRUMENTS.find((i) => i.id === nextId) || INSTRUMENTS[0];

    const hasContent = gridRef.current?.some((row) => row.some((cell) => String(cell).trim() !== ""));
    if (hasContent) {
      const ok = window.confirm(
        `Changing to ${nextInstrument.label} will clear the current tab writer.\nYour completed rows will not be affected.\n\nDo you want to continue?`
      );
      if (!ok) return;
    }

    setInstrumentId(nextInstrument.id);

    const presets = getInstrumentTuningPresets(nextInstrument.id);
    const firstPreset = presets[0];
    const app = lowToHighToApp(firstPreset.lowToHigh);

    setTuning(app);
    setTuningLabel(formatTuningName(firstPreset.name));

    const newGrid = makeBlankGrid(app.length, colsRef.current || defaultCols);
    undoStackRef.current = [];
    redoStackRef.current = [];
    setGrid(newGrid);
    setCursor({ r: 0, c: 0 });
    clearCellSelection();
    setOverwriteNext(true);
    setInsertOpen(false);
    setInstrumentOpen(false);
    focusKeyCapture();
  }

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 768;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function TabbyGameOverlay({
    onClose,
    highScore,
    onHighScore,
    rowCount,
    colCount,
    anchorRef,
    hudTopRef,
    tabbyBubbleMessage,
    onTabbyMascotClick,
  }) {
    const GAME_DURATION_SECONDS = 20;
    const activeTabbySprite = isDarkMode ? tabbyDark : tabbyLight;
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);
    const [target, setTarget] = useState(() => ({
      r: Math.floor(Math.random() * Math.max(1, rowCount)),
      c: Math.floor(Math.random() * Math.max(1, colCount)),
    }));
    const [anchorRect, setAnchorRect] = useState(null);
    const [hudRect, setHudRect] = useState(null);
    const [hammerPos, setHammerPos] = useState(() => {
      if (typeof window === "undefined") return { x: 240, y: 180 };
      return { x: Math.round(window.innerWidth / 2), y: Math.round(window.innerHeight / 2) };
    });
    const [isHammerWhacking, setIsHammerWhacking] = useState(false);
    const [impactFx, setImpactFx] = useState(null);
    const [impactDebris, setImpactDebris] = useState([]);
    const scoreRef = useRef(0);
    const hammerTimeoutRef = useRef(null);
    const impactTimeoutRef = useRef(null);
    const debrisTimersRef = useRef([]);

    const pickDifferentTarget = (prev) => {
      const maxRows = Math.max(1, rowCount);
      const maxCols = Math.max(1, colCount);
      if (maxRows * maxCols <= 1) return { r: 0, c: 0 };
      let next = prev;
      while (next.r === prev.r && next.c === prev.c) {
        next = {
          r: Math.floor(Math.random() * maxRows),
          c: Math.floor(Math.random() * maxCols),
        };
      }
      return next;
    };

    const finalizeAndClose = (scoreValue) => {
      const finalScore = Math.max(0, Number(scoreValue) || 0);
      if (finalScore > highScore) onHighScore(finalScore);
      onClose();
    };

    useEffect(() => {
      scoreRef.current = score;
    }, [score]);

    useEffect(() => {
      const measure = () => {
        const rect = anchorRef?.current?.getBoundingClientRect?.();
        if (!rect) return;
        setAnchorRect({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        });
      };
      measure();
      window.addEventListener("resize", measure);
      window.addEventListener("scroll", measure, true);
      return () => {
        window.removeEventListener("resize", measure);
        window.removeEventListener("scroll", measure, true);
      };
    }, [anchorRef]);

    useEffect(() => {
      const measureHud = () => {
        const gridRect = anchorRef?.current?.getBoundingClientRect?.();
        const completedTopRect = hudTopRef?.current?.getBoundingClientRect?.();
        if (gridRect && completedTopRect) {
          const left = window.innerWidth / 2;
          const top = gridRect.bottom + (completedTopRect.top - gridRect.bottom) / 2;
          setHudRect({ left, top });
          return;
        }
        setHudRect(null);
      };
      measureHud();
      window.addEventListener("resize", measureHud);
      window.addEventListener("scroll", measureHud, true);
      return () => {
        window.removeEventListener("resize", measureHud);
        window.removeEventListener("scroll", measureHud, true);
      };
    }, [anchorRef, hudTopRef]);

    useEffect(() => {
      const timer = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            finalizeAndClose(scoreRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
      const mover = window.setInterval(() => {
        setTarget((prev) => pickDifferentTarget(prev));
      }, 900);
      return () => window.clearInterval(mover);
    }, [rowCount, colCount]);

    useEffect(() => {
      const onEsc = (e) => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        e.stopPropagation();
        finalizeAndClose(scoreRef.current);
      };
      window.addEventListener("keydown", onEsc, true);
      return () => window.removeEventListener("keydown", onEsc, true);
    }, [highScore]);

    useEffect(() => {
      return () => {
        if (hammerTimeoutRef.current) {
          clearTimeout(hammerTimeoutRef.current);
          hammerTimeoutRef.current = null;
        }
        if (impactTimeoutRef.current) {
          clearTimeout(impactTimeoutRef.current);
          impactTimeoutRef.current = null;
        }
        for (const timer of debrisTimersRef.current) clearTimeout(timer);
        debrisTimersRef.current = [];
      };
    }, []);

    const handleCellClick = (r, c) => {
      if (r !== target.r || c !== target.c) return;
      setScore((prev) => {
        const next = prev + 1;
        scoreRef.current = next;
        return next;
      });
      setTarget((prev) => pickDifferentTarget(prev));
    };

    const updateHammerPos = (e) => {
      setHammerPos({ x: e.clientX, y: e.clientY });
    };
    const buildImpactPattern = () => {
      const crackCount = 10 + Math.floor(Math.random() * 4); // 10-13
      const dustCount = 14 + Math.floor(Math.random() * 6); // 14-19
      const cracks = Array.from({ length: crackCount }, () => {
        const angle = Math.round(Math.random() * 360);
        return {
          w: 12 + Math.round(Math.random() * 22),
          r: angle,
          t: Math.random() > 0.72 ? 3 : 2,
          ox: -4 + Math.round(Math.random() * 8),
          oy: -4 + Math.round(Math.random() * 8),
        };
      });
      const dust = Array.from({ length: dustCount }, () => {
        const angle = Math.random() * Math.PI * 2;
        const radius = 10 + Math.random() * 34;
        const dx = Math.cos(angle) * radius;
        const dy = Math.sin(angle) * radius;
        return {
          dx: `${dx.toFixed(1)}px`,
          dy: `${dy.toFixed(1)}px`,
          size: 2 + Math.round(Math.random() * 4),
        };
      });
      return { cracks, dust };
    };
    const buildDebrisParticles = (x, y) => {
      const count = 8 + Math.floor(Math.random() * 5); // 8-12
      return Array.from({ length: count }, (_, idx) => {
        const angle = Math.random() * Math.PI * 2;
        const radius = 12 + Math.random() * 42;
        const dx = Math.cos(angle) * radius;
        const dy = Math.sin(angle) * radius;
        const flightMs = 170 + Math.floor(Math.random() * 150); // 170-320
        const stayMs = 1000 + Math.floor(Math.random() * 2000); // 1-3s
        const fadeMs = 260 + Math.floor(Math.random() * 260); // 260-520
        return {
          id: `${Date.now()}_${idx}_${Math.random().toString(16).slice(2)}`,
          x,
          y,
          dx: `${dx.toFixed(1)}px`,
          dy: `${dy.toFixed(1)}px`,
          size: 2 + Math.floor(Math.random() * 4),
          round: Math.random() > 0.52 ? "50%" : "2px",
          r0: `${Math.round(Math.random() * 26)}deg`,
          r1: `${Math.round(90 + Math.random() * 240)}deg`,
          flightMs,
          stayMs,
          fadeMs,
          totalMs: flightMs + stayMs + fadeMs,
        };
      });
    };
    const hammerHeadColor = isDarkMode ? "rgba(246,248,252,0.96)" : "rgba(18,20,24,0.96)";
    const hammerHeadInner = isDarkMode ? "rgba(228,232,238,0.9)" : "rgba(36,40,46,0.9)";
    const hammerHandleColor = isDarkMode ? "rgba(228,232,238,0.72)" : "rgba(24,28,34,0.6)";

    return (
      <div
        onPointerMove={updateHammerPos}
        onMouseMove={updateHammerPos}
        onPointerDown={(e) => {
          setIsHammerWhacking(true);
          if (hammerTimeoutRef.current) clearTimeout(hammerTimeoutRef.current);
          hammerTimeoutRef.current = setTimeout(() => {
            setIsHammerWhacking(false);
            hammerTimeoutRef.current = null;
          }, 85);
          const nextImpact = {
            x: e.clientX,
            y: e.clientY,
            id: Date.now(),
            ...buildImpactPattern(),
          };
          setImpactFx(nextImpact);
          const nextDebris = buildDebrisParticles(e.clientX, e.clientY);
          setImpactDebris((prev) => [...prev, ...nextDebris].slice(-220));
          const removeTimer = setTimeout(() => {
            const removeIds = new Set(nextDebris.map((d) => d.id));
            setImpactDebris((prev) => prev.filter((d) => !removeIds.has(d.id)));
            debrisTimersRef.current = debrisTimersRef.current.filter((t) => t !== removeTimer);
          }, Math.max(...nextDebris.map((d) => d.totalMs)) + 80);
          debrisTimersRef.current.push(removeTimer);
          if (impactTimeoutRef.current) clearTimeout(impactTimeoutRef.current);
          impactTimeoutRef.current = setTimeout(() => {
            setImpactFx((cur) => (cur && cur.id === nextImpact.id ? null : cur));
            impactTimeoutRef.current = null;
          }, 180);
        }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 12000,
          background: "transparent",
          pointerEvents: "auto",
          cursor: "none",
        }}
      >
        <div
          style={{
            position: "fixed",
            left: hammerPos.x,
            top: hammerPos.y,
            width: 44,
            height: 44,
            pointerEvents: "none",
            transform: isHammerWhacking
              ? "translate(-34%, -58%) rotate(-58deg) scale(0.98)"
              : "translate(-28%, -82%) rotate(-18deg) scale(1)",
            transformOrigin: "54% 44%",
            transition: "transform 48ms cubic-bezier(0.2, 0.9, 0.2, 1)",
            zIndex: 12030,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="100%"
            height="100%"
            aria-hidden="true"
            style={{
              display: "block",
              filter: isDarkMode ? "drop-shadow(0 1px 1px rgba(0,0,0,0.45))" : "drop-shadow(0 1px 1px rgba(0,0,0,0.2))",
            }}
          >
            <path d="M10.4 10.3 21 20.9" fill="none" stroke={hammerHandleColor} strokeWidth="3.6" strokeLinecap="round" />
            <circle cx="21.1" cy="21" r="1.7" fill={hammerHandleColor} />
            <rect x="2.5" y="4.2" width="13.8" height="7" rx="3.2" fill={hammerHeadColor} />
            <rect x="4.2" y="5.2" width="10.4" height="5" rx="2.2" fill={hammerHeadInner} />
            <circle cx="3.5" cy="7.7" r="2.1" fill={hammerHeadColor} />
            <circle cx="15.4" cy="7.7" r="2.1" fill={hammerHeadColor} />
            <path
              d="M10.1 10.1 12 12"
              fill="none"
              stroke={hammerHeadColor}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div
          style={{
            position: "fixed",
            left: hammerPos.x,
            top: hammerPos.y,
            width: isHammerWhacking ? 14 : 10,
            height: isHammerWhacking ? 14 : 10,
            borderRadius: "50%",
            border: `2px solid ${isDarkMode ? "rgba(242,246,252,0.9)" : "rgba(22,24,28,0.88)"}`,
            background: isDarkMode ? "rgba(8,8,8,0.9)" : "rgba(255,255,255,0.92)",
            transform: "translate(-50%, -50%)",
            boxShadow: isHammerWhacking
              ? isDarkMode
                ? "0 0 0 5px rgba(240,245,255,0.2)"
                : "0 0 0 5px rgba(30,34,42,0.18)"
              : isDarkMode
              ? "0 0 0 2px rgba(240,245,255,0.1)"
              : "0 0 0 2px rgba(30,34,42,0.09)",
            pointerEvents: "none",
            zIndex: 12022,
            transition: "width 70ms ease, height 70ms ease, box-shadow 70ms ease, border-color 70ms ease",
          }}
        />
        {impactFx && (
          <div
            key={impactFx.id}
            style={{
              position: "fixed",
              left: impactFx.x,
              top: impactFx.y,
              width: 74,
              height: 74,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              zIndex: 12025,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 14,
                height: 14,
                marginLeft: -7,
                marginTop: -7,
                borderRadius: "50%",
                background: isDarkMode ? "rgba(12,12,12,0.95)" : "rgba(244,244,244,0.92)",
                boxShadow: isDarkMode
                  ? "0 0 0 2px rgba(255,255,255,0.16)"
                  : "0 0 0 2px rgba(0,0,0,0.18)",
              }}
            />
            {(impactFx.cracks || []).map((crack, idx) => (
              <div
                key={`crack-${impactFx.id}-${idx}`}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: crack.w,
                  height: crack.t || 2,
                  marginLeft: crack.ox ?? 0,
                  marginTop: (crack.oy ?? 0) - (crack.t || 2) / 2,
                  borderRadius: 2,
                  transformOrigin: "0 50%",
                  transform: `rotate(${crack.r}deg)`,
                  background: isDarkMode ? "rgba(224,226,230,0.58)" : "rgba(36,38,42,0.5)",
                  animation: "tabbyImpactCrack 240ms ease-out forwards",
                }}
              />
            ))}
            {(impactFx.dust || []).map((dust, idx) => (
              <div
                key={`dust-${impactFx.id}-${idx}`}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: dust.size,
                  height: dust.size,
                  marginLeft: -dust.size / 2,
                  marginTop: -dust.size / 2,
                  borderRadius: "50%",
                  background: isDarkMode ? "rgba(210,210,214,0.72)" : "rgba(64,66,70,0.48)",
                  animation: "tabbyImpactDust 250ms ease-out forwards",
                  ["--dx"]: dust.dx,
                  ["--dy"]: dust.dy,
                }}
              />
            ))}
          </div>
        )}
        {impactDebris.map((p) => (
          <div
            key={p.id}
            style={{
              position: "fixed",
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: p.round,
              background: isDarkMode ? "rgba(214,216,220,0.78)" : "rgba(48,50,56,0.56)",
              boxShadow: isDarkMode ? "0 0 0 1px rgba(8,8,8,0.25)" : "0 0 0 1px rgba(255,255,255,0.3)",
              pointerEvents: "none",
              zIndex: 12024,
              ["--dx"]: p.dx,
              ["--dy"]: p.dy,
              ["--r0"]: p.r0,
              ["--r1"]: p.r1,
              animation: [
                `tabbyDebrisFly ${p.flightMs}ms cubic-bezier(0.2, 0.75, 0.2, 1) forwards`,
                `tabbyDebrisFade ${p.fadeMs}ms linear ${p.flightMs + p.stayMs}ms forwards`,
              ].join(", "),
            }}
          />
        ))}

        <div
          style={{
            position: "fixed",
            top: hudRect ? hudRect.top : undefined,
            left: hudRect ? hudRect.left : "50%",
            bottom: hudRect ? undefined : 88,
            right: undefined,
            transform: hudRect ? "translate(-50%, -50%)" : "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              ...btnSecondary,
              height: 48,
              padding: "0 18px",
              borderRadius: 999,
              borderColor: THEME.border,
              background: withAlpha(THEME.bg, 0.82),
              color: THEME.text,
              fontWeight: 850,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontFamily: "'Press Start 2P', 'VT323', 'Courier New', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
              letterSpacing: 1.4,
              textTransform: "uppercase",
              fontSize: 16,
              textShadow: "0 1px 0 rgba(0,0,0,0.45)",
            }}
          >
            Score: {score} &nbsp; Time: {timeLeft}s &nbsp; Best: {highScore}
          </div>
          <button
            type="button"
            onClick={() => finalizeAndClose(scoreRef.current)}
            style={{
              ...btnSecondary,
              height: 48,
              padding: "0 18px",
              borderRadius: 999,
              background: withAlpha(THEME.bg, 0.82),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontFamily: "'Press Start 2P', 'VT323', 'Courier New', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
              letterSpacing: 1.4,
              fontWeight: 900,
              textTransform: "uppercase",
              fontSize: 16,
              textShadow: "0 1px 0 rgba(0,0,0,0.45)",
            }}
          >
            END
          </button>
        </div>

        {anchorRect && (
          <div
            style={{
              position: "fixed",
              left: anchorRect.left,
              top: anchorRect.top,
              width: anchorRect.width,
              height: anchorRect.height,
              pointerEvents: "auto",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "grid", gap: 10, marginTop: 0 }}>
              {Array.from({ length: Math.max(1, rowCount) }, (_, r) => (
                <div key={`tabby-row-${r}`} style={{ display: "grid" }}>
                  <div
                    style={{
                      display: "grid",
                      gridAutoFlow: "column",
                      gridAutoColumns: `${cellSize}px`,
                      gap: 8,
                      overflow: "hidden",
                      paddingBottom: 10,
                      alignItems: "center",
                      width: "100%",
                      maxWidth: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    {Array.from({ length: Math.max(1, colCount) }, (_, c) => {
                      const active = target.r === r && target.c === c;
                      return (
                        <button
                          key={`tabby-cell-${r}-${c}`}
                          type="button"
                          onClick={() => {
                            handleCellClick(r, c);
                            if (active) onTabbyMascotClick?.();
                          }}
                          style={{
                            width: cellSize,
                            height: cellSize,
                            borderRadius: 12,
                            border: `1px solid ${THEME.border}`,
                            background: isDarkMode ? "#1C1C1C" : THEME.surfaceWarm,
                            overflow: "hidden",
                            cursor: "none",
                            userSelect: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            lineHeight: 1,
                            padding: 0,
                            boxSizing: "border-box",
                          }}
                        >
                          {active ? (
                            <div
                              style={{
                                position: "relative",
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                pointerEvents: "none",
                                userSelect: "none",
                              }}
                            >
                              <div
                                style={{
                                  position: "absolute",
                                  width: "74%",
                                  height: "74%",
                                  borderRadius: "50%",
                                  background: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                                  boxShadow: isDarkMode
                                    ? "0 0 0 1px rgba(255,255,255,0.12)"
                                    : "0 0 0 1px rgba(0,0,0,0.12)",
                                }}
                              />
                              <img
                                src={activeTabbySprite}
                                alt="Target"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "contain",
                                  objectPosition: "center center",
                                  display: "block",
                                  transform: "scale(1.55)",
                                  transformOrigin: "center",
                                  filter: isDarkMode
                                    ? "brightness(1.18) contrast(1.16) drop-shadow(0 1px 1px rgba(0,0,0,0.55))"
                                    : "brightness(0.92) contrast(1.14) drop-shadow(0 1px 1px rgba(255,255,255,0.7))",
                                }}
                              />
                            </div>
                          ) : (
                            "\u00A0"
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {!!tabbyBubbleMessage && anchorRect && (
          <div
            style={{
              position: "fixed",
              left: anchorRect.left + target.c * (cellSize + 8) + Math.round(cellSize * 0.5),
              top: anchorRect.top + target.r * (cellSize + 10) - 22,
              transform: "translate(-50%, -100%)",
              pointerEvents: "none",
              zIndex: 12035,
              maxWidth: 240,
              padding: "6px 10px",
              borderRadius: 10,
              border: `1px solid ${withAlpha(THEME.border, 0.92)}`,
              background: withAlpha(THEME.surfaceWarm, 0.97),
              color: THEME.text,
              fontSize: 12,
              fontWeight: 850,
              lineHeight: 1.25,
              boxShadow: "0 10px 24px rgba(0,0,0,0.2)",
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {tabbyBubbleMessage}
          </div>
        )}
      </div>
    );
  }

  function MobileLanding() {
    const [mobileNotice, setMobileNotice] = useState("");
    const featuresRef = useRef(null);

    const showDesktopNotice = () => {
      setMobileNotice("TabStudio is designed for desktop. Open this page on a larger screen to start writing.");
    };

    const scrollToFeatures = () => {
      if (featuresRef.current?.scrollIntoView) {
        featuresRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          boxSizing: "border-box",
          background: THEME.bg,
          color: THEME.text,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
          padding: 16,
          display: "grid",
          gap: 28,
          alignContent: "start",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <button
            type="button"
            onClick={() => setChecklistOpen(true)}
            style={{
              width: 210,
              height: 62,
              overflow: "hidden",
              borderRadius: 4,
              flexShrink: 0,
              position: "relative",
              top: 1,
              border: "none",
              padding: 0,
              margin: 0,
              background: "transparent",
              cursor: "pointer",
            }}
            title="Open V1 Release Checklist"
            aria-label="Open V1 Release Checklist"
          >
            <img
              src={isDarkMode ? logoDark : logoLight}
              alt="TabStudio"
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                objectFit: "cover",
                objectPosition: "center 50%",
              }}
            />
          </button>
        </div>

        <section style={{ display: "grid", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.08, letterSpacing: -0.6 }}>A better way to write tabs.</h1>
          <p style={{ margin: 0, color: THEME.textFaint, fontSize: 16, lineHeight: 1.45 }}>
            Precision tab writing. Smart notation. Clean PDF exports.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              type="button"
              onClick={showDesktopNotice}
              style={{
                ...btnSecondary,
                height: 44,
                borderColor: withAlpha(THEME.accent, 0.6),
                color: THEME.accent,
                justifySelf: "start",
              }}
            >
              Use on desktop
            </button>
            <button
              type="button"
              onClick={scrollToFeatures}
              style={{ ...btnSecondary, height: 44, justifySelf: "start" }}
            >
              View features
            </button>
          </div>
          {mobileNotice ? (
            <div
              style={{
                ...card,
                padding: 10,
                fontSize: 13,
                lineHeight: 1.45,
                color: THEME.textFaint,
              }}
            >
              {mobileNotice}
            </div>
          ) : null}
          <div
            style={{
              ...card,
              minHeight: 190,
              padding: 8,
              overflow: "hidden",
            }}
          >
            <img
              src={resolvedTheme === "dark" ? heroDark : heroLight}
              alt="TabStudio desktop preview"
              style={{
                width: "100%",
                height: "100%",
                minHeight: 174,
                objectFit: "cover",
                borderRadius: 10,
                display: "block",
              }}
            />
          </div>
        </section>

        <section ref={featuresRef} style={{ display: "grid", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 22, letterSpacing: -0.3 }}>Why it&apos;s different</h2>
          <div style={{ ...card, padding: 12, display: "grid", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 900 }}>Built for precision</div>
              <div style={{ marginTop: 3, color: THEME.textFaint, fontSize: 14, lineHeight: 1.45 }}>
                Designed for musicians who care about clean, structured tabs.
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 900 }}>Smart notation system</div>
              <div style={{ marginTop: 3, color: THEME.textFaint, fontSize: 14, lineHeight: 1.45 }}>
                Bends, slides, harmonics and more, formatted properly.
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 900 }}>Export beautifully</div>
              <div style={{ marginTop: 3, color: THEME.textFaint, fontSize: 14, lineHeight: 1.45 }}>
                Professional PDF output, ready to share.
              </div>
            </div>
          </div>
        </section>

        <section style={{ display: "grid", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 22, letterSpacing: -0.3 }}>Who it&apos;s for</h2>
          <div style={{ ...card, padding: 12, display: "grid", gap: 8 }}>
            <div style={{ color: THEME.textFaint, fontWeight: 800 }}>Made for:</div>
            <div style={{ display: "grid", gap: 6, fontWeight: 850 }}>
              <div>Guitarists</div>
              <div>Songwriters</div>
              <div>Teachers</div>
              <div>Session players</div>
            </div>
          </div>
        </section>

        <section style={{ display: "grid", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 22, letterSpacing: -0.3 }}>TabStudio Plus</h2>
          <div style={{ ...card, padding: 12, display: "grid", gap: 10 }}>
            <div style={{ color: THEME.textFaint, fontWeight: 800 }}>One simple subscription.</div>
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
              <li>Full desktop editor</li>
              <li>Project library</li>
              <li>Unlimited exports</li>
              <li>Dark mode</li>
            </ul>
            <button
              type="button"
              onClick={showDesktopNotice}
              style={{
                ...btnSecondary,
                height: 44,
                borderColor: withAlpha(THEME.accent, 0.6),
                color: THEME.accent,
                justifySelf: "start",
              }}
            >
              Start writing on desktop
            </button>
          </div>
        </section>

        <section style={{ ...card, padding: 12, fontSize: 13, lineHeight: 1.5, color: THEME.textFaint }}>
          TabStudio is designed for desktop precision editing. Open this page on a larger screen to start writing tabs.
        </section>
      </div>
    );
  }

  if (isMobile) {
    return <MobileLanding />;
  }

  return (
    <div
      onPointerDown={handleRootPointerDown}
      style={{
        padding: 18,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        background: THEME.bg,
        color: THEME.text,
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Hidden key capture */}
      <input
        ref={keyCaptureRef}
        value=""
        onChange={() => {}}
        onKeyDown={handleGridKeyDown}
        aria-hidden="true"
        inputMode="none"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: 1,
          height: 1,
          opacity: 0,
          border: "none",
          padding: 0,
          margin: 0,
          background: "transparent",
          color: "transparent",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          position: "sticky",
          top: 0,
          zIndex: 50,
          paddingTop: 6,
          paddingBottom: 6,
          background: THEME.bg,
          borderBottom: `1px solid ${THEME.border}`,
          boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            transform: settingsOpen ? `translateX(${settingsPanelWidthCss})` : "translateX(0)",
            transition: "transform 220ms ease",
          }}
        >
          <div
            style={{
              width: 210,
              height: 62,
              overflow: "hidden",
              borderRadius: 4,
              flexShrink: 0,
              position: "relative",
              top: 1,
            }}
          >
            <img
              src={isDarkMode ? logoDark : logoLight}
              alt="TabStudio"
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                objectFit: "cover",
                objectPosition: "center 50%",
              }}
            />
          </div>
          <div style={{ fontWeight: 800, color: THEME.textFaint }}>
            {tr("A better way to write tabs.", "Una mejor forma de escribir tablaturas.")}
          </div>
        </div>

        <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              type="button"
              onClick={undo}
              disabled={undoStackRef.current.length === 0}
              {...headerBtnHoverHandlers("undo", undoStackRef.current.length === 0)}
              {...pressHandlers("undo", undoStackRef.current.length === 0)}
              style={headerTextBtnStyle("undo", { disabled: undoStackRef.current.length === 0, arrow: true })}
              title="Undo (Cmd/Ctrl+Z)"
              aria-label="Undo"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 14L5 10L9 6" />
                <path d="M5 10h8a6 6 0 0 1 6 6v2" />
              </svg>
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={redoStackRef.current.length === 0}
              {...headerBtnHoverHandlers("redo", redoStackRef.current.length === 0)}
              {...pressHandlers("redo", redoStackRef.current.length === 0)}
              style={headerTextBtnStyle("redo", { disabled: redoStackRef.current.length === 0, arrow: true })}
              title="Redo (Cmd+Shift+Z / Ctrl+Shift+Z / Ctrl+Y)"
              aria-label="Redo"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 14l4-4-4-4" />
                <path d="M19 10h-8a6 6 0 0 0-6 6v2" />
              </svg>
            </button>
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              type="button"
              onClick={handleSaveTabClick}
              {...headerBtnHoverHandlers("saveTab")}
              {...pressHandlers("saveTab")}
              style={headerTextBtnStyle("saveTab", { primary: true })}
            >
              {tr("Save", "Guardar")}
            </button>

            <button
              type="button"
              onClick={handleOpenTabClick}
              {...headerBtnHoverHandlers("openTab")}
              {...pressHandlers("openTab")}
              style={headerTextBtnStyle("openTab", { activeSelected: projectsLibraryOpen })}
            >
              {tr("Projects", "Proyectos")}
            </button>

            <button
              type="button"
              onClick={exportPdfNow}
              {...headerBtnHoverHandlers("export")}
              {...pressHandlers("export")}
              style={headerTextBtnStyle("export")}
            >
              {tr("Export", "Exportar")}
            </button>

            <button
              ref={settingsBtnRef}
              type="button"
              onClick={() => setSettingsOpen((v) => !v)}
              {...headerBtnHoverHandlers("settings")}
              {...pressHandlers("settings")}
              style={headerTextBtnStyle("settings", { iconOnly: true })}
              title="Settings"
              aria-label="Settings"
            >
              ⛭
            </button>
          </div>
        </div>
      </div>

      {saveSoonNotice && (
        <div
          style={{
            position: "fixed",
            top: 86,
            right: 18,
            zIndex: 120,
            maxWidth: 420,
            borderRadius: 12,
            border: `1px solid ${withAlpha(THEME.accent, 0.55)}`,
            background: THEME.surfaceWarm,
            color: THEME.text,
            padding: "10px 12px",
            fontSize: 13,
            fontWeight: 800,
            boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
          }}
        >
          {saveSoonNotice}
        </div>
      )}

      {/* Main layout */}
      <div
        style={{
          marginTop: 10,
        }}
      >
        {/* Settings sidebar */}
        {settingsOpen && (
          <aside
            ref={settingsPanelRef}
            style={{
              width: settingsPanelWidthCss,
              minWidth: 0,
              borderRadius: "0 16px 16px 0",
              border: `1px solid ${THEME.border}`,
              background: THEME.surfaceWarm,
              boxShadow: "0 18px 48px rgba(0,0,0,0.22)",
              padding: "14px 12px 12px",
              boxSizing: "border-box",
              position: "fixed",
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 90,
              overflowY: "auto",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
              display: "flex",
              flexDirection: "column",
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
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 950, letterSpacing: -0.3 }}>Settings</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setSettingsWide((v) => !v)}
                  style={{ ...btnSmallPill, height: 26, padding: "0 8px", fontSize: 12, fontWeight: 900 }}
                  title={settingsWide ? "Collapse settings width" : "Expand settings width"}
                  aria-label={settingsWide ? "Collapse settings width" : "Expand settings width"}
                >
                  {settingsWide ? "<<" : ">>"}
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  style={{ ...btnSmallPillClose }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ marginTop: 10, borderRadius: 12, border: `1px solid ${THEME.border}`, background: THEME.surfaceWarm, overflow: "hidden", order: 4, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() =>
                  setProjectsOpen((v) => {
                    const next = !v;
                    if (next) {
                      setShortcutsOpen(false);
                      setTabWritingOpen(false);
                      setFunModeOpen(false);
                      setFaqsOpen(false);
                    }
                    return next;
                  })
                }
                style={{
                  width: "100%",
                  ...btnSecondary,
                  height: 42,
                  padding: "0 10px",
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
                }}
              >
                <span>{tr("Projects & Saving", "Proyectos y guardado")}</span>
                <span style={{ fontSize: 12, opacity: 0.8 }}>{projectsOpen ? "▲" : "▼"}</span>
              </button>
              {projectsOpen && (
                <div
                  style={{
                    padding: 8,
                    borderTop: `1px solid ${THEME.border}`,
                    fontSize: 12,
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <div>Future view might look like:</div>
                  <ul style={{ margin: "4px 0 0 14px", padding: 0 }}>
                    <li>Projects (e.g. “Band project”, “Solo EP”)</li>
                    <li>
                      Inside a project:
                      <ul style={{ margin: "2px 0 0 14px" }}>
                        <li>Song 1 – open in editor</li>
                        <li>Song 2 – open in editor</li>
                      </ul>
                    </li>
                    <li>Last opened / last edited</li>
                  </ul>
                  <div style={{ fontSize: 11, color: THEME.textFaint, marginTop: 4 }}>
                    Tabs would be stored in a database and re-opened inside this editor.
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 10, borderRadius: 12, border: `1px solid ${THEME.border}`, background: THEME.surfaceWarm, overflow: "hidden", order: 3, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() =>
                  setShortcutsOpen((v) => {
                    const next = !v;
                    if (next) {
                      setProjectsOpen(false);
                      setTabWritingOpen(false);
                      setFunModeOpen(false);
                      setFaqsOpen(false);
                    }
                    return next;
                  })
                }
                style={{
                  width: "100%",
                  ...btnSecondary,
                  height: 42,
                  padding: "0 10px",
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
                }}
              >
                <span>{tr("Shortcuts & Tips", "Atajos y consejos")}</span>
                <span style={{ fontSize: 12, opacity: 0.8 }}>{shortcutsOpen ? "▲" : "▼"}</span>
              </button>
              {shortcutsOpen && (
                <div
                  style={{
                    padding: 8,
                    borderTop: `1px solid ${THEME.border}`,
                    fontSize: 12,
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: "0 2px",
                    }}
                  >
                    <div style={{ fontSize: 11, color: THEME.textFaint, fontWeight: 800 }}>
                      {tr("Showing", "Mostrando")}{" "}
                      <b style={{ color: THEME.text }}>{shortcutPlatform === "mac" ? "macOS" : tr("Windows", "Windows")}</b>{" "}
                      {tr("shortcuts for your device", "atajos para tu dispositivo")}
                    </div>
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
                  </div>

                  <div
                    style={{
                      maxHeight: 300,
                      overflowY: "auto",
                      paddingRight: 2,
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    {SHORTCUTS_REFERENCE.map((item) => (
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
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontWeight: 900 }}>{tr(item.action, SHORTCUTS_ACTION_ES[item.action])}</span>
                          <span style={{ fontSize: 11, fontWeight: 900, color: THEME.accent, whiteSpace: "nowrap" }}>
                            {tr(item.scope, SHORTCUTS_SCOPE_ES[item.scope])}
                          </span>
                        </div>
                        {shortcutsShowBoth ? (
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

                  <div style={{ fontSize: 11, color: THEME.textFaint, marginTop: 2 }}>
                    {tr(
                      "This table is the master shortcut reference for TabStudio (Windows + macOS).",
                      "Esta tabla es la referencia principal de atajos para TabStudio (Windows + macOS)."
                    )}
                  </div>
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
                </div>
              )}
            </div>

            {/* Tab writing settings */}
            <div
              style={{
                marginTop: 10,
                borderRadius: 12,
                border: `1px solid ${THEME.border}`,
                background: THEME.surfaceWarm,
                overflow: "hidden",
                order: 1,
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setTabWritingOpen((v) => {
                    const next = !v;
                    if (next) {
                      setProjectsOpen(false);
                      setShortcutsOpen(false);
                      setFunModeOpen(false);
                      setFaqsOpen(false);
                    }
                    return next;
                  })
                }
                style={{
                  width: "100%",
                  ...btnSecondary,
                  height: 42,
                  padding: "0 10px",
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
                }}
              >
                <span>{tr("Tab Settings", "Ajustes de tablatura")}</span>
                <span style={{ fontSize: 12, opacity: 0.8 }}>{tabWritingOpen ? "▲" : "▼"}</span>
              </button>
              {tabWritingOpen && (
                <div
                  style={{
                    padding: 8,
                    borderTop: `1px solid ${THEME.border}`,
                    fontSize: 12,
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <div style={{ fontWeight: 900 }}>Tab Key Behaviour</div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="radio"
                      name="tab-behaviour"
                      checked={tabCopyMode === "move"}
                      onChange={() => setTabCopyMode("move")}
                    />
                    <span>Tab - Move to next cell</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="radio"
                      name="tab-behaviour"
                      checked={tabCopyMode === "copy"}
                      onChange={() => setTabCopyMode("copy")}
                    />
                    <span>Auto-Duplicate on Tab</span>
                  </label>
                  <div style={{ fontSize: 11, color: THEME.textFaint, lineHeight: 1.35 }}>
                    (If "Auto-Duplicate on Tab" is enabled, Tab will also copy the current cell&apos;s value into the
                    next cell.)
                  </div>

                  <div style={{ marginTop: 8, fontWeight: 900 }}>Horizontal scroll</div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="radio"
                      name="scroll-scope"
                      checked={scrollScope === "all"}
                      onChange={() => setScrollScope("all")}
                    />
                    <span>Scroll all rows together</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="radio"
                      name="scroll-scope"
                      checked={scrollScope === "selected"}
                      onChange={() => setScrollScope("selected")}
                    />
                    <span>Scroll selected row only</span>
                  </label>

                  <div style={{ marginTop: 8, fontWeight: 900 }}>Appearance</div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
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
                          textShadow: themeMode === "light" ? "0 0 10px rgba(244,173,58,0.38)" : "none",
                          transition: "color 140ms ease, text-shadow 140ms ease, transform 140ms ease",
                          transform: themeMode === "light" ? "scale(1.06)" : "scale(1)",
                        }}
                      >
                        <span style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>☀</span>
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
                          textShadow: themeMode === "dark" ? "0 0 10px rgba(168,190,255,0.35)" : "none",
                          transition: "color 140ms ease, text-shadow 140ms ease, transform 140ms ease",
                          transform: themeMode === "dark" ? "scale(1.06)" : "scale(1)",
                        }}
                      >
                        <span style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>☾</span>
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: 8,
                      marginTop: 6,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ fontWeight: 800, color: THEME.text }}>Accent color</span>
                      <span style={{ fontSize: 11, color: THEME.textFaint, fontWeight: 800 }}>{activeAccent.label}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      {ACCENT_PRESETS.map((preset) => {
                        if (isDarkMode && preset.id === "black") return null;
                        if (!isDarkMode && preset.id === "white") return null;
                        const active = preset.id === accentColorId;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setAccentColorId(preset.id)}
                            title={preset.label}
                            aria-pressed={active}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 999,
                              border: `2px solid ${active ? THEME.accent : THEME.border}`,
                              background: preset.hex,
                              boxShadow: active ? "0 0 0 3px rgba(255,255,255,0.1)" : "inset 0 0 0 1px rgba(255,255,255,0.14)",
                              cursor: "pointer",
                              outline: "none",
                              padding: 0,
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                    <div style={{ fontWeight: 800, color: THEME.text }}>Default columns</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                      <span style={{ fontSize: 11, color: THEME.textFaint }}>
                        Used for new rows and triple-click reset.
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                    <div style={{ fontWeight: 800, color: THEME.text }}>1-digit auto-apply delay (seconds)</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={colsAutoDelayInput}
                        onChange={(e) => {
                          const raw = String(e.target.value ?? "").replace(/[^\d]/g, "");
                          setColsAutoDelayInput(raw);
                        }}
                        onBlur={commitColsAutoDelayInput}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            commitColsAutoDelayInput();
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
                      <span style={{ fontSize: 11, color: THEME.textFaint }}>
                        2+ digits apply instantly. 1 digit waits this long. Range: 1-10s.
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 8, fontWeight: 900 }}>PDF export</div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={pdfShowSong}
                      onChange={(e) => setPdfShowSong(e.target.checked)}
                    />
                    <span>Show song name</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={pdfShowArtist}
                      onChange={(e) => setPdfShowArtist(e.target.checked)}
                    />
                    <span>Show artist name</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={pdfShowTuning}
                      onChange={(e) => setPdfShowTuning(e.target.checked)}
                    />
                    <span>Show tuning</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={pdfShowCapo}
                      onChange={(e) => setPdfShowCapo(e.target.checked)}
                    />
                    <span>Show capo info</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={pdfShowHeaderBranding}
                      onChange={(e) => setPdfShowHeaderBranding(e.target.checked)}
                    />
                    <span>Show TabStudio header (logo/text)</span>
                  </label>

                  <div style={{ fontSize: 11, color: THEME.textFaint, marginTop: 4 }}>
                    Appearance is stored per user in this browser, so your preference stays the same next time.
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: 10,
                borderRadius: 12,
                border: `1px solid ${THEME.border}`,
                background: THEME.surfaceWarm,
                overflow: "hidden",
                order: 5,
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setFunModeOpen((v) => {
                    const next = !v;
                    if (next) {
                      setProjectsOpen(false);
                      setShortcutsOpen(false);
                      setTabWritingOpen(false);
                      setFaqsOpen(false);
                    }
                    return next;
                  })
                }
                style={{
                  width: "100%",
                  ...btnSecondary,
                  height: 42,
                  padding: "0 10px",
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
                }}
              >
                <span>{tr("Fun Mode", "Modo divertido")}</span>
                <span style={{ fontSize: 12, opacity: 0.8 }}>{funModeOpen ? "▲" : "▼"}</span>
              </button>
              {funModeOpen && (
                <div
                  style={{
                    padding: 8,
                    borderTop: `1px solid ${THEME.border}`,
                    fontSize: 12,
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <label
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 8,
                      alignItems: "center",
                      border: `1px solid ${THEME.border}`,
                      borderRadius: 10,
                      padding: "8px 10px",
                      background: THEME.surfaceWarm,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: THEME.text }}>
                        {tr("Fun Mode", "Modo divertido")}
                      </div>
                      <div style={{ marginTop: 2, fontSize: 11, color: THEME.textFaint, lineHeight: 1.35 }}>
                        {tr("Enable hidden playful extras.", "Activa extras ocultos y divertidos.")}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFunModeMasterEnabled((v) => !v)}
                      aria-pressed={funModeMasterEnabled}
                      style={{
                        width: 44,
                        height: 26,
                        borderRadius: 999,
                        border: `1px solid ${funModeMasterEnabled ? withAlpha(THEME.accent, 0.7) : THEME.border}`,
                        background: funModeMasterEnabled ? withAlpha(THEME.accent, 0.26) : THEME.surfaceWarm,
                        position: "relative",
                        cursor: "pointer",
                        padding: 0,
                        boxSizing: "border-box",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: 2,
                          left: funModeMasterEnabled ? 21 : 2,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: funModeMasterEnabled ? THEME.accent : withAlpha(THEME.text, 0.5),
                          transition: "left 140ms ease, background 140ms ease",
                        }}
                      />
                    </button>
                  </label>
                  {[
                    {
                      label: tr("Tabby", "Tabby"),
                      description: tr(
                        "Enable extra Tabby animations while you work.",
                        "Activa animaciones extra de Tabby mientras trabajas."
                      ),
                      checked: funTabbyEnabled,
                      onChange: (next) => setFunTabbyEnabled(next),
                    },
                    {
                      label: tr("Personal Best", "Mejor marca personal"),
                      description: tr(
                        "Track and celebrate your progress.",
                        "Sigue y celebra tu progreso."
                      ),
                      checked: funPersonalBestEnabled,
                      onChange: (next) => setFunPersonalBestEnabled(next),
                    },
                    {
                      label: tr("Party Mode", "Modo fiesta"),
                      description: tr(
                        "Add extra visual flair when saving songs.",
                        "Añade un toque visual extra al guardar canciones."
                      ),
                      checked: funPartyModeEnabled,
                      onChange: (next) => setFunPartyModeEnabled(next),
                    },
                  ].map((item) => (
                    <label
                      key={item.label}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: 8,
                        alignItems: "center",
                        border: `1px solid ${THEME.border}`,
                        borderRadius: 10,
                        padding: "8px 10px",
                        background: THEME.surfaceWarm,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 900, color: THEME.text }}>{item.label}</div>
                        <div style={{ marginTop: 2, fontSize: 11, color: THEME.textFaint, lineHeight: 1.35 }}>
                          {item.description}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => item.onChange(!item.checked)}
                        role="switch"
                        aria-checked={item.checked}
                        style={{
                          width: 46,
                          height: 26,
                          borderRadius: 999,
                          border: `1px solid ${item.checked ? withAlpha(THEME.accent, 0.62) : THEME.border}`,
                          background: item.checked ? withAlpha(THEME.accent, 0.25) : THEME.surfaceWarm,
                          padding: 2,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: item.checked ? "flex-end" : "flex-start",
                          cursor: "pointer",
                          transition: "background 140ms ease, border-color 140ms ease",
                        }}
                      >
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 999,
                            background: item.checked ? THEME.accent : THEME.textFaint,
                            transition: "background 140ms ease",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                          }}
                        />
                      </button>
                    </label>
                  ))}
                  {funModeMasterEnabled && (
                    <div style={{ display: "grid", gap: 6, marginTop: 2 }}>
                      <button
                        type="button"
                        onClick={() => openRickrollWithToasts({ showFollowup: true })}
                        style={{
                          ...btnSecondary,
                          height: 34,
                          padding: "0 10px",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 900,
                        }}
                        title="Easter egg"
                      >
                        {tr("Developer surprise", "Sorpresa del desarrollador")}
                      </button>
                      {import.meta.env.DEV && (
                        <button
                          type="button"
                          onClick={() => openRickrollWithToasts({ showFollowup: true })}
                          style={{
                            ...btnSecondary,
                            height: 30,
                            padding: "0 10px",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 850,
                            color: THEME.textFaint,
                          }}
                          title="DEV-only Rickroll trigger"
                        >
                          DEV: Trigger Rickroll
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginTop: 10, order: 6, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() =>
                  setFaqsOpen((v) => {
                    const next = !v;
                    if (next) {
                      setProjectsOpen(false);
                      setShortcutsOpen(false);
                      setTabWritingOpen(false);
                      setFunModeOpen(false);
                    }
                    return next;
                  })
                }
                style={{
                  width: "100%",
                  ...btnSecondary,
                  height: 42,
                  padding: "0 10px",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 16,
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                <span>{tr("FAQs & Support", "Preguntas frecuentes y soporte")}</span>
                <span style={{ fontSize: 12, opacity: 0.8 }}>{faqsOpen ? "▲" : "▼"}</span>
              </button>
              {faqsOpen && (
                <div
                  style={{
                    marginTop: 6,
                    padding: 8,
                    borderRadius: 12,
                    border: `1px solid ${THEME.border}`,
                    background: THEME.surfaceWarm,
                    fontSize: 12,
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <ul style={{ margin: "0 0 0 14px", padding: 0 }}>
                    <li>Where are my tabs saved?</li>
                    <li>Can I export to PDF without branding?</li>
                    <li>How do I cancel my subscription?</li>
                    <li>How can I contact support?</li>
                  </ul>
                  <div style={{ fontSize: 11, color: THEME.textFaint, marginTop: 4 }}>
                    In production, this could point to tabstudio.app/help or support@tabstudio.app.
                  </div>
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
                      marginTop: 4,
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
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 12,
                border: `1px solid ${THEME.border}`,
                background: THEME.surfaceWarm,
                order: 98,
                display: "grid",
                gap: 8,
                position: "relative",
                flexShrink: 0,
              }}
            >
              {(() => {
                const languages = [
                  { id: "en", name: "English (US)", available: true },
                  { id: "es", name: "Spanish (Español)", available: true },
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
                return (
                  <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <span aria-hidden="true" style={{ fontSize: 15, lineHeight: 1 }}>
                          🌐
                        </span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 900, color: THEME.text, lineHeight: 1.1 }}>
                            {tr("Language", "Idioma")}
                          </div>
                          <div style={{ marginTop: 2, fontSize: 11, fontWeight: 700, color: THEME.textFaint }}>
                            {tr(
                              "Not in your language yet? Contact us at Support@tabstudio.app to help us release it faster",
                              "¿Aún no está en tu idioma? Contáctanos en Support@tabstudio.app para ayudarnos a lanzarlo más rápido"
                            )}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          ...btnSmallPill,
                          height: 22,
                          padding: "0 8px",
                          borderColor: withAlpha(THEME.accent, 0.5),
                          color: THEME.accent,
                          background: "transparent",
                          cursor: "default",
                          fontSize: 10,
                          fontWeight: 900,
                          flexShrink: 0,
                        }}
                      >
                        {tr("Preview", "Vista previa")}
                      </span>
                    </div>

                    <button
                      ref={settingsLanguageBtnRef}
                      type="button"
                      onClick={() => setSettingsLanguageOpen((v) => !v)}
                      style={{
                        ...btnSecondary,
                        height: 36,
                        width: "100%",
                        padding: "0 10px",
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 13,
                        fontWeight: 850,
                      }}
                      aria-expanded={settingsLanguageOpen}
                      aria-label="Language menu"
                    >
                      <span>{activeLanguage.name}</span>
                      <span style={{ opacity: 0.85 }}>{settingsLanguageOpen ? "▲" : "▼"}</span>
                    </button>

                    {settingsLanguageOpen && (
                      <div
                        ref={settingsLanguageMenuRef}
                        style={{
                          position: "absolute",
                          top: 90,
                          left: 10,
                          right: 10,
                          display: "grid",
                          gap: 6,
                          border: `1px solid ${THEME.border}`,
                          borderRadius: 12,
                          padding: 8,
                          background: THEME.surfaceWarm,
                          maxHeight: 252,
                          overflowY: "auto",
                          boxShadow: "0 16px 38px rgba(0,0,0,0.2)",
                          zIndex: 30,
                        }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 900, color: THEME.textFaint, textTransform: "uppercase", letterSpacing: 0.35 }}>
                          {tr("Available", "Disponible")}
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
                        <div style={{ fontSize: 10, fontWeight: 900, color: THEME.textFaint, textTransform: "uppercase", letterSpacing: 0.35 }}>
                          {tr("Coming soon", "Próximamente")}
                        </div>
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
                            <span style={{ fontSize: 10, fontWeight: 900 }}>{tr("Soon", "Pronto")}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <button
              type="button"
              onClick={() => {
                setAccountProfileSection("overview");
                setAccountProfileOpen(true);
              }}
              onPointerEnter={() => setProfileFooterHover(true)}
              onPointerLeave={() => setProfileFooterHover(false)}
              onFocus={() => setProfileFooterFocused(true)}
              onBlur={() => setProfileFooterFocused(false)}
              title="Account & billing"
              style={{
                marginTop: "auto",
                paddingTop: 10,
                borderTop: `1px solid ${THEME.border}`,
                display: "flex",
                alignItems: "center",
                gap: 10,
                order: 99,
                borderRadius: 10,
                border: `1px solid ${
                  profileFooterHover || profileFooterFocused ? withAlpha(THEME.text, isDarkMode ? 0.22 : 0.16) : "transparent"
                }`,
                background:
                  profileFooterHover || profileFooterFocused ? withAlpha(THEME.text, isDarkMode ? 0.08 : 0.045) : "transparent",
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                transition: "background 120ms ease, border-color 120ms ease",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
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
                }}
                aria-hidden="true"
              >
                {String(accountFullName || "?")
                  .split(" ")
                  .map((s) => s[0] || "")
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, lineHeight: 1.1, fontWeight: 900, color: THEME.text }}>{accountFullName}</div>
                <div style={{ marginTop: 2, fontSize: 12, lineHeight: 1.1, color: THEME.textFaint, fontWeight: 800 }}>
                  {accountTier}
                </div>
              </div>
            </button>
          </aside>
        )}

        {/* Main editor */}
        <div
          ref={editorSurfaceRef}
          className="tab-editor-surface"
          style={{
            width: "100%",
            minWidth: 0,
            transform: settingsOpen ? `translateX(${settingsPanelWidthCss})` : "translateX(0)",
            transition: "transform 220ms ease",
          }}
        >
          {/* Song info */}
          <div style={{ ...card }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <label
                  htmlFor="song-name-input"
                  style={{
                    display: "block",
                    margin: "0 0 7px 2px",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: withAlpha(THEME.text, isDarkMode ? 0.72 : 0.7),
                    lineHeight: 1.1,
                    cursor: "text",
                  }}
                >
                  {tr("SONG NAME", "NOMBRE DE LA CANCION")}
                </label>
                <input
                  id="song-name-input"
                  ref={songTitleInputRef}
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Escape") return;
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.blur();
                    focusKeyCapture();
                  }}
                  placeholder={tr("Song name", "Nombre de la canción")}
                  style={field}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <label
                  htmlFor="artist-input"
                  style={{
                    display: "block",
                    margin: "0 0 7px 2px",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: withAlpha(THEME.text, isDarkMode ? 0.72 : 0.7),
                    lineHeight: 1.1,
                    cursor: "text",
                  }}
                >
                  {tr("ARTIST", "ARTISTA")}
                </label>
                <input
                  id="artist-input"
                  ref={artistInputRef}
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Escape") return;
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.blur();
                    focusKeyCapture();
                  }}
                  placeholder={tr("Artist", "Artista")}
                  style={field}
                />
              </div>
            </div>
          </div>

          <div ref={tabWriterAreaRef}>
          {/* Toolbar */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
            {/* Instruments */}
            <div style={{ position: "relative" }}>
              <button
                ref={instrumentBtnRef}
                type="button"
                onClick={() => setInstrumentOpen((v) => !v)}
                style={{
                  ...toolbarMenuBtn,
                  ...toolbarToggleVisual(instrumentOpen),
                }}
                title="Instrument"
              >
                <span>{currentInstrument.label}</span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                  }}
                >
                  <span style={{ opacity: 0.8 }}>{instrumentOpen ? "▲" : "▼"}</span>
                </span>
              </button>

              {instrumentOpen && (
                <div
                  ref={instrumentPanelRef}
                  style={{
                    position: "absolute",
                    top: 50,
                    left: 0,
                    zIndex: 1000,
                    width: 328,
                    background: THEME.surfaceWarm,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 16,
                    boxShadow: "0 24px 70px rgba(0,0,0,0.18)",
                    padding: 10,
                    boxSizing: "border-box",
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ fontWeight: 950 }}>Instruments</div>
                    <button
                      type="button"
                      onClick={() => {
                        setInstrumentOpen(false);
                        focusKeyCapture();
                      }}
                      style={{ ...btnSmallPillClose }}
                    >
                      ×
                    </button>
                  </div>

                  <div
                    style={{
                      maxHeight: 340,
                      overflowY: "auto",
                      paddingRight: 4,
                      display: "grid",
                      gap: 6,
                    }}
                    onWheel={(e) => e.stopPropagation()}
                  >
                    {[
                      { group: "Favourites", items: favouriteInstruments, isFavourites: true },
                      ...groupedInstruments.map((g) => ({ ...g, isFavourites: false })),
                    ].map(({ group, items, isFavourites }) => {
                      const expanded = expandedInstrumentGroup === group;
                      return (
                        <div
                          key={group}
                          style={{
                            marginBottom: 6,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedInstrumentGroup((prev) => (prev === group ? null : group))
                            }
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
                            <span style={{ fontSize: 13, opacity: 0.8 }}>{expanded ? "▲" : "▼"}</span>
                          </button>
                          {expanded && (
                            <div
                              style={{
                                display: "grid",
                                gap: 6,
                                padding: "6px 4px 2px",
                              }}
                            >
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
                                  You haven&apos;t added any favourites yet. Click the star next to an instrument to
                                  add it here.
                                </div>
                              ) : (
                                items.map((inst) => {
                                const active = inst.id === instrumentId;
                                const fav = favInstrumentIds.includes(inst.id);
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
                                      onClick={() => handleInstrumentChange(inst.id)}
                                      style={{
                                        textAlign: "left",
                                        padding: "9px 10px",
                                        borderRadius: 12,
                                        border: `1px solid ${active ? THEME.accent : THEME.border}`,
                                        background: THEME.surfaceWarm,
                                        cursor: "pointer",
                                        fontWeight: 800,
                                        fontSize: 13,
                                        color: active ? THEME.accent : THEME.text,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 8,
                                        boxSizing: "border-box",
                                        boxShadow: active ? `inset 0 0 0 1px ${withAlpha(THEME.accent, 0.2)}` : "none",
                                      }}
                                    >
                                      <span>{inst.label}</span>
                                      {isFavourites ? (
                                        active ? (
                                          <span style={{ fontSize: 12, color: THEME.accent, fontWeight: 900 }}>✓</span>
                                        ) : (
                                          <span />
                                        )
                                      ) : (
                                        <span
                                          style={{
                                            fontSize: 12,
                                            color: THEME.textFaint,
                                            fontWeight: 800,
                                          }}
                                        >
                                          {inst.stringCount} strings
                                        </span>
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => toggleFavouriteInstrument(inst.id)}
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
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ fontSize: 11, color: THEME.textFaint, marginTop: 6 }}>
                    You can mix multiple instruments in the same song – each completed row remembers which instrument it
                    was written for.
                  </div>
                </div>
              )}
            </div>

            {/* Columns */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: `1px solid ${THEME.border}`,
                borderRadius: 14,
                overflow: "hidden",
                background: THEME.surfaceWarm,
                height: 42,
                boxSizing: "border-box",
                marginLeft: 6,
              }}
            >
              <button
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
                  if (e.detail === 3) {
                    e.preventDefault();
                    clearColsAutoCommitTimer();
                    setCols(defaultCols);
                    setColsInput(String(defaultCols));
                    setColsReplaceOnType(false);
                    colsReplaceOnTypeRef.current = false;
                    e.currentTarget.blur();
                    focusKeyCapture();
                    return;
                  }
                  clearColsAutoCommitTimer();
                  setColsReplaceOnType(true);
                  colsReplaceOnTypeRef.current = true;
                }}
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
                onClick={(e) => {
                  if (e.detail === 3) {
                    e.preventDefault();
                    clearColsAutoCommitTimer();
                    setCols(defaultCols);
                    setColsInput(String(defaultCols));
                    setColsReplaceOnType(false);
                    colsReplaceOnTypeRef.current = false;
                    e.currentTarget.blur();
                    focusKeyCapture();
                  }
                }}
                onBlur={() => {
                  clearColsAutoCommitTimer();
                  commitColsInput();
                  setColsReplaceOnType(false);
                  colsReplaceOnTypeRef.current = false;
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

            {/* Tuning */}
            <div style={{ position: "relative" }}>
              <button
                ref={tuningBtnRef}
                type="button"
                onClick={() => {
                  setTuningOpen((v) => !v);
                  if (!tuningOpen) setCustomOpen(false);
                }}
                style={{
                  ...toolbarMenuBtn,
                  ...toolbarToggleVisual(tuningOpen),
                }}
                title="Tuning"
              >
                <span>{tuningLabel}</span>
                <span style={{ opacity: 0.8 }}>{tuningOpen ? "▲" : "▼"}</span>
              </button>

              {tuningOpen && (
                <div
                  ref={tuningPanelRef}
                  style={{
                    position: "absolute",
                    top: 50,
                    left: 0,
                    zIndex: 1000,
                    width: 380,
                    background: THEME.surfaceWarm,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 16,
                    boxShadow: "0 24px 70px rgba(0,0,0,0.18)",
                    padding: 10,
                    boxSizing: "border-box",
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontWeight: 950 }}>Tunings</div>
                    <button
                      type="button"
                      onClick={() => {
                        setTuningOpen(false);
                        setCustomOpen(false);
                        focusKeyCapture();
                      }}
                      style={{ ...btnSmallPillClose }}
                    >
                      ×
                    </button>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: 6,
                      marginTop: 10,
                      maxHeight: 360,
                      overflowY: "auto",
                      overscrollBehavior: "contain",
                      paddingRight: 4,
                    }}
                    onWheel={(e) => e.stopPropagation()}
                  >
                    {allTunings.map((t) => {
                      const isUser = currentInstrument.stringCount === 6 && userTuningsById.has(t.id);

                      return (
                        <div
                          key={t.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => applyTuningOption(t)}
                            style={{
                              textAlign: "left",
                              padding: "10px 10px",
                              borderRadius: 14,
                              border: `1px solid ${THEME.border}`,
                              background: THEME.surfaceWarm,
                              cursor: "pointer",
                              fontWeight: 900,
                              color: THEME.text,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 10,
                              boxSizing: "border-box",
                              minWidth: 0,
                            }}
                            >
                              <span>{formatTuningName(t.name)}</span>
                              <span
                                style={{
                                  fontSize: 12,
                                opacity: 0.7,
                                fontWeight: 900,
                                color: THEME.textFaint,
                              }}
                            >
                              {formatLowToHighString(t.lowToHigh)}
                            </span>
                          </button>

                          {isUser ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteUserTuning(t.id);
                              }}
                              title="Delete saved tuning"
                              style={{
                                height: 40,
                                padding: "0 10px",
                                borderRadius: 12,
                                border: `1px solid rgba(176,0,32,0.25)`,
                                background: THEME.dangerBg,
                                cursor: "pointer",
                                fontWeight: 950,
                                color: THEME.danger,
                                boxSizing: "border-box",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Delete
                            </button>
                          ) : (
                            <span />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {currentInstrument.stringCount === 6 && (
                    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => {
                          resetCustomFormToCurrent();
                          setCustomOpen(true);
                        }}
                        style={{
                          ...btnSecondary,
                          height: 36,
                          padding: "0 10px",
                          borderColor: customOpen ? THEME.accent : THEME.border,
                          background: THEME.surfaceWarm,
                        }}
                      >
                        + Add custom tuning
                      </button>
                    </div>
                  )}

                  <div style={{ fontSize: 12, color: THEME.textFaint, marginTop: 10 }}>
                    Chord tools currently only work in <b>6-string guitar</b> with <b>Standard</b> tuning.
                  </div>
                </div>
              )}
            </div>

            {/* Capo */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
              <button
                ref={capoBtnRef}
                type="button"
                onClick={() => setCapoOpen((v) => !v)}
                style={{
                  ...toolbarMenuBtn,
                  ...toolbarToggleVisual(capoOpen),
                }}
                title="Capo"
              >
                <span>{capoLabel}</span>
                <span style={{ opacity: 0.8 }}>{capoOpen ? "▲" : "▼"}</span>
              </button>

              {capoEnabled && (
                <input
                  ref={capoInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={capoFret}
                  onMouseDown={() => {
                    setCapoReplaceOnType(true);
                    capoReplaceOnTypeRef.current = true;
                  }}
                  onChange={(e) => {
                    const raw = String(e.target.value ?? "").replace(/[^\d]/g, "");
                    setCapoFret(raw);
                    if (!raw) {
                      setCapoEnabled(false);
                    }
                  }}
                  onFocus={() => {
                    setCapoFretFocused(true);
                    setCapoReplaceOnType(true);
                    capoReplaceOnTypeRef.current = true;
                  }}
                  onBlur={() => {
                    setCapoFretFocused(false);
                    setCapoReplaceOnType(false);
                    capoReplaceOnTypeRef.current = false;
                    validateCapo();
                  }}
                  onKeyDown={(e) => {
                    if (/^\d$/.test(e.key)) {
                      e.preventDefault();
                      const replace = capoReplaceOnTypeRef.current;
                      setCapoFret((prev) => {
                        const base = replace ? "" : String(prev ?? "");
                        return `${base}${e.key}`.replace(/[^\d]/g, "");
                      });
                      if (replace) {
                        setCapoReplaceOnType(false);
                        capoReplaceOnTypeRef.current = false;
                      }
                      return;
                    }
                    if (e.key === "Backspace") {
                      e.preventDefault();
                      setCapoReplaceOnType(false);
                      capoReplaceOnTypeRef.current = false;
                      setCapoFret((prev) => {
                        const next = String(prev ?? "").slice(0, -1);
                        if (!next) setCapoEnabled(false);
                        return next;
                      });
                      return;
                    }
                    if (e.key === "Delete") {
                      e.preventDefault();
                      setCapoReplaceOnType(false);
                      capoReplaceOnTypeRef.current = false;
                      setCapoFret("");
                      setCapoEnabled(false);
                      return;
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setCapoReplaceOnType(false);
                      capoReplaceOnTypeRef.current = false;
                      const ok = validateCapo();
                      if (ok) {
                        capoInputRef.current?.blur?.();
                        focusKeyCapture();
                      }
                      return;
                    }
                    if (e.key === "Tab") return;
                    e.preventDefault();
                  }}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    borderRadius: 12,
                    border: `1px solid ${capoFretFocused ? THEME.accent : THEME.border}`,
                    outline: "none",
                    boxShadow: capoFretFocused ? `0 0 0 3px ${withAlpha(THEME.accent, 0.18)}` : "none",
                    textAlign: "center",
                    ...pillMono,
                    background: THEME.surfaceWarm,
                    color: THEME.text,
                    boxSizing: "border-box",
                    caretColor: "transparent",
                  }}
                  title="Capo fret (1–24)"
                />
              )}

              {capoOpen && (
                <div
                  ref={capoPanelRef}
                  style={{
                    position: "absolute",
                    top: 50,
                    left: 0,
                    zIndex: 1000,
                    width: 240,
                    background: THEME.surfaceWarm,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 16,
                    boxShadow: "0 24px 70px rgba(0,0,0,0.18)",
                    padding: 10,
                    boxSizing: "border-box",
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      marginBottom: 8,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div style={{ fontWeight: 950 }}>Capo</div>
                    <button
                      type="button"
                      onClick={() => {
                        setCapoOpen(false);
                        focusKeyCapture();
                      }}
                      style={{ ...btnSmallPillClose }}
                    >
                      ×
                    </button>
                  </div>

                  <div style={{ display: "grid", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setCapoEnabled(false);
                        setCapoOpen(false);
                        focusKeyCapture();
                      }}
                      style={{
                        textAlign: "left",
                        padding: "10px 10px",
                        borderRadius: 14,
                        border: `1px solid ${THEME.border}`,
                        background: THEME.surfaceWarm,
                        cursor: "pointer",
                        fontWeight: 900,
                        color: THEME.text,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                        boxSizing: "border-box",
                      }}
                    >
                      <span>No</span>
                      {!capoEnabled ? <span style={{ color: THEME.accent, fontWeight: 950 }}>✓</span> : <span />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCapoEnabled(true);
                        setCapoOpen(false);
                        setCapoFret("");
                        requestAnimationFrame(() => {
                          try {
                            capoInputRef.current?.focus?.({ preventScroll: true });
                          } catch {
                            capoInputRef.current?.focus?.();
                          }
                        });
                      }}
                      style={{
                        textAlign: "left",
                        padding: "10px 10px",
                        borderRadius: 14,
                        border: `1px solid ${THEME.border}`,
                        background: THEME.surfaceWarm,
                        cursor: "pointer",
                        fontWeight: 900,
                        color: THEME.text,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                        boxSizing: "border-box",
                      }}
                    >
                      <span>Yes</span>
                      {capoEnabled ? <span style={{ color: THEME.accent, fontWeight: 950 }}>✓</span> : <span />}
                    </button>
                  </div>

                  <div style={{ fontSize: 12, color: THEME.textFaint, marginTop: 10 }}>
                    If enabled, enter the fret number in the box (1–24).
                  </div>
                </div>
              )}
            </div>

            {/* Chords */}
            <div style={{ position: "relative", marginLeft: 10 }}>
              <button
                ref={chordsBtnRef}
                type="button"
                onClick={() => setChordsOpen((v) => !v)}
                disabled={!standard}
                title={
                  standard
                    ? "Chord tools (6-string guitar, Standard tuning)"
                    : "Chords currently only available for 6-string guitar in Standard tuning"
                }
                style={{
                  ...toolbarMenuBtn,
                  ...toolbarToggleVisual(chordsOpen),
                  cursor: standard ? "pointer" : "not-allowed",
                  opacity: standard ? 1 : 0.55,
                }}
              >
                <span>{tr("Chords", "Acordes")}</span>
                <span style={{ opacity: 0.8 }}>{chordsOpen ? "▲" : "▼"}</span>
              </button>

              {chordsOpen && (
                <div
                  ref={chordsPanelRef}
                  style={{
                    position: "absolute",
                    top: 50,
                    left: 0,
                    zIndex: 1000,
                    width: "min(860px, calc(100vw - 36px))",
                    background: THEME.surfaceWarm,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 16,
                    boxShadow: "0 24px 70px rgba(0,0,0,0.18)",
                    padding: 10,
                    boxSizing: "border-box",
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontWeight: 950 }}>Chord tools</div>
                      <div style={{ fontSize: 12, color: THEME.textFaint }}>
                        Presets for 6-string guitar in Standard tuning. Save your own chord shapes from the selected
                        column. Your saved chords and any preset edits are only stored for your TabStudio account in
                        this browser.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setChordsOpen(false);
                        focusKeyCapture();
                      }}
                      style={{ ...btnSmallPillClose }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Save & apply */}
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

                  {/* Chord list */}
                  <div style={{ marginTop: 12, borderTop: `1px solid ${THEME.border}`, paddingTop: 12 }}>
                    <div style={{ fontWeight: 950, marginBottom: 8 }}>Chords</div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                        maxHeight: 320,
                        overflowY: "auto",
                        overscrollBehavior: "contain",
                        paddingRight: 4,
                      }}
                      onWheel={(e) => e.stopPropagation()}
                    >
                      <div style={{ gridColumn: "1 / -1", fontSize: 12, color: THEME.textFaint, fontWeight: 900 }}>
                        Presets
                      </div>

                      {effectivePresetChords.map((c) => {
                        const selected = selectedChordId === c.id;
                        return (
                          <div
                            key={c.id}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "minmax(0,1fr) auto",
                              gap: 6,
                              alignItems: "center",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedChordId(c.id)}
                              style={{
                                textAlign: "left",
                                padding: "10px 10px",
                                borderRadius: 14,
                                border: `1px solid ${THEME.border}`,
                                background: THEME.surfaceWarm,
                                cursor: "pointer",
                                fontWeight: 900,
                                color: THEME.text,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 10,
                                boxSizing: "border-box",
                              }}
                            >
                              <span>{c.name}</span>
                              {selected ? <span style={{ color: THEME.accent, fontWeight: 950 }}>✓</span> : <span />}
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditChordModal(c)}
                              style={{
                                height: 32,
                                padding: "0 8px",
                                borderRadius: 10,
                                border: `1px solid ${THEME.border}`,
                                background: THEME.surfaceWarm,
                                cursor: "pointer",
                                fontSize: 11,
                                fontWeight: 900,
                                color: THEME.textFaint,
                                boxSizing: "border-box",
                              }}
                              title={`Edit ${c.name} shape`}
                            >
                              Edit
                            </button>
                          </div>
                        );
                      })}

                      <div
                        style={{
                          gridColumn: "1 / -1",
                          marginTop: 4,
                          fontSize: 12,
                          color: THEME.textFaint,
                          fontWeight: 900,
                        }}
                      >
                        Your saved chords
                      </div>

                      {userChords.length === 0 ? (
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
                      ) : (
                        userChords.map((c) => {
                          const selected = selectedChordId === c.id;
                          return (
                            <div
                              key={c.id}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "minmax(0,1fr) auto auto",
                                gap: 6,
                                alignItems: "center",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedChordId(c.id)}
                                style={{
                                  textAlign: "left",
                                  padding: "10px 10px",
                                  borderRadius: 14,
                                  border: `1px solid ${THEME.border}`,
                                  background: THEME.surfaceWarm,
                                  cursor: "pointer",
                                  fontWeight: 900,
                                  color: THEME.text,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 10,
                                  boxSizing: "border-box",
                                  minWidth: 0,
                                }}
                              >
                                <span>{c.name}</span>
                                {selected ? (
                                  <span style={{ color: THEME.accent, fontWeight: 950 }}>✓</span>
                                ) : (
                                  <span />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditChordModal(c)}
                                style={{
                                  height: 32,
                                  padding: "0 8px",
                                  borderRadius: 10,
                                  border: `1px solid ${THEME.border}`,
                                  background: THEME.surfaceWarm,
                                  cursor: "pointer",
                                  fontSize: 11,
                                  fontWeight: 900,
                                  color: THEME.textFaint,
                                  boxSizing: "border-box",
                                }}
                                title={`Edit ${c.name} shape`}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  deleteUserChord(c.id);
                                }}
                                title="Delete saved chord"
                                style={{
                                  height: 32,
                                  padding: "0 8px",
                                  borderRadius: 10,
                                  border: `1px solid rgba(176,0,32,0.25)`,
                                  background: THEME.dangerBg,
                                  cursor: "pointer",
                                  fontWeight: 950,
                                  color: THEME.danger,
                                  boxSizing: "border-box",
                                  whiteSpace: "nowrap",
                                  fontSize: 11,
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Repeat last applied chord (compact) */}
            {standard && lastAppliedChordId && (
              <button
                type="button"
                onClick={repeatLastChord}
                title="Repeat last chord into the next column"
                aria-label="Repeat last chord into the next column"
                style={{
                  ...toolbarMenuBtn,
                  width: 42,
                  minWidth: 42,
                  padding: 0,
                  justifyContent: "center",
                  border: `2px solid ${THEME.accent}`,
                  background: THEME.surfaceWarm,
                  color: THEME.accent,
                  fontSize: 18,
                  fontWeight: 950,
                }}
              >
                ↻
              </button>
            )}

            {/* Insert */}
            <div style={{ position: "relative" }}>
              <button
                ref={insertBtnRef}
                type="button"
                onClick={() => setInsertOpen((v) => !v)}
                title="Insert a technique/symbol (+ opens this menu)"
                style={{
                  ...toolbarMenuBtn,
                  ...toolbarToggleVisual(insertOpen),
                }}
              >
                <span>{tr("Insert", "Insertar")}</span>
                <span style={{ opacity: 0.8 }}>{insertOpen ? "▲" : "▼"}</span>
              </button>

              {insertOpen && (
                <div
                  ref={insertPanelRef}
                  style={{
                    position: "absolute",
                    top: 50,
                    left: 0,
                    zIndex: 1000,
                    width: 320,
                    background: THEME.surfaceWarm,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 16,
                    boxShadow: "0 24px 70px rgba(0,0,0,0.18)",
                    padding: 10,
                    boxSizing: "border-box",
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 950 }}>Insert</div>
                    <button
                      type="button"
                      onClick={() => {
                        setInsertOpen(false);
                        focusKeyCapture();
                      }}
                      style={{ ...btnSmallPillClose }}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {INSERT_OPTIONS.map((opt) => (
                      <button
                        key={`${opt.mode}:${opt.insert}`}
                        type="button"
                        onClick={() => {
                          if (opt.mode === "column") fillSelectedColumnWith(opt.insert);
                          else insertIntoSelectedCell(opt.insert);
                        }}
                        style={{
                          textAlign: "left",
                          padding: "9px 10px",
                          borderRadius: 14,
                          border: `1px solid ${THEME.border}`,
                          background: THEME.surfaceWarm,
                          cursor: "pointer",
                          fontWeight: 850,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          color: THEME.text,
                          boxSizing: "border-box",
                        }}
                      >
                        <span>{opt.label}</span>
                        <span style={{ ...pillMono, color: THEME.textFaint, opacity: 0.9 }}>{opt.insert}</span>
                      </button>
                    ))}

                    {/* Harmonic helper */}
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
                        textAlign: "left",
                        padding: "9px 10px",
                        borderRadius: 14,
                        border: `1px solid ${THEME.border}`,
                        background: THEME.surfaceWarm,
                        cursor: "pointer",
                        fontWeight: 850,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        color: THEME.text,
                        boxSizing: "border-box",
                      }}
                    >
                      <span>Harmonic</span>
                      <span style={{ ...pillMono, color: THEME.textFaint, opacity: 0.9 }}>(12)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (hasCellSelection) {
                          clearSelectedCells();
                          setInsertOpen(false);
                          focusKeyCapture();
                          return;
                        }
                        const { r, c } = cursorRef.current;
                        setCell(r, c, "");
                        setOverwriteNext(true);
                        setInsertOpen(false);
                        focusKeyCapture();
                      }}
                      style={{
                        textAlign: "left",
                        padding: "9px 10px",
                        borderRadius: 14,
                        border: `1px solid ${THEME.border}`,
                        background: THEME.surfaceWarm,
                        cursor: "pointer",
                        fontWeight: 850,
                        color: THEME.danger,
                        boxSizing: "border-box",
                      }}
                    >
                      Clear Cell
                    </button>
                  </div>

                  <div style={{ fontSize: 12, color: THEME.textFaint, marginTop: 8 }}>
                    Tip: Press <b>+</b> (or <b>Shift</b> + <b>=</b>) to open this menu anytime.
                  </div>
                </div>
              )}
            </div>

            {/* Clear all current grid */}
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

            {/* Complete row */}
            <button
              type="button"
              onClick={completeRow}
              {...pressHandlers("completeRow")}
              style={{
                ...btnSecondary,
                ...pressVisual(pressedBtnId === "completeRow"),
                height: 42,
                marginLeft: "auto",
                transition: "transform 100ms ease, background 120ms ease, border-color 120ms ease, color 120ms ease",
              }}
            >
              {tr("Complete Row", "Completar fila")}
            </button>
          </div>

          {/* Grid */}
          <div style={{ position: "relative", marginTop: 14 }}>
            <div ref={tabbyGridRef} style={{ display: "grid", gap: 10 }}>
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
                      const partyTint = partyGridTints[cellKey(r, c)];
                      const partyCellActive = !!partyTint;

                      return (
                        <div key={c} style={{ position: "relative", width: cellSize, height: cellSize }}>
                          <button
                            className="tab-grid-cell-button"
                            type="button"
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
                                ? `3px solid ${THEME.accent}`
                                : partyCellActive
                                ? `1px solid ${partyTint.ring}`
                                : `1px solid ${THEME.border}`,
                              background: selected ? selectedBgTint : partyTint?.bg || bg,
                              boxShadow:
                                selected || isCursor || !partyCellActive
                                  ? "none"
                                  : `0 0 10px ${partyTint.glow}, inset 0 0 12px ${partyTint.glow}`,
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
                            transition: "background 170ms ease, border-color 120ms ease, box-shadow 170ms ease",
                          }}
                        >
                          {firstExportGlowActive && (
                            <span
                              aria-hidden="true"
                              style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: 11,
                                background:
                                  `radial-gradient(circle at 50% 48%, ${withAlpha("#FFD166", 0.86)} 0%, ${withAlpha(
                                    "#FFD166",
                                    0.56
                                  )} 44%, ${withAlpha("#FFD166", 0.24)} 72%, ${withAlpha("#FFD166", 0)} 100%)`,
                                boxShadow: "none",
                                animation: "tabstudioFirstExportCellGlow 3600ms cubic-bezier(0.2, 0.72, 0.2, 1) forwards",
                                pointerEvents: "none",
                              }}
                            />
                          )}
                         {val === "" ? (
    "\u00A0"
  ) : (() => {
    const trimmed = val.trim();

    // Match e.g. "1b(1/2)" or "7b(1)"
    const bendMatch = /^(\d+)b\((1\/2|1)\)$/.exec(trimmed);

    let mainText = trimmed;
    let supText = "";

    if (bendMatch) {
      mainText = bendMatch[1]; // fret number
      // Show ½ for half bend, 1 for full bend
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

          </div>
          </div>

          {/* Completed rows */}
          {completedRows.length > 0 && (
            <div ref={completedRowsSectionRef} style={{ marginTop: isTabbyGameActive ? 84 : 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                  flexWrap: "wrap",
                }}
              >
                <button
                  ref={completedRowsToggleRef}
                  type="button"
                  onClick={() =>
                    setCompletedRowsOpen((v) => {
                      const next = !v;
                      if (!next) clearSelection();
                      return next;
                    })
                  }
                  style={{
                    ...btnSecondary,
                    height: 36,
                    padding: "0 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontWeight: 950 }}>{tr("Completed Rows", "Filas completadas")}</span>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>{completedRowsOpen ? "▲" : "▼"}</span>
                </button>

                {completedRowsOpen && (
                  <div ref={completedRowsActionsRef} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={addNoteRow}
                      style={{ ...btnSecondary, height: 36, padding: "0 10px" }}
                    >
                      {tr("Add Note", "Añadir nota")}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (allRowsSelected) clearSelection();
                        else selectAllRows();
                      }}
                      style={{
                        ...btnSecondary,
                        height: 36,
                        padding: "0 10px",
                        borderColor: allRowsSelected ? withAlpha(THEME.accent, 0.75) : THEME.border,
                        color: allRowsSelected ? THEME.accent : THEME.text,
                        boxShadow: allRowsSelected ? `inset 0 0 0 1px ${withAlpha(THEME.accent, 0.22)}` : "none",
                      }}
                    >
                      {tr("Select All", "Seleccionar todo")}
                    </button>

                    {selectionCount > 0 && !allRowsSelected && (
                      <button
                        type="button"
                        onClick={clearSelection}
                        style={{ ...btnSecondary, height: 36, padding: "0 10px" }}
                      >
                        {tr("Clear Selection", "Limpiar selección")}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={duplicateSelectedRows}
                      disabled={selectionCount === 0}
                      style={{
                        ...iconActionBtnBase,
                        marginLeft: 12,
                        opacity: selectionCount === 0 ? 0.55 : 1,
                        cursor: selectionCount === 0 ? "default" : "pointer",
                      }}
                      title={selectionCount > 0 ? `Duplicate selected (${selectionCount})` : "Duplicate selected"}
                      aria-label={selectionCount > 0 ? `Duplicate selected rows (${selectionCount})` : "Duplicate selected rows"}
                    >
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2.2" />
                        <rect x="5" y="5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2.2" opacity="0.8" />
                      </svg>
                      {selectionCount > 0 && (
                        <span
                          style={{
                            position: "absolute",
                            top: -6,
                            right: -6,
                            minWidth: 18,
                            height: 18,
                            borderRadius: 999,
                            border: `1px solid ${THEME.border}`,
                            background: THEME.surfaceWarm,
                            color: THEME.text,
                            fontSize: 11,
                            fontWeight: 900,
                            lineHeight: "16px",
                            textAlign: "center",
                            padding: "0 4px",
                            boxSizing: "border-box",
                          }}
                        >
                          {selectionCount}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        deleteSelectedRows();
                      }}
                      disabled={selectionCount === 0}
                      style={{
                        ...iconActionBtnBase,
                        opacity: selectionCount === 0 ? 0.55 : 1,
                        cursor: selectionCount === 0 ? "default" : "pointer",
                        borderColor: deleteSelectedConfirmOpen
                          ? THEME.danger
                          : hasRowSelection
                          ? "rgba(176,0,32,0.25)"
                          : THEME.border,
                        color: deleteSelectedConfirmOpen ? "#ffffff" : hasRowSelection ? THEME.danger : THEME.text,
                        background: deleteSelectedConfirmOpen
                          ? THEME.danger
                          : hasRowSelection
                          ? THEME.dangerBg
                          : THEME.surfaceWarm,
                        boxShadow: deleteSelectedConfirmOpen ? `0 0 0 1px ${THEME.danger}` : "none",
                      }}
                      title={selectionCount > 0 ? `Delete selected (${selectionCount})` : "Delete selected"}
                      aria-label={selectionCount > 0 ? `Delete selected rows (${selectionCount})` : "Delete selected rows"}
                    >
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M4 7h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                        <path d="M9 7V5.8C9 4.81 9.81 4 10.8 4h2.4C14.19 4 15 4.81 15 5.8V7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                        <path d="M7 7l.9 11.2c.08 1  .92 1.8 1.93 1.8h4.34c1.01 0 1.85-.8 1.93-1.8L17 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                        <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                      </svg>
                      {selectionCount > 0 && (
                        <span
                          style={{
                            position: "absolute",
                            top: -6,
                            right: -6,
                            minWidth: 18,
                            height: 18,
                            borderRadius: 999,
                            border: deleteSelectedConfirmOpen ? "1px solid rgba(255,255,255,0.4)" : `1px solid ${THEME.border}`,
                            background: deleteSelectedConfirmOpen ? withAlpha("#000000", 0.2) : THEME.surfaceWarm,
                            color: deleteSelectedConfirmOpen ? "#ffffff" : THEME.text,
                            fontSize: 11,
                            fontWeight: 900,
                            lineHeight: "16px",
                            textAlign: "center",
                            padding: "0 4px",
                            boxSizing: "border-box",
                          }}
                        >
                          {selectionCount}
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {completedRowsOpen && (
                <div style={{ display: "grid", gap: 10 }}>
                  {completedRows.map((row, idx) => {
                    const isNote = row.kind === "note";
                    const text = isNote ? String(row.noteText ?? "") : buildRowTabWithRepeat(row);
                    const isRenaming = renamingRowId === row.id;
                    const checked = selectedRowIds.has(row.id);

                    
  return (
                      <div
                        key={row.id}
                        style={card}
                        draggable
                        onDragStart={(e) => onDragStartRow(e, row.id)}
                        onDragOver={onDragOverRow}
                        onDrop={(e) => onDropRow(e, row.id)}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              minWidth: 240,
                              flexWrap: "wrap",
                            }}
                          >
                            {/* Custom select button */}
                            <button
                              type="button"
                              onClick={() => toggleSelectedRow(row.id)}
                              title="Select row"
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 12,
                                border: `1px solid ${checked ? THEME.accent : THEME.border}`,
                                background: THEME.surfaceWarm,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                boxSizing: "border-box",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 14,
                                  fontWeight: 900,
                                  color: checked ? THEME.accent : THEME.textFaint,
                                }}
                              >
                                {checked ? "✓" : ""}
                              </span>
                            </button>

                            {isRenaming ? (
                              <input
                                ref={renameInputRef}
                                value={renameDraft}
                                onChange={(e) => setRenameDraft(e.target.value)}
                                onBlur={() => commitRenameRow(row.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    commitRenameRow(row.id);
                                  } else if (e.key === "Escape") {
                                    e.preventDefault();
                                    cancelRenameRow();
                                  }
                                }}
                                style={{
                                  height: 34,
                                  borderRadius: 12,
                                  border: `1px solid ${THEME.border}`,
                                  padding: "0 10px",
                                  fontWeight: 950,
                                  width: 260,
                                  background: THEME.surfaceWarm,
                                  color: THEME.text,
                                  boxSizing: "border-box",
                                }}
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => startRenameRow(row)}
                                title="Click to rename (Intro / Verse / Chorus etc)"
                                style={{
                                  background: THEME.surfaceWarm,
                                  border: `1px solid ${THEME.border}`,
                                  borderRadius: 12,
                                  padding: "7px 10px",
                                  fontWeight: 950,
                                  cursor: "pointer",
                                  color: THEME.text,
                                  boxSizing: "border-box",
                                }}
                              >
                                {row.name || `Row ${idx + 1} – ${row.instrumentLabelAtTime || currentInstrument.label}`}
                              </button>
                            )}

                            <span style={{ fontSize: 12, color: THEME.textFaint }}>({idx + 1})</span>
                          </div>

                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            {!isNote && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 850,
                                    color: THEME.textFaint,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.4,
                                  }}
                                >
                                  Loops
                                </span>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    border: `1px solid ${THEME.border}`,
                                    borderRadius: 12,
                                    overflow: "hidden",
                                    background: THEME.surfaceWarm,
                                    height: 36,
                                    boxSizing: "border-box",
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => nudgeRowRepeat(row.id, -1)}
                                    style={{
                                      width: 30,
                                      height: 36,
                                      border: "none",
                                      outline: "none",
                                      boxShadow: "none",
                                      background: "transparent",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontWeight: 1000,
                                      fontSize: 18,
                                      lineHeight: 1,
                                      color: THEME.text,
                                      padding: 0,
                                    }}
                                    title="Decrease loops"
                                    aria-label="Decrease loops"
                                  >
                                    −
                                  </button>

                                  <div style={{ width: 1, height: "100%", background: THEME.border }} />

                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={row.repeatCount ?? 1}
                                    onMouseDown={(e) => {
                                      if (e.detail === 3) {
                                        e.preventDefault();
                                        resetRowRepeat(row.id);
                                        e.currentTarget.blur();
                                        focusKeyCapture();
                                        return;
                                      }
                                      repeatOverwriteRef.current = true;
                                    }}
                                    onClick={(e) => {
                                      if (e.detail === 3) {
                                        e.preventDefault();
                                        resetRowRepeat(row.id);
                                        e.currentTarget.blur();
                                        focusKeyCapture();
                                        return;
                                      }
                                      repeatOverwriteRef.current = true;
                                    }}
                                    onChange={(e) => {
                                      const rawDom = String(e.target.value ?? "").replace(/[^\d]/g, "");
                                      if (!rawDom) {
                                        updateRowRepeat(row.id, "");
                                        return;
                                      }
                                      let nextRaw = rawDom;
                                      if (repeatOverwriteRef.current) {
                                        nextRaw = rawDom.slice(-1);
                                        repeatOverwriteRef.current = false;
                                      }
                                      updateRowRepeat(row.id, nextRaw);
                                    }}
                                    onFocus={(e) => {
                                      repeatOverwriteRef.current = true;
                                      e.target.select();
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        e.currentTarget.blur();
                                        focusKeyCapture();
                                      }
                                    }}
                                    style={{
                                      width: 46,
                                      height: 36,
                                      border: "none",
                                      outline: "none",
                                      boxShadow: "none",
                                      caretColor: "transparent",
                                      cursor: "pointer",
                                      textAlign: "center",
                                      ...pillMono,
                                      fontSize: 16,
                                      fontWeight: 900,
                                      background: "transparent",
                                      color: THEME.text,
                                      boxSizing: "border-box",
                                      padding: 0,
                                    }}
                                    title="Triple-click to reset loops to 1"
                                  />

                                  <div style={{ width: 1, height: "100%", background: THEME.border }} />

                                  <button
                                    type="button"
                                    onClick={() => nudgeRowRepeat(row.id, 1)}
                                    style={{
                                      width: 30,
                                      height: 36,
                                      border: "none",
                                      outline: "none",
                                      boxShadow: "none",
                                      background: "transparent",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontWeight: 1000,
                                      fontSize: 18,
                                      lineHeight: 1,
                                      color: THEME.text,
                                      padding: 0,
                                    }}
                                    title="Increase loops"
                                    aria-label="Increase loops"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                            )}

                            <button
                              type="button"
                              onClick={() => duplicateRow(row.id)}
                              style={{ ...btnSecondary, height: 36 }}
                            >
                              Duplicate
                            </button>

                            {isNote && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => insertIntoNoteText(row.id, "↑")}
                                  style={{ ...btnSecondary, width: 36, minWidth: 36, height: 36, padding: 0, fontSize: 18 }}
                                  title="Insert up arrow in note"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  onClick={() => insertIntoNoteText(row.id, "↓")}
                                  style={{ ...btnSecondary, width: 36, minWidth: 36, height: 36, padding: 0, fontSize: 18 }}
                                  title="Insert down arrow in note"
                                >
                                  ↓
                                </button>
                              </>
                            )}

                            {!isNote && (
                              <button
                                type="button"
                                onClick={() => editCompletedRow(row.id)}
                                style={{ ...btnSecondary, height: 36 }}
                              >
                                Edit
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => deleteCompletedRow(row.id)}
                              style={{ ...rowDeleteBtn }}
                              title="Delete row"
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        {isNote ? (
                          <textarea
                            ref={(el) => {
                              if (!noteTextAreaRefs.current) noteTextAreaRefs.current = {};
                              if (el) noteTextAreaRefs.current[row.id] = el;
                              else if (noteTextAreaRefs.current[row.id]) delete noteTextAreaRefs.current[row.id];
                            }}
                            value={text}
                            onChange={(e) => updateNoteText(row.id, e.target.value)}
                            placeholder="Write a note (e.g. strumming pattern, dynamics, lyrics)..."
                            style={{
                              margin: "10px 0 0 0",
                              width: "100%",
                              minHeight: 60,
                              resize: "vertical",
                              borderRadius: 12,
                              border: `1px solid ${THEME.border}`,
                              padding: "8px 10px",
                              fontSize: 13,
                              lineHeight: 1.4,
                              fontFamily:
                                "-apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', sans-serif",
                              color: THEME.text,
                              background: THEME.surfaceWarm,
                              boxSizing: "border-box",
                            }}
                          />
                        ) : (
                          <pre
                            style={{
                              margin: "10px 0 0 0",
                              whiteSpace: "pre",
                              overflowX: "auto",
                              fontSize: 14,
                              lineHeight: 1.35,
                              fontFamily:
                                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
                              color: THEME.text,
                            }}
                          >
                            {text}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {milestoneConfetti && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: milestoneConfetti.left ?? 0,
                top: milestoneConfetti.top ?? 0,
                width: milestoneConfetti.width,
                height: milestoneConfetti.height,
                pointerEvents: "none",
                zIndex: 1300,
                overflow: "hidden",
              }}
            >
              {milestoneConfetti.particles.map((particle) => (
                <span
                  key={particle.id}
                  style={{
                    position: "absolute",
                    left: `${particle.startX}px`,
                    top: `${particle.startY}px`,
                    width: particle.size,
                    height: Math.max(3, particle.size * 0.62),
                    borderRadius: 999,
                    background: particle.color,
                    opacity: 0,
                    transform: "translate(0, 0)",
                    boxShadow: `0 0 8px ${withAlpha(particle.color, 0.36)}`,
                    animation: `tabstudioConfettiBurst ${particle.duration}ms linear ${particle.delay}ms forwards`,
                    ["--xPeak"]: `${particle.xPeak}px`,
                    ["--yPeak"]: `${particle.yPeak}px`,
                    ["--xApexEase"]: `${particle.xApexEase}px`,
                    ["--yApexEase"]: `${particle.yApexEase}px`,
                    ["--xMid1"]: `${particle.xMid1}px`,
                    ["--yMid1"]: `${particle.yMid1}px`,
                    ["--xMid2"]: `${particle.xMid2}px`,
                    ["--yMid2"]: `${particle.yMid2}px`,
                    ["--xMid3"]: `${particle.xMid3}px`,
                    ["--yMid3"]: `${particle.yMid3}px`,
                    ["--xNearFloor"]: `${particle.xNearFloor}px`,
                    ["--yNearFloor"]: `${particle.yNearFloor}px`,
                    ["--xFade"]: `${particle.xFade}px`,
                    ["--yFade"]: `${particle.yFade}px`,
                    ["--xEnd"]: `${particle.xEnd}px`,
                    ["--yEnd"]: `${particle.yEnd}px`,
                    ["--rotPeak"]: particle.rotPeak,
                    ["--rotApexEase"]: particle.rotApexEase,
                    ["--rotMid1"]: particle.rotMid1,
                    ["--rotMid2"]: particle.rotMid2,
                    ["--rotMid3"]: particle.rotMid3,
                    ["--rotNearFloor"]: particle.rotNearFloor,
                    ["--rotFade"]: particle.rotFade,
                    ["--rotEnd"]: particle.rotEnd,
                  }}
                />
              ))}
            </div>
          )}

          {milestoneToast && (
            <div
              style={{
                position: "absolute",
                right: 14,
                bottom: 14,
                zIndex: 1302,
                pointerEvents: "none",
                borderRadius: 10,
                border: `1px solid ${withAlpha(THEME.accent, 0.45)}`,
                background: withAlpha(THEME.surfaceWarm, 0.95),
                color: THEME.text,
                padding: "8px 10px",
                fontSize: 12,
                fontWeight: 850,
                lineHeight: 1.25,
                boxShadow: "0 10px 22px rgba(0,0,0,0.2)",
                animation: "tabstudioMilestoneToast 2000ms ease forwards",
              }}
            >
              {milestoneToast}
            </div>
          )}

          {checklistOpen && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 5400,
                background: withAlpha(THEME.bg, isDarkMode ? 0.92 : 0.86),
                backdropFilter: "blur(6px)",
                display: "flex",
                justifyContent: "center",
                padding: "24px 18px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: "min(1100px, 100%)",
                  height: "100%",
                  borderRadius: 16,
                  border: `1px solid ${THEME.border}`,
                  background: THEME.surfaceWarm,
                  boxShadow: "0 24px 60px rgba(0,0,0,0.34)",
                  overflow: "auto",
                  display: "grid",
                  gridTemplateRows: "auto 1fr",
                }}
              >
                <div
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    padding: "16px 18px",
                    borderBottom: `1px solid ${THEME.border}`,
                    background: withAlpha(THEME.surfaceWarm, 0.95),
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 950, letterSpacing: -0.3 }}>V1 Release Checklist</div>
                    <div style={{ marginTop: 4, fontSize: 13, color: THEME.textFaint, fontWeight: 700 }}>
                      {checklistCounts.complete}/{checklistCounts.total} complete
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button type="button" onClick={resetChecklistState} style={{ ...btnSecondary, height: 34, padding: "0 12px" }}>
                      Reset checklist
                    </button>
                    <button type="button" onClick={restoreChecklistDefaults} style={{ ...btnSecondary, height: 34, padding: "0 12px" }}>
                      Restore defaults
                    </button>
                    <button type="button" onClick={() => setChecklistOpen(false)} style={{ ...btnSecondary, height: 34, padding: "0 12px" }}>
                      Back to editor
                    </button>
                  </div>
                </div>

                <div style={{ padding: 16, display: "grid", gap: 14 }}>
                  {visibleChecklistSections.map((section) => (
                    <section key={section.id} style={{ ...card, padding: 14 }}>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 950, letterSpacing: 0.2 }}>{section.title}</h3>
                      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                        {(section.items || []).map((item) => {
                          const checked = !!v1ChecklistState[item.id];
                          return (
                            <div
                              key={item.id}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "auto 1fr auto",
                                alignItems: "start",
                                gap: 10,
                                borderRadius: 10,
                                border: `1px solid ${withAlpha(THEME.border, 0.9)}`,
                                background: checked ? withAlpha(THEME.accent, isDarkMode ? 0.12 : 0.08) : "transparent",
                                padding: "8px 10px",
                                boxSizing: "border-box",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleChecklistItem(item.id)}
                                style={{ marginTop: 2, width: 16, height: 16, accentColor: THEME.accent }}
                              />
                              <div style={{ fontSize: 14, color: THEME.text, fontWeight: checked ? 800 : 700, lineHeight: 1.35 }}>{item.text}</div>
                              <button
                                type="button"
                                onClick={() => hideChecklistItem(item.id)}
                                style={{ ...btnSmallPillClose, fontSize: 15, lineHeight: 1, color: THEME.textFaint }}
                                title="Remove item"
                                aria-label="Remove item"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          )}

          {rowDeleteConfirmIds && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.52)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                zIndex: 5200,
              }}
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) closeDeleteRowsConfirm();
              }}
            >
              <div
                style={{
                  width: "min(430px, 100%)",
                  ...card,
                  padding: 16,
                  boxShadow: "0 30px 70px rgba(0,0,0,0.35)",
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontSize: 20, fontWeight: 950, color: THEME.text }}>
                    {deleteConfirmCount > 1 ? "Delete selected rows?" : "Delete row?"}
                  </div>
                  <button type="button" onClick={closeDeleteRowsConfirm} style={{ ...btnSmallPillClose }}>
                    ×
                  </button>
                </div>
                <div style={{ marginTop: 8, color: THEME.textFaint, fontSize: 14 }}>
                  {deleteConfirmCount > 1
                    ? `You are about to delete ${deleteConfirmCount} rows. This action cannot be undone.`
                    : "This row will be removed from Completed Rows. This action cannot be undone."}
                </div>
                <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button type="button" onClick={closeDeleteRowsConfirm} style={{ ...btnSecondary, height: 36, padding: "0 12px" }}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteRows}
                    style={{
                      ...btnSecondary,
                      height: 36,
                      padding: "0 12px",
                      borderColor: "rgba(176,0,32,0.25)",
                      color: THEME.danger,
                      background: THEME.dangerBg,
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Account & Profile modal */}
          {accountProfileOpen && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: THEME.bg,
                display: "flex",
                zIndex: 5000,
              }}
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) setAccountProfileOpen(false);
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: THEME.surfaceWarm,
                  border: "none",
                  boxShadow: "none",
                  padding: 0,
                  boxSizing: "border-box",
                  display: "grid",
                  gridTemplateColumns: "260px minmax(0, 1fr)",
                  overflow: "hidden",
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    borderRight: `1px solid ${THEME.border}`,
                    background: isDarkMode ? "#101010" : "#FFFFFF",
                    padding: 16,
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    overflowY: "auto",
                  }}
                >
                  <div style={{ fontWeight: 950, fontSize: 18, color: THEME.text }}>Account</div>

                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 999,
                      border: `1px solid ${THEME.border}`,
                      background: THEME.surfaceWarm,
                      color: THEME.textFaint,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  >
                    {String(accountFullName || "?")
                      .split(" ")
                      .map((s) => s[0] || "")
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 17, fontWeight: 900, color: THEME.text, lineHeight: 1.1 }}>{accountFullName}</div>
                    <div style={{ marginTop: 4, fontSize: 13, color: THEME.textFaint, fontWeight: 800 }}>{accountTier}</div>
                  </div>

                  {[
                    { id: "overview", label: "Overview" },
                    { id: "profile", label: "Profile" },
                    { id: "security", label: "Security" },
                    { id: "subscription", label: "Subscription" },
                    { id: "billing", label: "Billing" },
                  ].map((item) => {
                    const active = accountProfileSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAccountProfileSection(item.id)}
                        style={{
                          ...toolbarMenuBtn,
                          width: "100%",
                          justifyContent: "flex-start",
                          minHeight: 44,
                          background: THEME.surfaceWarm,
                          borderColor: active ? withAlpha(THEME.accent, 0.7) : THEME.border,
                          color: active ? THEME.accent : THEME.text,
                          boxShadow: "none",
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}

                  <div style={{ marginTop: "auto", fontSize: 12, color: THEME.textFaint, lineHeight: 1.4 }}>
                    {accountEmail}
                  </div>
                </div>

                <div
                  style={{
                    padding: 18,
                    boxSizing: "border-box",
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    minHeight: 0,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div style={{ fontWeight: 950, fontSize: 18, color: THEME.text }}>Account</div>
                    <button type="button" onClick={() => setAccountProfileOpen(false)} style={{ ...btnSmallPillClose }}>
                      ×
                    </button>
                  </div>

                  {(() => {
                    const sectionMeta = {
                      overview: { title: "Overview", sub: "Membership, usage, and quick account summary." },
                      profile: { title: "Profile", sub: "Public profile details and creator identity settings." },
                      security: { title: "Security", sub: "Login, authentication, and active session controls." },
                      subscription: { title: "Subscription", sub: "Plan details, renewals, and subscription options." },
                      billing: { title: "Billing", sub: "Payment methods, invoices, and billing contact details." },
                    };
                    const meta = sectionMeta[accountProfileSection] || sectionMeta.overview;
                    return (
                      <div style={{ ...card, padding: 12, borderColor: THEME.border, background: THEME.surfaceWarm }}>
                        <div style={{ fontSize: 20, fontWeight: 950, color: THEME.text, lineHeight: 1.15 }}>{meta.title}</div>
                        <div style={{ marginTop: 4, fontSize: 13, color: THEME.textFaint, fontWeight: 700 }}>{meta.sub}</div>
                      </div>
                    );
                  })()}

                  <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "grid", gap: 12, paddingRight: 4 }}>
                  {accountProfileSection === "overview" && (
                    <div style={{ display: "grid", gap: 12 }}>
                      <div
                        style={{
                          ...card,
                          padding: 14,
                          borderColor: THEME.border,
                          background: THEME.surfaceWarm,
                        }}
                      >
                        <div style={{ fontWeight: 900, fontSize: 15, color: THEME.text }}>Membership</div>
                        <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 12, color: THEME.textFaint }}>Current tier</div>
                            <div style={{ marginTop: 2, fontWeight: 900, fontSize: 15 }}>{accountTier}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 12, color: THEME.textFaint }}>Member since</div>
                            <div style={{ marginTop: 2, fontWeight: 900, fontSize: 15 }}>{accountMemberSince}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 12, color: THEME.textFaint }}>Subscription renews</div>
                            <div style={{ marginTop: 2, fontWeight: 900, fontSize: 15 }}>{accountRenewalDate}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 12, color: THEME.textFaint }}>Billing cycle</div>
                            <div style={{ marginTop: 2, fontWeight: 900, fontSize: 15 }}>{accountBillingCycle}</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                        <div style={{ ...card, padding: 12 }}>
                          <div style={{ fontSize: 12, color: THEME.textFaint }}>Tabs created</div>
                          <div style={{ marginTop: 4, fontSize: 22, fontWeight: 950, color: THEME.text }}>48</div>
                        </div>
                        <div style={{ ...card, padding: 12 }}>
                          <div style={{ fontSize: 12, color: THEME.textFaint }}>PDF exports (30 days)</div>
                          <div style={{ marginTop: 4, fontSize: 22, fontWeight: 950, color: THEME.text }}>17</div>
                        </div>
                        <div style={{ ...card, padding: 12 }}>
                          <div style={{ fontSize: 12, color: THEME.textFaint }}>Storage used</div>
                          <div style={{ marginTop: 4, fontSize: 22, fontWeight: 950, color: THEME.text }}>124 MB</div>
                        </div>
                        <div style={{ ...card, padding: 12 }}>
                          <div style={{ fontSize: 12, color: THEME.textFaint }}>Last active</div>
                          <div style={{ marginTop: 4, fontSize: 22, fontWeight: 950, color: THEME.text }}>Today</div>
                        </div>
                      </div>

                      <div style={{ ...card, padding: 12 }}>
                        <div style={{ fontWeight: 900, fontSize: 14 }}>Coming soon</div>
                        <div style={{ marginTop: 6, fontSize: 13, color: THEME.textFaint, lineHeight: 1.5 }}>
                          Quick links to invoices, devices and recent activity will appear here in a future update.
                        </div>
                      </div>
                    </div>
                  )}

                  {accountProfileSection === "profile" && (
                    <div style={{ display: "grid", gap: 12 }}>
                      <div style={{ ...card, padding: 14 }}>
                        <div style={{ fontWeight: 900, fontSize: 15 }}>Public profile</div>
                        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: THEME.textFaint, marginBottom: 6 }}>Display name</div>
                            <input
                              value={profileDisplayName}
                              onChange={(e) => setProfileDisplayName(e.target.value)}
                              style={{ ...field }}
                              placeholder="Display name"
                            />
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: THEME.textFaint, marginBottom: 6 }}>Username</div>
                            <input
                              value={profileHandle}
                              onChange={(e) => setProfileHandle(e.target.value)}
                              style={{ ...field }}
                              placeholder="@username"
                            />
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: THEME.textFaint, marginBottom: 6 }}>Bio</div>
                            <textarea
                              value={profileBio}
                              onChange={(e) => setProfileBio(e.target.value)}
                              rows={3}
                              style={{
                                ...field,
                                minHeight: 92,
                                padding: "10px",
                                resize: "vertical",
                                fontFamily: "inherit",
                                fontWeight: 700,
                              }}
                              placeholder="Short bio"
                            />
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: THEME.textFaint, marginBottom: 6 }}>Website</div>
                            <input
                              value={profileWebsite}
                              onChange={(e) => setProfileWebsite(e.target.value)}
                              style={{ ...field }}
                              placeholder="https://"
                            />
                          </div>
                          <div
                            style={{
                              ...card,
                              borderRadius: 12,
                              padding: 10,
                              background: THEME.surfaceWarm,
                            }}
                          >
                            <div style={{ fontSize: 12, color: THEME.textFaint, fontWeight: 800 }}>Public profile URL</div>
                            <div style={{ marginTop: 4, fontSize: 13, fontWeight: 900, color: THEME.text }}>
                              {`https://tabstudio.app/u/${String(profileHandle || "creator")
                                .toLowerCase()
                                .replace(/^@+/, "")
                                .replace(/[^a-z0-9_-]/g, "") || "creator"}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {accountProfileSection === "security" && (
                    <div style={{ display: "grid", gap: 12 }}>
                      <div style={{ ...card, padding: 14 }}>
                        <div style={{ fontWeight: 900, fontSize: 15 }}>Login & authentication</div>
                        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: THEME.textFaint, marginBottom: 6 }}>Account email</div>
                            <input
                              value={securityEmail}
                              onChange={(e) => setSecurityEmail(e.target.value)}
                              style={{ ...field }}
                              placeholder="Email"
                            />
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                            <input style={{ ...field }} type="password" placeholder="New password" />
                            <input style={{ ...field }} type="password" placeholder="Confirm password" />
                          </div>
                          <div
                            style={{
                              ...card,
                              borderRadius: 12,
                              padding: 10,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 850, fontSize: 14 }}>Two-factor authentication</div>
                              <div style={{ marginTop: 2, fontSize: 12, color: THEME.textFaint }}>
                                Add an authenticator app for extra account protection.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSecurityTwoFactorEnabled((v) => !v)}
                              style={{
                                ...btnSmallPill,
                                borderColor: securityTwoFactorEnabled ? withAlpha(THEME.accent, 0.7) : THEME.border,
                                background: THEME.surfaceWarm,
                                color: securityTwoFactorEnabled ? THEME.accent : THEME.text,
                              }}
                            >
                              {securityTwoFactorEnabled ? "Enabled" : "Enable"}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div style={{ ...card, padding: 14 }}>
                        <div style={{ fontWeight: 900, fontSize: 15 }}>Recent sessions</div>
                        <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                          {recentSessions.map((session) => (
                            <div
                              key={`${session.device}-${session.when}`}
                              style={{
                                ...card,
                                borderRadius: 12,
                                padding: 10,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 850, fontSize: 14 }}>{session.device}</div>
                                <div style={{ marginTop: 2, fontSize: 12, color: THEME.textFaint }}>
                                  {session.location}
                                </div>
                              </div>
                              <div style={{ fontSize: 12, color: THEME.textFaint, fontWeight: 800 }}>{session.when}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                          <div style={{ display: "grid", gap: 4 }}>
                            <button type="button" style={{ ...btnSmallPillDanger }}>
                              Sign out all other sessions
                            </button>
                            <div style={{ fontSize: 11, color: THEME.textFaint, textAlign: "right" }}>
                              You&apos;ll stay signed in on this device.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {accountProfileSection === "subscription" && (
                    <div style={{ display: "grid", gap: 12 }}>
                      <div
                        style={{
                          ...card,
                          padding: 14,
                          borderColor: THEME.border,
                          background: THEME.surfaceWarm,
                        }}
                      >
                        <div style={{ fontWeight: 900, fontSize: 15 }}>Current plan</div>
                        <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 12, color: THEME.textFaint }}>Plan</div>
                            <div style={{ marginTop: 3, display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontWeight: 900, fontSize: 15 }}>{accountTier}</span>
                              <span
                                style={{
                                  ...btnSmallPill,
                                  height: 22,
                                  padding: "0 8px",
                                  borderColor: withAlpha(THEME.accent, 0.55),
                                  background: "transparent",
                                  color: THEME.accent,
                                  cursor: "default",
                                  fontSize: 11,
                                }}
                              >
                                Current plan
                              </span>
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 12, color: THEME.textFaint }}>Renews</div>
                            <div style={{ marginTop: 3, fontWeight: 900, fontSize: 15 }}>{accountRenewalDate}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 12, color: THEME.textFaint }}>Cycle</div>
                            <div style={{ marginTop: 3, fontWeight: 900, fontSize: 15 }}>{accountBillingCycle}</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ ...card, padding: 14 }}>
                        <div
                          style={{
                            ...card,
                            borderRadius: 12,
                            padding: 10,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 850, fontSize: 14 }}>Automatic renewal</div>
                            <div style={{ marginTop: 2, fontSize: 12, color: THEME.textFaint }}>
                              Keep your subscription active without interruption.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSubscriptionAutoRenew((v) => !v)}
                            style={{
                              ...btnSmallPill,
                              borderColor: subscriptionAutoRenew ? withAlpha(THEME.accent, 0.7) : THEME.border,
                              background: THEME.surfaceWarm,
                              color: subscriptionAutoRenew ? THEME.accent : THEME.text,
                            }}
                          >
                            {subscriptionAutoRenew ? "On" : "Off"}
                          </button>
                        </div>
                        <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button type="button" style={{ ...btnSmallPill }}>Compare Plans</button>
                          <button type="button" style={{ ...btnSmallPillDanger }}>Cancel Subscription</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {accountProfileSection === "billing" && (
                    <div style={{ display: "grid", gap: 12 }}>
                      <div style={{ ...card, padding: 14 }}>
                        <div style={{ fontWeight: 900, fontSize: 15 }}>Payment method</div>
                        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                          <input
                            value={defaultPaymentMethod}
                            onChange={(e) => setDefaultPaymentMethod(e.target.value)}
                            style={{ ...field }}
                            placeholder="Card or payment method"
                          />
                          <input
                            value={billingEmail}
                            onChange={(e) => setBillingEmail(e.target.value)}
                            style={{ ...field }}
                            placeholder="Billing email"
                          />
                        </div>
                        <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                          <button type="button" style={{ ...btnSmallPill }}>Update Payment Method</button>
                        </div>
                      </div>
                      <div style={{ ...card, padding: 14 }}>
                        <div style={{ fontWeight: 900, fontSize: 15 }}>Invoices</div>
                        <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                          {recentInvoices.map((invoice) => (
                            <div
                              key={invoice.id}
                              style={{
                                ...card,
                                borderRadius: 12,
                                padding: 10,
                                display: "grid",
                                gridTemplateColumns: "minmax(0, 1fr) auto auto auto",
                                gap: 10,
                                alignItems: "center",
                              }}
                            >
                              <div style={{ fontWeight: 850, fontSize: 14 }}>{invoice.id}</div>
                              <div style={{ fontSize: 12, color: THEME.textFaint }}>{invoice.date}</div>
                              <div style={{ fontSize: 13, fontWeight: 900 }}>{invoice.amount}</div>
                              <div
                                style={{
                                  ...btnSmallPill,
                                  height: 24,
                                  padding: "0 8px",
                                  borderColor:
                                    invoice.status === "Paid"
                                      ? withAlpha(THEME.accent, 0.55)
                                      : invoice.status === "Upcoming"
                                      ? withAlpha("#E49D3A", 0.55)
                                      : withAlpha("#6FA8FF", 0.55),
                                  background:
                                    invoice.status === "Paid"
                                      ? "transparent"
                                      : invoice.status === "Upcoming"
                                      ? "transparent"
                                      : "transparent",
                                  color:
                                    invoice.status === "Paid"
                                      ? THEME.accent
                                      : invoice.status === "Upcoming"
                                      ? "#E49D3A"
                                      : "#6FA8FF",
                                  cursor: "default",
                                }}
                              >
                                {invoice.status}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  </div>

                  {(() => {
                    const primaryLabelBySection = {
                      overview: "Save Changes",
                      profile: "Save Profile",
                      security: "Save Changes",
                      subscription: "Update Plan",
                      billing: "Save Changes",
                    };
                    const primaryLabel = primaryLabelBySection[accountProfileSection] || "Save Changes";
                    return (
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: "auto" }}>
                        <button type="button" onClick={() => setAccountProfileOpen(false)} style={{ ...btnSmallPill }}>
                          Close
                        </button>
                        <button
                          type="button"
                          style={{
                            ...btnSmallPill,
                            borderColor: withAlpha(THEME.accent, 0.7),
                            background: "transparent",
                            color: THEME.accent,
                          }}
                        >
                          {primaryLabel}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Save Tab Project modal (mock flow only) */}
          {saveProjectOpen && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 5000,
              }}
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) setSaveProjectOpen(false);
              }}
            >
              <div
                style={{
                  width: 760,
                  maxWidth: "92vw",
                  borderRadius: 18,
                  background: THEME.surfaceWarm,
                  border: `1px solid ${THEME.border}`,
                  boxShadow: "0 24px 70px rgba(0,0,0,0.32)",
                  padding: 16,
                  boxSizing: "border-box",
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                    gap: 10,
                  }}
                >
                  <div style={{ fontWeight: 950, fontSize: 20, color: THEME.text }}>Save Tab Project</div>
                  <button type="button" onClick={() => setSaveProjectOpen(false)} style={{ ...btnSmallPillClose }}>
                    ×
                  </button>
                </div>

                <div style={{ fontSize: 13, color: THEME.textFaint, lineHeight: 1.55 }}>
                  Choose where this tab will live in your library. This is a preview flow only for now.
                </div>

                <div
                  style={{
                    marginTop: 12,
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                    gap: 12,
                  }}
                >
                  <div style={{ ...card, padding: 12, display: "grid", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: THEME.textFaint, marginBottom: 6 }}>Band / Project</div>
                      <select
                        value={saveTargetBand?.id || ""}
                        onChange={(e) => {
                          const nextBandId = e.target.value;
                          const nextBand = libraryData.find((b) => b.id === nextBandId) || null;
                          setSaveTargetBandId(nextBandId);
                          setSaveTargetAlbumId(nextBand?.albums?.[0]?.id || "");
                        }}
                        style={{ ...field }}
                      >
                        {libraryData.map((band) => (
                          <option key={band.id} value={band.id}>
                            {band.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: THEME.textFaint, marginBottom: 6 }}>Album</div>
                      <select
                        value={saveTargetAlbum?.id || ""}
                        onChange={(e) => setSaveTargetAlbumId(e.target.value)}
                        style={{ ...field }}
                      >
                        {saveTargetAlbums.length === 0 ? (
                          <option value="">No albums available</option>
                        ) : (
                          saveTargetAlbums.map((album) => (
                            <option key={album.id} value={album.id}>
                              {album.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: THEME.textFaint, marginBottom: 6 }}>Song name</div>
                      <input
                        value={saveTargetSongName}
                        onChange={(e) => setSaveTargetSongName(e.target.value)}
                        placeholder="Song name"
                        style={{ ...field }}
                      />
                    </div>
                  </div>

                  <div style={{ ...card, padding: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: THEME.textFaint, marginBottom: 6 }}>
                      Snapshot preview (mock)
                    </div>
                    <pre
                      style={{
                        margin: 0,
                        maxHeight: 190,
                        overflow: "auto",
                        whiteSpace: "pre-wrap",
                        fontSize: 12,
                        lineHeight: 1.45,
                        color: THEME.text,
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
                      }}
                    >
                      {JSON.stringify(
                        {
                          ...saveSnapshotDraft,
                          targetBand: saveTargetBand?.name || null,
                          targetAlbum: saveTargetAlbum?.name || null,
                          targetSong: String(saveTargetSongName || "").trim() || "Untitled Song",
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                  <button type="button" onClick={() => setSaveProjectOpen(false)} style={{ ...btnSecondary }}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleMockSaveProject}
                    style={{
                      ...btnSmallPill,
                      borderColor: withAlpha(THEME.accent, 0.7),
                      background: "transparent",
                      color: THEME.accent,
                    }}
                  >
                    Save to library (mock)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Projects & Library panel */}
          {projectsLibraryOpen && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: THEME.bg,
                zIndex: 5000,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: THEME.surfaceWarm,
                  border: "none",
                  boxShadow: "none",
                  padding: 18,
                  boxSizing: "border-box",
                  display: "grid",
                  gridTemplateRows: "auto auto minmax(0, 1fr) auto auto",
                  gap: 10,
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                    gap: 10,
                  }}
                >
                  <div style={{ fontWeight: 950, fontSize: 20, color: THEME.text }}>Projects &amp; Library</div>
                  <button type="button" onClick={() => setProjectsLibraryOpen(false)} style={{ ...btnSmallPillClose }}>
                    ×
                  </button>
                </div>

                <div style={{ fontSize: 13, color: THEME.textFaint, lineHeight: 1.55 }}>
                  In a future update, your saved projects will appear here and can be organized by band, album, and song.
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.15fr)",
                    gap: 10,
                    minHeight: 0,
                  }}
                >
                  <div style={{ ...card, padding: 10, minHeight: 0, overflowY: "auto" }}>
                    <div style={{ fontSize: 13, color: THEME.textFaint, fontWeight: 900, marginBottom: 8 }}>
                      Bands / Projects
                    </div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {libraryData.map((band, bandIndex) => {
                        const active = selectedLibraryBand?.id === band.id;
                        return (
                          <button
                            key={band.id}
                            type="button"
                            draggable
                            onClick={() => {
                              setSelectedLibraryBandId(band.id);
                              setSelectedLibraryAlbumId("");
                              setSelectedLibrarySongId("");
                            }}
                            onDragStart={() => {
                              libraryDragRef.current = { type: "band", index: bandIndex };
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const drag = libraryDragRef.current;
                              if (!drag || drag.type !== "band") return;
                              reorderLibraryBands(drag.index, bandIndex);
                              libraryDragRef.current = null;
                            }}
                            onDragEnd={() => {
                              libraryDragRef.current = null;
                            }}
                            style={{
                              ...btnSecondary,
                              justifyContent: "flex-start",
                              textAlign: "left",
                              background: THEME.surfaceWarm,
                              borderColor: active ? withAlpha(THEME.accent, 0.7) : THEME.border,
                              color: active ? THEME.accent : THEME.text,
                              boxShadow: "none",
                              cursor: "grab",
                            }}
                          >
                            {band.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ ...card, padding: 10, minHeight: 0, overflowY: "auto" }}>
                    <div style={{ fontSize: 13, color: THEME.textFaint, fontWeight: 900, marginBottom: 8 }}>Albums</div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {!selectedLibraryBand ? (
                        <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>
                          Select a band/project to view albums.
                        </div>
                      ) : selectedLibraryAlbums.length === 0 ? (
                        <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>No albums yet</div>
                      ) : (
                        selectedLibraryAlbums.map((album, albumIndex) => {
                          const active = selectedLibraryAlbum?.id === album.id;
                          return (
                            <button
                              key={album.id}
                              type="button"
                              draggable
                              onClick={() => {
                                setSelectedLibraryAlbumId(album.id);
                                setSelectedLibrarySongId("");
                              }}
                              onDragStart={() => {
                                libraryDragRef.current = { type: "album", index: albumIndex };
                              }}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                const drag = libraryDragRef.current;
                                if (!drag || drag.type !== "album") return;
                                reorderLibraryAlbums(drag.index, albumIndex);
                                libraryDragRef.current = null;
                              }}
                              onDragEnd={() => {
                                libraryDragRef.current = null;
                              }}
                              style={{
                                ...btnSecondary,
                                justifyContent: "flex-start",
                                textAlign: "left",
                                background: THEME.surfaceWarm,
                                borderColor: active ? withAlpha(THEME.accent, 0.7) : THEME.border,
                                color: active ? THEME.accent : THEME.text,
                                boxShadow: "none",
                                cursor: "grab",
                              }}
                            >
                              {album.name}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div style={{ ...card, padding: 10, minHeight: 0, overflowY: "auto" }}>
                    <div style={{ fontSize: 13, color: THEME.textFaint, fontWeight: 900, marginBottom: 8 }}>Songs</div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {!selectedLibraryAlbum ? (
                        <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>
                          Select an album to view songs.
                        </div>
                      ) : selectedLibrarySongs.length === 0 ? (
                        <div style={{ fontSize: 13, color: THEME.textFaint, padding: "8px 4px" }}>No songs yet</div>
                      ) : (
                        selectedLibrarySongs.map((song, songIndex) => {
                          const active = selectedLibrarySong?.id === song.id;
                          return (
                            <div
                              key={song.id}
                              draggable
                              onDragStart={() => {
                                libraryDragRef.current = { type: "song", index: songIndex };
                              }}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                const drag = libraryDragRef.current;
                                if (!drag || drag.type !== "song") return;
                                reorderLibrarySongs(drag.index, songIndex);
                                libraryDragRef.current = null;
                              }}
                              onDragEnd={() => {
                                libraryDragRef.current = null;
                              }}
                              style={{ cursor: "grab" }}
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedLibrarySongId(song.id)}
                                style={{
                                  ...btnSecondary,
                                  width: "100%",
                                  justifyContent: "space-between",
                                  textAlign: "left",
                                  background: THEME.surfaceWarm,
                                  borderColor: active ? withAlpha(THEME.accent, 0.7) : THEME.border,
                                  color: active ? THEME.accent : THEME.text,
                                  boxShadow: "none",
                                }}
                              >
                                <span>{song.name}</span>
                                <span style={{ fontSize: 12, opacity: 0.8 }}>▸</span>
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div style={{ marginTop: 10, borderTop: `1px solid ${THEME.border}`, paddingTop: 10 }}>
                      <div style={{ fontSize: 12, color: THEME.textFaint, fontWeight: 900, marginBottom: 6 }}>
                        Tab Files
                      </div>
                      {!selectedLibrarySong ? (
                        <div style={{ fontSize: 12, color: THEME.textFaint, padding: "4px 2px" }}>
                          Select a song folder to view contained tabs.
                        </div>
                      ) : selectedLibraryTabs.length === 0 ? (
                        <div style={{ fontSize: 12, color: THEME.textFaint, padding: "4px 2px" }}>No tabs in this song yet</div>
                      ) : (
                        <div style={{ display: "grid", gap: 6 }}>
                          {selectedLibraryTabs.map((tab) => (
                            <div
                              key={tab.id}
                              style={{
                                ...card,
                                borderRadius: 10,
                                padding: "7px 9px",
                                background: THEME.surfaceWarm,
                                boxShadow: "none",
                                borderColor: THEME.border,
                              }}
                            >
                              <div style={{ fontWeight: 800, fontSize: 12, color: THEME.text }}>• {tab.name}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: THEME.textFaint,
                    lineHeight: 1.5,
                    fontWeight: 700,
                  }}
                >
                  Future behavior: finished tabs will be saved here as structured JSON, grouped by band, album, and
                  song folder, then stored either locally or in a backend service.
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setProjectsLibraryOpen(false)} style={{ ...btnSecondary }}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit chord modal */}
          {editChordModalOpen && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 5000,
              }}
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) closeEditChordModal();
              }}
            >
              <div
                style={{
                  width: 420,
                  maxWidth: "90vw",
                  borderRadius: 18,
                  background: THEME.surfaceWarm,
                  border: `1px solid ${THEME.border}`,
                  boxShadow: "0 24px 70px rgba(0,0,0,0.32)",
                  padding: 16,
                  boxSizing: "border-box",
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 950, fontSize: 16 }}>Edit {editChordNameHeader || "chord"}</div>
                    <div style={{ fontSize: 12, color: THEME.textFaint, marginTop: 2 }}>Standard tuning only.</div>
                  </div>
                  <button
                    type="button"
                    onClick={closeEditChordModal}
                    style={{ ...btnSmallPillClose }}
                  >
                    ×
                  </button>
                </div>

                <div
                  style={{
                    marginTop: 8,
                    padding: 10,
                    borderRadius: 14,
                    border: `1px solid ${THEME.border}`,
                    background: THEME.surfaceWarm,
                    display: "grid",
                    gap: 6,
                  }}
                >
                  {editChordLabelStrings.map((label, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          ...pillMono,
                          fontSize: 13,
                          textAlign: "right",
                          color: THEME.textFaint,
                          width: 24,
                        }}
                      >
                        {label.toUpperCase()}
                      </div>
                      <input
                        value={editChordFrets[idx] ?? ""}
                        onChange={(e) => {
                          const v = e.target.value.trim();
                          setEditChordFrets((prev) => {
                            const next = prev.slice();
                            next[idx] = v;
                            return next;
                          });
                        }}
                        placeholder="- / 0–24 / x"
                        style={{
                          width: cellSize,
                          height: cellSize,
                          borderRadius: 12,
                          border: `1px solid ${THEME.border}`,
                          textAlign: "center",
                          ...pillMono,
                          background: THEME.surfaceWarm,
                          color: THEME.text,
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  ))}
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
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={handleSaveEditedChord}
                      {...pressHandlers("editChordSave")}
                      style={{
                        ...btnSecondary,
                        ...pressVisual(pressedBtnId === "editChordSave"),
                        height: 38,
                        padding: "0 12px",
                      }}
                    >
                      Save Changes
                    </button>
                    {editChordIsPreset && (
                      <button
                        type="button"
                        onClick={handleResetEditedChordToDefault}
                        style={{
                          ...btnSecondary,
                          height: 38,
                          padding: "0 12px",
                        }}
                        title="Reset this preset back to the original shape"
                      >
                        Reset to default
                      </button>
                    )}
                  </div>

                  <div style={{ fontSize: 11, color: THEME.textFaint }}>
                    Tip: use <b>x</b> for muted strings and leave blank for no change.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom tuning modal */}
          {customOpen && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 5000,
              }}
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) {
                  setCustomOpen(false);
                  setTuningOpen(true);
                  focusKeyCapture();
                }
              }}
            >
              <div
                style={{
                  width: 420,
                  maxWidth: "90vw",
                  borderRadius: 18,
                  background: THEME.surfaceWarm,
                  border: `1px solid ${THEME.border}`,
                  boxShadow: "0 24px 70px rgba(0,0,0,0.32)",
                  padding: 16,
                  boxSizing: "border-box",
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 950, fontSize: 16 }}>Add custom tuning</div>
                    <div style={{ fontSize: 12, color: THEME.textFaint, marginTop: 2 }}>
                      Top box = high string (e). Bottom box = low string (E).
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomOpen(false);
                      setTuningOpen(true);
                      focusKeyCapture();
                    }}
                    style={{ ...btnSmallPillClose }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
                  <input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Tuning name (e.g. My Drop C)"
                    style={{ ...field, height: 40 }}
                  />

                  <div
                    style={{
                      marginTop: 4,
                      padding: 10,
                      borderRadius: 14,
                      border: `1px solid ${THEME.border}`,
                      background: THEME.surfaceWarm,
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    {customAppNotes.map((note, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            color: THEME.textFaint,
                            width: 60,
                            textAlign: "right",
                            fontWeight: 900,
                          }}
                        >
                          String {DEFAULT_TUNING.length - idx}
                        </div>
                        <input
                          value={note}
                          onChange={(e) => setCustomAppNote(idx, e.target.value)}
                          placeholder={DEFAULT_TUNING[idx].toUpperCase()}
                          style={{
                            width: cellSize,
                            height: cellSize,
                            borderRadius: 12,
                            border: `1px solid ${THEME.border}`,
                            textAlign: "center",
                            ...pillMono,
                            background: THEME.surfaceWarm,
                            color: THEME.text,
                            boxSizing: "border-box",
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
                      onClick={saveCustomTuning}
                      {...pressHandlers("saveTuning")}
                      style={{
                        ...btnSecondary,
                        ...pressVisual(pressedBtnId === "saveTuning"),
                        height: 38,
                        padding: "0 12px",
                      }}
                    >
                      Save Tuning
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomOpen(false);
                        setTuningOpen(true);
                        focusKeyCapture();
                      }}
                      style={{ ...btnSecondary, height: 38, padding: "0 12px" }}
                    >
                      Cancel
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: THEME.textFaint }}>
                    Saved custom tunings only affect your own TabStudio account.
                  </div>
                </div>
              </div>
            </div>
          )}

          {isTabbyGameActive && (
            <TabbyGameOverlay
              highScore={tabbyHighScore}
              onHighScore={setTabbyHighScore}
              onClose={() => setIsTabbyGameActive(false)}
              rowCount={tuning.length}
              colCount={cols}
              anchorRef={tabbyGridRef}
              hudTopRef={completedRowsToggleRef}
              tabbyBubbleMessage={tabbyBubbleMessage}
              onTabbyMascotClick={handleTabbyShyEasterClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}
