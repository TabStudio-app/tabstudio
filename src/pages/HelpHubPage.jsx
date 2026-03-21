import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppHeader from "../components/AppHeader";
import developerPhoto from "../assets/HarryBolton.JPG";
import tabbyLight from "../assets/tabby-light-v1-transparent.png";
import tabbyDark from "../assets/tabby-dark-v1-transparent.png";
import AboutPage from "./AboutPage";
import { supportFormFieldClass } from "../utils/uiStyles";
import {
  faqRowVisual,
  secondaryTabButton,
} from "../utils/uiTokens";

export default function HelpHubPage({ shared }) {
  const {
    ACCENT_PRESETS,
    DARK_THEME,
    LIGHT_THEME,
    LS_ACCENT_COLOR_KEY,
    LS_THEME_MODE_KEY,
    TABBY_ASSIST_MINT,
    TABBY_ASSIST_MINT_STRONG,
    TabbySpeechBubble,
    getTabStudioInteractiveFieldStyle,
    onBack,
    onGoSettings,
    siteHeaderBarStyle,
    siteHeaderEditorLinkStyle,
    siteHeaderLeftGroupStyle,
    siteHeaderLogoButtonStyle,
    siteHeaderLogoImageStyle,
    siteHeaderRightGroupStyle,
    siteHeaderSecondaryButtonStyle,
    siteHeaderSloganStyle,
    supportEverPaidSubscriber = false,
    supportPaidSubscriber = false,
    supportUserEmail = "",
    targetSection = "about",
    withAlpha,
  } = shared;
  const aboutRef = useRef(null);
  const developerRef = useRef(null);
  const faqRef = useRef(null);
  const supportRef = useRef(null);
  const helpScrollRef = useRef(null);
  const tabbySpeechDelayRef = useRef(null);
  const tabbySpeechSecondLineRef = useRef(null);
  const tabbySpeechThirdLineRef = useRef(null);
  const tabbySpeechHideRef = useRef(null);
  const supportSpeechTriggeredForActivationRef = useRef(false);
  const supportSectionWasActiveRef = useRef(false);
  const supportSwapTimerRef = useRef(null);
  const supportThanksTimerRef = useRef(null);
  const [openFaqId, setOpenFaqId] = useState("");
  const [faqQuery, setFaqQuery] = useState("");
  const [tabbyFloatUp, setTabbyFloatUp] = useState(false);
  const [tabbyBlink, setTabbyBlink] = useState(false);
  const [tabbySpeechIndex, setTabbySpeechIndex] = useState(0);
  const [tabbySpeechPlaying, setTabbySpeechPlaying] = useState(false);
  const [tabbyMessageMode, setTabbyMessageMode] = useState("idle");
  const [tabbySpeechTrigger, setTabbySpeechTrigger] = useState(0);
  const [helpTabbyDismissed, setHelpTabbyDismissed] = useState(false);
  const [supportIntroConsumed, setSupportIntroConsumed] = useState(false);
  const [activeHelpSection, setActiveHelpSection] = useState(String(targetSection || "about").toLowerCase());
  const [themeRefresh, setThemeRefresh] = useState(0);
  const spotlightSwapTimerRef = useRef(null);
  const [supportShowForm, setSupportShowForm] = useState(false);
  const [supportLeftVisible, setSupportLeftVisible] = useState(true);
  const [supportSenderEmail, setSupportSenderEmail] = useState("");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportAttachedImages, setSupportAttachedImages] = useState([]);
  const [supportAttachmentError, setSupportAttachmentError] = useState("");
  const [supportFormErrors, setSupportFormErrors] = useState({});
  const [supportFocusedField, setSupportFocusedField] = useState("");
  const [supportHoveredField, setSupportHoveredField] = useState("");
  const [faqSearchFocused, setFaqSearchFocused] = useState(false);
  const [faqSearchHovered, setFaqSearchHovered] = useState(false);
  const [supportSending, setSupportSending] = useState(false);
  const [supportReturnLinkHover, setSupportReturnLinkHover] = useState(false);
  const [supportSendBtnHover, setSupportSendBtnHover] = useState(false);
  const [supportInstagramHover, setSupportInstagramHover] = useState(false);
  const [helpHeaderHoverBtn, setHelpHeaderHoverBtn] = useState("");
  const [helpHeaderPressedBtn, setHelpHeaderPressedBtn] = useState("");
  const [hoveredHelpNavButton, setHoveredHelpNavButton] = useState("");
  const [hoveredFaqId, setHoveredFaqId] = useState("");
  const [contactSupportBtnHover, setContactSupportBtnHover] = useState(false);
  const [developerFeedbackHover, setDeveloperFeedbackHover] = useState(false);
  const clearSupportTabbyIntroDelay = useCallback(() => {
    if (tabbySpeechDelayRef.current) {
      window.clearTimeout(tabbySpeechDelayRef.current);
      tabbySpeechDelayRef.current = null;
    }
  }, []);
  const clearSupportTabbySpeechSequence = useCallback(() => {
    clearSupportTabbyIntroDelay();
    if (tabbySpeechSecondLineRef.current) {
      window.clearTimeout(tabbySpeechSecondLineRef.current);
      tabbySpeechSecondLineRef.current = null;
    }
    if (tabbySpeechThirdLineRef.current) {
      window.clearTimeout(tabbySpeechThirdLineRef.current);
      tabbySpeechThirdLineRef.current = null;
    }
    if (tabbySpeechHideRef.current) {
      window.clearTimeout(tabbySpeechHideRef.current);
      tabbySpeechHideRef.current = null;
    }
  }, [clearSupportTabbyIntroDelay]);

  const getSystemThemeForHelp = useCallback(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }, []);
  const isHelpDarkMode = useMemo(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = window.localStorage.getItem(LS_THEME_MODE_KEY);
      if (stored === "dark") return true;
      if (stored === "light") return false;
    } catch {}
    return getSystemThemeForHelp() === "dark";
  }, [getSystemThemeForHelp, themeRefresh]);
  const helpAccentId = useMemo(() => {
    const fallback = isHelpDarkMode ? "white" : "black";
    if (typeof window === "undefined") return fallback;
    try {
      const stored = window.localStorage.getItem(LS_ACCENT_COLOR_KEY);
      if (ACCENT_PRESETS.some((p) => p.id === stored)) {
        if (isHelpDarkMode && stored === "black") return fallback;
        if (!isHelpDarkMode && stored === "white") return fallback;
        return stored;
      }
    } catch {}
    return fallback;
  }, [isHelpDarkMode, themeRefresh]);
  const helpAccent = useMemo(
    () => (ACCENT_PRESETS.find((preset) => preset.id === helpAccentId) || ACCENT_PRESETS[0]).hex,
    [helpAccentId]
  );
  const HELP_THEME = useMemo(() => {
    const base = isHelpDarkMode ? DARK_THEME : LIGHT_THEME;
    return {
      ...base,
      accent: helpAccent,
      accentSoft: withAlpha(helpAccent, isHelpDarkMode ? 0.2 : 0.16),
    };
  }, [isHelpDarkMode, helpAccent]);

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
    const id = window.setInterval(() => {
      setTabbyFloatUp((v) => !v);
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let mounted = true;
    let timerId = null;
    const runBlink = () => {
      const waitMs = 7000 + Math.floor(Math.random() * 5000);
      timerId = window.setTimeout(() => {
        if (!mounted) return;
        setTabbyBlink(true);
        window.setTimeout(() => {
          if (!mounted) return;
          setTabbyBlink(false);
        }, 220);
        runBlink();
      }, waitMs);
    };
    runBlink();
    return () => {
      mounted = false;
      if (timerId) window.clearTimeout(timerId);
    };
  }, []);

  useEffect(() => {
    if (!tabbySpeechTrigger) return undefined;
    if (activeHelpSection !== "support") return undefined;
    clearSupportTabbySpeechSequence();
    setTabbySpeechPlaying(true);
    setTabbyMessageMode("intro");
    setTabbySpeechIndex(0);
    tabbySpeechSecondLineRef.current = window.setTimeout(() => {
      setTabbySpeechIndex(1);
      tabbySpeechSecondLineRef.current = null;
    }, 2800);
    tabbySpeechThirdLineRef.current = window.setTimeout(() => {
      setTabbySpeechIndex(2);
      tabbySpeechThirdLineRef.current = null;
    }, 5800);
    tabbySpeechHideRef.current = window.setTimeout(() => {
      setTabbyMessageMode("idle");
      setTabbySpeechPlaying(false);
      tabbySpeechHideRef.current = null;
    }, 9300);
    return clearSupportTabbySpeechSequence;
  }, [clearSupportTabbySpeechSequence, tabbySpeechTrigger]);

  useEffect(() => {
    if (!supportShowForm) setSupportSenderEmail("");
  }, [supportShowForm]);

  useEffect(() => {
    return () => {
      clearSupportTabbySpeechSequence();
      if (spotlightSwapTimerRef.current) window.clearTimeout(spotlightSwapTimerRef.current);
      if (supportSwapTimerRef.current) window.clearTimeout(supportSwapTimerRef.current);
      if (supportThanksTimerRef.current) window.clearTimeout(supportThanksTimerRef.current);
    };
  }, [clearSupportTabbySpeechSequence]);

  useEffect(() => {
    clearSupportTabbyIntroDelay();
    const supportActive = activeHelpSection === "support";
    if (!supportActive) {
      supportSectionWasActiveRef.current = false;
      supportSpeechTriggeredForActivationRef.current = false;
      clearSupportTabbySpeechSequence();
      setTabbyMessageMode("idle");
      setTabbySpeechPlaying(false);
      setTabbySpeechIndex(0);
      return undefined;
    }
    if (!supportSectionWasActiveRef.current) {
      supportSectionWasActiveRef.current = true;
      supportSpeechTriggeredForActivationRef.current = false;
    }
    if (supportIntroConsumed) return undefined;
    if (supportSpeechTriggeredForActivationRef.current) return undefined;
    if (tabbySpeechPlaying || tabbyMessageMode !== "idle") return undefined;
    tabbySpeechDelayRef.current = window.setTimeout(() => {
      supportSpeechTriggeredForActivationRef.current = true;
      setSupportIntroConsumed(true);
      setTabbySpeechTrigger((v) => v + 1);
      tabbySpeechDelayRef.current = null;
    }, 1500);
    return () => {
      if (tabbySpeechDelayRef.current) {
        window.clearTimeout(tabbySpeechDelayRef.current);
        tabbySpeechDelayRef.current = null;
      }
    };
  }, [activeHelpSection, clearSupportTabbyIntroDelay, clearSupportTabbySpeechSequence, supportIntroConsumed, tabbyMessageMode, tabbySpeechPlaying]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      if (supportShowForm) {
        setSupportFormErrors({});
        setSupportLeftVisible(false);
        if (supportSwapTimerRef.current) window.clearTimeout(supportSwapTimerRef.current);
        supportSwapTimerRef.current = window.setTimeout(() => {
          setSupportShowForm(false);
          setSupportLeftVisible(true);
          supportSwapTimerRef.current = null;
        }, 220);
        return;
      }
      onBack?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onBack, supportShowForm]);
  useEffect(() => {
    const onResize = () => setHelpFeatureNarrow(window.innerWidth <= 1180);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const map = {
      about: aboutRef,
      faq: faqRef,
      support: supportRef,
    };
    const key = String(targetSection || "about").toLowerCase();
    const ref = map[key] || aboutRef;
    const id = requestAnimationFrame(() => {
      try {
        ref.current?.scrollIntoView({ behavior: "auto", block: "start" });
      } catch {}
    });
    return () => cancelAnimationFrame(id);
  }, [targetSection]);
  useEffect(() => {
    setActiveHelpSection(String(targetSection || "about").toLowerCase());
  }, [targetSection]);
  useEffect(() => {
    if (String(targetSection || "").toLowerCase() !== "faq") return;
    setOpenFaqId("");
  }, [targetSection]);

  useEffect(() => {
    const root = helpScrollRef.current;
    if (!root) return undefined;
    const observed = [
      ["about", aboutRef.current],
      ["developer", developerRef.current],
      ["faq", faqRef.current],
      ["support", supportRef.current],
    ].filter(([, el]) => Boolean(el));
    if (!observed.length) return undefined;
    const ratios = new Map();
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target?.id;
          if (!id) continue;
          ratios.set(id, entry.intersectionRatio);
        }
        let bestId = "";
        let bestRatio = -1;
        for (const [id, ratio] of ratios.entries()) {
          if (ratio > bestRatio) {
            bestId = id;
            bestRatio = ratio;
          }
        }
        if (bestId) setActiveHelpSection(bestId);
      },
      {
        root,
        threshold: [0.15, 0.3, 0.45, 0.6, 0.75, 0.9],
      }
    );
    for (const [, el] of observed) obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const sectionCard = {
    borderRadius: 14,
    border: `1px solid ${HELP_THEME.border}`,
    background: HELP_THEME.surfaceWarm,
    padding: 18,
    display: "grid",
    gap: 10,
  };
  const navPillFor = (sectionId) => ({
    ...secondaryTabButton(HELP_THEME, withAlpha, {
      active: activeHelpSection === sectionId,
      hovered: hoveredHelpNavButton === sectionId,
      isDarkMode: isHelpDarkMode,
    }),
  });
  const sectionStyle = (sectionId) => ({
    ...sectionCard,
    border: `1px solid ${
      activeHelpSection === sectionId ? withAlpha(HELP_THEME.accent, 0.72) : HELP_THEME.border
    }`,
    boxShadow:
      activeHelpSection === sectionId
        ? `0 0 0 2px ${withAlpha(HELP_THEME.accent, isHelpDarkMode ? 0.12 : 0.08)}`
        : "none",
    transition: "border-color 180ms ease, box-shadow 180ms ease",
  });
  const faqItems = [
    {
      id: "faq-1",
      q: "What instruments does TabStudio support?",
      a: "Currently TabStudio focuses on standard guitar tablature.\n\nAdditional instrument support may be considered in future updates.",
    },
    {
      id: "faq-2",
      q: "Where are my tabs stored?",
      a: "Your tabs are stored securely and linked to your account.\n\nIf your subscription ends, your tabs are not deleted. They remain safely stored in your account, but they become inaccessible until your subscription is renewed.\n\nThis helps protect your projects, song ideas, and saved tabs from being permanently lost.",
    },
    {
      id: "faq-3",
      q: "Why does TabStudio require a subscription?",
      a: "Running TabStudio requires ongoing infrastructure for storing projects, maintaining accounts, and supporting continued development of the app.\n\nSubscriptions help cover hosting, storage, maintenance, and future improvements.\n\nThe goal is to keep TabStudio sustainable while continuing to improve the experience for users.",
    },
    {
      id: "faq-4",
      q: "What happens if I cancel my subscription?",
      a: "If your subscription ends, your stored tabs are not deleted.\n\nYour tabs and projects remain safely stored in your account, but editing and access will be unavailable until your subscription is renewed.\n\nThis is designed to protect your work while keeping the service sustainable.",
    },
    {
      id: "faq-4b",
      q: "Can I cancel my membership?",
      a: "Yes.\n\nYou can cancel your subscription anytime.\n\nYour tabs remain safely stored in your account.",
    },
    {
      id: "faq-5",
      q: "Can I export my tabs?",
      a: "Yes.\n\nBand and Creator subscription plans can export tabs as clean PDF sheets, ideal for printing, rehearsals, and sharing with bandmates.\n\nThe Creator subscription plan can also export PNG images, making it easy to use tab overlays in lesson videos, tutorials, YouTube content, and social media posts.",
    },
    {
      id: "faq-6",
      q: "Does TabStudio auto-save my work?",
      a: "Yes.\n\nTabStudio automatically saves your work while you write. If you close the app, refresh the page, temporarily disconnect, or leave with an unfinished tab still in the grid, your progress should still be there when you return.\n\nThis helps protect unfinished ideas, riffs, and song sections from being lost.",
    },
    {
      id: "faq-7",
      q: "Can I organise multiple songs?",
      a: "Yes.\n\nTabStudio allows you to organise tabs and projects using an Artist → Album → Song structure, helping keep ideas tidy and easy to manage.\n\nThis makes it easier to store riffs, build songs over time, and quickly find projects again later.",
    },
    {
      id: "faq-8",
      q: "Will new features be added?",
      a: "Yes.\n\nTabStudio is an actively developing project and will continue evolving over time based on user feedback, feature requests, and real-world use.\n\nImprovements will focus on keeping the app simple, useful, and shaped by the needs of musicians.",
    },
    {
      id: "faq-9",
      q: "Is TabStudio mobile friendly?",
      a: "TabStudio is currently designed primarily for desktop and laptop use.\n\nAt the moment, the editing experience is not intended for mobile phones or tablets. In a future version, we plan to make tabs viewable on mobile and tablet devices, with direct image export to phone for Creator workflows.",
    },
    {
      id: "faq-10",
      q: "Can I use TabStudio for teaching or content creation?",
      a: "Yes.\n\nTabStudio is designed to help teachers and content creators create clean tab visuals for educational content.\n\nThe Creator subscription plan can export PNG tab images with adjustable backgrounds, font sizes, and styling, making it easier to overlay tab notation onto lesson videos, tutorials, and social media content.",
    },
    {
      id: "faq-11",
      q: "Do I need music theory knowledge to use TabStudio?",
      a: "No.\n\nTabStudio is designed to be simple and intuitive, allowing guitarists to quickly write tabs without requiring advanced music theory knowledge.\n\nThe focus is on getting ideas into tab clearly and easily.",
    },
    {
      id: "faq-12",
      q: "Can I send feature requests or feedback?",
      a: "Absolutely.\n\nUser feedback plays an important role in shaping the direction of TabStudio. Feature requests, bug reports, and general feedback are always welcome and help improve future versions of the app.",
    },
    {
      id: "faq-13",
      q: "Can I upgrade or downgrade my plan?",
      a: "Yes.\n\nYou can change your subscription plan at any time.\n\nIf you upgrade mid-billing cycle, you only pay the difference for the remaining time in your billing period.\n\nIf you downgrade, the new plan starts on your next billing cycle.",
    },
    {
      id: "faq-14",
      q: "What happens if I reach my tab limit?",
      a: "Solo plans allow up to 50 saved tabs.\n\nBand plans allow up to 250 saved tabs.\n\nCreator plans allow unlimited saved tabs.\n\nYou can upgrade your subscription anytime if you need more space.",
    },
    {
      id: "faq-15",
      q: "Do my tabs disappear if I cancel?",
      a: "No.\n\nYour tabs remain stored in your account.\n\nYou can reactivate your subscription later to continue editing or exporting them.",
    },
  ];
  const normalizedFaqQuery = faqQuery.trim().toLowerCase();
  const filteredFaqItems = useMemo(() => {
    if (!normalizedFaqQuery) return faqItems;
    return faqItems.filter((item) => {
      const haystack = `${item.q}\n${item.a}`.toLowerCase();
      return haystack.includes(normalizedFaqQuery);
    });
  }, [faqItems, normalizedFaqQuery]);
  const hasFaqSearch = normalizedFaqQuery.length > 0;
  const showFaqEmpty = filteredFaqItems.length === 0;
  const supportMessagingAvailable = true;
  const supportCanAttachImages = Boolean(supportPaidSubscriber || supportEverPaidSubscriber);
  const supportSubjectChars = supportSubject.length;
  const supportMessageChars = supportMessage.length;
  const isSupportSection = activeHelpSection === "support";
  const isHelpTabbyVisible = isSupportSection || !helpTabbyDismissed;
  const canQuickFillSupportEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(supportUserEmail || "").trim());
  const showSupportInstagramOption = Boolean(supportPaidSubscriber || supportEverPaidSubscriber);
  const tabbyBubbleVisible = tabbyMessageMode !== "idle";
  const tabbyBubbleText = tabbyMessageMode === "success"
    ? "Thanks for reaching out!\nYour message has been sent.\nWe'll get back to you if needed."
    : tabbyMessageMode === "intro"
      ? tabbySpeechIndex === 0
        ? "Hi, I'm Tabby 👋"
        : tabbySpeechIndex === 1
          ? "I help keep TabStudio improving."
          : "Send feedback to help improve my home!"
      : "";
  const supportFieldStyle = (fieldName) => ({
    ...getTabStudioInteractiveFieldStyle({
      focused: supportFocusedField === fieldName,
      hovered: supportHoveredField === fieldName,
      minHeight: 40,
      padding: fieldName === "message" ? "10px 12px" : "0 12px",
      fontSize: 14,
      fontWeight: 700,
    }),
    border: supportFormErrors[fieldName]
      ? `1px solid ${withAlpha("#FF5A67", 0.72)}`
      : supportFocusedField === fieldName
      ? "1px solid rgba(66,201,149,0.6)"
      : supportHoveredField === fieldName
      ? "1px solid rgba(255,255,255,0.18)"
      : "1px solid rgba(255,255,255,0.08)",
    fontStyle: "normal",
    opacity: 1,
    "--support-placeholder-color": "rgba(255,255,255,0.46)",
    lineHeight: 1.4,
    boxShadow:
      supportFocusedField === fieldName
        ? "0 0 0 2px rgba(66,201,149,0.15)"
        : "none",
  });
  const supportEmailLooksValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  const supportMessageLooksReady = (value) => String(value || "").trim().length >= 12;
  const supportSendReady = supportEmailLooksValid(supportSenderEmail) && supportMessageLooksReady(supportMessage);
  const isAllowedSupportImageFile = (file) => {
    const mime = String(file?.type || "").toLowerCase();
    if (["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(mime)) return true;
    const name = String(file?.name || "").toLowerCase();
    return [".png", ".jpg", ".jpeg", ".webp"].some((ext) => name.endsWith(ext));
  };
  const addSupportImages = (incomingFiles) => {
    const files = Array.from(incomingFiles || []);
    if (!files.length) return;
    const validFiles = files.filter((file) => isAllowedSupportImageFile(file));
    const remaining = Math.max(0, 5 - supportAttachedImages.length);
    const filesToAdd = validFiles.slice(0, remaining);
    const ignoredByType = files.length - validFiles.length;
    const ignoredByLimit = validFiles.length - filesToAdd.length;
    if (filesToAdd.length) {
      setSupportAttachedImages((prev) => [...prev, ...filesToAdd].slice(0, 5));
    }
    if (ignoredByType > 0) {
      setSupportAttachmentError("Only PNG, JPG, JPEG, and WEBP files are supported.");
    } else if (ignoredByLimit > 0 || files.length > remaining) {
      setSupportAttachmentError("You can attach up to 5 images.");
    } else {
      setSupportAttachmentError("");
    }
  };
  const removeSupportImageAt = (idx) => {
    setSupportAttachedImages((prev) => prev.filter((_, i) => i !== idx));
    setSupportAttachmentError("");
  };
  const smoothScrollHelpTo = (targetEl, extraOffset = 8, duration = 420) => {
    try {
      const scroller = helpScrollRef.current;
      if (!scroller || !targetEl) return;
      const scrollerRect = scroller.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const from = scroller.scrollTop;
      const to = Math.max(0, from + (targetRect.top - scrollerRect.top) - extraOffset);
      const distance = to - from;
      const start = performance.now();
      const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      const step = (now) => {
        const elapsed = now - start;
        const p = Math.min(1, elapsed / duration);
        scroller.scrollTop = from + distance * easeInOutCubic(p);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    } catch {}
  };
  const beginSupportFormSwap = () => {
    if (!supportMessagingAvailable || supportShowForm) return;
    setSupportFormErrors({});
    setSupportLeftVisible(false);
    if (supportSwapTimerRef.current) window.clearTimeout(supportSwapTimerRef.current);
    supportSwapTimerRef.current = window.setTimeout(() => {
      setSupportShowForm(true);
      setSupportLeftVisible(true);
      smoothScrollHelpTo(supportRef.current, 8);
      supportSwapTimerRef.current = null;
    }, 220);
  };
  const returnToSupportInfo = () => {
    if (!supportShowForm) {
      smoothScrollHelpTo(supportRef.current, 8);
      return;
    }
    setSupportFormErrors({});
    setSupportLeftVisible(false);
    if (supportSwapTimerRef.current) window.clearTimeout(supportSwapTimerRef.current);
    supportSwapTimerRef.current = window.setTimeout(() => {
      setSupportShowForm(false);
      setSupportLeftVisible(true);
      smoothScrollHelpTo(supportRef.current, 8);
      supportSwapTimerRef.current = null;
    }, 220);
  };
  const onSubmitSupportMessage = async (e) => {
    e.preventDefault();
    if (!supportMessagingAvailable || supportSending) return;
    const nextErrors = {};
    const nextEmail = String(supportSenderEmail || "").trim();
    const nextSubject = String(supportSubject || "").trim();
    const nextMessage = String(supportMessage || "").trim();
    if (!supportEmailLooksValid(nextEmail)) nextErrors.email = "Please enter a valid email address.";
    if (!nextSubject) nextErrors.subject = "Please add a subject.";
    if (nextSubject.length > 120) nextErrors.subject = "Subject must be 120 characters or less.";
    if (!nextMessage) nextErrors.message = "Please add a message.";
    if (nextMessage.length > 800) nextErrors.message = "Message must be 800 characters or less.";
    setSupportFormErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSupportSending(true);
    try {
      const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").trim().replace(/\/+$/g, "");
      const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
      if (!supabaseUrl || !anonKey) {
        throw new Error("Support email service is not configured.");
      }

      const functionUrl = `${supabaseUrl}/functions/v1/send-transactional-email`;
      const supportEmailPayload = {
        to: "support@tabstudio.app",
        subject: `Support Request: ${nextSubject}`,
        from: "TabStudio <support@tabstudio.app>",
        html: `
          <p><strong>Sender:</strong> ${nextEmail}</p>
          <p><strong>Subject:</strong> ${nextSubject}</p>
          <p><strong>Message:</strong></p>
          <p>${nextMessage.replace(/\n/g, "<br/>")}</p>
          <p><strong>Attachment count:</strong> ${supportAttachedImages.length}</p>
          <p><strong>Attachment names:</strong> ${
            supportAttachedImages.length
              ? supportAttachedImages.map((file) => String(file?.name || "").trim()).filter(Boolean).join(", ")
              : "None"
          }</p>
        `,
      };
      const requesterEmailPayload = {
        to: nextEmail,
        template_type: "support_received",
        template_data: {},
      };

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      };

      const [supportEmailResponse, requesterEmailResponse] = await Promise.all([
        fetch(functionUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(supportEmailPayload),
        }),
        fetch(functionUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(requesterEmailPayload),
        }),
      ]);

      if (!supportEmailResponse.ok || !requesterEmailResponse.ok) {
        const supportErrorText = supportEmailResponse.ok ? "" : await supportEmailResponse.text().catch(() => "");
        const requesterErrorText = requesterEmailResponse.ok ? "" : await requesterEmailResponse.text().catch(() => "");
        throw new Error(
          `Support email failed. support_status=${supportEmailResponse.status} requester_status=${requesterEmailResponse.status} support_body=${supportErrorText} requester_body=${requesterErrorText}`
        );
      }
    } catch (error) {
      console.error("[HelpHubPage] support email submission failed", error);
      setSupportFormErrors({
        form: "We couldn't send your support request right now. Please try again.",
      });
      setSupportSending(false);
      return;
    }

    setSupportSenderEmail("");
    setSupportSubject("");
    setSupportMessage("");
    setSupportAttachedImages([]);
    setSupportAttachmentError("");
    setSupportFormErrors({});
    setSupportSending(false);
    clearSupportTabbySpeechSequence();
    setTabbySpeechTrigger(0);
    setTabbyMessageMode("success");
    setTabbySpeechPlaying(false);
    setTabbySpeechIndex(0);
    setSupportIntroConsumed(true);
    supportSpeechTriggeredForActivationRef.current = true;
    setSupportLeftVisible(false);
    if (supportSwapTimerRef.current) window.clearTimeout(supportSwapTimerRef.current);
    supportSwapTimerRef.current = window.setTimeout(() => {
      setSupportShowForm(false);
      setSupportLeftVisible(true);
      smoothScrollHelpTo(supportRef.current, 8, 620);
      supportSwapTimerRef.current = null;
    }, 220);
    if (supportThanksTimerRef.current) window.clearTimeout(supportThanksTimerRef.current);
    supportThanksTimerRef.current = window.setTimeout(() => {
      setTabbyMessageMode("idle");
      supportThanksTimerRef.current = null;
    }, 3600);
  };
  const scrollToRef = (ref) => {
    try {
      const nextId = String(ref?.current?.id || "").toLowerCase();
      if (nextId) setActiveHelpSection(nextId);
      ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {}
  };
  const headerRightContent = (
    <>
      <button
        type="button"
        onClick={onBack}
        onMouseEnter={() => setHelpHeaderHoverBtn("back")}
        onMouseLeave={() => setHelpHeaderHoverBtn((prev) => (prev === "back" ? "" : prev))}
        onFocus={() => setHelpHeaderHoverBtn("back")}
        onBlur={() => setHelpHeaderHoverBtn((prev) => (prev === "back" ? "" : prev))}
        onPointerDown={() => setHelpHeaderPressedBtn("back")}
        onPointerUp={() => setHelpHeaderPressedBtn("")}
        onPointerCancel={() => setHelpHeaderPressedBtn("")}
        style={siteHeaderEditorLinkStyle(HELP_THEME, { hovered: helpHeaderHoverBtn === "back" })}
      >
        Editor
      </button>
      <button
        type="button"
        onClick={onGoSettings}
        onMouseEnter={() => setHelpHeaderHoverBtn("settings")}
        onMouseLeave={() => setHelpHeaderHoverBtn((prev) => (prev === "settings" ? "" : prev))}
        onFocus={() => setHelpHeaderHoverBtn("settings")}
        onBlur={() => setHelpHeaderHoverBtn((prev) => (prev === "settings" ? "" : prev))}
        onPointerDown={() => setHelpHeaderPressedBtn("settings")}
        onPointerUp={() => setHelpHeaderPressedBtn("")}
        onPointerCancel={() => setHelpHeaderPressedBtn("")}
        style={{
          ...siteHeaderSecondaryButtonStyle(HELP_THEME, {
            hovered: helpHeaderHoverBtn === "settings",
            pressed: helpHeaderPressedBtn === "settings",
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
        background: HELP_THEME.bg,
        color: HELP_THEME.text,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        display: "grid",
        gridTemplateRows: "auto auto minmax(0, 1fr)",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <AppHeader
        shared={{
          isDark: isHelpDarkMode,
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
          theme: HELP_THEME,
        }}
      />
      <div
        style={{
          position: "sticky",
          top: 74,
          zIndex: 45,
          padding: "8px 18px",
          background: HELP_THEME.bg,
          borderBottom: `1px solid ${HELP_THEME.border}`,
          boxShadow: "0 8px 20px rgba(0,0,0,0.04)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          overflowX: "auto",
        }}
      >
        <button
          type="button"
          onClick={() => scrollToRef(aboutRef)}
          onMouseEnter={() => setHoveredHelpNavButton("about")}
          onMouseLeave={() => setHoveredHelpNavButton((prev) => (prev === "about" ? "" : prev))}
          onFocus={() => setHoveredHelpNavButton("about")}
          onBlur={() => setHoveredHelpNavButton((prev) => (prev === "about" ? "" : prev))}
          style={navPillFor("about")}
        >
          About
        </button>
        <button
          type="button"
          onClick={() => scrollToRef(developerRef)}
          onMouseEnter={() => setHoveredHelpNavButton("developer")}
          onMouseLeave={() => setHoveredHelpNavButton((prev) => (prev === "developer" ? "" : prev))}
          onFocus={() => setHoveredHelpNavButton("developer")}
          onBlur={() => setHoveredHelpNavButton((prev) => (prev === "developer" ? "" : prev))}
          style={navPillFor("developer")}
        >
          Developer
        </button>
        <button
          type="button"
          onClick={() => scrollToRef(faqRef)}
          onMouseEnter={() => setHoveredHelpNavButton("faq")}
          onMouseLeave={() => setHoveredHelpNavButton((prev) => (prev === "faq" ? "" : prev))}
          onFocus={() => setHoveredHelpNavButton("faq")}
          onBlur={() => setHoveredHelpNavButton((prev) => (prev === "faq" ? "" : prev))}
          style={navPillFor("faq")}
        >
          FAQs
        </button>
        <button
          type="button"
          onClick={() => scrollToRef(supportRef)}
          onMouseEnter={() => setHoveredHelpNavButton("support")}
          onMouseLeave={() => setHoveredHelpNavButton((prev) => (prev === "support" ? "" : prev))}
          onFocus={() => setHoveredHelpNavButton("support")}
          onBlur={() => setHoveredHelpNavButton((prev) => (prev === "support" ? "" : prev))}
          style={navPillFor("support")}
        >
          Support
        </button>
      </div>
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
          ref={helpScrollRef}
          style={{
          width: "calc(100vw - 32px)",
          maxWidth: 1680,
          borderRadius: 16,
          border: `1px solid ${HELP_THEME.border}`,
          background: HELP_THEME.surfaceWarm,
          padding: 26,
          boxSizing: "border-box",
          display: "grid",
          gap: 18,
          minHeight: 0,
          maxHeight: "100%",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "grid", gap: 6 }}>
          <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>Help &amp; Information</h1>
          <div style={{ fontSize: 15, color: HELP_THEME.textFaint, fontWeight: 700 }}>
            Everything you need to know about TabStudio.
          </div>
        </div>

        <AboutPage
          shared={{
            aboutRef,
            HELP_THEME,
            sectionStyle,
          }}
        />

        <section id="developer" ref={developerRef} style={sectionStyle("developer")}>
          <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.15 }}>About the Developer</h2>
          <div
            style={{
              borderRadius: 12,
              border: `1px solid ${HELP_THEME.border}`,
              background: HELP_THEME.surfaceWarm,
              padding: 14,
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                aria-label="Developer profile image placeholder"
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 999,
                  border: `1px solid ${HELP_THEME.border}`,
                  backgroundImage: `url(${developerPhoto})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.2 }}>Harry Bolton</div>
                <div style={{ marginTop: 2, fontSize: 12, color: HELP_THEME.textFaint, fontWeight: 800 }}>
                  Creator of TabStudio
                </div>
              </div>
            </div>
            <div style={{ color: HELP_THEME.textFaint, lineHeight: 1.6, fontSize: 16 }}>
              TabStudio started as a personal project after years of writing guitar tabs and feeling frustrated with how
              complicated traditional tab software could be.
              <br />
              <br />
              I wanted a simple place to quickly write ideas, store tabs, and easily find them again later, without relying on
              scraps of paper, scattered notes, or clunky, outdated tab apps.
              <br />
              <br />
              Like many guitarists, I would often write a riff I really liked, only to forget it the next time I picked up the
              guitar. We don’t all play every day, and good ideas can disappear quickly if they’re not written down somewhere.
              <br />
              <br />
              What began as a small tool for myself gradually evolved into TabStudio. After using it for my own tabs, it became
              clear that other guitarists could benefit from a simple tab writing tool focused on speed and ease of use, no
              complex music theory required, just getting ideas straight into tab.
              <br />
              <br />
              My goal is to keep building a clean, focused tool shaped by feedback from real musicians and the guitar community.
              <br />
              <br />
              TabStudio will continue evolving over time, with improvements guided by user feedback and feature requests wherever
              possible.
              <br />
              <br />
              If you have ideas, feature requests, or run into issues,{" "}
              <button
                type="button"
                onClick={() => scrollToRef(supportRef)}
                onMouseEnter={() => setDeveloperFeedbackHover(true)}
                onMouseLeave={() => setDeveloperFeedbackHover(false)}
                onFocus={() => setDeveloperFeedbackHover(true)}
                onBlur={() => setDeveloperFeedbackHover(false)}
                style={{
                  display: "inline",
                  padding: 0,
                  border: "none",
                  background: "transparent",
                  color: developerFeedbackHover ? TABBY_ASSIST_MINT_STRONG : TABBY_ASSIST_MINT,
                  fontSize: "inherit",
                  lineHeight: "inherit",
                  fontWeight: 800,
                  textDecoration: "underline",
                  textUnderlineOffset: developerFeedbackHover ? 3 : 2,
                  cursor: "pointer",
                  transition: "color 140ms ease, text-underline-offset 140ms ease",
                }}
              >
                please send feedback
              </button>
              , it genuinely helps shape the future of the app.
            </div>
          </div>
        </section>

        <section id="faq" ref={faqRef} style={sectionStyle("faq")}>
          <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.15 }}>Frequently Asked Questions</h2>
          <div
            style={{
              display: "grid",
              gap: 6,
              borderRadius: 12,
              border: `1px solid ${HELP_THEME.border}`,
              background: HELP_THEME.surfaceWarm,
              padding: 12,
            }}
          >
            <label
              htmlFor="faq-search"
              style={{ fontSize: 13, fontWeight: 850, color: HELP_THEME.textFaint, letterSpacing: 0.2 }}
            >
              Search FAQs
            </label>
            <input
              id="faq-search"
              type="text"
              value={faqQuery}
              onChange={(e) => setFaqQuery(e.target.value)}
              onMouseEnter={() => setFaqSearchHovered(true)}
              onMouseLeave={() => setFaqSearchHovered(false)}
              onFocus={() => setFaqSearchFocused(true)}
              onBlur={() => setFaqSearchFocused(false)}
              placeholder="Search by keyword, for example: export, PNG, subscription, mobile"
              autoComplete="off"
              spellCheck={false}
              style={getTabStudioInteractiveFieldStyle({
                focused: faqSearchFocused,
                hovered: faqSearchHovered,
                minHeight: 42,
                padding: "0 12px",
                fontSize: 15,
                fontWeight: 700,
              })}
            />
            <div style={{ color: HELP_THEME.textMuted, fontSize: 12, lineHeight: 1.45 }}>
              Try terms like subscription, account, cancel subscription, renew subscription, export, PDF, PNG, auto-save, mobile, phone, or content creator.
            </div>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {showFaqEmpty && (
              <div
                style={{
                  borderRadius: 12,
                  border: `1px solid ${HELP_THEME.border}`,
                  background: HELP_THEME.surfaceWarm,
                  padding: "12px 14px",
                  color: HELP_THEME.textFaint,
                  fontSize: 15,
                  lineHeight: 1.55,
                }}
              >
                No matching FAQs found. Try terms like export, subscription, PNG, mobile, or auto-save.
              </div>
            )}
            {filteredFaqItems.map((item) => {
              const open = hasFaqSearch || openFaqId === item.id;
              return (
                <div
                  key={item.id}
                  style={faqRowVisual(HELP_THEME, withAlpha, {
                    open,
                    hovered: hoveredFaqId === item.id,
                    isDarkMode: isHelpDarkMode,
                  })}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqId((prev) => (prev === item.id ? "" : item.id))}
                    onMouseEnter={() => setHoveredFaqId(item.id)}
                    onMouseLeave={() => setHoveredFaqId((prev) => (prev === item.id ? "" : prev))}
                    onFocus={() => setHoveredFaqId(item.id)}
                    onBlur={() => setHoveredFaqId((prev) => (prev === item.id ? "" : prev))}
                    style={{
                      width: "100%",
                      minHeight: 54,
                      padding: "12px 16px",
                      border: "none",
                      background: "transparent",
                      color: HELP_THEME.text,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      fontWeight: 900,
                      fontSize: 17,
                      lineHeight: 1.3,
                      textAlign: "left",
                      cursor: "pointer",
                      outline: "none",
                      boxShadow: "none",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <span style={{ flex: 1 }}>{item.q}</span>
                    <span
                      style={{
                        fontSize: 12,
                        opacity: open ? 1 : 0.82,
                        color: open ? HELP_THEME.accent : HELP_THEME.textFaint,
                        transition: "color 160ms ease, opacity 160ms ease, transform 160ms ease",
                        transform: open ? "translateY(-1px)" : "none",
                      }}
                    >
                      {open ? "▲" : "▼"}
                    </span>
                  </button>
                  {open && (
                    <div
                      style={{
                        borderTop: `1px solid ${HELP_THEME.border}`,
                        background: withAlpha(HELP_THEME.text, isHelpDarkMode ? 0.015 : 0.012),
                        padding: "14px 16px 16px",
                        color: HELP_THEME.textFaint,
                        lineHeight: 1.6,
                        fontSize: 16,
                        whiteSpace: "pre-line",
                      }}
                    >
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section id="support" ref={supportRef} style={sectionStyle("support")}>
          <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.15 }}>Support</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div
              style={{
                borderRadius: 12,
                border: `1px solid ${HELP_THEME.border}`,
                background: HELP_THEME.surfaceWarm,
                padding: 14,
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                overflow: "hidden",
                color: HELP_THEME.textFaint,
                lineHeight: 1.6,
                fontSize: 16,
                minHeight: 336,
                display: "grid",
                alignContent: "center",
              }}
            >
              <div
                style={{
                  width: "100%",
                  minWidth: 0,
                  boxSizing: "border-box",
                  opacity: supportLeftVisible ? 1 : 0,
                  transform: `translateY(${supportLeftVisible ? 0 : 4}px)`,
                  transition: "opacity 220ms ease, transform 220ms ease",
                }}
              >
                {!supportShowForm && (
                  <div>
                    <p>
                      If you encounter a bug, have a question, or want to suggest a feature,
                      <br />
                      you can contact the TabStudio team directly.
                    </p>
                    <p>Your feedback helps improve the editor and shape future updates.</p>
                    <p>
                      We welcome:
                      <br />
                      • bug reports
                      <br />
                      • feature ideas
                      <br />
                      • workflow suggestions
                      <br />
                      • general feedback
                    </p>
                    <p style={{ marginBottom: 0 }}>TabStudio is an independent project.</p>
                    <p style={{ marginTop: 8 }}>User feedback plays an important role in improving the experience.</p>
                    <p style={{ marginTop: 10, marginBottom: 8, fontSize: 14, color: HELP_THEME.text }}>
                      Need help? You can message the TabStudio team here.
                    </p>
                    <button
                      type="button"
                      onClick={beginSupportFormSwap}
                      onMouseEnter={() => setContactSupportBtnHover(true)}
                      onMouseLeave={() => setContactSupportBtnHover(false)}
                      onFocus={() => setContactSupportBtnHover(true)}
                      onBlur={() => setContactSupportBtnHover(false)}
                      style={{
                        marginTop: 2,
                        minHeight: 38,
                        padding: "0 14px",
                        borderRadius: 999,
                        border: "1px solid transparent",
                        background: contactSupportBtnHover ? TABBY_ASSIST_MINT_STRONG : TABBY_ASSIST_MINT,
                        color: "#0b1110",
                        fontSize: 14,
                        fontWeight: 850,
                        cursor: "pointer",
                        transition: "background 140ms ease, box-shadow 140ms ease",
                        boxShadow: contactSupportBtnHover ? `0 8px 16px ${withAlpha(TABBY_ASSIST_MINT, 0.28)}` : "none",
                      }}
                    >
                      Contact Support
                    </button>
                  </div>
                )}
                {supportShowForm && (
                  <form
                    onSubmit={onSubmitSupportMessage}
                    noValidate
                    style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, width: "100%", minWidth: 0, boxSizing: "border-box" }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: HELP_THEME.textFaint, marginBottom: 6 }}>Sender Email</div>
                      <div style={{ position: "relative" }}>
                        <input
                          className={supportFormFieldClass}
                          type="email"
                          value={supportSenderEmail}
                          onChange={(e) => {
                            const next = e.target.value;
                            setSupportSenderEmail(next);
                            if (supportFormErrors.email) {
                              setSupportFormErrors((prev) => {
                                const updated = { ...prev };
                                if (!next.trim() || supportEmailLooksValid(next)) delete updated.email;
                                return updated;
                              });
                            }
                          }}
                          onFocus={() => setSupportFocusedField("email")}
                          onMouseEnter={() => setSupportHoveredField("email")}
                          onMouseLeave={() => setSupportHoveredField((prev) => (prev === "email" ? "" : prev))}
                          onBlur={() => {
                            setSupportFocusedField((prev) => (prev === "email" ? "" : prev));
                            const nextEmail = String(supportSenderEmail || "").trim();
                            setSupportFormErrors((prev) => {
                              const updated = { ...prev };
                              if (nextEmail && !supportEmailLooksValid(nextEmail)) {
                                updated.email = "Please enter a valid email address.";
                              } else {
                                delete updated.email;
                              }
                              return updated;
                            });
                          }}
                          style={{
                            ...supportFieldStyle("email"),
                            paddingRight: canQuickFillSupportEmail ? 94 : 12,
                          }}
                          placeholder="you@example.com"
                          autoComplete="email"
                        />
                        {canQuickFillSupportEmail ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSupportSenderEmail(String(supportUserEmail || "").trim());
                              setSupportFormErrors((prev) => {
                                if (!prev.email) return prev;
                                const updated = { ...prev };
                                delete updated.email;
                                return updated;
                              });
                            }}
                            style={{
                              position: "absolute",
                              top: "50%",
                              right: 8,
                              transform: "translateY(-50%)",
                              minHeight: 24,
                              padding: "0 8px",
                              borderRadius: 999,
                              border: `1px solid ${HELP_THEME.border}`,
                              background: withAlpha(HELP_THEME.text, isHelpDarkMode ? 0.06 : 0.04),
                              color: HELP_THEME.textMuted,
                              fontSize: 11,
                              fontWeight: 700,
                              lineHeight: 1,
                              cursor: "pointer",
                            }}
                            title="Use account email"
                            aria-label="Use account email"
                          >
                            Use account email
                          </button>
                        ) : null}
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          minHeight: 16,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          fontSize: 12,
                          lineHeight: 1.3,
                        }}
                      >
                        <span style={{ color: withAlpha(HELP_THEME.text, isHelpDarkMode ? 0.46 : 0.42), fontStyle: "italic" }}>We'll reply here if needed.</span>
                        <span style={{ color: supportFormErrors.email ? "#FF6E7A" : "transparent", fontWeight: 700 }}>
                          {supportFormErrors.email || " "}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: HELP_THEME.textFaint, marginBottom: 6 }}>Subject</div>
                      <input
                        className={supportFormFieldClass}
                        type="text"
                        value={supportSubject}
                        onChange={(e) => {
                          const next = e.target.value.slice(0, 120);
                          setSupportSubject(next);
                          setSupportFormErrors((prev) => {
                            if (!prev.subject) return prev;
                            const updated = { ...prev };
                            if (String(next || "").trim().length > 0) delete updated.subject;
                            else updated.subject = "Please add a subject.";
                            return updated;
                          });
                        }}
                        onFocus={() => setSupportFocusedField("subject")}
                        onMouseEnter={() => setSupportHoveredField("subject")}
                        onMouseLeave={() => setSupportHoveredField((prev) => (prev === "subject" ? "" : prev))}
                        onBlur={() => setSupportFocusedField((prev) => (prev === "subject" ? "" : prev))}
                        style={supportFieldStyle("subject")}
                        placeholder="Brief summary of your message"
                        maxLength={120}
                      />
                      <div
                        style={{
                          marginTop: 6,
                          minHeight: 16,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          fontSize: 12,
                          lineHeight: 1.3,
                        }}
                      >
                        <span style={{ color: withAlpha(HELP_THEME.text, isHelpDarkMode ? 0.42 : 0.38) }}> </span>
                        <span style={{ color: supportFormErrors.subject ? "#FF6E7A" : HELP_THEME.textMuted, fontWeight: supportFormErrors.subject ? 700 : 500 }}>
                          {supportFormErrors.subject || `${supportSubjectChars} / 120`}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: HELP_THEME.textFaint, marginBottom: 6 }}>Message</div>
                      <textarea
                        className={supportFormFieldClass}
                        value={supportMessage}
                        onChange={(e) => {
                          const next = e.target.value.slice(0, 800);
                          setSupportMessage(next);
                          setSupportFormErrors((prev) => {
                            if (!prev.message) return prev;
                            const updated = { ...prev };
                            if (String(next || "").trim().length > 0) delete updated.message;
                            else updated.message = "Please add a message.";
                            return updated;
                          });
                        }}
                        onFocus={() => setSupportFocusedField("message")}
                        onMouseEnter={() => setSupportHoveredField("message")}
                        onMouseLeave={() => setSupportHoveredField((prev) => (prev === "message" ? "" : prev))}
                        onBlur={() => setSupportFocusedField((prev) => (prev === "message" ? "" : prev))}
                        style={{
                          ...supportFieldStyle("message"),
                          minHeight: 132,
                          resize: "vertical",
                          fontFamily: "inherit",
                        }}
                        placeholder="Describe the issue, idea, or question…"
                        maxLength={800}
                      />
                      <div
                        style={{
                          marginTop: 6,
                          minHeight: 16,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          fontSize: 12,
                          lineHeight: 1.3,
                        }}
                      >
                        <span style={{ color: withAlpha(HELP_THEME.text, isHelpDarkMode ? 0.46 : 0.42), fontStyle: "italic" }}>Include steps to reproduce bugs if possible.</span>
                        <span style={{ color: supportFormErrors.message ? "#FF6E7A" : HELP_THEME.textMuted, fontWeight: supportFormErrors.message ? 700 : 500 }}>
                          {supportFormErrors.message || `${supportMessageChars} / 800`}
                        </span>
                      </div>
                    </div>
                    {supportCanAttachImages ? (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: HELP_THEME.textFaint, marginBottom: 6 }}>Images (optional)</div>
                        <input
                          className={supportFormFieldClass}
                          type="file"
                          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                          multiple
                          onChange={(e) => {
                            addSupportImages(e.target.files);
                            e.target.value = "";
                          }}
                          onFocus={() => setSupportFocusedField("attachments")}
                          onBlur={() => setSupportFocusedField((prev) => (prev === "attachments" ? "" : prev))}
                          onMouseEnter={() => setSupportHoveredField("attachments")}
                          onMouseLeave={() => setSupportHoveredField((prev) => (prev === "attachments" ? "" : prev))}
                          style={{
                            ...supportFieldStyle("attachments"),
                            minHeight: 38,
                            paddingTop: 8,
                            paddingBottom: 8,
                            fontWeight: 600,
                          }}
                        />
                        <div
                          style={{
                            marginTop: 6,
                            minHeight: 16,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                            fontSize: 12,
                            lineHeight: 1.3,
                          }}
                        >
                          <span style={{ color: HELP_THEME.textMuted }}>Add up to 5 screenshots if helpful.</span>
                          <span style={{ color: supportAttachmentError ? "#FF6E7A" : HELP_THEME.textMuted, fontWeight: supportAttachmentError ? 700 : 500 }}>
                            {supportAttachmentError || `${supportAttachedImages.length} / 5`}
                          </span>
                        </div>
                        {supportAttachedImages.length > 0 ? (
                          <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                            {supportAttachedImages.map((file, idx) => (
                              <div
                                key={`${file.name}-${file.size}-${idx}`}
                                style={{
                                  minHeight: 28,
                                  borderRadius: 8,
                                  border: `1px solid ${HELP_THEME.border}`,
                                  background: HELP_THEME.surface,
                                  padding: "4px 8px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 8,
                                  fontSize: 12,
                                  color: HELP_THEME.textFaint,
                                }}
                              >
                                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
                                <button
                                  className="support-remove-attachment-btn"
                                  type="button"
                                  onClick={() => removeSupportImageAt(idx)}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    color: "rgba(255,255,255,0.6)",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    padding: 0,
                                    cursor: "pointer",
                                    transition: "color 0.15s ease",
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {supportFormErrors.form ? (
                      <div
                        style={{
                          marginTop: -2,
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#FF6E7A",
                        }}
                      >
                        {supportFormErrors.form}
                      </div>
                    ) : null}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        marginTop: 4,
                      }}
                    >
                      <button
                        type="button"
                        onClick={returnToSupportInfo}
                        onMouseEnter={() => setSupportReturnLinkHover(true)}
                        onMouseLeave={() => setSupportReturnLinkHover(false)}
                        onFocus={() => setSupportReturnLinkHover(true)}
                        onBlur={() => setSupportReturnLinkHover(false)}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: supportReturnLinkHover
                            ? withAlpha(HELP_THEME.text, isHelpDarkMode ? 0.74 : 0.7)
                            : withAlpha(HELP_THEME.text, isHelpDarkMode ? 0.58 : 0.56),
                          fontSize: 13,
                          fontWeight: 800,
                          padding: 0,
                          cursor: "pointer",
                          textDecoration: supportReturnLinkHover ? "underline" : "none",
                          textUnderlineOffset: 3,
                          transition: "color 180ms ease, text-decoration-color 180ms ease",
                        }}
                      >
                        Return to Support
                      </button>
                      <button
                        type="submit"
                        disabled={supportSending}
                        onMouseEnter={() => setSupportSendBtnHover(true)}
                        onMouseLeave={() => setSupportSendBtnHover(false)}
                        onFocus={() => setSupportSendBtnHover(true)}
                        onBlur={() => setSupportSendBtnHover(false)}
                        style={{
                          minHeight: 38,
                          padding: "0 14px",
                          borderRadius: 999,
                          border: supportSendReady ? "1px solid transparent" : `1px solid ${withAlpha(HELP_THEME.accent, 0.7)}`,
                          background: supportSendReady
                            ? supportSendBtnHover
                              ? TABBY_ASSIST_MINT_STRONG
                              : TABBY_ASSIST_MINT
                            : withAlpha(HELP_THEME.accent, isHelpDarkMode ? 0.12 : 0.08),
                          color: supportSendReady
                            ? "#0b1110"
                            : supportSendBtnHover
                              ? withAlpha(HELP_THEME.text, isHelpDarkMode ? 0.78 : 0.74)
                              : withAlpha(HELP_THEME.text, isHelpDarkMode ? 0.64 : 0.62),
                          fontSize: 14,
                          fontWeight: 850,
                          cursor: supportSending ? "default" : "pointer",
                          opacity: supportSending ? 0.72 : 1,
                          transition: "color 180ms ease, background 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
                          boxShadow: supportSendReady && supportSendBtnHover ? `0 8px 16px ${withAlpha(TABBY_ASSIST_MINT, 0.28)}` : "none",
                        }}
                      >
                        {supportSending ? "Sending..." : "Send Message"}
                      </button>
                    </div>
                  </form>
                )}
                {showSupportInstagramOption ? (
                  <div
                    style={{
                      marginTop: 14,
                      paddingTop: 10,
                      borderTop: `1px solid ${HELP_THEME.border}`,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <a
                      href="https://instagram.com/tabstudio.app"
                      target="_blank"
                      rel="noopener"
                      onMouseEnter={() => setSupportInstagramHover(true)}
                      onMouseLeave={() => setSupportInstagramHover(false)}
                      onFocus={() => setSupportInstagramHover(true)}
                      onBlur={() => setSupportInstagramHover(false)}
                      aria-label="Open TabStudio Instagram"
                      title="Open TabStudio Instagram"
                      style={{
                        width: "100%",
                        background: supportInstagramHover ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${supportInstagramHover ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: 10,
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                        transform: supportInstagramHover ? "translateY(-1px)" : "translateY(0)",
                        transition: "background 0.15s ease, border 0.15s ease, transform 0.15s ease",
                        color: HELP_THEME.textMuted,
                        fontSize: 12,
                        fontStyle: "italic",
                        textDecoration: "none",
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
                          filter: supportInstagramHover ? "brightness(1.08)" : "brightness(1)",
                          transition: "filter 160ms ease",
                          flexShrink: 0,
                        }}
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <rect x="3.9" y="3.9" width="16.2" height="16.2" rx="5.1" stroke="#FFFFFF" strokeWidth="2.1" />
                          <circle cx="12" cy="12" r="4.7" stroke="#FFFFFF" strokeWidth="2.1" />
                          <circle cx="17.5" cy="6.7" r="1.45" fill="#FFFFFF" />
                        </svg>
                      </span>
                      <span style={{ color: HELP_THEME.textMuted }}>
                        Prefer Instagram? Follow us and drop us a message there.
                      </span>
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
            {isHelpTabbyVisible ? (
            <div style={{ display: "grid", alignItems: "center", justifyItems: "center", marginTop: 14 }}>
              <div
                style={{
                  position: "relative",
                  transform: `translateY(${tabbyFloatUp ? -6 : 2}px)`,
                  transition: "transform 2100ms cubic-bezier(0.42, 0, 0.28, 1)",
                  width: 260,
                  height: 260,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: 236,
                    height: 236,
                    transform: "translate(-50%, -50%)",
                    borderRadius: "50%",
                    background: `radial-gradient(circle at center, ${withAlpha("#FFFFFF", isHelpDarkMode ? 0.24 : 0.12)} 0%, ${withAlpha("#FFFFFF", isHelpDarkMode ? 0.12 : 0.06)} 42%, transparent 74%)`,
                    filter: "blur(1px)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    width: "min(210px, 100%)",
                  }}
                >
                  <TabbySpeechBubble
                    theme={HELP_THEME}
                    isDark={isHelpDarkMode}
                    accentColor={TABBY_ASSIST_MINT}
                    variant="normal"
                    visible={tabbyBubbleVisible}
                    bubbleWidth={238}
                    bubbleMaxWidth={238}
                    tailSide="bottom-center"
                    withAlpha={withAlpha}
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "14%",
                      transform: `translate(-50%, calc(-100% - ${tabbyBubbleVisible ? 18 : 6}px))`,
                      transition: "opacity 460ms ease, transform 460ms ease",
                    }}
                  >
                    {tabbyBubbleText}
                  </TabbySpeechBubble>
                  <button
                    type="button"
                    onDoubleClick={() => {
                      if (isSupportSection) return;
                      setHelpTabbyDismissed(true);
                      setTabbyMessageMode("idle");
                      setTabbySpeechPlaying(false);
                      clearSupportTabbySpeechSequence();
                    }}
                    style={{
                      border: "none",
                      background: "transparent",
                      padding: 0,
                      margin: 0,
                      display: "block",
                      cursor: isSupportSection ? "default" : "pointer",
                    }}
                    aria-label="Tabby"
                    title={isSupportSection ? "Tabby" : "Double-click to hide Tabby"}
                  >
                    <img
                      src={isHelpDarkMode ? tabbyDark : tabbyLight}
                      alt="Tabby, the TabStudio support mascot"
                      style={{
                        width: "100%",
                        height: "auto",
                        opacity: isHelpDarkMode ? 0.99 : 0.94,
                        borderRadius: 14,
                        transform: `scaleY(${tabbyBlink ? 0.97 : 1})`,
                        transformOrigin: "50% 58%",
                        transition: "transform 100ms ease-out",
                        filter: isHelpDarkMode
                          ? `drop-shadow(0 12px 24px ${withAlpha("#000000", 0.3)}) brightness(1.1) contrast(1.06)`
                          : `drop-shadow(0 9px 20px ${withAlpha("#000000", 0.14)})`,
                      }}
                    />
                  </button>
                </div>
              </div>
            </div>
            ) : null}
          </div>
        </section>
      </div>
      </div>
    </div>
  );
}
