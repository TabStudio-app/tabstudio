/* Archived Fun Mode features for future TabStudio versions. Not used in V1. */

// NOTE: This file preserves the original V1 Fun Mode code snippets from App.jsx for future reuse.
// Snippets are archived verbatim by section with source line ranges from the pre-refactor App.jsx.

export const FUN_MODE_ARCHIVE = String.raw`
===== IMPORTS + STORAGE KEYS (App.jsx:1-45 excerpt) =====
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
const LS_SETTINGS_FULLSCREEN_KEY = "tabstudio_settings_fullscreen_v1";
const LS_LIBRARY_V1_KEY = "tabstudio_library_v1";
const LS_V1_CHECKLIST_STATE_KEY = "tabstudio_v1_checklist_state";

===== CHECKLIST FUN MODE ENTRIES (App.jsx:70-175 excerpt) =====
const NO_ALBUM_NAME = "No Album";
const DEFAULT_SLOGAN_OFFSET_X = -4;
const SLOGAN_INTRO_OFFSET_DELTA = 16;
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

===== TABBY KEYFRAMES (App.jsx:2218-2240 excerpt) =====
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

===== RICKROLL / TABBY / PARTY FUNCTIONS (App.jsx:3412-3518 excerpt) =====
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

===== FUN STATE + REFS (App.jsx:4419-4492 excerpt) =====
  const [funModeOpen, setFunModeOpen] = useState(false);
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [accountProfileOpen, setAccountProfileOpen] = useState(false);
  const [projectsLibraryOpen, setProjectsLibraryOpen] = useState(false);
  const [uiDialog, setUiDialog] = useState(null);
  const [saveSoonNotice, setSaveSoonNotice] = useState("");
  const [tabsMilestonesTriggered, setTabsMilestonesTriggered] = useState(() => readMilestonesTriggered());
  const [milestoneConfetti, setMilestoneConfetti] = useState(null);
  const [milestoneToast, setMilestoneToast] = useState("");
  const [partyGridTints, setPartyGridTints] = useState({});
  const [firstExportGlowActive, setFirstExportGlowActive] = useState(false);
  const [libraryData, setLibraryData] = useState(() => readLibraryData());
  const [selectedLibraryArtistKey, setSelectedLibraryArtistKey] = useState("");
  const [selectedLibraryAlbumName, setSelectedLibraryAlbumName] = useState("");
  const [selectedLibrarySongName, setSelectedLibrarySongName] = useState("");
  const [libraryAlbumCreateOpen, setLibraryAlbumCreateOpen] = useState(false);
  const [libraryNewAlbumDraft, setLibraryNewAlbumDraft] = useState("");
  const [librarySongCreateOpen, setLibrarySongCreateOpen] = useState(false);
  const [libraryNewSongDraft, setLibraryNewSongDraft] = useState("");
  const [artistCreateOpen, setArtistCreateOpen] = useState(false);
  const [newArtistDraft, setNewArtistDraft] = useState("");
  const [artistMenuOpen, setArtistMenuOpen] = useState(false);
  const [albumCreateOpen, setAlbumCreateOpen] = useState(false);
  const [newAlbumDraft, setNewAlbumDraft] = useState("");
  const [albumMenuOpen, setAlbumMenuOpen] = useState(false);
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

===== FUN EFFECTS (App.jsx:4790-4940 excerpt) =====
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
      localStorage.setItem(LS_LIBRARY_V1_KEY, JSON.stringify(normalizeLibraryData(libraryData)));
    } catch {}
  }, [libraryData]);

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
      localStorage.setItem(LS_SETTINGS_FULLSCREEN_KEY, settingsFullscreen ? "true" : "false");
    } catch {}
  }, [settingsFullscreen]);
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
      const active = document.activeElement;
      if (isTextEntryElement(e.target) || isTextEntryElement(active)) return;
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


===== TABBY GAME OVERLAY (App.jsx:6856-7468 excerpt) =====
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

===== FUN MODE SETTINGS PANEL UI (App.jsx:8815-9012 excerpt) =====
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

===== GRID/PARTY + TABBY OVERLAY RENDER REFERENCES (App.jsx:11425-11590,14731-14741 excerpt) =====
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
                            data-grid-cell="true"
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
`;
