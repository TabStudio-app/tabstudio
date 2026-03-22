import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppHeader from "../components/AppHeader";
import heroDark from "../assets/tabstudio-hero-dark.png";
import heroLight from "../assets/tabstudio-hero-light.png";
import { MEMBERSHIP_COMPARISON_ROWS, MEMBERSHIP_PLANS } from "../features/pricing";
import {
  featureListDescription,
  featureListIconBadge,
  featureListItem,
  featureListTitle,
} from "../utils/uiTokens";

export default function MembershipPage({ onBack, onGoSettings, onSelectPlan, shared }) {
  const {
    ACCENT_PRESETS,
    currentPlanId,
    DARK_THEME,
    hasActiveMembership,
    isAuthenticated,
    LIGHT_THEME,
    LS_ACCENT_COLOR_KEY,
    LS_MEMBERSHIP_PRICING_GUIDE_SEEN_KEY,
    LS_MEMBERSHIP_SCROLL_TO_PLANS_KEY,
    LS_SELECTED_BILLING_CYCLE_KEY,
    LS_THEME_MODE_KEY,
    TABBY_ASSIST_MINT,
    TABBY_ASSIST_MINT_STRONG,
    normalizeBillingCycle,
    siteHeaderBarStyle,
    siteHeaderEditorLinkStyle,
    siteHeaderLeftGroupStyle,
    siteHeaderLogoButtonStyle,
    siteHeaderLogoImageStyle,
    siteHeaderRightGroupStyle,
    siteHeaderSecondaryButtonStyle,
    siteHeaderSloganStyle,
    withAlpha,
  } = shared;
  const planRank = useMemo(() => ({ solo: 1, band: 2, creator: 3 }), []);
  const [themeRefresh, setThemeRefresh] = useState(0);
  const [billingCycle, setBillingCycle] = useState(() => {
    if (typeof window === "undefined") return "monthly";
    try {
      return normalizeBillingCycle(window.localStorage.getItem(LS_SELECTED_BILLING_CYCLE_KEY));
    } catch {
      return "monthly";
    }
  });
  const [hoveredPlan, setHoveredPlan] = useState("");
  const [hoveredPlanButton, setHoveredPlanButton] = useState("");
  const membershipScrollRef = useRef(null);
  const membershipPricingSectionRef = useRef(null);
  const membershipFeatureSpotlightRef = useRef(null);
  const membershipFeatureListRef = useRef(null);
  const membershipFeatureListScrollAnimRef = useRef(null);
  const membershipSpotlightContentRef = useRef(null);
  const membershipSpotlightSwapTimerRef = useRef(null);
  const membershipAutoScrollTimerRef = useRef(null);
  const membershipHasInteractedRef = useRef(false);
  const [membershipFeatureNarrow, setMembershipFeatureNarrow] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 1180 : false
  );
  const [displayedMembershipFeatureId, setDisplayedMembershipFeatureId] = useState("organized");
  const [hoveredMembershipFeatureId, setHoveredMembershipFeatureId] = useState("");
  const [focusedMembershipFeatureId, setFocusedMembershipFeatureId] = useState("");
  const [membershipSpotlightHovered, setMembershipSpotlightHovered] = useState(false);
  const [membershipSpotlightVisible, setMembershipSpotlightVisible] = useState(true);
  const [membershipSpotlightArrowFloatUp, setMembershipSpotlightArrowFloatUp] = useState(false);
  const [membershipFeatureListScrollBtnHover, setMembershipFeatureListScrollBtnHover] = useState(false);
  const [membershipFeatureListHasMoreBelow, setMembershipFeatureListHasMoreBelow] = useState(false);
  const [membershipFeatureListScrollTop, setMembershipFeatureListScrollTop] = useState(0);
  const [membershipSpotlightHasMoreBelow, setMembershipSpotlightHasMoreBelow] = useState(false);
  const [membershipSpotlightScrollTop, setMembershipSpotlightScrollTop] = useState(0);
  const [hoveredMembershipPanel, setHoveredMembershipPanel] = useState("");
  const [hoveredComparisonRowLabel, setHoveredComparisonRowLabel] = useState("");
  const [membershipHeaderHoverBtn, setMembershipHeaderHoverBtn] = useState("");
  const [membershipHeaderPressedBtn, setMembershipHeaderPressedBtn] = useState("");
  const [membershipScrollCueFloatUp, setMembershipScrollCueFloatUp] = useState(false);
  const [membershipScrollCueHover, setMembershipScrollCueHover] = useState(false);
  const onScrollToPricing = useCallback((behavior = "smooth") => {
    const scroller = membershipScrollRef.current;
    const pricingSection = membershipPricingSectionRef.current;
    if (!scroller || !pricingSection) return;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const resolvedBehavior = prefersReducedMotion ? "auto" : behavior;
    const offsetTop = 12;
    const scrollerRect = scroller.getBoundingClientRect();
    const pricingRect = pricingSection.getBoundingClientRect();
    const fallbackTop = Math.max(0, scroller.scrollTop + (pricingRect.top - scrollerRect.top) - offsetTop);
    const targetTop = Math.max(0, (Number(pricingSection.offsetTop) || fallbackTop) - offsetTop);
    scroller.scrollTo({ top: targetTop, behavior: resolvedBehavior });
  }, []);

  const getSystemThemeForMembership = useCallback(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }, []);
  const isMembershipDarkMode = useMemo(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = window.localStorage.getItem(LS_THEME_MODE_KEY);
      if (stored === "dark") return true;
      if (stored === "light") return false;
    } catch {}
    return getSystemThemeForMembership() === "dark";
  }, [getSystemThemeForMembership, themeRefresh]);
  const membershipAccentId = useMemo(() => {
    const fallback = isMembershipDarkMode ? "white" : "black";
    if (typeof window === "undefined") return fallback;
    try {
      const stored = window.localStorage.getItem(LS_ACCENT_COLOR_KEY);
      if (ACCENT_PRESETS.some((p) => p.id === stored)) {
        if (isMembershipDarkMode && stored === "black") return fallback;
        if (!isMembershipDarkMode && stored === "white") return fallback;
        return stored;
      }
    } catch {}
    return fallback;
  }, [isMembershipDarkMode, themeRefresh]);
  const membershipAccent = useMemo(
    () => (ACCENT_PRESETS.find((preset) => preset.id === membershipAccentId) || ACCENT_PRESETS[0]).hex,
    [membershipAccentId]
  );
  const MEMBERSHIP_THEME = useMemo(() => {
    const base = isMembershipDarkMode ? DARK_THEME : LIGHT_THEME;
    return {
      ...base,
      accent: membershipAccent,
    };
  }, [isMembershipDarkMode, membershipAccent]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onStorage = (e) => {
      if (!e?.key || e.key === LS_THEME_MODE_KEY || e.key === LS_ACCENT_COLOR_KEY) {
        setThemeRefresh((v) => v + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    let mq;
    const onSystemThemeChange = () => setThemeRefresh((v) => v + 1);
    if (typeof window.matchMedia === "function") {
      mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (typeof mq.addEventListener === "function") mq.addEventListener("change", onSystemThemeChange);
      else if (typeof mq.addListener === "function") mq.addListener(onSystemThemeChange);
    }
    return () => {
      window.removeEventListener("storage", onStorage);
      if (mq) {
        if (typeof mq.removeEventListener === "function") mq.removeEventListener("change", onSystemThemeChange);
        else if (typeof mq.removeListener === "function") mq.removeListener(onSystemThemeChange);
      }
    };
  }, []);

  useEffect(() => {
    const onResize = () => setMembershipFeatureNarrow(window.innerWidth <= 1180);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const prefersReducedMotion =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return undefined;
    const id = window.setInterval(() => setMembershipScrollCueFloatUp((v) => !v), 800);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    const scroller = membershipScrollRef.current;
    if (!scroller) return undefined;
    const markInteracted = () => {
      membershipHasInteractedRef.current = true;
    };
    const onScroll = () => {
      if (scroller.scrollTop > 8) markInteracted();
    };
    scroller.addEventListener("wheel", markInteracted, { passive: true });
    scroller.addEventListener("touchstart", markInteracted, { passive: true });
    scroller.addEventListener("pointerdown", markInteracted, { passive: true });
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", markInteracted, true);
    return () => {
      scroller.removeEventListener("wheel", markInteracted);
      scroller.removeEventListener("touchstart", markInteracted);
      scroller.removeEventListener("pointerdown", markInteracted);
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", markInteracted, true);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const scroller = membershipScrollRef.current;
    const pricingSection = membershipPricingSectionRef.current;
    if (!scroller || !pricingSection) return undefined;
    const prefersReducedMotion =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let shouldGuide = true;
    try {
      shouldGuide = window.localStorage.getItem(LS_MEMBERSHIP_PRICING_GUIDE_SEEN_KEY) !== "true";
    } catch {}
    if (!shouldGuide) return undefined;
    if (prefersReducedMotion) {
      try {
        window.localStorage.setItem(LS_MEMBERSHIP_PRICING_GUIDE_SEEN_KEY, "true");
      } catch {}
      return undefined;
    }
    try {
      window.localStorage.setItem(LS_MEMBERSHIP_PRICING_GUIDE_SEEN_KEY, "true");
    } catch {}
    membershipAutoScrollTimerRef.current = window.setTimeout(() => {
      if (membershipHasInteractedRef.current) return;
      const scrollerRect = scroller.getBoundingClientRect();
      const pricingRect = pricingSection.getBoundingClientRect();
      const centerOffset = Math.max(12, (scroller.clientHeight - pricingRect.height) / 2);
      const targetTop = Math.max(0, scroller.scrollTop + (pricingRect.top - scrollerRect.top) - centerOffset);
      scroller.scrollTo({ top: targetTop, behavior: "smooth" });
    }, 1400);
    return () => {
      if (membershipAutoScrollTimerRef.current) {
        window.clearTimeout(membershipAutoScrollTimerRef.current);
        membershipAutoScrollTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (membershipSpotlightSwapTimerRef.current) window.clearTimeout(membershipSpotlightSwapTimerRef.current);
      if (membershipAutoScrollTimerRef.current) window.clearTimeout(membershipAutoScrollTimerRef.current);
    };
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    let shouldJumpToPlans = false;
    try {
      shouldJumpToPlans = window.sessionStorage.getItem(LS_MEMBERSHIP_SCROLL_TO_PLANS_KEY) === "true";
      if (shouldJumpToPlans) window.sessionStorage.removeItem(LS_MEMBERSHIP_SCROLL_TO_PLANS_KEY);
    } catch {}
    if (!shouldJumpToPlans) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        onScrollToPricing("smooth");
      });
    });
  }, [onScrollToPricing]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LS_SELECTED_BILLING_CYCLE_KEY, normalizeBillingCycle(billingCycle));
    } catch {}
  }, [billingCycle]);

  const cycleBtnStyle = (isActive) => ({
    minHeight: 40,
    borderRadius: 999,
    border: `1px solid ${isActive ? "transparent" : MEMBERSHIP_THEME.border}`,
    background: isActive ? TABBY_ASSIST_MINT : withAlpha(MEMBERSHIP_THEME.text, isMembershipDarkMode ? 0.04 : 0.03),
    boxShadow: isActive ? `0 6px 14px ${withAlpha(TABBY_ASSIST_MINT, isMembershipDarkMode ? 0.26 : 0.2)}` : "none",
    color: isActive ? "#FFFFFF" : MEMBERSHIP_THEME.textFaint,
    padding: "0 20px",
    fontSize: 15,
    fontWeight: 900,
    cursor: "pointer",
    transition: "background 180ms ease, color 180ms ease, box-shadow 180ms ease",
  });

  const plans = MEMBERSHIP_PLANS;
  const comparisonRows = MEMBERSHIP_COMPARISON_ROWS;
  const membershipKeyFeatures = [
    {
      id: "organized",
      icon: "📂",
      title: "Keep Your Songs Organised",
      spotlightLead: "Keep songs, riffs, and drafts easy to find so writing stays focused.",
      body:
        "Manage multiple songs and riff ideas in one place without losing track of your work.\n\nTabStudio keeps your tabs organised so you can focus on writing.\n\nIt is easier to build ideas into finished songs when everything stays structured and easy to revisit.",
      spotlightVisualTitle: "Artist → Album → Song Organisation",
    },
    {
      id: "fast",
      icon: "⚡",
      title: "Write Tabs Instantly",
      spotlightLead: "Capture ideas while they are fresh, without fighting the interface.",
      body:
        "Capture riffs and song ideas quickly with a clean tab editor built specifically for guitar. No clutter. No complicated music software.\n\nTabStudio focuses on speed and clarity. The grid responds instantly to keyboard input so you can write ideas the moment they appear, without breaking your creative flow.\n\nWhether you're writing a quick riff, practising a section, or mapping out a full song, the editor keeps the process simple and distraction-free.",
      spotlightVisualTitle: "Fast Guitar Tab Grid",
    },
    {
      id: "creator-export",
      icon: "🎥",
      title: "Tabs for Content Creators",
      spotlightLead: "Create lesson-ready visuals that stay clear on screen and easy to follow.",
      body:
        "Create lesson-ready tab visuals that are easy to place over videos and social clips.\n\nTabStudio helps you produce clean, readable tab graphics so viewers can follow what you play without visual clutter.\n\nIt is a practical workflow for guitar teachers, YouTubers, and creators who need tab content that looks polished and clear on screen.",
      spotlightVisualTitle: "PNG Export for Creator Overlays",
    },
    {
      id: "techniques",
      icon: "🎸",
      title: "Built-In Guitar Techniques",
      spotlightLead: "Keep phrasing, articulation, and playing detail readable inside the tab itself.",
      body:
        "Insert slides, bends, and other guitar techniques directly into your tabs with clear notation.\n\nTechnique markings stay readable inside the grid, so anyone opening the tab can understand the phrasing and articulation immediately.\n\nThis keeps your tabs accurate for practice, rehearsals, and sharing with other players.",
      spotlightVisualTitle: "Technique Notation Tools",
    },
    {
      id: "export-pdf",
      icon: "📄",
      title: "Export Clean Tab Sheets",
      spotlightLead: "Move from rough idea to a shareable tab sheet without reformatting your work.",
      body:
        "Turn finished tabs into clean sheets that are easy to review and use in real sessions.\n\nThe output is designed to stay legible when printed or shared, so your parts remain clear for rehearsals and collaboration.\n\nIt is a reliable way to move from writing to practical use without reformatting your work.",
      spotlightVisualTitle: "Printable PDF Export",
    },
    {
      id: "autosave",
      icon: "💾",
      title: "Never Lose Your Ideas",
      spotlightLead: "Write with confidence knowing progress is protected as you go.",
      body:
        "TabStudio automatically saves your work while you write, so ideas are protected as you go.\n\nYou can experiment freely without worrying about losing progress when switching tasks or taking a break.\n\nThat makes it easier to keep momentum when capturing riffs, edits, and song drafts.",
      spotlightVisualTitle: "Auto-Save Protection",
    },
    {
      id: "guitarists",
      icon: "🎯",
      title: "Designed by a Guitarist",
      spotlightLead: "Built around real tab-writing habits instead of generic music software workflows.",
      body:
        "TabStudio was built from a guitarist-first perspective, with practical writing flow as the priority.\n\nThe interface avoids unnecessary complexity so you can focus on your ideas instead of navigating heavy music software.\n\nNo deep setup or theory overhead is required to start writing and organizing useful tabs.",
      spotlightVisualTitle: "Built with Guitar Workflow in Mind",
    },
    {
      id: "themes",
      icon: "🎨",
      title: "Customise Your Workspace",
      spotlightLead: "Make the editor feel comfortable enough for longer writing sessions.",
      body:
        "Adjust the workspace to match how you like to write, whether you prefer a darker or lighter visual setup.\n\nTheme and color options help reduce visual fatigue and keep the editor comfortable during longer sessions.\n\nA familiar-looking workspace makes it easier to stay focused on the tab itself.",
      spotlightVisualTitle: "Dark / Light + Accent Themes",
    },
    {
      id: "listening",
      icon: "💬",
      title: "We're Listening",
      spotlightLead: "Feedback helps shape what gets improved next and keeps the product practical.",
      body:
        "Your feedback directly shapes what gets improved and shipped next in TabStudio.\n\nWorkflow pain points and feature ideas help prioritize updates that make writing and organizing tabs easier.\n\nThe product evolves around real use, not generic feature bloat.",
      spotlightVisualTitle: "Community-Led Improvements",
    },
  ];
  const selectedMembershipSpotlightFeature = useMemo(
    () => membershipKeyFeatures.find((feature) => feature.id === displayedMembershipFeatureId) || membershipKeyFeatures[0] || null,
    [membershipKeyFeatures, displayedMembershipFeatureId]
  );
  const membershipSpotlightData = useMemo(() => {
    if (!selectedMembershipSpotlightFeature) return null;
    const descriptionLines = selectedMembershipSpotlightFeature.body
      .split(/\n\s*\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3);
    return {
      icon: selectedMembershipSpotlightFeature.icon,
      title: selectedMembershipSpotlightFeature.title,
      lead: selectedMembershipSpotlightFeature.spotlightLead || "",
      descriptionLines: descriptionLines.length
        ? descriptionLines
        : [selectedMembershipSpotlightFeature.body.replace(/\n\n/g, " ").trim()],
      visualTitle:
        selectedMembershipSpotlightFeature.spotlightVisualTitle || selectedMembershipSpotlightFeature.title,
    };
  }, [selectedMembershipSpotlightFeature]);
  useEffect(() => {
    const id = window.setInterval(() => {
      setMembershipSpotlightArrowFloatUp((v) => !v);
    }, 2600);
    return () => window.clearInterval(id);
  }, []);

  useEffect(
    () => () => {
      if (membershipFeatureListScrollAnimRef.current != null) {
        window.cancelAnimationFrame(membershipFeatureListScrollAnimRef.current);
        membershipFeatureListScrollAnimRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    const el = membershipFeatureListRef.current;
    if (!el || membershipFeatureNarrow) {
      setMembershipFeatureListHasMoreBelow(false);
      setMembershipFeatureListScrollTop(0);
      return undefined;
    }
    const updateFeatureListScrollState = () => {
      const maxScrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
      setMembershipFeatureListHasMoreBelow(maxScrollTop - el.scrollTop > 8);
      setMembershipFeatureListScrollTop(el.scrollTop);
    };
    updateFeatureListScrollState();
    const onScroll = () => updateFeatureListScrollState();
    el.addEventListener("scroll", onScroll, { passive: true });
    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => updateFeatureListScrollState());
      resizeObserver.observe(el);
    }
    window.addEventListener("resize", updateFeatureListScrollState);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateFeatureListScrollState);
      resizeObserver?.disconnect?.();
    };
  }, [membershipFeatureNarrow, displayedMembershipFeatureId]);

  const scrollMembershipFeatureListToBottom = useCallback(() => {
    const el = membershipFeatureListRef.current;
    if (!el) return;
    const from = el.scrollTop;
    const to = Math.max(0, el.scrollHeight - el.clientHeight);
    if (Math.abs(to - from) < 2) return;
    if (membershipFeatureListScrollAnimRef.current != null) {
      window.cancelAnimationFrame(membershipFeatureListScrollAnimRef.current);
      membershipFeatureListScrollAnimRef.current = null;
    }
    const duration = 1080;
    const start = performance.now();
    const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      el.scrollTop = from + (to - from) * easeInOutCubic(progress);
      if (progress < 1) {
        membershipFeatureListScrollAnimRef.current = window.requestAnimationFrame(step);
      } else {
        membershipFeatureListScrollAnimRef.current = null;
      }
    };
    membershipFeatureListScrollAnimRef.current = window.requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    const el = membershipSpotlightContentRef.current;
    if (!el || membershipFeatureNarrow) {
      setMembershipSpotlightHasMoreBelow(false);
      setMembershipSpotlightScrollTop(0);
      return undefined;
    }
    const updateSpotlightScrollState = () => {
      const maxScrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
      setMembershipSpotlightHasMoreBelow(maxScrollTop - el.scrollTop > 8);
      setMembershipSpotlightScrollTop(el.scrollTop);
    };
    updateSpotlightScrollState();
    const onScroll = () => updateSpotlightScrollState();
    el.addEventListener("scroll", onScroll, { passive: true });
    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => updateSpotlightScrollState());
      resizeObserver.observe(el);
    }
    window.addEventListener("resize", updateSpotlightScrollState);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateSpotlightScrollState);
      resizeObserver?.disconnect?.();
    };
  }, [membershipFeatureNarrow, displayedMembershipFeatureId, membershipSpotlightVisible]);
  const onSelectMembershipFeatureCard = (feature) => {
    if (!feature?.id) return;
    if (displayedMembershipFeatureId === feature.id && membershipSpotlightVisible) return;
    setMembershipSpotlightVisible(false);
    if (membershipSpotlightSwapTimerRef.current) window.clearTimeout(membershipSpotlightSwapTimerRef.current);
    membershipSpotlightSwapTimerRef.current = window.setTimeout(() => {
      setDisplayedMembershipFeatureId(feature.id);
      setMembershipSpotlightVisible(true);
      membershipSpotlightSwapTimerRef.current = null;
    }, 170);
  };
  const headerRightContent = (
    <>
      <button
        type="button"
        onClick={onBack}
        onMouseEnter={() => setMembershipHeaderHoverBtn("editor")}
        onMouseLeave={() => setMembershipHeaderHoverBtn((prev) => (prev === "editor" ? "" : prev))}
        onFocus={() => setMembershipHeaderHoverBtn("editor")}
        onBlur={() => setMembershipHeaderHoverBtn((prev) => (prev === "editor" ? "" : prev))}
        onPointerDown={() => setMembershipHeaderPressedBtn("editor")}
        onPointerUp={() => setMembershipHeaderPressedBtn("")}
        onPointerCancel={() => setMembershipHeaderPressedBtn("")}
        style={siteHeaderEditorLinkStyle(MEMBERSHIP_THEME, { hovered: membershipHeaderHoverBtn === "editor" })}
      >
        Editor
      </button>
      <button
        type="button"
        onClick={onGoSettings}
        onMouseEnter={() => setMembershipHeaderHoverBtn("settings")}
        onMouseLeave={() => setMembershipHeaderHoverBtn((prev) => (prev === "settings" ? "" : prev))}
        onFocus={() => setMembershipHeaderHoverBtn("settings")}
        onBlur={() => setMembershipHeaderHoverBtn((prev) => (prev === "settings" ? "" : prev))}
        onPointerDown={() => setMembershipHeaderPressedBtn("settings")}
        onPointerUp={() => setMembershipHeaderPressedBtn("")}
        onPointerCancel={() => setMembershipHeaderPressedBtn("")}
        style={{
          ...siteHeaderSecondaryButtonStyle(MEMBERSHIP_THEME, {
            hovered: membershipHeaderHoverBtn === "settings",
            pressed: membershipHeaderPressedBtn === "settings",
            iconOnly: true,
          }),
          fontSize: 20,
        }}
        aria-label="Settings"
      >
        ⛭
      </button>
    </>
  );
  return (
    <div
      style={{
        height: "100dvh",
        minHeight: "100dvh",
        background: MEMBERSHIP_THEME.bg,
        color: MEMBERSHIP_THEME.text,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr)",
        overflow: "hidden",
      }}
    >
      <AppHeader
        shared={{
          isDark: isMembershipDarkMode,
          logoAriaLabel: "Go to tab writer",
          onLogoClick: onBack,
          rightContent: headerRightContent,
          showRightGroup: true,
          siteHeaderBarStyle,
          siteHeaderLeftGroupStyle,
          siteHeaderLogoButtonStyle,
          siteHeaderLogoImageStyle,
          siteHeaderRightGroupStyle,
          siteHeaderSloganStyle,
          theme: MEMBERSHIP_THEME,
        }}
      />

      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: 0,
          display: "grid",
          placeItems: "center",
          padding: 16,
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div
          ref={membershipScrollRef}
          style={{
            width: "calc(100vw - 32px)",
            maxWidth: 1680,
            borderRadius: 16,
            border: `1px solid ${MEMBERSHIP_THEME.border}`,
            background: MEMBERSHIP_THEME.surfaceWarm,
            padding: 24,
            display: "grid",
            gap: 20,
            boxSizing: "border-box",
            minHeight: 0,
            maxHeight: "100%",
            overflowY: "auto",
          }}
        >
          <section
            style={{
              borderRadius: 16,
              border: `1px solid ${MEMBERSHIP_THEME.border}`,
              background: MEMBERSHIP_THEME.surfaceWarm,
              padding: 22,
              display: "grid",
              gap: 18,
            }}
          >
            <div style={{ display: "grid", justifyItems: "center", textAlign: "center", gap: 12 }}>
              <h1
                style={{
                  margin: 0,
                  maxWidth: 920,
                  textAlign: "center",
                  fontSize: "clamp(38px, 4.6vw, 56px)",
                  fontWeight: 800,
                  lineHeight: 1.08,
                  letterSpacing: "-0.03em",
                }}
              >
                Write better guitar tabs.
              </h1>
              <div
                style={{
                  color: MEMBERSHIP_THEME.textFaint,
                  fontSize: "clamp(16px, 1.95vw, 21px)",
                  lineHeight: 1.38,
                  opacity: 0.86,
                  maxWidth: 700,
                  textAlign: "center",
                }}
              >
                Create, organise, and manage your tabs with TabStudio.
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 8,
                  width: "min(760px, 100%)",
                  marginTop: 2,
                }}
              >
                {[
                  "Write tabs quickly",
                  "Keep your songs organised",
                  "Start simple, upgrade anytime",
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      minHeight: 30,
                      borderRadius: 999,
                      border: `1px solid ${MEMBERSHIP_THEME.border}`,
                      background: withAlpha(MEMBERSHIP_THEME.text, isMembershipDarkMode ? 0.05 : 0.035),
                      color: MEMBERSHIP_THEME.textFaint,
                      fontSize: 13,
                      fontWeight: 700,
                      lineHeight: 1.2,
                      padding: "0 10px",
                      textAlign: "center",
                    }}
                  >
                    <span aria-hidden="true" style={{ color: TABBY_ASSIST_MINT, fontSize: 12 }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", justifyItems: "center", marginTop: 14, marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={() => onScrollToPricing("smooth")}
                  onMouseEnter={() => setMembershipScrollCueHover(true)}
                  onMouseLeave={() => setMembershipScrollCueHover(false)}
                  onFocus={() => setMembershipScrollCueHover(true)}
                  onBlur={() => setMembershipScrollCueHover(false)}
                  aria-label="View plans"
                  style={{
                    height: 40,
                    padding: "0 22px",
                    borderRadius: 12,
                    border: "none",
                    background: membershipScrollCueHover ? TABBY_ASSIST_MINT_STRONG : TABBY_ASSIST_MINT,
                    color: "#04120a",
                    fontSize: 16,
                    fontWeight: 600,
                    lineHeight: 1,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 180ms ease",
                    boxShadow: membershipScrollCueHover ? `0 10px 20px ${withAlpha(TABBY_ASSIST_MINT, 0.24)}` : "none",
                    transform: membershipScrollCueHover ? "translateY(-1px)" : "translateY(0)",
                    gap: 8,
                  }}
                >
                  <span>View plans</span>
                  <span
                    aria-hidden="true"
                    style={{
                      display: "inline-flex",
                      transform: `translateY(${membershipScrollCueFloatUp ? 2 : -1}px)`,
                      transition: "transform 800ms ease-in-out",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ display: "block" }}>
                      <path
                        d="M6 9.5 12 15.5 18 9.5"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
              </div>

              <div
                style={{
                  width: "min(1120px, 100%)",
                  justifySelf: "center",
                  marginTop: 4,
                  display: "grid",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    marginTop: 4,
                    marginBottom: 2,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{ width: 72, height: 1, background: withAlpha("#FFFFFF", 0.08) }}
                  />
                  <span
                    style={{
                      textAlign: "center",
                      color: withAlpha("#FFFFFF", 0.9),
                      fontSize: 12,
                      fontWeight: 900,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Inside TabStudio
                  </span>
                  <span
                    aria-hidden="true"
                    style={{ width: 72, height: 1, background: withAlpha("#FFFFFF", 0.08) }}
                  />
                </div>
                <div
                  style={{
                    borderRadius: 14,
                    border: `1px solid ${withAlpha("#FFFFFF", 0.08)}`,
                    background: withAlpha(MEMBERSHIP_THEME.text, isMembershipDarkMode ? 0.03 : 0.018),
                    boxShadow: `0 25px 60px ${withAlpha("#000000", isMembershipDarkMode ? 0.6 : 0.32)}`,
                    overflow: "hidden",
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      height: 24,
                      borderBottom: `1px solid ${MEMBERSHIP_THEME.border}`,
                      background: withAlpha(MEMBERSHIP_THEME.text, isMembershipDarkMode ? 0.06 : 0.04),
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "0 10px",
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: withAlpha(MEMBERSHIP_THEME.text, 0.55) }} />
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: withAlpha(MEMBERSHIP_THEME.text, 0.4) }} />
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: withAlpha(MEMBERSHIP_THEME.text, 0.3) }} />
                  </div>
                  <img
                    src={isMembershipDarkMode ? heroDark : heroLight}
                    alt="TabStudio editor preview"
                    style={{ display: "block", width: "100%", height: "auto" }}
                  />
                </div>
                <div
                  style={{
                    textAlign: "center",
                    color: MEMBERSHIP_THEME.textFaint,
                    opacity: 0.82,
                    fontSize: 13,
                    lineHeight: 1.35,
                  }}
                >
                  The TabStudio editor — clean, fast, and built for guitar players.
                </div>
              </div>
            </div>

            <div
              ref={membershipPricingSectionRef}
              id="plans"
              style={{
                position: "relative",
                scrollMarginTop: 12,
                borderRadius: 15,
                border: `1px solid ${MEMBERSHIP_THEME.border}`,
                background: MEMBERSHIP_THEME.surfaceWarm,
                boxShadow: `0 12px 28px ${withAlpha("#000000", isMembershipDarkMode ? 0.22 : 0.09)}`,
                padding: "18px 14px 14px",
                display: "grid",
                gap: 14,
                marginTop: 22,
              }}
            >
              <div style={{ display: "grid", justifyItems: "center", gap: 8, textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.08em",
                    fontWeight: 900,
                    color: TABBY_ASSIST_MINT,
                    textTransform: "uppercase",
                  }}
                >
                  Plans
                </div>
                <div style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800, letterSpacing: "-0.01em" }}>
                  Choose the plan that fits how you write.
                </div>
                <div style={{ fontSize: 13, color: MEMBERSHIP_THEME.textFaint, opacity: 0.84 }}>
                  Upgrade, downgrade, or cancel anytime.
                </div>
              </div>

              <div style={{ display: "grid", justifyItems: "center", marginTop: 12, marginBottom: 34 }}>
                <div
                  style={{
                    position: "relative",
                    display: "inline-grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 4,
                    padding: 4,
                    borderRadius: 999,
                    border: `1px solid ${MEMBERSHIP_THEME.border}`,
                    background: withAlpha(MEMBERSHIP_THEME.text, isMembershipDarkMode ? 0.05 : 0.04),
                    minWidth: 258,
                  }}
                >
                  <button type="button" onClick={() => setBillingCycle("monthly")} style={cycleBtnStyle(billingCycle === "monthly")}>
                    Monthly
                  </button>
                  <button type="button" onClick={() => setBillingCycle("yearly")} style={cycleBtnStyle(billingCycle === "yearly")}>
                    Yearly
                  </button>
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 7px)",
                      left: "75%",
                      transform: "translateX(-50%)",
                      minHeight: 20,
                      borderRadius: 999,
                      border: `1px solid ${
                        billingCycle === "yearly"
                          ? withAlpha(TABBY_ASSIST_MINT, 0.62)
                          : withAlpha(TABBY_ASSIST_MINT, 0.34)
                      }`,
                      background:
                        billingCycle === "yearly"
                          ? withAlpha(TABBY_ASSIST_MINT, isMembershipDarkMode ? 0.2 : 0.14)
                          : withAlpha(MEMBERSHIP_THEME.text, isMembershipDarkMode ? 0.06 : 0.045),
                      color: TABBY_ASSIST_MINT,
                      opacity: billingCycle === "yearly" ? 1 : 0.62,
                      padding: "0 9px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11.5,
                      fontWeight: 900,
                      letterSpacing: "0.02em",
                      lineHeight: 1,
                      pointerEvents: "none",
                      whiteSpace: "nowrap",
                      transition: "opacity 180ms ease, background 180ms ease, border-color 180ms ease",
                    }}
                  >
                    Save 20%
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 14,
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  alignItems: "stretch",
                  marginBottom: 2,
                }}
              >
              {plans.map((plan) => {
                const normalizedCurrentPlanId = hasActiveMembership ? String(currentPlanId || "").toLowerCase() : "";
                const isCurrentPlan = Boolean(normalizedCurrentPlanId && normalizedCurrentPlanId === plan.id);
                const isLowerTierThanCurrent =
                  Boolean(normalizedCurrentPlanId) && (planRank[plan.id] || 0) < (planRank[normalizedCurrentPlanId] || 0);
                const canUpgradeFromCurrent =
                  Boolean(normalizedCurrentPlanId) && (planRank[plan.id] || 0) > (planRank[normalizedCurrentPlanId] || 0);
                let cardCtaLabel = plan.cta;
                let cardCtaDisabled = false;
                let cardCtaTone = "default";
                if (isCurrentPlan) {
                  cardCtaLabel = "Current Plan";
                  cardCtaDisabled = true;
                  cardCtaTone = "current";
                } else if (canUpgradeFromCurrent) {
                  cardCtaLabel = `Upgrade to ${plan.name}`;
                  cardCtaTone = "upgrade";
                } else if (isLowerTierThanCurrent) {
                  cardCtaLabel = `Downgrade to ${plan.name}`;
                  cardCtaTone = "downgrade";
                }
                const isHovered = hoveredPlan === plan.id;
                const isButtonHovered = hoveredPlanButton === plan.id;
                const isBandPlan = plan.id === "band";
                const cardPadding = isBandPlan ? 20 : 19;
                const planTitleSize = isBandPlan ? 31 : 30;
                const cardBorderColor = isCurrentPlan
                  ? withAlpha(TABBY_ASSIST_MINT, 0.58)
                  : isBandPlan
                    ? withAlpha(TABBY_ASSIST_MINT, 0.4)
                    : MEMBERSHIP_THEME.border;
                const cardShadow = isCurrentPlan
                  ? `0 0 0 1px ${withAlpha(TABBY_ASSIST_MINT, 0.18)}, 0 12px 24px ${withAlpha(TABBY_ASSIST_MINT, isMembershipDarkMode ? 0.18 : 0.12)}`
                  : isHovered
                  ? `0 14px 28px ${withAlpha("#000000", isMembershipDarkMode ? 0.28 : 0.13)}, 0 0 0 1px ${withAlpha(TABBY_ASSIST_MINT, isMembershipDarkMode ? 0.22 : 0.14)}, 0 10px 24px ${withAlpha(TABBY_ASSIST_MINT, isMembershipDarkMode ? 0.26 : 0.18)}`
                  : "none";
                const ctaMintActive =
                  isCurrentPlan || isHovered || isButtonHovered || isBandPlan || cardCtaTone === "upgrade" || cardCtaTone === "downgrade";
                const ctaInteractive = !cardCtaDisabled && (isHovered || isButtonHovered);
                const ctaBorderColor =
                  cardCtaTone === "included"
                    ? MEMBERSHIP_THEME.border
                    : ctaMintActive
                      ? withAlpha(TABBY_ASSIST_MINT, 0.7)
                      : MEMBERSHIP_THEME.border;
                const ctaBackground =
                  cardCtaTone === "included"
                    ? withAlpha(MEMBERSHIP_THEME.text, isMembershipDarkMode ? 0.05 : 0.03)
                    : ctaMintActive
                      ? TABBY_ASSIST_MINT
                      : MEMBERSHIP_THEME.surfaceWarm;
                const ctaTextColor = cardCtaTone === "included" ? MEMBERSHIP_THEME.textFaint : "#FFFFFF";
                const ctaShadow = ctaInteractive
                  ? `0 0 0 1px ${withAlpha(TABBY_ASSIST_MINT, 0.2)}, 0 8px 16px ${withAlpha(TABBY_ASSIST_MINT, isMembershipDarkMode ? 0.22 : 0.16)}`
                  : "none";
                return (
                  <div
                    key={plan.id}
                    onMouseEnter={() => setHoveredPlan(plan.id)}
                    onMouseLeave={() => setHoveredPlan((prev) => (prev === plan.id ? "" : prev))}
                    style={{
                      borderRadius: 14,
                      border: `1px solid ${cardBorderColor}`,
                      background: withAlpha(MEMBERSHIP_THEME.surfaceWarm, isMembershipDarkMode ? 0.97 : 0.99),
                      padding: cardPadding,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxSizing: "border-box",
                      transition: "border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease, filter 160ms ease",
                      boxShadow: cardShadow,
                      transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                      filter: isHovered ? "brightness(1.025)" : "none",
                    }}
                  >
                    <div style={{ display: "grid", gap: 14, flex: 1 }}>
                      <div style={{ display: "grid", gap: 6 }}>
                        {isCurrentPlan ? (
                          <div
                            style={{
                              minHeight: 24,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "fit-content",
                              borderRadius: 999,
                              border: `1px solid ${withAlpha(TABBY_ASSIST_MINT, 0.6)}`,
                              background: withAlpha(TABBY_ASSIST_MINT, isMembershipDarkMode ? 0.16 : 0.12),
                              color: TABBY_ASSIST_MINT,
                              fontSize: 11.5,
                              fontWeight: 900,
                              letterSpacing: "0.03em",
                              padding: "0 10px",
                            }}
                          >
                            Current Plan
                          </div>
                        ) : null}
                        <h2 style={{ margin: 0, fontSize: planTitleSize, lineHeight: 1.05, letterSpacing: "-0.01em" }}>{plan.name}</h2>
                        <div
                          style={{
                            color: MEMBERSHIP_THEME.textFaint,
                            fontSize: 15,
                            lineHeight: 1.45,
                            minHeight: 66,
                          }}
                        >
                          {plan.description}
                        </div>
                      </div>
                      <ul
                        style={{
                          margin: 0,
                          padding: 0,
                          listStyle: "none",
                          display: "grid",
                          gap: 7,
                          fontSize: 14.5,
                        }}
                      >
                        {plan.features.map((feature) => {
                          const isCarryForwardFeature =
                            feature.startsWith("Everything in ") || feature.startsWith("Includes everything in ");
                          return (
                            <li
                              key={feature}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "10px minmax(0, 1fr)",
                                columnGap: 8,
                                alignItems: "start",
                                lineHeight: 1.35,
                                color: isCarryForwardFeature ? MEMBERSHIP_THEME.text : MEMBERSHIP_THEME.textFaint,
                                fontWeight: isCarryForwardFeature ? 700 : 560,
                              }}
                            >
                              <span
                                aria-hidden="true"
                                style={{
                                  width: 5,
                                  height: 5,
                                  borderRadius: "50%",
                                  marginTop: 7,
                                  background: withAlpha(MEMBERSHIP_THEME.text, isMembershipDarkMode ? 0.56 : 0.42),
                                }}
                              />
                              <span>{feature}</span>
                            </li>
                          );
                        })}
                      </ul>
                      <div style={{ display: "grid", gap: 1 }}>
                        {billingCycle === "yearly" ? (() => {
                          const monthlyMatch = String(plan.monthly || "").match(/\$([0-9]+(?:\.[0-9]+)?)/);
                          const monthlyValue = monthlyMatch ? Number(monthlyMatch[1]) : NaN;
                          if (!Number.isFinite(monthlyValue)) return null;
                          const originalYearly = (monthlyValue * 12).toFixed(2);
                          return (
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                lineHeight: 1.1,
                                color: MEMBERSHIP_THEME.textFaint,
                                opacity: 0.78,
                                textDecoration: "line-through",
                                textDecorationThickness: "1px",
                              }}
                            >
                              ${originalYearly}/year
                            </div>
                          );
                        })() : null}
                        <div style={{ fontSize: 34, fontWeight: 950, letterSpacing: -0.4, lineHeight: 1.08 }}>
                          {billingCycle === "yearly" ? plan.yearly : plan.monthly}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (cardCtaDisabled) return;
                        onSelectPlan?.(plan.id, billingCycle);
                      }}
                      disabled={cardCtaDisabled}
                      onMouseEnter={() => setHoveredPlanButton(plan.id)}
                      onMouseLeave={() => setHoveredPlanButton((prev) => (prev === plan.id ? "" : prev))}
                      onFocus={() => setHoveredPlanButton(plan.id)}
                      onBlur={() => setHoveredPlanButton((prev) => (prev === plan.id ? "" : prev))}
                      style={{
                        minHeight: 44,
                        borderRadius: 11,
                        border: `1px solid ${ctaBorderColor}`,
                        background: ctaBackground,
                        color: ctaTextColor,
                        fontSize: 16,
                        fontWeight: 900,
                        cursor: cardCtaDisabled ? "default" : "pointer",
                        transition: "box-shadow 180ms ease, border-color 180ms ease, background 180ms ease, transform 180ms ease",
                        boxShadow: ctaShadow,
                        transform: ctaInteractive ? "translateY(-1px)" : "translateY(0)",
                        marginTop: 14,
                        opacity: cardCtaDisabled && !isCurrentPlan ? 0.72 : 1,
                      }}
                    >
                      {cardCtaLabel}
                    </button>
                  </div>
                );
              })}
              </div>
            </div>

            <div style={{ textAlign: "center", color: MEMBERSHIP_THEME.textFaint, fontSize: 14, fontWeight: 700 }}>
              Cancel anytime from your account settings. Your saved tabs remain safe in your account.
            </div>

            <div
              onMouseEnter={() => setHoveredMembershipPanel("comparison")}
              onMouseLeave={() => setHoveredMembershipPanel((prev) => (prev === "comparison" ? "" : prev))}
              style={{
                borderRadius: 12,
                border: `1px solid ${
                  hoveredMembershipPanel === "comparison"
                    ? withAlpha("#FFFFFF", isMembershipDarkMode ? 0.6 : 0.48)
                    : MEMBERSHIP_THEME.border
                }`,
                background: MEMBERSHIP_THEME.surfaceWarm,
                overflow: "hidden",
                boxShadow:
                  hoveredMembershipPanel === "comparison"
                    ? `0 0 0 1px ${withAlpha("#FFFFFF", isMembershipDarkMode ? 0.18 : 0.12)}, 0 12px 24px ${withAlpha("#000000", isMembershipDarkMode ? 0.24 : 0.1)}`
                    : "none",
                transform: hoveredMembershipPanel === "comparison" ? "translateY(-2px)" : "translateY(0)",
                transition: "border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(220px, 1.5fr) repeat(3, minmax(110px, 1fr))",
                  borderBottom: `1px solid ${withAlpha("#FFFFFF", 0.12)}`,
                  background: withAlpha(MEMBERSHIP_THEME.text, isMembershipDarkMode ? 0.07 : 0.045),
                }}
              >
                <div style={{ padding: "10px 12px", fontSize: 13, fontWeight: 900, color: MEMBERSHIP_THEME.text }}>Feature comparison</div>
                <div style={{ padding: "10px 12px", fontSize: 13, fontWeight: 900, textAlign: "center", color: MEMBERSHIP_THEME.text }}>Solo</div>
                <div style={{ padding: "10px 12px", fontSize: 13, fontWeight: 900, textAlign: "center", color: MEMBERSHIP_THEME.text }}>Band</div>
                <div style={{ padding: "10px 12px", fontSize: 13, fontWeight: 900, textAlign: "center", color: withAlpha("#FFFFFF", 0.96) }}>Creator</div>
              </div>
              {comparisonRows.map((row, idx) => (
                (() => {
                  const isIncluded = (value) => {
                    const v = String(value || "").trim().toLowerCase();
                    return v === "yes" || v === "included";
                  };
                  const isUnavailable = (value) => {
                    const v = String(value || "").trim();
                    return v === "—" || v === "-";
                  };
                  const creatorUnique = isIncluded(row.creator) && !isIncluded(row.solo) && !isIncluded(row.band);
                  const renderPlanCell = (value, planId) => {
                    const included = isIncluded(value);
                    const unavailable = isUnavailable(value);
                    if (included) {
                      return (
                        <span
                          aria-label="Included"
                          style={{
                            fontSize: 15,
                            lineHeight: 1,
                            fontWeight: 900,
                            color: planId === "creator" && creatorUnique ? TABBY_ASSIST_MINT : withAlpha(TABBY_ASSIST_MINT, 0.9),
                          }}
                        >
                          ✓
                        </span>
                      );
                    }
                    if (unavailable) {
                      return (
                        <span
                          aria-label="Not included"
                          style={{
                            fontSize: 13.5,
                            lineHeight: 1,
                            fontWeight: 700,
                            color: withAlpha("#FFFFFF", 0.35),
                          }}
                        >
                          —
                        </span>
                      );
                    }
                    return (
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: planId === "creator" && creatorUnique ? 800 : 700,
                          color: planId === "creator" && creatorUnique ? MEMBERSHIP_THEME.text : MEMBERSHIP_THEME.textFaint,
                        }}
                      >
                        {value}
                      </span>
                    );
                  };
                  return (
                    <div
                      key={row.label}
                      onMouseEnter={() => setHoveredComparisonRowLabel(row.label)}
                      onMouseLeave={() =>
                        setHoveredComparisonRowLabel((prev) => (prev === row.label ? "" : prev))
                      }
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(220px, 1.5fr) repeat(3, minmax(110px, 1fr))",
                        borderTop: idx === 0 ? "none" : `1px solid ${MEMBERSHIP_THEME.border}`,
                        background:
                          hoveredComparisonRowLabel === row.label
                            ? withAlpha("#FFFFFF", isMembershipDarkMode ? 0.06 : 0.05)
                            : idx % 2 === 1
                              ? withAlpha(MEMBERSHIP_THEME.text, isMembershipDarkMode ? 0.03 : 0.02)
                              : "transparent",
                        transition: "background 200ms ease",
                      }}
                    >
                      <div style={{ padding: "14px 16px", fontSize: 13, fontWeight: 500, color: MEMBERSHIP_THEME.textFaint }}>{row.label}</div>
                      <div style={{ padding: "14px 16px", display: "grid", placeItems: "center", textAlign: "center" }}>
                        {renderPlanCell(row.solo, "solo")}
                      </div>
                      <div style={{ padding: "14px 16px", display: "grid", placeItems: "center", textAlign: "center" }}>
                        {renderPlanCell(row.band, "band")}
                      </div>
                      <div style={{ padding: "14px 16px", display: "grid", placeItems: "center", textAlign: "center" }}>
                        {renderPlanCell(row.creator, "creator")}
                      </div>
                    </div>
                  );
                })()
              ))}
            </div>
          </section>

          <section
            onMouseEnter={() => setHoveredMembershipPanel("key-features")}
            onMouseLeave={() => setHoveredMembershipPanel((prev) => (prev === "key-features" ? "" : prev))}
            style={{
              borderRadius: 16,
              border: `1px solid ${
                hoveredMembershipPanel === "key-features"
                  ? withAlpha("#FFFFFF", isMembershipDarkMode ? 0.6 : 0.48)
                  : MEMBERSHIP_THEME.border
              }`,
              background: MEMBERSHIP_THEME.surfaceWarm,
              padding: 12,
              display: "grid",
              gridTemplateRows: "auto auto",
              gap: 10,
              minHeight: 0,
              maxHeight: "none",
              overflow: "visible",
              boxShadow:
                hoveredMembershipPanel === "key-features"
                  ? `0 0 0 1px ${withAlpha("#FFFFFF", isMembershipDarkMode ? 0.18 : 0.12)}, 0 12px 24px ${withAlpha("#000000", isMembershipDarkMode ? 0.24 : 0.1)}`
                  : "none",
              transform: hoveredMembershipPanel === "key-features" ? "translateY(-2px)" : "translateY(0)",
              transition: "border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 22, lineHeight: 1.1 }}>Key Features</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: membershipFeatureNarrow ? "minmax(0, 1fr)" : "minmax(240px, 310px) minmax(0, 1fr)",
                gap: 8,
                minHeight: 0,
                alignItems: "stretch",
              }}
            >
              <div style={{ display: "grid", gap: 6, alignContent: "start", minHeight: 0, gridTemplateRows: "auto minmax(0, 1fr)" }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: MEMBERSHIP_THEME.textFaint,
                    letterSpacing: 0.3,
                    padding: "2px 2px 0",
                  }}
                >
                  Feature list
                </div>
                <div
                  ref={membershipFeatureListRef}
                  style={{
                    position: "relative",
                    borderRadius: 12,
                    border: `1px solid ${MEMBERSHIP_THEME.border}`,
                    background: MEMBERSHIP_THEME.surfaceWarm,
                    padding: 8,
                    display: "grid",
                    gap: 6,
                    minHeight: 0,
                    maxHeight: membershipFeatureNarrow ? "none" : "min(560px, calc(100dvh - 300px))",
                    overflowY: membershipFeatureNarrow ? "visible" : "auto",
                    overflowX: "hidden",
                    overscrollBehaviorY: "auto",
                    scrollbarWidth: "thin",
                  }}
                >
                  {!membershipFeatureNarrow && membershipFeatureListHasMoreBelow ? (
                    <>
                      <div
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          left: 8,
                          right: 8,
                          bottom: 8,
                          height: 52,
                          pointerEvents: "none",
                          background: `linear-gradient(180deg, ${withAlpha(MEMBERSHIP_THEME.surfaceWarm, 0)} 0%, ${withAlpha(MEMBERSHIP_THEME.surfaceWarm, 0.78)} 66%, ${MEMBERSHIP_THEME.surfaceWarm} 100%)`,
                          opacity: membershipFeatureListScrollTop > 4 ? 0 : 1,
                          transition: "opacity 180ms ease",
                          zIndex: 1,
                        }}
                      />
                      <button
                        type="button"
                        onClick={scrollMembershipFeatureListToBottom}
                        onMouseEnter={() => setMembershipFeatureListScrollBtnHover(true)}
                        onMouseLeave={() => setMembershipFeatureListScrollBtnHover(false)}
                        onFocus={() => setMembershipFeatureListScrollBtnHover(true)}
                        onBlur={() => setMembershipFeatureListScrollBtnHover(false)}
                        aria-label="Scroll feature list down"
                        style={{
                          position: "absolute",
                          left: "50%",
                          bottom: 9,
                          transform: membershipFeatureListScrollBtnHover
                            ? "translateX(-50%) translateY(-1px) scale(1.01)"
                            : "translateX(-50%) translateY(0) scale(1)",
                          width: 24,
                          height: 24,
                          borderRadius: 9,
                          border: `1px solid ${
                            membershipFeatureListScrollBtnHover
                              ? withAlpha(MEMBERSHIP_THEME.text, isMembershipDarkMode ? 0.14 : 0.1)
                              : withAlpha(MEMBERSHIP_THEME.text, isMembershipDarkMode ? 0.07 : 0.05)
                          }`,
                          background: membershipFeatureListScrollBtnHover
                            ? withAlpha("#0f1720", isMembershipDarkMode ? 0.9 : 0.82)
                            : withAlpha("#0b1118", isMembershipDarkMode ? 0.82 : 0.72),
                          color: withAlpha(MEMBERSHIP_THEME.text, membershipFeatureListScrollBtnHover ? 0.82 : 0.68),
                          fontSize: 14,
                          fontWeight: 600,
                          lineHeight: 1,
                          opacity: membershipFeatureListScrollTop > 4 ? 0 : 0.94,
                          transition: "opacity 180ms ease, transform 180ms ease, background 180ms ease, border-color 180ms ease, color 180ms ease",
                          cursor: "pointer",
                          boxSizing: "border-box",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0,
                          boxShadow: membershipFeatureListScrollBtnHover
                            ? `0 4px 10px ${withAlpha("#000000", isMembershipDarkMode ? 0.16 : 0.07)}`
                            : `0 1px 4px ${withAlpha("#000000", isMembershipDarkMode ? 0.1 : 0.04)}`,
                          backdropFilter: "blur(8px)",
                          WebkitBackdropFilter: "blur(8px)",
                          zIndex: 2,
                        }}
                      >
                        ⌄
                      </button>
                    </>
                  ) : null}
                  {membershipKeyFeatures.map((feature) => (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => onSelectMembershipFeatureCard(feature)}
                      onMouseEnter={() => setHoveredMembershipFeatureId(feature.id)}
                      onMouseLeave={() => setHoveredMembershipFeatureId((prev) => (prev === feature.id ? "" : prev))}
                      onFocus={() => setFocusedMembershipFeatureId(feature.id)}
                      onBlur={() => setFocusedMembershipFeatureId((prev) => (prev === feature.id ? "" : prev))}
                      style={featureListItem(MEMBERSHIP_THEME, withAlpha, {
                        active: displayedMembershipFeatureId === feature.id,
                        focused: focusedMembershipFeatureId === feature.id,
                        hovered: hoveredMembershipFeatureId === feature.id,
                        isDarkMode: isMembershipDarkMode,
                        padding: "10px 12px",
                        gap: 5,
                      })}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          aria-hidden="true"
                          style={featureListIconBadge(MEMBERSHIP_THEME, withAlpha, { isDarkMode: isMembershipDarkMode })}
                        >
                          {feature.icon}
                        </span>
                        <div style={{ ...featureListTitle(MEMBERSHIP_THEME), fontSize: 12.5 }}>{feature.title}</div>
                      </div>
                      <div style={featureListDescription(MEMBERSHIP_THEME, { lineClamp: 2, fontSize: 11.5, lineHeight: 1.35 })}>
                        {feature.body.replace(/\n\n/g, " ")}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div
                ref={membershipFeatureSpotlightRef}
                onMouseEnter={() => setMembershipSpotlightHovered(true)}
                onMouseLeave={() => setMembershipSpotlightHovered(false)}
                style={{
                  position: "relative",
                  borderRadius: 14,
                  border: `1px solid ${withAlpha(MEMBERSHIP_THEME.accent, membershipSpotlightHovered ? 0.82 : 0.58)}`,
                  background: MEMBERSHIP_THEME.surfaceWarm,
                  boxShadow: membershipSpotlightHovered
                    ? `0 0 0 2px ${withAlpha(MEMBERSHIP_THEME.accent, isMembershipDarkMode ? 0.2 : 0.14)}, 0 14px 30px ${withAlpha(MEMBERSHIP_THEME.accent, isMembershipDarkMode ? 0.3 : 0.18)}`
                    : `0 0 0 1px ${withAlpha(MEMBERSHIP_THEME.accent, isMembershipDarkMode ? 0.24 : 0.16)}, 0 12px 26px ${withAlpha(MEMBERSHIP_THEME.accent, isMembershipDarkMode ? 0.2 : 0.12)}`,
                  padding: 11,
                  display: "grid",
                  gridTemplateRows: "auto auto",
                  gap: 10,
                  minHeight: 0,
                  height: "auto",
                  transition: "box-shadow 180ms ease, border-color 180ms ease",
                  overflow: "visible",
                }}
              >
                <div
                  ref={membershipSpotlightContentRef}
                  style={{
                    display: "grid",
                    gap: 8,
                    alignContent: "start",
                    minHeight: 0,
                    overflow: "visible",
                    paddingRight: 0,
                    opacity: membershipSpotlightVisible ? 1 : 0,
                    transform: `translateY(${membershipSpotlightVisible ? 0 : 4}px)`,
                    transition: "opacity 180ms ease, transform 180ms ease",
                  }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 999,
                        border: `1px solid ${MEMBERSHIP_THEME.border}`,
                        background: withAlpha(MEMBERSHIP_THEME.text, isMembershipDarkMode ? 0.1 : 0.06),
                        color: MEMBERSHIP_THEME.text,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                      }}
                    >
                      {membershipSpotlightData.icon}
                    </span>
                    <div style={{ fontWeight: 900, fontSize: 12, color: MEMBERSHIP_THEME.textFaint, letterSpacing: 0.35 }}>
                      Feature Spotlight
                    </div>
                  </div>
                  <h3 style={{ margin: 0, fontSize: 24, lineHeight: 1.12 }}>{membershipSpotlightData.title}</h3>
                  {membershipSpotlightData.lead ? (
                    <div style={{ color: MEMBERSHIP_THEME.text, lineHeight: 1.4, fontSize: 15, fontWeight: 800 }}>
                      {membershipSpotlightData.lead}
                    </div>
                  ) : null}
                  <div style={{ color: MEMBERSHIP_THEME.textFaint, lineHeight: 1.48, fontSize: 14.5, display: "grid", gap: 8 }}>
                    {(membershipSpotlightData.descriptionLines || []).map((line, idx) => (
                      <p key={`${membershipSpotlightData.title}-line-${idx}`} style={{ margin: 0 }}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
                {!membershipFeatureNarrow && membershipSpotlightHasMoreBelow ? (
                  <>
                    <div
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        left: 11,
                        right: 11,
                        bottom: 196,
                        height: 72,
                        pointerEvents: "none",
                        background: `linear-gradient(180deg, ${withAlpha(MEMBERSHIP_THEME.surfaceWarm, 0)} 0%, ${withAlpha(MEMBERSHIP_THEME.surfaceWarm, 0.72)} 66%, ${MEMBERSHIP_THEME.surfaceWarm} 100%)`,
                        opacity: membershipSpotlightScrollTop > 4 ? 0 : 1,
                        transition: "opacity 180ms ease",
                      }}
                    />
                    <div
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        left: "50%",
                        bottom: 220,
                        transform: `translateX(-50%) translateY(${membershipSpotlightArrowFloatUp ? 2 : -2}px)`,
                        color: withAlpha(MEMBERSHIP_THEME.text, 0.84),
                        fontSize: 20,
                        fontWeight: 700,
                        lineHeight: 1,
                        opacity: membershipSpotlightScrollTop > 4 ? 0 : 0.88,
                        transition: "opacity 180ms ease, transform 2600ms ease",
                        pointerEvents: "none",
                        textShadow: `0 3px 12px ${withAlpha("#000000", isMembershipDarkMode ? 0.4 : 0.18)}`,
                      }}
                    >
                      v
                    </div>
                  </>
                ) : null}
                <div
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    border: `1px solid ${MEMBERSHIP_THEME.border}`,
                    background: withAlpha(MEMBERSHIP_THEME.text, isMembershipDarkMode ? 0.03 : 0.02),
                    boxShadow: `0 8px 18px ${withAlpha("#000000", isMembershipDarkMode ? 0.2 : 0.08)}`,
                    minHeight: membershipFeatureNarrow ? 198 : 202,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 6,
                    padding: 9,
                    marginTop: membershipFeatureNarrow ? 0 : 2,
                    opacity: membershipSpotlightVisible ? 1 : 0,
                    transform: `translateY(${membershipSpotlightVisible ? 0 : 4}px)`,
                    transition: "opacity 180ms ease, transform 180ms ease",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      maxWidth: membershipFeatureNarrow ? "100%" : 760,
                      borderRadius: 10,
                      border: `1px solid ${MEMBERSHIP_THEME.border}`,
                      overflow: "hidden",
                      minHeight: membershipFeatureNarrow ? 154 : 170,
                      aspectRatio: "16 / 9",
                      background: withAlpha(MEMBERSHIP_THEME.text, isMembershipDarkMode ? 0.04 : 0.03),
                    }}
                  >
                    <img
                      src={isMembershipDarkMode ? heroDark : heroLight}
                      alt="TabStudio feature preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
