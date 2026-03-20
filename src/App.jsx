import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import logoLight from "./assets/15.png";
import logoDark from "./assets/16.png";
import heroDark from "./assets/tabstudio-hero-dark.png";
import heroLight from "./assets/tabstudio-hero-light.png";
import developerPhoto from "./assets/HarryBolton.JPG";
import tabbyLight from "./assets/tabby-light-v1-transparent.png";
import tabbyDark from "./assets/tabby-dark-v1-transparent.png";
import MembershipPage from "./pages/MembershipPage";
import HelpHubPage from "./pages/HelpHubPage";
import SignupPage from "./pages/SignupPage";
import SigninPage from "./pages/SigninPage";
import CheckoutPlaceholderPage from "./pages/CheckoutPlaceholderPage";
import SuccessPage from "./pages/SuccessPage";
import BillingPage from "./pages/BillingPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import BecomeAnAffiliatePage from "./pages/BecomeAnAffiliatePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { getPlanMeta } from "./features/pricing";
import ExportPage from "./pages/ExportPage";
import {
  buildVideoExportBlob,
  collectVideoSyncNoteSequence,
  formatTapSyncTimestamp,
  getPngExportPaddingPixels,
  getPngExportTargetWidth,
  normalizePngExportPadding,
  normalizePngExportSize,
} from "./features/export/exportHelpers";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import AccountPage from "./pages/AccountPage";
import ProjectsPage, { resetPhaseBLibraryRecordsCache } from "./pages/ProjectsPage";
import AffiliateApplicationPage from "./pages/AffiliateApplicationPage";
import { signOut } from "./lib/auth";
import { createProject, getProjectById, getUserProjects, updateProject } from "./lib/projects";
import { createProfile, getProfile, updateProfile } from "./lib/profile";
import { supabase } from "./lib/supabaseClient";
import { createStripeCheckoutSession } from "./utils/stripeCheckout";
import EditorMetadataPanel from "./components/EditorMetadataPanel";
import EditorToolbar from "./components/EditorToolbar";
import SettingsPanel from "./components/SettingsPanel";
import TabGrid from "./components/TabGrid";
import TabbyAssistant, { TabbySpeechBubble } from "./components/TabbyAssistant";
import { ACCOUNT_MOCK_DATA } from "./components/account/accountMockData";
import {
  brandLogoButtonClass,
  supportFormFieldClass,
  tabbyTourActionPrimaryClass,
  tabbyTourDimLayerClass,
} from "./utils/uiStyles";
import {
  buttonBase,
  buttonHeaderIcon,
  buttonHeaderText,
  buttonMicro,
  buttonPill,
  buttonPrimary,
  buttonSecondary,
  cardBase,
  inputEditor,
  inputImmersive,
  menuItem,
  menuItemSelected,
  menuPanel,
  modalCard,
  modalCloseButton,
  modalHeader,
  modalOverlay,
  headerPageLogo,
  headerPageRightGroup,
  headerPageShell,
  gridCellHoverVisual,
  modalMiniInputHoverVisual,
} from "./utils/uiTokens";

/**
 * App ordering is TOP->BOTTOM strings: [E, B, G, D, A, E] (high → low)
 * Tuning list is shown/stored as LOW → HIGH (E A D G B E)
 * We convert on apply by reversing.
 */

const DEFAULT_TUNING = ["E", "B", "G", "D", "A", "E"]; // high → low (app order)
const DEFAULT_COLS = 32;
const TRIPLE_CLICK_RESET_COLS = 32;
const MIN_COLS = 1;
const MAX_COLS = 64;
const DEFAULT_COLS_AUTO_DELAY_MS = 1000;
const EDITOR_AUTOSAVE_DELAY_MS = 1400;
const EDITOR_AUTOSAVE_RETRY_MS = 4000;
const EDITOR_SETTLED_SAVE_MAX_PASSES = 4;

const LS_USER_TUNINGS_KEY = "tab_editor_user_tunings_v1";
const LS_USER_CHORDS_KEY = "tab_editor_user_chords_v1";
const LS_CHORD_OVERRIDES_KEY = "tab_editor_chord_overrides_v1";
const LS_INSTRUMENT_FAVS_KEY = "tab_editor_instrument_favs_v1";
const LS_ACCENT_COLOR_KEY = "tabstudio_accent_color_v1";
const LS_DEFAULT_COLS_KEY = "tabstudio_default_cols_v1";
const LS_SCROLL_SCOPE_KEY = "tabstudio_scroll_scope_v1";
const LS_THEME_MODE_KEY = "tabstudio_theme_mode";
const LS_UI_LANG_KEY = "tabstudio_ui_lang_v1";
const LS_PERSONAL_BEST_COMPLETED_ROWS_KEY = "tabstudio_personal_best_completed_rows";
const LS_TABS_MILESTONES_TRIGGERED_KEY = "tabstudio_tabs_milestones_triggered";
const LS_FIRST_EXPORT_CELEBRATED_KEY = "tabstudio_first_export_celebrated";
const LS_SETTINGS_FULLSCREEN_KEY = "tabstudio_settings_fullscreen_v1";
const LS_LIBRARY_V1_KEY = "tabstudio_library_v1";
const LS_SLOGAN_OFFSET_X_KEY = "tabstudio_slogan_offset_x_v1";
const LS_EXPORT_BG_MODE_KEY = "tabstudio_export_bg_mode";
const LS_EXPORT_BG_COLOR_KEY = "tabstudio_export_bg_color";
const LS_EXPORT_TEXT_COLOR_KEY = "tabstudio_export_text_color";
const LS_EXPORT_THICKNESS_KEY = "tabstudio_export_thickness";
const LS_EXPORT_TEXT_OUTLINE_KEY = "tabstudio_export_text_outline";
const LS_EXPORT_SHOW_ROW_NAMES_KEY = "tabstudio_export_show_row_names";
const LS_EXPORT_SHOW_ARTIST_KEY = "tabstudio_export_show_artist";
const LS_EXPORT_SHOW_ALBUM_KEY = "tabstudio_export_show_album";
const LS_EXPORT_SHOW_SONG_KEY = "tabstudio_export_show_song";
const LS_EXPORT_SHOW_INSTRUMENT_KEY = "tabstudio_export_show_instrument";
const LS_EXPORT_SHOW_TUNING_KEY = "tabstudio_export_show_tuning";
const LS_EXPORT_SHOW_CAPO_KEY = "tabstudio_export_show_capo";
const LS_EXPORT_SHOW_TEMPO_KEY = "tabstudio_export_show_tempo";
const LS_EXPORT_SHOW_IMAGE_BRANDING_KEY = "tabstudio_export_show_image_branding";
const LS_EXPORT_IMAGE_SIZE_KEY = "tabstudio_export_image_size";
const LS_EXPORT_IMAGE_PADDING_KEY = "tabstudio_export_image_padding";
const LS_CHORDS_SECTION_KEY = "tabstudio_chords_section_v1";
const LS_SELECTED_PLAN_KEY = "selectedPlan";
const LS_SELECTED_BILLING_CYCLE_KEY = "selectedBillingCycle";
const LS_USER_STATE_KEY = "tabstudioUserState";
const LS_TABSTUDIO_DRAFT_KEY = "tabstudioDraft";
const LS_RESTORE_DRAFT_AFTER_MEMBERSHIP_KEY = "tabstudioRestoreDraftAfterMembership";
const LS_RESTORE_DRAFT_AFTER_SIGNIN_KEY = "tabstudioRestoreDraftAfterSignin";
const LS_MEMBERSHIP_SCROLL_TO_PLANS_KEY = "tabstudioMembershipScrollToPlans";
const SESSION_CONVERSION_SIGNUP_KEY = "tabstudioConversionSignupStateV1";
const SESSION_CHECKOUT_AUTOSTART_KEY = "tabstudioCheckoutAutostartV1";
const SESSION_FORCE_PROFILE_SETUP_AFTER_PAYMENT_KEY = "tabstudioForceProfileSetupAfterPayment";
const LS_HEADER_TABBY_NUDGE_SHOWN_SESSION_KEY = "tabstudioHeaderTabbyNudgeShown";
const LS_HEADER_TABBY_ENGAGED_SESSION_KEY = "tabstudioHeaderTabbyEngaged";
const LS_MEMBERSHIP_PRICING_GUIDE_SEEN_KEY = "tabstudioMembershipPricingGuideSeen";
const LS_TABBY_TOUR_COMPLETE_KEY = "tabbyTourComplete";
const LS_TABBY_INTRO_SEEN_KEY = "tabbyIntroSeen";
const LS_TABBY_HIDDEN_KEY = "tabbyHidden";
const TABBY_ASSIST_MINT = "#34d399";
const TABBY_ASSIST_MINT_STRONG = "#10b981";
const PDF_FOOTER_BRANDING_TEXT = "www.tabstudio.app | Tabs, simplfied.";
const VIEWPORT_TABBY_RIGHT_PX = 32;
const VIEWPORT_TABBY_BOTTOM_PX = 10;
const VIEWPORT_TABBY_Z_INDEX = 120;
const VIEWPORT_TABBY_CONTAINER_SIZE_PX = 260;
const VIEWPORT_TABBY_GLOW_SIZE_PX = 236;
const VIEWPORT_TABBY_ASSET_MAX_WIDTH_PX = 210;
const HEADER_INTRO_SESSION_KEY = "tabstudioIntroPlayed";
const HEADER_TAGLINE_FADE_MS = 2400;
const HEADER_TABS_ANCHOR_OFFSET_PX = 48;
const HEADER_TAGLINE_SLIDE_MS = 2300;
const HEADER_TAGLINE_SLIDE_EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";
const LIBRARY_DELETE_WAIT_SECONDS = 10;
const TABSTUDIO_TUTORIAL_URL = "https://www.youtube.com/watch?v=Aq5WXmQQooo&list=RDAq5WXmQQooo&start_radio=1";
const TABS_CREATED_MILESTONES = [10, 25, 50, 100, 250, 500, 1000];
const NO_ALBUM_NAME = "No Album";
const DEFAULT_SLOGAN_OFFSET_X = -4;
const SLOGAN_INTRO_OFFSET_DELTA = 16;
const EXPORT_BRANDING_TEXT = "www.tabstudio.app | Tabs, simplfied.";
const ONBOARDING_TRACE_ENABLED = false;

function onboardingTrace(...args) {
  if (!ONBOARDING_TRACE_ENABLED) return;
  console.log(...args);
}

function normalizeAffiliateLinkText(rawValue) {
  return String(rawValue || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/g, "");
}

function getAffiliateExportLink(profile) {
  const directLink = normalizeAffiliateLinkText(profile?.affiliateLink);
  if (directLink) return directLink;
  const affiliateCode = String(profile?.affiliateCode || profile?.username || "")
    .trim()
    .replace(/^@+/, "");
  if (!affiliateCode) return "";
  return `www.tabstudio.app/?ref=${encodeURIComponent(affiliateCode)}`;
}

function getResolvedExportBrandingText({ includeBranding = true, useAffiliateLink = false, profile } = {}) {
  if (!includeBranding) return "";
  if (useAffiliateLink) {
    const affiliateLink = getAffiliateExportLink(profile);
    if (affiliateLink) return `${affiliateLink} | Tabs, simplfied.`;
  }
  return EXPORT_BRANDING_TEXT;
}

function normalizeBillingCycle(raw) {
  const value = String(raw || "").trim().toLowerCase();
  return value === "yearly" ? "yearly" : "monthly";
}

function isValidFlowSignupEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function normalizeConversionSignupState(rawState) {
  const raw = rawState && typeof rawState === "object" ? rawState : {};
  return {
    signupCompletedForFlow: Boolean(raw.signupCompletedForFlow),
    flowEmail: String(raw.flowEmail || "").trim(),
    flowPassword: String(raw.flowPassword || ""),
    pendingAuthUserId: String(raw.pendingAuthUserId || "").trim(),
    selectedPlan: normalizePlanId(raw.selectedPlan),
    selectedBillingCycle: normalizeBillingCycle(raw.selectedBillingCycle),
    updatedAt: Number.isFinite(raw.updatedAt) ? Number(raw.updatedAt) : Date.now(),
  };
}

function hasReusableConversionSignupState(rawState) {
  const state = normalizeConversionSignupState(rawState);
  if (!state.signupCompletedForFlow) return false;
  if (!isValidFlowSignupEmail(state.flowEmail)) return false;
  if (String(state.flowPassword || "").length < 8) return false;
  return true;
}

function hasPendingFlowAuthIdentity(rawState) {
  const state = normalizeConversionSignupState(rawState);
  return hasReusableConversionSignupState(state) && Boolean(String(state.pendingAuthUserId || "").trim());
}

function buildPendingFlowCheckoutRequestKey(rawState, planTier, billingCycle) {
  const state = normalizeConversionSignupState(rawState);
  if (!hasPendingFlowAuthIdentity(state)) return "";
  return [
    "checkout",
    String(state.pendingAuthUserId || state.flowEmail || "").trim().toLowerCase(),
    normalizePlanId(planTier),
    normalizeBillingCycle(billingCycle),
    String(state.updatedAt || ""),
  ]
    .filter(Boolean)
    .join(":");
}

function isRetryableCheckoutLaunchError(error) {
  if (Boolean(error?.retryable)) return true;
  const message = String(error?.message || "").trim().toLowerCase();
  if (!message) return false;
  return (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("timed out") ||
    message.includes("taking longer than expected") ||
    message.includes("load failed")
  );
}

function loadConversionSignupState() {
  if (typeof window === "undefined") return normalizeConversionSignupState(null);
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(SESSION_CONVERSION_SIGNUP_KEY) || "null");
    return normalizeConversionSignupState(parsed);
  } catch {
    return normalizeConversionSignupState(null);
  }
}

function persistConversionSignupState(nextState) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_CONVERSION_SIGNUP_KEY, JSON.stringify(normalizeConversionSignupState(nextState)));
  } catch {}
}

function clearConversionSignupState() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SESSION_CONVERSION_SIGNUP_KEY);
  } catch {}
}

function hasForcedProfileSetupAfterPayment() {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SESSION_FORCE_PROFILE_SETUP_AFTER_PAYMENT_KEY) === "true";
  } catch {
    return false;
  }
}

function setForcedProfileSetupAfterPayment(enabled) {
  if (typeof window === "undefined") return;
  try {
    if (enabled) {
      window.sessionStorage.setItem(SESSION_FORCE_PROFILE_SETUP_AFTER_PAYMENT_KEY, "true");
    } else {
      window.sessionStorage.removeItem(SESSION_FORCE_PROFILE_SETUP_AFTER_PAYMENT_KEY);
    }
  } catch {}
}

function normalizeAppPath(rawPath) {
  const value = String(rawPath || "/").trim() || "/";
  if (value === "/member") return "/membership";
  return value;
}

function normalizeProfileData(rawProfile) {
  const profile = rawProfile && typeof rawProfile === "object" ? rawProfile : {};
  const favoriteInstrumentIds = Array.isArray(profile.favoriteInstrumentIds)
    ? profile.favoriteInstrumentIds.map((id) => String(id || "")).filter(Boolean)
    : [];
  const chordDiagrams = Array.isArray(profile.chordDiagrams)
    ? profile.chordDiagrams
        .filter(
          (diagram) =>
            diagram &&
            typeof diagram.chordName === "string" &&
            Array.isArray(diagram.stringFrets) &&
            diagram.stringFrets.length > 0
        )
        .map((diagram) => ({
          chordName: String(diagram.chordName || ""),
          stringFrets: diagram.stringFrets.map((value) => String(value ?? "").trim()),
          tuningId: String(diagram.tuningId || ""),
          tuningName: String(diagram.tuningName || ""),
          createdAt: String(diagram.createdAt || ""),
        }))
    : [];
  const exportBrandingPrefs =
    profile.exportBrandingPrefs && typeof profile.exportBrandingPrefs === "object"
      ? {
          includeTabStudioLink: profile.exportBrandingPrefs.includeTabStudioLink !== false,
          useAffiliateLink: Boolean(profile.exportBrandingPrefs.useAffiliateLink),
        }
      : null;
  const chordDiagramExportPrefs =
    profile.chordDiagramExportPrefs && typeof profile.chordDiagramExportPrefs === "object"
      ? { ...profile.chordDiagramExportPrefs }
      : null;
  return {
    avatarDataUrl: String(profile.avatarDataUrl || ""),
    displayName: String(profile.displayName || ""),
    favoriteInstrumentIds,
    heardAbout: String(profile.heardAbout || ""),
    gender: String(profile.gender || ""),
    birthday: String(profile.birthday || ""),
    chordDiagrams,
    affiliateCode: String(profile.affiliateCode || ""),
    affiliateLink: String(profile.affiliateLink || ""),
    username: String(profile.username || ""),
    exportBrandingPrefs,
    chordDiagramExportPrefs,
  };
}

function normalizeBirthdayForProfileRow(rawBirthday) {
  const raw = String(rawBirthday || "").trim();
  if (!raw) return null;
  const displayMatch = raw.match(/^(\d{2}) \/ (\d{2}) \/ (\d{4})$/);
  if (displayMatch) {
    const [, day, month, year] = displayMatch;
    return `${year}-${month}-${day}`;
  }
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return raw;
  return null;
}

function normalizePlanTier(rawPlanTier) {
  const raw = String(rawPlanTier || "").trim().toLowerCase();
  if (raw === "solo" || raw === "band" || raw === "creator") return raw;
  return "free";
}

function normalizeMembershipStatus(rawStatus) {
  const value = String(rawStatus || "").trim().toLowerCase();
  return value === "active" ? "active" : "free";
}

function isPaidPlanTier(planTier) {
  const normalized = normalizePlanTier(planTier);
  return normalized === "solo" || normalized === "band" || normalized === "creator";
}

function buildProfileDataFromRow(profileRow) {
  if (!profileRow || typeof profileRow !== "object") return normalizeProfileData(null);
  return normalizeProfileData({
    displayName: profileRow.display_name || "",
    gender: profileRow.gender || "",
    birthday: profileRow.birthday || "",
    avatarDataUrl: profileRow.avatar_url || "",
    favoriteInstrumentIds: Array.isArray(profileRow.favourite_instruments) ? profileRow.favourite_instruments : [],
    heardAbout: profileRow.heard_about || "",
  });
}

function getMembershipStateFromProfileRow(profileRow) {
  const profilePlanTier = normalizePlanTier(profileRow?.plan_tier);
  const planTier = profileRow ? profilePlanTier : "free";
  const membershipStatus = profileRow?.membership_status ? normalizeMembershipStatus(profileRow.membership_status) : "free";
  const billingCycle = normalizeBillingCycle(profileRow?.billing_cycle);
  const hasMembership = membershipStatus === "active" && isPaidPlanTier(planTier);
  return {
    planTier: hasMembership ? planTier : "free",
    planType: hasMembership ? planTier : null,
    hasMembership,
    everHadMembership: hasMembership,
    membershipStatus: hasMembership ? membershipStatus : "free",
    billingCycle,
  };
}

function isProfileSetupComplete(rawProfile) {
  const profile = normalizeProfileData(rawProfile);
  const missingFields = [];
  if (String(profile.displayName || "").trim().length === 0) missingFields.push("displayName");
  if (String(profile.gender || "").trim().length === 0) missingFields.push("gender");
  if (String(profile.birthday || "").trim().length === 0) missingFields.push("birthday");
  const result = missingFields.length === 0;
  onboardingTrace("[ONBOARDING TRACE] isProfileSetupComplete", {
    profile,
    missingFields,
    result,
  });
  return result;
}

function hasStoredPlanSelection() {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(String(window.localStorage.getItem(LS_SELECTED_PLAN_KEY) || "").trim());
  } catch {
    return false;
  }
}

function resolvePlaceholderGuardPath(targetPath, routeState) {
  const path = normalizeAppPath(targetPath);
  const {
    isAuthenticated = false,
    hasMembership = false,
    planTier = "free",
    isProfileComplete = false,
    hasCheckoutIntent = false,
    canAccessCheckoutWhileSignedOut = false,
    forceProfileSetupAfterPayment = false,
  } = routeState || {};
  const hasPaidTier = isPaidPlanTier(planTier);
  let guardReason = "no-redirect";

  const resolvePostSigninPath = () => {
    if (!hasPaidTier) {
      guardReason = hasCheckoutIntent ? "post-signin-no-paid-tier-with-checkout-intent" : "post-signin-no-paid-tier";
      return hasCheckoutIntent ? "/checkout" : "/membership";
    }
    if (!isProfileComplete) {
      guardReason = "post-signin-profile-incomplete";
      return "/profile-setup";
    }
    guardReason = "post-signin-profile-complete";
    return "/editor";
  };

  let guardedPath = path;

  if (path === "/signup" || path === "/signin") {
    guardedPath = !isAuthenticated ? path : resolvePostSigninPath();
  } else if (path === "/checkout") {
    if (!isAuthenticated) {
      guardReason = canAccessCheckoutWhileSignedOut ? "checkout-allowed-pending-email-confirmation" : "checkout-requires-auth";
      guardedPath = canAccessCheckoutWhileSignedOut ? "/checkout" : "/signup";
    } else if (!hasPaidTier) {
      guardReason = hasCheckoutIntent ? "checkout-allowed-pending-payment" : "checkout-no-intent";
      guardedPath = hasCheckoutIntent ? "/checkout" : "/membership";
    } else {
      guardReason = isProfileComplete ? "checkout-paid-profile-complete" : "checkout-paid-profile-incomplete";
      guardedPath = isProfileComplete ? "/editor" : "/profile-setup";
    }
  } else if (path === "/profile-setup") {
    if (!isAuthenticated) {
      guardReason = "profile-setup-requires-auth";
      guardedPath = "/signup";
    } else if (!hasPaidTier) {
      guardReason = hasCheckoutIntent ? "profile-setup-without-paid-tier-but-has-checkout-intent" : "profile-setup-no-paid-tier";
      guardedPath = hasCheckoutIntent ? "/checkout" : "/membership";
    } else if (forceProfileSetupAfterPayment) {
      guardReason = "profile-setup-forced-post-payment";
      guardedPath = "/profile-setup";
    } else {
      guardReason = isProfileComplete ? "profile-setup-already-complete" : "profile-setup-allowed-incomplete";
      guardedPath = isProfileComplete ? "/editor" : "/profile-setup";
    }
  } else if (path === "/") {
    if (!isAuthenticated) {
      guardReason = "root-public";
      guardedPath = "/";
    } else if (!hasPaidTier) {
      guardReason = "root-auth-no-paid-tier";
      guardedPath = "/";
    } else {
      guardReason = isProfileComplete ? "root-paid-profile-complete" : "root-paid-profile-incomplete";
      guardedPath = isProfileComplete ? "/editor" : "/profile-setup";
    }
  } else if (path === "/editor") {
    if (!isAuthenticated) {
      guardReason = "editor-public";
      guardedPath = "/editor";
    } else if (!hasPaidTier) {
      guardReason = "editor-auth-no-paid-tier";
      guardedPath = "/editor";
    } else {
      guardReason = isProfileComplete ? "editor-paid-profile-complete" : "editor-paid-profile-incomplete";
      guardedPath = isProfileComplete ? "/editor" : "/profile-setup";
    }
  } else if (path === "/projects" || path === "/export") {
    if (!isAuthenticated) {
      guardReason = `${path}-requires-auth`;
      guardedPath = "/editor";
    } else if (!hasPaidTier) {
      guardReason = `${path}-no-paid-tier`;
      guardedPath = hasCheckoutIntent ? "/checkout" : "/membership";
    } else if (!isProfileComplete) {
      guardReason = `${path}-profile-incomplete`;
      guardedPath = "/profile-setup";
    } else {
      guardReason = `${path}-allowed`;
      guardedPath = path;
    }
  } else if (path === "/account" || path === "/account/billing") {
    if (!isAuthenticated) {
      guardReason = `${path}-requires-auth`;
      guardedPath = "/editor";
    } else if (!hasPaidTier) {
      guardReason = `${path}-no-paid-tier`;
      guardedPath = hasCheckoutIntent ? "/checkout" : "/membership";
    } else if (!isProfileComplete) {
      guardReason = `${path}-profile-incomplete`;
      guardedPath = "/profile-setup";
    } else {
      guardReason = `${path}-allowed`;
      guardedPath = path;
    }
  } else if (path === "/becomeanaffiliate" || path === "/becomeanaffiliate/apply") {
    guardReason = `${path}-public`;
    guardedPath = path;
  } else if (path === "/auth/callback" || path === "/auth/reset-password") {
    guardReason = `${path}-public`;
    guardedPath = path;
  }

  onboardingTrace("[ONBOARDING TRACE] resolvePlaceholderGuardPath", {
    currentPath: path,
    isAuthenticated,
    hasMembership,
    planTier,
    hasCheckoutIntent,
    canAccessCheckoutWhileSignedOut,
    isProfileComplete,
    forceProfileSetupAfterPayment,
    returnedGuardedPath: guardedPath,
    reason: guardReason,
  });

  if (guardedPath === "/profile-setup" && path !== "/profile-setup") {
    onboardingTrace("[ONBOARDING TRACE] redirecting-to-profile-setup", {
      fromPath: path,
      reason: guardReason,
      isAuthenticated,
      hasMembership,
      planTier,
      hasCheckoutIntent,
      canAccessCheckoutWhileSignedOut,
      isProfileComplete,
    });
  }

  return guardedPath;
}

function normalizeUserState(rawState) {
  const base = {
    authUserId: "",
    isLoggedIn: false,
    hasMembership: false,
    everHadMembership: false,
    planTier: "free",
    planType: null,
    email: "",
    profile: normalizeProfileData(null),
  };
  if (!rawState || typeof rawState !== "object") return base;
  const planTier = normalizePlanTier(rawState.planTier || rawState.planType);
  const planType = isPaidPlanTier(planTier) ? planTier : null;
  const hasMembership = Boolean(rawState.hasMembership || isPaidPlanTier(planTier));
  const everHadMembership = Boolean(rawState.everHadMembership || hasMembership || planType);
  return {
    authUserId: String(rawState.authUserId || ""),
    isLoggedIn: Boolean(rawState.isLoggedIn),
    hasMembership,
    everHadMembership,
    planTier,
    planType,
    email: String(rawState.email || ""),
    profile: normalizeProfileData(rawState.profile),
  };
}

function loadUserStateFromStorage() {
  if (typeof window === "undefined") return normalizeUserState(null);
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LS_USER_STATE_KEY) || "null");
    return normalizeUserState(parsed);
  } catch {
    return normalizeUserState(null);
  }
}

function persistUserStateToStorage(nextState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_USER_STATE_KEY, JSON.stringify(normalizeUserState(nextState)));
  } catch {}
}

function normalizePlanId(planId) {
  const raw = String(planId || "").trim().toLowerCase();
  if (raw === "band") return "band";
  if (raw === "creator") return "creator";
  return "solo";
}

function getPlanPermissions(planType) {
  const normalized = normalizePlanId(planType);
  if (normalized === "creator") {
    return {
      canSave: true,
      canExportPdf: true,
      canExportPng: true,
      canUseTapToSync: true,
      canUseSetlistCreator: true,
      maxSavedTabs: Infinity,
    };
  }
  if (normalized === "band") {
    return {
      canSave: true,
      canExportPdf: true,
      canExportPng: false,
      canUseTapToSync: false,
      canUseSetlistCreator: true,
      maxSavedTabs: 250,
    };
  }
  return {
    canSave: true,
    canExportPdf: false,
    canExportPng: false,
    canUseTapToSync: false,
    canUseSetlistCreator: false,
    maxSavedTabs: 50,
  };
}

function getTabStudioInteractiveFieldStyle({ focused = false, hovered = false, minHeight = 44, padding = "0 12px", fontSize = 16, fontWeight = 700 } = {}) {
  return inputImmersive({ focused, hovered, minHeight, padding, fontSize, fontWeight });
}

function getAvatarInitials(nameValue) {
  const parts = String(nameValue || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return (parts[0][0] || "?").toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}
function EditIcon({ size = 14, strokeWidth = 2 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function AvatarSilhouetteIcon({ size = 16, strokeWidth = 1.8, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block", color }}
    >
      <circle cx="12" cy="8.2" r="3.6" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M5.5 18.8c.9-3.1 3.6-4.8 6.5-4.8s5.6 1.7 6.5 4.8" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

const SITE_HEADER_LAYOUT = {
  minHeight: 74,
  paddingY: 6,
  paddingX: 18,
  gap: 8,
  leftGap: 12,
  rightGap: 12,
  logoWidth: 210,
  logoHeight: 62,
  sloganWidth: 220,
  sloganBottomOffset: 11.25,
  leftReserveWidth: 210 + 12 + 220,
  rightReserveWidth: 184,
};

function siteHeaderBarStyle(theme) {
  return headerPageShell(theme, SITE_HEADER_LAYOUT);
}

const siteHeaderLeftGroupStyle = {
  position: "absolute",
  left: SITE_HEADER_LAYOUT.paddingX,
  top: "50%",
  transform: "translateY(-50%)",
  display: "flex",
  alignItems: "center",
  gap: SITE_HEADER_LAYOUT.leftGap,
  flexWrap: "nowrap",
};

const siteHeaderRightGroupStyle = headerPageRightGroup(SITE_HEADER_LAYOUT);

const siteHeaderLogoButtonStyle = headerPageLogo(SITE_HEADER_LAYOUT);

const siteHeaderLogoImageStyle = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "cover",
  objectPosition: "center 50%",
};

function siteHeaderSloganStyle(color, opacity = 0.75) {
  return {
    marginLeft: 0,
    width: SITE_HEADER_LAYOUT.sloganWidth,
    minWidth: SITE_HEADER_LAYOUT.sloganWidth,
    display: "inline-flex",
    alignItems: "center",
    alignSelf: "flex-end",
    marginBottom: SITE_HEADER_LAYOUT.sloganBottomOffset,
    fontSize: 13,
    fontWeight: 400,
    color,
    opacity,
    letterSpacing: 0.2,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    overflow: "visible",
  };
}

function siteHeaderSecondaryButtonStyle(theme, { hovered = false, pressed = false, iconOnly = false } = {}) {
  return buttonHeaderIcon(theme, withAlpha, { hovered, pressed, iconOnly });
}

function siteHeaderEditorLinkStyle(theme, { hovered = false } = {}) {
  return buttonHeaderText(theme, withAlpha, { hovered });
}

function siteHeaderPrimaryCtaStyle({ hovered = false, pressed = false } = {}) {
  return {
    minHeight: 36,
    height: 36,
    borderRadius: 10,
    border: "none",
    background: hovered || pressed ? TABBY_ASSIST_MINT_STRONG : TABBY_ASSIST_MINT,
    color: "#062016",
    fontSize: 16,
    fontWeight: 700,
    padding: "0 16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxSizing: "border-box",
    boxShadow: hovered ? `0 8px 16px ${withAlpha(TABBY_ASSIST_MINT, 0.28)}` : "none",
    transition: "all 0.15s ease",
    transform: pressed ? "translateY(1px)" : hovered ? "translateY(-1px)" : "translateY(0)",
    lineHeight: 1,
  };
}


export default function App() {
  const HELP_EDITOR_PANEL_KEY = "tabstudio_help_editor_panel_v1";
  const enableDevCheckout = String(import.meta.env.VITE_ENABLE_DEV_CHECKOUT || "").trim().toLowerCase() === "true";
  const [supabaseSession, setSupabaseSession] = useState(null);
  const [supabaseUser, setSupabaseUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [userState, setUserState] = useState(() => loadUserStateFromStorage());
  const [isLaunchingCheckout, setIsLaunchingCheckout] = useState(false);
  const [checkoutLaunchError, setCheckoutLaunchError] = useState("");
  const helpSupportUserEmail = String(userState?.email || "");
  const helpSupportUserId = "harry_bolton";
  const helpSupportPaidSubscriber = Boolean(isPaidPlanTier(userState?.planTier));
  const helpSupportEverPaidSubscriber = Boolean(userState?.everHadMembership || isPaidPlanTier(userState?.planTier));
  const [path, setPath] = useState(() => {
    if (typeof window === "undefined") return "/";
    return normalizeAppPath(window.location.pathname || "/");
  });
  const [pendingEditorPanel, setPendingEditorPanel] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem(HELP_EDITOR_PANEL_KEY) || "";
    } catch {
      return "";
    }
  });
  const updateUserState = useCallback((next) => {
    setUserState((prev) => {
      const normalized = normalizeUserState(typeof next === "function" ? next(prev) : next);
      persistUserStateToStorage(normalized);
      return normalized;
    });
  }, []);

  const syncBillingCycleFromProfileRow = useCallback((profileRow) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LS_SELECTED_BILLING_CYCLE_KEY, normalizeBillingCycle(profileRow?.billing_cycle));
    } catch {}
  }, []);

  const buildSessionUserState = useCallback(
    async (session, prevState) => {
      const nextAuthUserId = String(session?.user?.id || "");
      const isSameAuthenticatedUser = Boolean(nextAuthUserId) && prevState?.authUserId === nextAuthUserId;
      let profileRow = null;

      if (session?.user?.id) {
        const existing = await getProfile(session.user.id);
        if (existing.error) {
          onboardingTrace("[ONBOARDING TRACE] session-profile-read-failed", {
            authUserId: session.user.id,
            error: existing.error,
          });
        } else {
          const normalizedSessionEmail = String(session.user.email || "").trim().toLowerCase();
          profileRow = existing.data || null;
          if (!profileRow) {
            const createdProfile = await createProfile(session.user.id, {
              email: normalizedSessionEmail || null,
            });
            if (createdProfile.error) {
              onboardingTrace("[ONBOARDING TRACE] session-profile-create-failed", {
                authUserId: session.user.id,
                error: createdProfile.error,
              });
            } else {
              profileRow = createdProfile.data || null;
            }
          } else if (normalizedSessionEmail && String(profileRow.email || "").trim().toLowerCase() !== normalizedSessionEmail) {
            const updatedProfile = await updateProfile(session.user.id, {
              email: normalizedSessionEmail,
            });
            if (updatedProfile.error) {
              onboardingTrace("[ONBOARDING TRACE] session-profile-email-sync-failed", {
                authUserId: session.user.id,
                error: updatedProfile.error,
              });
            } else {
              profileRow = updatedProfile.data || profileRow;
            }
          }
          syncBillingCycleFromProfileRow(profileRow);
        }
      }

      const membershipState = getMembershipStateFromProfileRow(profileRow);
      return normalizeUserState({
        ...prevState,
        authUserId: nextAuthUserId,
        isLoggedIn: Boolean(session),
        hasMembership: session ? membershipState.hasMembership : false,
        everHadMembership: session ? membershipState.everHadMembership : false,
        planTier: session ? membershipState.planTier : "free",
        planType: session ? membershipState.planType : null,
        email: String(session?.user?.email || ""),
        profile: session
          ? profileRow
            ? buildProfileDataFromRow(profileRow)
            : isSameAuthenticatedUser
            ? prevState?.profile
            : normalizeProfileData(null)
          : normalizeProfileData(null),
      });
    },
    [syncBillingCycleFromProfileRow]
  );

  const hydrateSessionState = useCallback(
    async (session, { persistDraftRestore = false } = {}) => {
      const next = await buildSessionUserState(session || null, loadUserStateFromStorage());
      setSupabaseSession(session || null);
      setSupabaseUser(session?.user || null);
      setUserState(() => {
        persistUserStateToStorage(next);
        return next;
      });
      if (persistDraftRestore) {
        try {
          window.localStorage.setItem(LS_RESTORE_DRAFT_AFTER_SIGNIN_KEY, "true");
        } catch {}
      }
      return next;
    },
    [buildSessionUserState]
  );

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        const session = data?.session || null;
        await hydrateSessionState(session);
      } finally {
        if (isMounted) setAuthReady(true);
      }
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      window.setTimeout(() => {
        if (!isMounted) return;
        void (async () => {
          await hydrateSessionState(session || null);
          if (!isMounted) return;
          setAuthReady(true);
        })();
      }, 0);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [buildSessionUserState, hydrateSessionState]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onPop = () => {
      const next = normalizeAppPath(window.location.pathname || "/");
      if (window.location.pathname !== next) {
        window.history.replaceState({}, "", next);
      }
      setPath(next);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigateTo = useCallback((to) => {
    if (typeof window === "undefined") return;
    const next = normalizeAppPath(to);
    if (window.location.pathname !== next) {
      window.history.pushState({}, "", next);
      setPath(next);
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }
    setPath(next);
  }, []);
  const openEditorPanelFromHelp = useCallback((panel) => {
    const next = String(panel || "").toLowerCase();
    if (!next) return;
    try {
      sessionStorage.setItem(HELP_EDITOR_PANEL_KEY, next);
    } catch {}
    setPendingEditorPanel(next);
    navigateTo("/");
  }, [navigateTo]);
  const clearPendingEditorPanel = useCallback(() => {
    try {
      sessionStorage.removeItem(HELP_EDITOR_PANEL_KEY);
    } catch {}
    setPendingEditorPanel("");
  }, []);
  const selectedPlan = useMemo(() => {
    if (isPaidPlanTier(userState?.planTier)) return normalizePlanId(userState?.planTier);
    if (typeof window === "undefined") return "solo";
    try {
      const raw = String(window.localStorage.getItem(LS_SELECTED_PLAN_KEY) || "").toLowerCase();
      return normalizePlanId(raw);
    } catch {
      return "solo";
    }
  }, [path, userState]);
  const selectedBillingCycle = useMemo(() => {
    if (typeof window === "undefined") return "monthly";
    try {
      return normalizeBillingCycle(window.localStorage.getItem(LS_SELECTED_BILLING_CYCLE_KEY));
    } catch {
      return "monthly";
    }
  }, [path]);
  const isAuthenticated = authReady ? Boolean(supabaseUser) : Boolean(userState?.isLoggedIn);
  const planTier = normalizePlanTier(userState?.planTier);
  const hasActiveMembership = isPaidPlanTier(planTier);
  const isProfileComplete = useMemo(() => isProfileSetupComplete(userState?.profile), [userState]);
  const hasCheckoutIntent = useMemo(() => {
    const reusableSignupState = loadConversionSignupState();
    return hasReusableConversionSignupState(reusableSignupState) || hasStoredPlanSelection();
  }, [path, userState]);
  const canAccessCheckoutWhileSignedOut = useMemo(() => hasPendingFlowAuthIdentity(loadConversionSignupState()), [path, userState]);
  const forceProfileSetupAfterPayment = useMemo(() => hasForcedProfileSetupAfterPayment(), [path, userState]);
  const guardedPath = useMemo(() => {
    if (!authReady) return path;
    return resolvePlaceholderGuardPath(path, {
      isAuthenticated,
      hasMembership: hasActiveMembership,
      planTier,
      isProfileComplete,
      hasCheckoutIntent,
      canAccessCheckoutWhileSignedOut,
      forceProfileSetupAfterPayment,
    });
  }, [authReady, path, isAuthenticated, hasActiveMembership, planTier, isProfileComplete, hasCheckoutIntent, canAccessCheckoutWhileSignedOut, forceProfileSetupAfterPayment]);
  const routePath = guardedPath;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (guardedPath === path) return;
    window.history.replaceState({}, "", guardedPath);
    setPath(guardedPath);
  }, [guardedPath, path]);
  const startMembershipSignup = useCallback(
    (planId, billingCycle = "monthly") => {
      const safePlan = normalizePlanId(planId);
      const safeBillingCycle = normalizeBillingCycle(billingCycle);
      try {
        window.localStorage.setItem(LS_SELECTED_PLAN_KEY, safePlan);
        window.localStorage.setItem(LS_SELECTED_BILLING_CYCLE_KEY, safeBillingCycle);
      } catch {}
      const flowSignupState = loadConversionSignupState();
      if (hasReusableConversionSignupState(flowSignupState)) {
        persistConversionSignupState({
          ...flowSignupState,
          selectedPlan: safePlan,
          selectedBillingCycle: safeBillingCycle,
          updatedAt: Date.now(),
        });
        navigateTo("/checkout");
        return;
      }
      navigateTo("/signup");
    },
    [navigateTo]
  );
  const handleMembershipPlanAction = useCallback(
    (planId, billingCycle = "monthly") => {
      const safePlan = normalizePlanId(planId);
      const safeBillingCycle = normalizeBillingCycle(billingCycle);
      try {
        window.localStorage.setItem(LS_SELECTED_PLAN_KEY, safePlan);
        window.localStorage.setItem(LS_SELECTED_BILLING_CYCLE_KEY, safeBillingCycle);
      } catch {}
      if (isAuthenticated && hasActiveMembership) {
        navigateTo("/checkout");
        return;
      }
      startMembershipSignup(safePlan, safeBillingCycle);
    },
    [hasActiveMembership, isAuthenticated, navigateTo, startMembershipSignup]
  );
  const continueToCheckout = useCallback(
    async ({
      email,
      password,
      selectedPlan: planId,
      selectedBillingCycle: billingCycle,
      requiresEmailConfirmation = false,
      session = null,
      pendingAuthUserId = "",
    }) => {
      const safePlan = normalizePlanId(planId);
      const safeBillingCycle = normalizeBillingCycle(billingCycle);
      onboardingTrace("[ONBOARDING TRACE] continueToCheckout:start", {
        email: String(email || "").trim(),
        selectedPlan: safePlan,
        selectedBillingCycle: safeBillingCycle,
        requiresEmailConfirmation,
        hasSession: Boolean(session),
      });
      setCheckoutLaunchError("");
      try {
        window.localStorage.setItem(LS_SELECTED_PLAN_KEY, safePlan);
        window.localStorage.setItem(LS_SELECTED_BILLING_CYCLE_KEY, safeBillingCycle);
      } catch {}
      persistConversionSignupState({
        signupCompletedForFlow: true,
        flowEmail: String(email || "").trim(),
        flowPassword: String(password || ""),
        pendingAuthUserId: String(pendingAuthUserId || "").trim(),
        selectedPlan: safePlan,
        selectedBillingCycle: safeBillingCycle,
        updatedAt: Date.now(),
      });
      try {
        window.sessionStorage.setItem(SESSION_CHECKOUT_AUTOSTART_KEY, "true");
      } catch {}

      if (session) {
        await hydrateSessionState(session, { persistDraftRestore: false });
        setAuthReady(true);
      }

      onboardingTrace("[ONBOARDING TRACE] continueToCheckout:navigate", {
        finalRoutePushed: "/checkout",
      });
      navigateTo("/checkout");
      return { redirected: true, requiresEmailConfirmation };
    },
    [hydrateSessionState, navigateTo]
  );
  const activateMembershipDevMode = useCallback(async () => {
    const plan = normalizePlanId(selectedPlan);
    const billingCycle = normalizeBillingCycle(selectedBillingCycle);
    const existing = loadUserStateFromStorage();
    onboardingTrace("[ONBOARDING TRACE] activateMembershipDevMode:start", {
      currentUserStateBeforeUpdate: existing,
      valuesBeingWritten: {
        isLoggedIn: true,
        hasMembership: true,
        planTier: plan,
        planType: plan,
        membershipStatus: "active",
        billingCycle,
      },
    });
    let profileWriteError = null;
    if (supabaseUser?.id) {
      const normalizedAccountEmail = String(supabaseUser?.email || existing?.email || "").trim().toLowerCase();
      const membershipProfileRow = {
        email: normalizedAccountEmail || null,
        plan_tier: plan,
        membership_status: "active",
        billing_cycle: billingCycle,
      };
      const existingProfile = await getProfile(supabaseUser.id);
      if (existingProfile.error) {
        profileWriteError = existingProfile.error;
        onboardingTrace("[ONBOARDING TRACE] activateMembershipDevMode:profile-read-failed", {
          authUserId: supabaseUser.id,
          error: existingProfile.error,
        });
      } else {
        const profileWriteResult = existingProfile.data
          ? await updateProfile(supabaseUser.id, membershipProfileRow)
          : await createProfile(supabaseUser.id, membershipProfileRow);
        if (profileWriteResult.error) {
          profileWriteError = profileWriteResult.error;
          onboardingTrace("[ONBOARDING TRACE] activateMembershipDevMode:profile-save-failed", {
            authUserId: supabaseUser.id,
            error: profileWriteResult.error,
            usedOperation: existingProfile.data ? "updateProfile" : "createProfile",
          });
        } else {
          onboardingTrace("[ONBOARDING TRACE] activateMembershipDevMode:profile-save-succeeded", {
            authUserId: supabaseUser.id,
            usedOperation: existingProfile.data ? "updateProfile" : "createProfile",
            persistedPlanTier: plan,
            persistedMembershipStatus: "active",
            persistedBillingCycle: billingCycle,
          });
        }
      }
    }
    if (!profileWriteError && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LS_SELECTED_BILLING_CYCLE_KEY, billingCycle);
      } catch {}
    }
    const next = normalizeUserState({
      ...existing,
      isLoggedIn: true,
      hasMembership: true,
      planTier: plan,
      planType: plan,
    });
    setUserState(next);
    persistUserStateToStorage(next);
    clearConversionSignupState();
    try {
      window.localStorage.setItem(LS_RESTORE_DRAFT_AFTER_MEMBERSHIP_KEY, "true");
    } catch {}
    onboardingTrace("[ONBOARDING TRACE] activateMembershipDevMode:navigate", {
      finalRoutePushed: "/profile-setup",
    });
    navigateTo("/profile-setup");
  }, [navigateTo, selectedBillingCycle, selectedPlan, supabaseUser]);
  const launchHostedStripeCheckout = useCallback(async () => {
    const plan = normalizePlanId(selectedPlan);
    const billingCycle = normalizeBillingCycle(selectedBillingCycle);
    const flowSignupState = loadConversionSignupState();
    const pendingFlowIdentityReady = hasPendingFlowAuthIdentity(flowSignupState);
    const checkoutRequestKey = buildPendingFlowCheckoutRequestKey(flowSignupState, plan, billingCycle);
    onboardingTrace("[ONBOARDING TRACE] createStripeCheckoutSession:start", {
      selectedPlan: plan,
      selectedBillingCycle: billingCycle,
      hasPendingFlowAuthIdentity: pendingFlowIdentityReady,
      pendingAuthUserId: pendingFlowIdentityReady ? flowSignupState.pendingAuthUserId : "",
      pendingAuthEmail: pendingFlowIdentityReady ? flowSignupState.flowEmail : "",
      checkoutRequestKey,
    });
    setCheckoutLaunchError("");
    setIsLaunchingCheckout(true);
    try {
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          const { url } = await createStripeCheckoutSession({
            planTier: plan,
            billingCycle,
            successPath: "/success",
            cancelPath: "/checkout",
            pendingAuthUserId: pendingFlowIdentityReady ? flowSignupState.pendingAuthUserId : "",
            pendingAuthEmail: pendingFlowIdentityReady ? flowSignupState.flowEmail : "",
            idempotencyKey: checkoutRequestKey,
          });
          if (typeof window !== "undefined") {
            window.location.assign(url);
          }
          return;
        } catch (error) {
          const shouldRetry = attempt === 1 && isRetryableCheckoutLaunchError(error);
          onboardingTrace("[ONBOARDING TRACE] createStripeCheckoutSession:attempt-failed", {
            selectedPlan: plan,
            selectedBillingCycle: billingCycle,
            attempt,
            shouldRetry,
            error: String(error?.message || error || "Unknown error"),
          });
          if (shouldRetry) {
            await new Promise((resolve) => window.setTimeout(resolve, 1000));
            continue;
          }
          throw error;
        }
      }
    } catch (error) {
      console.error("[ONBOARDING TRACE] createStripeCheckoutSession:failed", {
        selectedPlan: plan,
        selectedBillingCycle: billingCycle,
        error,
      });
      setCheckoutLaunchError(String(error?.message || "Unable to start secure checkout."));
      setIsLaunchingCheckout(false);
    }
  }, [selectedBillingCycle, selectedPlan]);
  const saveProfileSetup = useCallback(
    async (profilePayload) => {
      const normalizedProfile = normalizeProfileData(profilePayload);
      let refreshedProfile = null;
      onboardingTrace("[ONBOARDING TRACE] saveProfileSetup:start", {
        incomingProfilePayload: profilePayload,
        normalizedProfilePayload: normalizedProfile,
      });

      if (supabaseUser?.id) {
        const normalizedAccountEmail = String(supabaseUser?.email || userState?.email || "").trim().toLowerCase();
        const profileRow = {
          email: normalizedAccountEmail || null,
          display_name: String(normalizedProfile.displayName || "").trim() || null,
          gender: String(normalizedProfile.gender || "").trim() || null,
          birthday: normalizeBirthdayForProfileRow(normalizedProfile.birthday),
          avatar_url: String(normalizedProfile.avatarDataUrl || "").trim() || null,
          favourite_instruments: Array.isArray(normalizedProfile.favoriteInstrumentIds)
            ? normalizedProfile.favoriteInstrumentIds.map((id) => String(id || "").trim()).filter(Boolean)
            : [],
          heard_about: String(normalizedProfile.heardAbout || "").trim() || null,
        };

        const existing = await getProfile(supabaseUser.id);
        if (existing.error) {
          onboardingTrace("[ONBOARDING TRACE] saveProfileSetup:supabase-read-failed", {
            error: existing.error,
          });
          return { error: existing.error };
        }

        const result = existing.data
          ? await updateProfile(supabaseUser.id, profileRow)
          : await createProfile(supabaseUser.id, profileRow);

        if (result.error) {
          onboardingTrace("[ONBOARDING TRACE] saveProfileSetup:supabase-save-failed", {
            error: result.error,
            usedOperation: existing.data ? "updateProfile" : "createProfile",
          });
          return { error: result.error };
        }
        onboardingTrace("[ONBOARDING TRACE] saveProfileSetup:supabase-save-succeeded", {
          usedOperation: existing.data ? "updateProfile" : "createProfile",
          result: result.data,
        });

        const refreshed = await getProfile(supabaseUser.id);
        if (refreshed.error) {
          onboardingTrace("[ONBOARDING TRACE] saveProfileSetup:supabase-refresh-failed", {
            error: refreshed.error,
          });
          return { error: refreshed.error };
        }
        refreshedProfile = refreshed.data;
        onboardingTrace("[ONBOARDING TRACE] saveProfileSetup:supabase-refreshed-profile", {
          refreshedProfile,
        });
      }

      try {
        window.localStorage.setItem(LS_INSTRUMENT_FAVS_KEY, JSON.stringify(normalizedProfile.favoriteInstrumentIds || []));
      } catch {}

      const nextProfile = refreshedProfile
        ? normalizeProfileData({
            ...normalizedProfile,
            displayName: refreshedProfile.display_name || normalizedProfile.displayName,
            gender: refreshedProfile.gender || normalizedProfile.gender,
            birthday: refreshedProfile.birthday || normalizedProfile.birthday,
            avatarDataUrl: refreshedProfile.avatar_url || normalizedProfile.avatarDataUrl,
          })
        : normalizedProfile;

      flushSync(() => {
        updateUserState((prev) => ({
          ...prev,
          profile: nextProfile,
        }));
      });
      setForcedProfileSetupAfterPayment(false);
      onboardingTrace("[ONBOARDING TRACE] saveProfileSetup:local-profile-written", {
        finalLocalUserStateProfileWritten: nextProfile,
      });

      return { error: null };
    },
    [supabaseUser, updateUserState, userState]
  );
  const completeSignin = useCallback(
    async ({ session = null, persistDraftRestore = true } = {}) => {
      setAuthReady(false);
      let resolvedSession = session || null;

      if (!resolvedSession) {
        const {
          data: { session: activeSession },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;
        resolvedSession = activeSession || null;
      }

      if (!resolvedSession) {
        throw new Error("Unable to finish signing in.");
      }

      const nextState = await hydrateSessionState(resolvedSession, { persistDraftRestore });
      setAuthReady(true);
      return { error: null, nextState };
    },
    [hydrateSessionState]
  );
  const resolveAuthenticatedDestination = useCallback(
    (nextState, { hasCheckoutIntent = false } = {}) =>
      resolvePlaceholderGuardPath("/signin", {
        isAuthenticated: true,
        hasMembership: Boolean(nextState?.hasMembership),
        planTier: normalizePlanTier(nextState?.planTier),
        isProfileComplete: isProfileSetupComplete(nextState?.profile),
        hasCheckoutIntent,
        forceProfileSetupAfterPayment: false,
      }),
    []
  );
  const handleResolvedEmailAuth = useCallback(
    async ({ session = null, type = "" } = {}) => {
      const { nextState } = await completeSignin({ session, persistDraftRestore: false });
      const hasCheckoutIntent = hasReusableConversionSignupState(loadConversionSignupState());
      const normalizedType = String(type || "").trim().toLowerCase();

      if (normalizedType === "email_change" || normalizedType === "email") {
        return {
          title: "Email confirmed.",
          message: "Your account email has been updated successfully.",
          path: "/account",
          navigate: navigateTo,
        };
      }

      if (normalizedType === "signup" && hasCheckoutIntent && !nextState?.hasMembership) {
        return {
          title: "Email confirmed.",
          message: "Your account is confirmed. We’re finishing your membership activation now.",
          path: "/success",
          navigate: navigateTo,
        };
      }

      return {
        title: normalizedType === "signup" ? "Email confirmed." : "You're signed in.",
        message:
          normalizedType === "signup"
            ? "Your account is ready. We’re taking you to the next step now."
            : "Your sign-in link worked. Redirecting you now.",
        path: resolveAuthenticatedDestination(nextState, { hasCheckoutIntent }),
        navigate: navigateTo,
      };
    },
    [completeSignin, navigateTo, resolveAuthenticatedDestination]
  );
  const handleRecoverySessionResolved = useCallback(
    async ({ session = null } = {}) => {
      await completeSignin({ session, persistDraftRestore: false });
    },
    [completeSignin]
  );
  const handleResetPasswordComplete = useCallback(
    async ({ session = null } = {}) => {
      const { nextState } = await completeSignin({ session, persistDraftRestore: false });
      return resolveAuthenticatedDestination(nextState, {
        hasCheckoutIntent: hasReusableConversionSignupState(loadConversionSignupState()),
      });
    },
    [completeSignin, resolveAuthenticatedDestination]
  );
  const finalizePostPaymentRoute = useCallback(
    (profileRow) => {
      const membershipState = getMembershipStateFromProfileRow(profileRow);
      const nextProfile = buildProfileDataFromRow(profileRow);
      updateUserState((prev) => ({
        ...prev,
        ...membershipState,
        profile: nextProfile,
      }));
      clearConversionSignupState();
      setForcedProfileSetupAfterPayment(true);
      try {
        window.localStorage.setItem(LS_RESTORE_DRAFT_AFTER_MEMBERSHIP_KEY, "true");
      } catch {}
      navigateTo("/profile-setup");
    },
    [navigateTo, updateUserState]
  );

  const helpTargetSection = useMemo(() => {
    if (typeof window === "undefined") return "about";
    const hash = String(window.location.hash || "").replace(/^#/, "").toLowerCase();
    if (hash === "faq" || hash === "support" || hash === "about") return hash;
    if (path === "/faq") return "faq";
    if (path === "/support") return "support";
    return "about";
  }, [path]);

  if (routePath === "/help" || routePath === "/about" || routePath === "/faq" || routePath === "/support") {
    return (
      <HelpHubPage
        shared={{
          ACCENT_PRESETS,
          DARK_THEME,
          LIGHT_THEME,
          LS_ACCENT_COLOR_KEY,
          LS_THEME_MODE_KEY,
          TABBY_ASSIST_MINT,
          TABBY_ASSIST_MINT_STRONG,
          TabbySpeechBubble,
          getTabStudioInteractiveFieldStyle,
          onBack: () => navigateTo("/"),
          onGoSettings: () => openEditorPanelFromHelp("settings"),
          siteHeaderBarStyle,
          siteHeaderEditorLinkStyle,
          siteHeaderLeftGroupStyle,
          siteHeaderLogoButtonStyle,
          siteHeaderLogoImageStyle,
          siteHeaderRightGroupStyle,
          siteHeaderSecondaryButtonStyle,
          siteHeaderSloganStyle,
          supportEverPaidSubscriber: helpSupportEverPaidSubscriber,
          supportPaidSubscriber: helpSupportPaidSubscriber,
          supportUserEmail: helpSupportUserEmail,
          targetSection: helpTargetSection,
          withAlpha,
        }}
      />
    );
  }

  if (routePath === "/membership") {
    return (
      <MembershipPage
        onBack={() => navigateTo("/")}
        onGoSettings={() => openEditorPanelFromHelp("settings")}
        onSelectPlan={handleMembershipPlanAction}
        shared={{
          ACCENT_PRESETS,
          DARK_THEME,
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
          currentPlanId: hasActiveMembership ? normalizePlanId(userState?.planType || userState?.planTier) : null,
          hasActiveMembership,
          isAuthenticated,
          withAlpha,
        }}
      />
    );
  }

  if (routePath === "/becomeanaffiliate") {
    return (
      <BecomeAnAffiliatePage
        shared={{
          ACCENT_PRESETS,
          DARK_THEME,
          LIGHT_THEME,
          LS_ACCENT_COLOR_KEY,
          LS_THEME_MODE_KEY,
          TABBY_ASSIST_MINT,
          TABBY_ASSIST_MINT_STRONG,
          onApply: () => navigateTo("/becomeanaffiliate/apply"),
          onBack: () => navigateTo("/"),
          siteHeaderBarStyle,
          siteHeaderLeftGroupStyle,
          siteHeaderLogoButtonStyle,
          siteHeaderLogoImageStyle,
          siteHeaderSloganStyle,
          withAlpha,
        }}
      />
    );
  }

  if (routePath === "/becomeanaffiliate/apply") {
    return (
      <AffiliateApplicationPage
        shared={{
          ACCENT_PRESETS,
          DARK_THEME,
          LIGHT_THEME,
          LS_ACCENT_COLOR_KEY,
          LS_THEME_MODE_KEY,
          TABBY_ASSIST_MINT,
          TABBY_ASSIST_MINT_STRONG,
          onBack: () => navigateTo("/becomeanaffiliate"),
          onBackToProjects: () => navigateTo("/projects"),
          siteHeaderBarStyle,
          siteHeaderLeftGroupStyle,
          siteHeaderLogoButtonStyle,
          siteHeaderLogoImageStyle,
          siteHeaderSloganStyle,
          withAlpha,
        }}
      />
    );
  }

  if (routePath === "/signup") {
    return (
      <SignupPage
        shared={{
          ACCENT_PRESETS,
          DARK_THEME,
          LIGHT_THEME,
          LS_ACCENT_COLOR_KEY,
          LS_THEME_MODE_KEY,
          TABBY_ASSIST_MINT,
          TABBY_ASSIST_MINT_STRONG,
          getTabStudioInteractiveFieldStyle,
          normalizeBillingCycle,
          onBack: () => navigateTo("/editor"),
          onContinue: continueToCheckout,
          onGoSignIn: () => navigateTo("/signin"),
          selectedBillingCycle,
          selectedPlan,
          siteHeaderBarStyle,
          siteHeaderEditorLinkStyle,
          siteHeaderLeftGroupStyle,
          siteHeaderLogoButtonStyle,
          siteHeaderLogoImageStyle,
          siteHeaderSloganStyle,
          withAlpha,
        }}
      />
    );
  }

  if (routePath === "/signin") {
    return (
      <SigninPage
        shared={{
          ACCENT_PRESETS,
          DARK_THEME,
          LS_ACCENT_COLOR_KEY,
          LS_MEMBERSHIP_SCROLL_TO_PLANS_KEY,
          LS_THEME_MODE_KEY,
          TABBY_ASSIST_MINT,
          TABBY_ASSIST_MINT_STRONG,
          TabbySpeechBubble,
          VIEWPORT_TABBY_ASSET_MAX_WIDTH_PX,
          VIEWPORT_TABBY_BOTTOM_PX,
          VIEWPORT_TABBY_CONTAINER_SIZE_PX,
          VIEWPORT_TABBY_GLOW_SIZE_PX,
          VIEWPORT_TABBY_RIGHT_PX,
          VIEWPORT_TABBY_Z_INDEX,
          getTabStudioInteractiveFieldStyle,
          onAuthSuccess: completeSignin,
          onBack: () => navigateTo("/editor"),
          onGoMembership: () => {
            try {
              window.sessionStorage.setItem(LS_MEMBERSHIP_SCROLL_TO_PLANS_KEY, "true");
            } catch {}
            navigateTo("/membership");
          },
          siteHeaderBarStyle,
          siteHeaderEditorLinkStyle,
          siteHeaderLeftGroupStyle,
          siteHeaderLogoButtonStyle,
          siteHeaderLogoImageStyle,
          siteHeaderSloganStyle,
          withAlpha,
        }}
      />
    );
  }

  if (routePath === "/auth/callback") {
    return (
      <AuthCallbackPage
        shared={{
          ACCENT_PRESETS,
          DARK_THEME,
          LS_ACCENT_COLOR_KEY,
          LS_THEME_MODE_KEY,
          TABBY_ASSIST_MINT,
          TABBY_ASSIST_MINT_STRONG,
          onBack: () => navigateTo("/editor"),
          onContinueToAccountSetup: () => {
            setForcedProfileSetupAfterPayment(true);
            navigateTo("/profile-setup");
          },
          onContinueToResetPassword: () => navigateTo("/auth/reset-password"),
          onReturnToTabStudio: () => navigateTo("/"),
          siteHeaderBarStyle,
          siteHeaderLeftGroupStyle,
          siteHeaderLogoButtonStyle,
          siteHeaderLogoImageStyle,
          siteHeaderSloganStyle,
          withAlpha,
        }}
      />
    );
  }

  if (routePath === "/auth/reset-password") {
    return (
      <ResetPasswordPage
        shared={{
          ACCENT_PRESETS,
          DARK_THEME,
          LS_ACCENT_COLOR_KEY,
          LS_THEME_MODE_KEY,
          TABBY_ASSIST_MINT,
          onBack: () => navigateTo("/editor"),
          onGoSignIn: () => navigateTo("/signin"),
          onRecoverySessionResolved: handleRecoverySessionResolved,
          onResetPasswordComplete: handleResetPasswordComplete,
          siteHeaderBarStyle,
          siteHeaderEditorLinkStyle,
          siteHeaderLeftGroupStyle,
          siteHeaderLogoButtonStyle,
          siteHeaderLogoImageStyle,
          siteHeaderRightGroupStyle,
          siteHeaderSloganStyle,
          withAlpha,
        }}
      />
    );
  }

  if (routePath === "/checkout") {
    let shouldAutoLaunchCheckout = false;
    if (typeof window !== "undefined") {
      try {
        shouldAutoLaunchCheckout = window.sessionStorage.getItem(SESSION_CHECKOUT_AUTOSTART_KEY) === "true";
      } catch {}
    }

    return (
      <CheckoutPlaceholderPage
        shared={{
          ACCENT_PRESETS,
          DARK_THEME,
          LIGHT_THEME,
          LS_ACCENT_COLOR_KEY,
          LS_THEME_MODE_KEY,
          TABBY_ASSIST_MINT,
          TABBY_ASSIST_MINT_STRONG,
          checkoutAutostartKey: SESSION_CHECKOUT_AUTOSTART_KEY,
          checkoutButtonLabel: enableDevCheckout ? "Continue to Secure Checkout (Developer Mode)" : "Continue to Secure Checkout",
          checkoutErrorMessage: checkoutLaunchError,
          isCheckoutProcessing: isLaunchingCheckout,
          normalizeBillingCycle,
          onActivateMembership: enableDevCheckout ? activateMembershipDevMode : launchHostedStripeCheckout,
          onBack: () => navigateTo("/signup"),
          onChangePlan: () => {
            try {
              window.sessionStorage.setItem(LS_MEMBERSHIP_SCROLL_TO_PLANS_KEY, "true");
            } catch {}
            navigateTo("/membership");
          },
          shouldAutoLaunchCheckout,
          selectedBillingCycle,
          selectedPlan,
          siteHeaderBarStyle,
          siteHeaderEditorLinkStyle,
          siteHeaderLeftGroupStyle,
          siteHeaderLogoButtonStyle,
          siteHeaderLogoImageStyle,
          siteHeaderSloganStyle,
          withAlpha,
        }}
      />
    );
  }

  if (routePath === "/profile-setup") {
    return (
      <ProfileSetupPage
        shared={{
          ACCENT_PRESETS,
          AvatarSilhouetteIcon,
          DARK_THEME,
          INSTRUMENTS,
          LIGHT_THEME,
          LS_ACCENT_COLOR_KEY,
          LS_THEME_MODE_KEY,
          TABBY_ASSIST_MINT,
          TabbySpeechBubble,
          VIEWPORT_TABBY_ASSET_MAX_WIDTH_PX,
          VIEWPORT_TABBY_BOTTOM_PX,
          VIEWPORT_TABBY_CONTAINER_SIZE_PX,
          VIEWPORT_TABBY_GLOW_SIZE_PX,
          VIEWPORT_TABBY_RIGHT_PX,
          VIEWPORT_TABBY_Z_INDEX,
          getTabStudioInteractiveFieldStyle,
          logoDark,
          logoLight,
          onBackToEditor: () => navigateTo("/editor"),
          onSaveProfile: saveProfileSetup,
          siteHeaderBarStyle,
          siteHeaderEditorLinkStyle,
          siteHeaderLeftGroupStyle,
          siteHeaderLogoButtonStyle,
          siteHeaderLogoImageStyle,
          siteHeaderSloganStyle,
          tabbyDark,
          tabbyLight,
          userState,
          withAlpha,
        }}
      />
    );
  }

  if (routePath === "/success") {
    return (
      <SuccessPage
        shared={{
          ACCENT_PRESETS,
          DARK_THEME,
          LIGHT_THEME,
          LS_ACCENT_COLOR_KEY,
          LS_THEME_MODE_KEY,
          siteHeaderBarStyle,
          siteHeaderLeftGroupStyle,
          siteHeaderLogoButtonStyle,
          siteHeaderLogoImageStyle,
          siteHeaderSloganStyle,
          withAlpha,
        }}
      />
    );
  }

  if (routePath === "/billing") {
    return (
      <BillingPage
        shared={{
          ACCENT_PRESETS,
          DARK_THEME,
          LIGHT_THEME,
          LS_ACCENT_COLOR_KEY,
          LS_THEME_MODE_KEY,
          onBackToEditor: () => navigateTo("/editor"),
          userState,
        }}
      />
    );
  }

  if (
    routePath === "/" ||
    routePath === "/editor" ||
    routePath === "/projects" ||
    routePath === "/export" ||
    routePath === "/account" ||
    routePath === "/account/billing"
  ) {
    return (
      <EditorApp
        navigateTo={navigateTo}
        pendingOpenPanel={
          routePath === "/projects"
            ? "projects"
            : routePath === "/export"
            ? "export"
            : routePath === "/account"
            ? "account"
            : routePath === "/account/billing"
            ? "account-billing"
            : pendingEditorPanel
        }
        onPendingPanelHandled={clearPendingEditorPanel}
        updateUserState={updateUserState}
        userState={userState}
      />
    );
  }

  return (
    <EditorApp
      navigateTo={navigateTo}
      pendingOpenPanel={pendingEditorPanel}
      onPendingPanelHandled={clearPendingEditorPanel}
      updateUserState={updateUserState}
      userState={userState}
    />
  );
}

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

function projectSnapshotSignature(snapshot) {
  try {
    return JSON.stringify(snapshot || {});
  } catch {
    return "";
  }
}

function shouldRunImmediateFollowUpSave(reason) {
  const value = String(reason || "").trim().toLowerCase();
  if (!value) return false;
  return (
    value.includes("switch-document") ||
    value.includes("final-flush") ||
    value.includes("beforeunload") ||
    value.includes("pagehide") ||
    value.includes("unmount") ||
    value.includes("manual")
  );
}

function normalizeTuningNote(value) {
  return String(value ?? "")
    .trim()
    .replace(/[a-z]/g, (ch) => ch.toUpperCase());
}

function lowToHighToApp(lowToHigh) {
  // input LOW→HIGH like ["E","A","D","G","B","E"] -> app HIGH→LOW
  return (lowToHigh ?? []).slice().reverse().map((s) => normalizeTuningNote(s));
}
function appToLowToHigh(appTuning) {
  return (appTuning ?? []).slice().reverse().map((s) => normalizeTuningNote(s));
}
function formatLowToHighString(arr) {
  return (arr ?? []).map((s) => normalizeTuningNote(s)).join(" ");
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
  const artists = data?.artists && typeof data.artists === "object" ? data.artists : {};
  for (const artistName of Object.keys(artists)) {
    const albums = artists?.[artistName]?.albums && typeof artists[artistName].albums === "object" ? artists[artistName].albums : {};
    for (const albumName of Object.keys(albums)) {
      const songs = albums?.[albumName]?.songs && typeof albums[albumName].songs === "object" ? albums[albumName].songs : {};
      for (const songName of Object.keys(songs)) {
        total += getTabCountForSongEntry(songs[songName]);
      }
    }
  }
  const unsortedAlbums =
    data?.unsorted?.albums && typeof data.unsorted.albums === "object" ? data.unsorted.albums : {};
  for (const albumName of Object.keys(unsortedAlbums)) {
    const songs =
      unsortedAlbums?.[albumName]?.songs && typeof unsortedAlbums[albumName].songs === "object"
        ? unsortedAlbums[albumName].songs
        : {};
    for (const songName of Object.keys(songs)) {
      total += getTabCountForSongEntry(songs[songName]);
    }
  }
  return total;
}
function makeEmptyLibrary() {
  return { artists: {}, unsorted: { albums: { [NO_ALBUM_NAME]: { songs: {} } } } };
}
function normalizeLibraryData(raw) {
  const base = makeEmptyLibrary();
  if (!raw || typeof raw !== "object") return base;

  const result = {
    artists: {},
    unsorted: {
      albums: {},
    },
  };

  const artists = raw?.artists && typeof raw.artists === "object" ? raw.artists : {};
  for (const artistName of Object.keys(artists)) {
    const cleanArtistName = String(artistName || "").trim();
    if (!cleanArtistName) continue;
    const artistData = artists[artistName];
    const artistAlbums =
      artistData?.albums && typeof artistData.albums === "object" && !Array.isArray(artistData.albums)
        ? artistData.albums
        : {};
    const normalizedAlbums = {};
    for (const albumName of Object.keys(artistAlbums)) {
      const cleanAlbumName = String(albumName || "").trim() || NO_ALBUM_NAME;
      const albumData = artistAlbums[albumName];
      const songs =
        albumData?.songs && typeof albumData.songs === "object" && !Array.isArray(albumData.songs)
          ? albumData.songs
          : {};
      normalizedAlbums[cleanAlbumName] = { songs: { ...songs } };
    }
    if (!normalizedAlbums[NO_ALBUM_NAME]) normalizedAlbums[NO_ALBUM_NAME] = { songs: {} };
    result.artists[cleanArtistName] = { albums: normalizedAlbums };
  }

  const unsortedAlbums =
    raw?.unsorted?.albums && typeof raw.unsorted.albums === "object" && !Array.isArray(raw.unsorted.albums)
      ? raw.unsorted.albums
      : {};
  for (const albumName of Object.keys(unsortedAlbums)) {
    const cleanAlbumName = String(albumName || "").trim() || NO_ALBUM_NAME;
    const albumData = unsortedAlbums[albumName];
    const songs =
      albumData?.songs && typeof albumData.songs === "object" && !Array.isArray(albumData.songs)
        ? albumData.songs
        : {};
    result.unsorted.albums[cleanAlbumName] = { songs: { ...songs } };
  }
  if (!result.unsorted.albums[NO_ALBUM_NAME]) result.unsorted.albums[NO_ALBUM_NAME] = { songs: {} };
  return result;
}

function isSongTabsContainer(entry) {
  return Boolean(entry && typeof entry === "object" && entry.tabs && typeof entry.tabs === "object" && !Array.isArray(entry.tabs));
}

function getTabCountForSongEntry(entry) {
  if (!isSongTabsContainer(entry)) return entry ? 1 : 0;
  const tabIds = Object.keys(entry.tabs || {});
  return tabIds.length || 1;
}

function getSongTabsModel(entry) {
  if (isSongTabsContainer(entry)) {
    const tabs = entry.tabs && typeof entry.tabs === "object" ? entry.tabs : {};
    const knownIds = Object.keys(tabs);
    const fromOrder = Array.isArray(entry.tabOrder) ? entry.tabOrder.map((id) => String(id || "")).filter(Boolean) : [];
    const tabOrder = [];
    for (const id of fromOrder) {
      if (tabs[id] && !tabOrder.includes(id)) tabOrder.push(id);
    }
    for (const id of knownIds) {
      if (!tabOrder.includes(id)) tabOrder.push(id);
    }
    return { tabs, tabOrder };
  }
  const fallbackId = "tab-1";
  const fallbackTab = entry && typeof entry === "object" ? { ...entry } : {};
  if (!fallbackTab.tabName) fallbackTab.tabName = "Tab 1";
  return {
    tabs: { [fallbackId]: fallbackTab },
    tabOrder: [fallbackId],
  };
}

function buildSongEntryWithTabs(baseEntry, tabs, tabOrder, nextActiveTabId = "") {
  const source = baseEntry && typeof baseEntry === "object" ? baseEntry : {};
  const nextTabs = tabs && typeof tabs === "object" ? tabs : {};
  const nextOrder = Array.isArray(tabOrder) ? tabOrder.map((id) => String(id || "")).filter(Boolean) : Object.keys(nextTabs);
  const ordered = [];
  for (const id of nextOrder) {
    if (nextTabs[id] && !ordered.includes(id)) ordered.push(id);
  }
  for (const id of Object.keys(nextTabs)) {
    if (!ordered.includes(id)) ordered.push(id);
  }
  const activeTabId = ordered.includes(nextActiveTabId) ? nextActiveTabId : ordered[0] || "";
  return {
    songName: String(source.songName || ""),
    artistName: String(source.artistName || ""),
    albumName: String(source.albumName || ""),
    createdAt: String(source.createdAt || ""),
    updatedAt: String(source.updatedAt || ""),
    tabs: nextTabs,
    tabOrder: ordered,
    activeTabId,
  };
}

function getSloganText() {
  return "Tabs, simplified";
}

function createSongId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {}
  return `song_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildChordTuningId(instrumentId, lowToHighTuning) {
  const notes = Array.isArray(lowToHighTuning) ? lowToHighTuning.map((value) => String(value ?? "").trim()) : [];
  return [String(instrumentId || "gtr6"), ...notes].join("|");
}

function isStandardGuitarTuning(instrumentId, lowToHighTuning) {
  if (String(instrumentId || "") !== "gtr6") return false;
  const notes = Array.isArray(lowToHighTuning) ? lowToHighTuning.map((value) => String(value ?? "").trim().toLowerCase()) : [];
  return notes.join("|") === "e|a|d|g|b|e";
}

function cloneJson(value, fallback) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return fallback;
  }
}

function findSongLocationById(libraryData, songId) {
  const targetId = String(songId || "").trim();
  if (!targetId) return null;
  const library = normalizeLibraryData(cloneJson(libraryData, makeEmptyLibrary()));

  const searchSongs = (artistName, albums) => {
    for (const albumName of Object.keys(albums || {})) {
      const songs = albums?.[albumName]?.songs || {};
      for (const songName of Object.keys(songs)) {
        if (String(songs?.[songName]?.songId || "").trim() === targetId) {
          return { artistName, albumName, songName, snapshot: songs[songName] };
        }
      }
    }
    return null;
  };

  const unsortedMatch = searchSongs("Unsorted", library?.unsorted?.albums || {});
  if (unsortedMatch) return unsortedMatch;

  for (const artistName of Object.keys(library?.artists || {})) {
    const match = searchSongs(artistName, library?.artists?.[artistName]?.albums || {});
    if (match) return match;
  }

  return null;
}

function readLibraryData() {
  try {
    const raw = localStorage.getItem(LS_LIBRARY_V1_KEY);
    const parsed = JSON.parse(String(raw ?? "{}"));
    return normalizeLibraryData(parsed);
  } catch {
    return makeEmptyLibrary();
  }
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
  { action: "Save project", win: "Ctrl+S", mac: "Cmd+S", scope: "Global", description: "Save current song to library." },
  { action: "Open Projects", win: "Ctrl+O", mac: "Cmd+O", scope: "Global", description: "Open Projects & Library." },
  { action: "Export", win: "Ctrl+E", mac: "Cmd+E", scope: "Global", description: "Open export panel." },
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
    action: "Move down one cell",
    win: "Enter",
    mac: "Enter",
    scope: "Grid",
    description: "Move down one string while keeping column.",
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
    action: "Jump to String 1",
    win: "Shift+1",
    mac: "Shift+1",
    scope: "Grid",
    description: "Jump to string row 1 (top string) at the same column.",
  },
  {
    action: "Jump to String 2",
    win: "Shift+2",
    mac: "Shift+2",
    scope: "Grid",
    description: "Jump to string row 2 at the same column.",
  },
  {
    action: "Jump to String 3",
    win: "Shift+3",
    mac: "Shift+3",
    scope: "Grid",
    description: "Jump to string row 3 at the same column.",
  },
  {
    action: "Jump to String 4",
    win: "Shift+4",
    mac: "Shift+4",
    scope: "Grid",
    description: "Jump to string row 4 at the same column.",
  },
  {
    action: "Jump to String 5",
    win: "Shift+5",
    mac: "Shift+5",
    scope: "Grid",
    description: "Jump to string row 5 at the same column.",
  },
  {
    action: "Jump to String 6",
    win: "Shift+6",
    mac: "Shift+6",
    scope: "Grid",
    description: "Jump to string row 6 at the same column.",
  },
  {
    action: "Jump to String 7",
    win: "Shift+7",
    mac: "Shift+7",
    scope: "Grid",
    description: "Jump to string row 7 at the same column (7-string instruments only).",
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
    action: "Paste copied cells",
    win: "Ctrl+V",
    mac: "Cmd+V",
    scope: "Grid",
    description: "Paste copied cells. Full-column copies paste into the destination column of the selected cell.",
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

const SHORTCUTS_CATEGORY_FILTERS = [
  { id: "all", label: "All" },
  { id: "global", label: "Global" },
  { id: "grid", label: "Grid" },
  { id: "song-inputs", label: "Song Inputs" },
  { id: "navigation", label: "Navigation" },
  { id: "editing", label: "Editing" },
];

function getShortcutCategoryId(item) {
  const scope = String(item?.scope || "").trim().toLowerCase();
  const action = String(item?.action || "").trim().toLowerCase();
  if (scope === "global") return "global";
  if (scope === "song inputs") return "song-inputs";

  const isNavigationAction =
    action.startsWith("move ") ||
    action.startsWith("jump ") ||
    action.includes("focus ") ||
    action.includes("return focus") ||
    action.startsWith("open instrument menu") ||
    action.startsWith("open tuning menu") ||
    action.startsWith("open capo menu") ||
    action.startsWith("open chords menu") ||
    action.startsWith("open insert menu") ||
    action.startsWith("open insert quickly");
  if (isNavigationAction) return "navigation";

  const isEditingAction =
    action.startsWith("insert key trigger") ||
    action.startsWith("enter fret values") ||
    action.startsWith("clear ") ||
    action.startsWith("copy ") ||
    action.startsWith("select all ") ||
    action.startsWith("add/remove ") ||
    action.startsWith("duplicate ") ||
    action.startsWith("delete ") ||
    action.startsWith("complete row") ||
    action.startsWith("reset columns");
  if (isEditingAction || scope === "insert menu" || scope === "completed rows") return "editing";

  if (scope === "grid" || scope === "toolbar") return "grid";
  return "grid";
}

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
  "Move down one cell": "Mover una celda abajo",
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
  "Paste copied cells": "Pegar celdas copiadas",
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
  "Save current song to library.": "Guardar la canción actual en la biblioteca.",
  "Open Projects & Library.": "Abrir Proyectos y biblioteca.",
  "Export current tab as PDF.": "Exportar la tablatura actual como PDF.",
  "Open the Settings sidebar.": "Abrir la barra lateral de ajustes.",
  "Open Settings and expand Shortcuts & Tips.": "Abrir Ajustes y desplegar Atajos y consejos.",
  "Focus the Song name input from the editor.": "Enfocar el campo Nombre de la canción desde el editor.",
  "Focus the Artist input from the editor.": "Enfocar el campo Artista desde el editor.",
  "Blur Song/Artist input and restore grid focus.": "Quitar foco de Canción/Artista y volver a la cuadrícula.",
  "Move down one string while keeping column.": "Mover abajo una cuerda manteniendo columna.",
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
  "Paste copied cells. Full-column copies paste into the destination column of the selected cell.":
    "Pegar celdas copiadas. Las copias de columna completa se pegan en la columna de destino de la celda seleccionada.",
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
    let maxLen = 1;
    let minLen = Number.POSITIVE_INFINITY;
    let hasFilledCell = false;
    for (let r = 0; r < tuning.length; r++) {
      const raw = String(grid?.[r]?.[c] ?? "");
      const trimmed = raw.trim();
      if (trimmed === "") continue;
      hasFilledCell = true;
      const len = trimmed.length;
      maxLen = Math.max(maxLen, len);
      minLen = Math.min(minLen, len);
    }
    // Mixed-width columns (e.g. 7 and 11) need one extra slot to center nicely.
    if (hasFilledCell && minLen < maxLen && maxLen > 1) return maxLen + 1;
    return maxLen;
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
        return centerPad(trimmed, w, "-");
      });
      // Keep a guard dash at both edges so tabs always render as: Tuning|-...-|
      return `${normalizeTuningNote(label)}|-${cells.join("-")}-|`;
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
          t.lowToHigh.length > 0
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
          c.frets.length > 0
      )
      .map((c) => ({
        id: c.id,
        name: c.name,
        frets: c.frets.map((x) => String(x ?? "").trim()),
        tuningId: String(c.tuningId || buildChordTuningId("gtr6", ["E", "A", "D", "G", "B", "E"])),
        tuningName: String(c.tuningName || "Standard"),
        instrumentId: String(c.instrumentId || "gtr6"),
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

function buildPdfPageLayout({
  title,
  artist,
  albumName,
  instrumentLabel,
  tuningLabel,
  capoEnabled,
  capoFret,
  tempoEnabled,
  tempoBpm,
  completedRows,
  showSong = true,
  showArtist = true,
  showAlbum = true,
  showInstrument = true,
  showTuning = true,
  showCapo = true,
  showTempo = true,
  showHeaderBranding = true,
  footerBrandingText = PDF_FOOTER_BRANDING_TEXT,
  rowGrouping = "fill",
}) {
  const pageW = 595.28;
  const pageH = 841.89;
  const margin = 56;

  const fontSize = 11;
  const lineH = 14;
  const footerTopGap = 8;
  const footerBottomInset = 10;
  const footerReserved = footerTopGap + lineH + footerBottomInset;

  const usableW = pageW - margin * 2;
  const maxChars = Math.max(40, Math.floor(usableW / (fontSize * 0.6)));

  function wrapLineToObjects(text, font = "F1") {
    const wrapped = wrapMonospaceLine(String(text ?? ""), maxChars);
    return wrapped.map((w) => ({ text: w, font }));
  }

  const blocks = [];

  {
    const b = [];

    if (showHeaderBranding) {
      b.push(...wrapLineToObjects("TabStudio", "F2"));
      b.push(...wrapLineToObjects(EXPORT_BRANDING_TEXT, "F1"));
      b.push(...wrapLineToObjects("", "F1"));
    }

    const cleanTitle = String(title ?? "").trim();
    const cleanArtist = String(artist ?? "").trim();
    const cleanAlbum = String(albumName ?? "").trim();
    const metaParts = [];
    if (showArtist && cleanArtist) metaParts.push(`Artist: ${cleanArtist}`);
    if (showAlbum && cleanAlbum && cleanAlbum !== NO_ALBUM_NAME) metaParts.push(`Album: ${cleanAlbum}`);
    if (showSong && cleanTitle) metaParts.push(`Song: ${cleanTitle}`);
    if (metaParts.length > 0) b.push(...wrapLineToObjects(metaParts.join(" | "), "F1"));

    const cleanInstrument = String(instrumentLabel ?? "").trim();
    const cleanTuning = String(tuningLabel ?? "").trim();
    const infoParts = [];
    if (showInstrument && cleanInstrument) infoParts.push(`Instrument: ${cleanInstrument}`);
    if (showTuning && cleanTuning) infoParts.push(`Tuning: ${cleanTuning}`);
    if (showCapo && hasConfiguredCapo(capoEnabled, capoFret)) infoParts.push(`Capo: ${String(capoFret || "").trim()}`);
    if (showTempo && hasConfiguredTempo(tempoEnabled, tempoBpm)) infoParts.push(`Tempo: ${String(tempoBpm || "").trim()} BPM`);
    if (infoParts.length > 0) b.push(...wrapLineToObjects(infoParts.join(" | "), "F1"));

    b.push(...wrapLineToObjects("", "F1"));
    blocks.push({ lines: b, kind: "header" });
  }

  if (!completedRows || completedRows.length === 0) {
    blocks.push({ lines: wrapLineToObjects("(No completed rows yet)", "F1"), kind: "row" });
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
      blocks.push({ lines: b, kind: "row" });
    }
  }

  const contentLinesPerPage = Math.max(1, Math.floor((pageH - margin * 2 - footerReserved) / lineH));

  const contentPages = [];
  let current = [];
  let used = 0;
  let currentRowCount = 0;
  const rowBlocks = blocks.filter((b) => b.kind === "row");
  let rowIndexCursor = 0;

  function flushPage() {
    contentPages.push({ lines: current, rowCount: currentRowCount });
    current = [];
    used = 0;
    currentRowCount = 0;
  }

  for (let bi = 0; bi < blocks.length; bi += 1) {
    const block = blocks[bi];
    const blockLines = block.lines;
    const blockLen = blockLines.length;
    const isRowBlock = block.kind === "row";

    if (used > 0 && used + blockLen > contentLinesPerPage) flushPage();

    if (blockLen > contentLinesPerPage) {
      let i = 0;
      while (i < blockLines.length) {
        const slice = blockLines.slice(i, i + contentLinesPerPage);
        if (used > 0) flushPage();
        current.push(...slice);
        used += slice.length;
        if (isRowBlock) currentRowCount += 1;
        i += contentLinesPerPage;
        flushPage();
      }
      if (isRowBlock) rowIndexCursor += 1;
      continue;
    }

    if (rowGrouping === "grouped" && isRowBlock) {
      const remainingRowsIncludingCurrent = rowBlocks.length - rowIndexCursor;
      const addingWouldLeaveSingleRowForNextPage = remainingRowsIncludingCurrent > 1 && remainingRowsIncludingCurrent - 1 === 1;
      const canDeferToNextPage = currentRowCount >= 1 && used > 0;
      if (addingWouldLeaveSingleRowForNextPage && canDeferToNextPage) {
        flushPage();
      }
    }

    current.push(...blockLines);
    used += blockLen;
    if (isRowBlock) {
      currentRowCount += 1;
      rowIndexCursor += 1;
    }
  }

  if (current.length) contentPages.push({ lines: current, rowCount: currentRowCount });
  if (contentPages.length === 0) contentPages.push({ lines: [], rowCount: 0 });

  const pages = contentPages.map((pageData, pageIndex) => {
    const contentLines = pageData.lines.slice();
    while (contentLines.length < contentLinesPerPage) contentLines.push({ text: "", font: "F1" });
    return {
      contentLines,
      footerLeft: String(footerBrandingText || "").trim(),
      footerRight: `Page ${pageIndex + 1} of ${contentPages.length}`,
    };
  });

  return {
    pageW,
    pageH,
    margin,
    fontSize,
    lineH,
    footerTopGap,
    footerBottomInset,
    footerReserved,
    pages,
  };
}

function buildPdfBytes({
  title,
  artist,
  albumName,
  instrumentLabel,
  tuningLabel,
  capoEnabled,
  capoFret,
  tempoEnabled,
  tempoBpm,
  completedRows,
  showSong = true,
  showArtist = true,
  showAlbum = true,
  showInstrument = true,
  showTuning = true,
  showCapo = true,
  showTempo = true,
  showHeaderBranding = true,
  footerBrandingText = PDF_FOOTER_BRANDING_TEXT,
  rowGrouping = "fill",
  thickness = "B",
}) {
  const { pageW, pageH, margin, fontSize, lineH, footerBottomInset, pages } = buildPdfPageLayout({
    title,
    artist,
    albumName,
    instrumentLabel,
    tuningLabel,
    capoEnabled,
    capoFret,
    tempoEnabled,
    tempoBpm,
    completedRows,
    showSong,
    showArtist,
    showAlbum,
    showInstrument,
    showTuning,
    showCapo,
    showTempo,
    showHeaderBranding,
    footerBrandingText,
    rowGrouping,
  });

  const pageStreams = pages.map((pageData) => {
    const x = margin;
    const yStart = pageH - margin;
    const contentLines = pageData.contentLines || [];

    let stream = "";
    stream += "BT\n";
    stream += `/F1 ${fontSize} Tf\n`;
    stream += `1 0 0 1 ${x.toFixed(2)} ${yStart.toFixed(2)} Tm\n`;

    let currentFont = "F1";
    const resolvedThickness = ["A", "B", "C"].includes(String(thickness || "").toUpperCase())
      ? String(thickness || "").toUpperCase()
      : "B";
    for (let i = 0; i < contentLines.length; i++) {
      const ln = contentLines[i] || { text: "", font: "F1" };
      let targetFont = ln.font || "F1";
      if (resolvedThickness === "A") targetFont = "F1";
      else if (resolvedThickness === "C") targetFont = "F2";
      if (targetFont !== currentFont) {
        currentFont = targetFont;
        stream += `/${currentFont} ${fontSize} Tf\n`;
      }
      const safe = pdfEscapeLiteral(ln.text ?? "");
      stream += `(${safe}) Tj\n`;
      if (i !== contentLines.length - 1) stream += `0 ${(-lineH).toFixed(2)} Td\n`;
    }
    stream += "ET\n";

    const footerY = margin + footerBottomInset;
    const footerLeft = String(pageData.footerLeft || "");
    const footerRight = String(pageData.footerRight || "");
    const approxCharWidth = fontSize * 0.6;
    const footerRightX = Math.max(margin, pageW - margin - footerRight.length * approxCharWidth);

    if (footerLeft) {
      stream += "BT\n";
      stream += `/F1 ${fontSize} Tf\n`;
      stream += "0.42 g\n";
      stream += `1 0 0 1 ${margin.toFixed(2)} ${footerY.toFixed(2)} Tm\n`;
      stream += `(${pdfEscapeLiteral(footerLeft)}) Tj\n`;
      stream += "ET\n";
    }

    if (footerRight) {
      stream += "BT\n";
      stream += `/F1 ${fontSize} Tf\n`;
      stream += "0.42 g\n";
      stream += `1 0 0 1 ${footerRightX.toFixed(2)} ${footerY.toFixed(2)} Tm\n`;
      stream += `(${pdfEscapeLiteral(footerRight)}) Tj\n`;
      stream += "ET\n";
    }

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

function downloadBlobFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function sanitizeExportFileBase(str) {
  return String(str || "")
    .trim()
    .replace(/[^\w\- ]+/g, "")
    .replace(/\s+/g, " ");
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeHexColorOrFallback(value, fallback) {
  const clean = String(value ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(clean) ? clean : fallback;
}

function isLightHexColor(hex) {
  const safe = normalizeHexColorOrFallback(hex, "#000000");
  const r = parseInt(safe.slice(1, 3), 16);
  const g = parseInt(safe.slice(3, 5), 16);
  const b = parseInt(safe.slice(5, 7), 16);
  // Perceived brightness (WCAG-style luma approximation)
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luma >= 0.56;
}

function getHexLuma(hex) {
  const safe = normalizeHexColorOrFallback(hex, "#000000");
  const r = parseInt(safe.slice(1, 3), 16);
  const g = parseInt(safe.slice(3, 5), 16);
  const b = parseInt(safe.slice(5, 7), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function getAutoContrastedTextColor(bgHex, textHex) {
  const bg = normalizeHexColorOrFallback(bgHex, "#000000");
  const text = normalizeHexColorOrFallback(textHex, "#ffffff");
  const bgLuma = getHexLuma(bg);
  const textLuma = getHexLuma(text);
  // Keep chosen color unless the pair is too close in brightness.
  if (Math.abs(bgLuma - textLuma) >= 0.38) return text;
  return bgLuma >= 0.56 ? "#111111" : "#f2f2f2";
}

function makeExportRowLabel(row, idx) {
  const base = String(row?.name || "").trim();
  if (base) return base;
  return row?.kind === "note" ? `Note ${idx + 1}` : `Row ${idx + 1}`;
}

function getExportRowText(row, idx) {
  if (!row) return "";
  if (row.kind === "note") {
    const noteText = String(row.noteText ?? "");
    return noteText.length ? noteText : makeExportRowLabel(row, idx);
  }
  return buildRowTabWithRepeat(row);
}

function hasConfiguredCapo(capoEnabled, capoFret) {
  if (!capoEnabled) return false;
  const raw = String(capoFret ?? "").trim();
  if (!raw) return false;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 && n <= 24;
}

function hasConfiguredTempo(tempoEnabled, tempoBpm) {
  if (!tempoEnabled) return false;
  const raw = String(tempoBpm ?? "").trim();
  if (!raw) return false;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 30 && n <= 300;
}

function buildImageExportMetaLines({
  row,
  songTitle,
  artist,
  albumName,
  capoEnabled,
  capoFret,
  tempoEnabled,
  tempoBpm,
  showSong = false,
  showArtist = false,
  showAlbum = false,
  showInstrument = false,
  showTuning = false,
  showCapo = false,
  showTempo = false,
}) {
  const lines = [];
  if (showSong) {
    const v = String(songTitle || "").trim();
    if (v) lines.push(`Song: ${v}`);
  }
  if (showArtist) {
    const v = String(artist || "").trim();
    if (v) lines.push(`Artist: ${v}`);
  }
  if (showAlbum) {
    const v = String(albumName || "").trim();
    if (v && v !== NO_ALBUM_NAME) lines.push(`Album: ${v}`);
  }
  if (showInstrument) {
    const v = String(row?.instrumentLabelAtTime || "").trim();
    if (v) lines.push(`Instrument: ${v}`);
  }
  if (showTuning) {
    const arr = Array.isArray(row?.tuningAtTime) ? row.tuningAtTime : [];
    const v = arr.map((x) => normalizeTuningNote(x)).filter(Boolean).join(" ");
    if (v) lines.push(`Tuning: ${v}`);
  }
  if (showCapo && hasConfiguredCapo(capoEnabled, capoFret)) {
    const v = String(capoFret || "").trim();
    if (v) lines.push(`Capo: ${v}`);
  }
  if (showTempo && hasConfiguredTempo(tempoEnabled, tempoBpm)) {
    const v = String(tempoBpm || "").trim();
    if (v) lines.push(`Tempo: ${v} BPM`);
  }
  return lines;
}

function getThicknessPresetStyle(preset = "B") {
  if (preset === "A") return { fontWeight: 500, strokeWidth: 0 };
  if (preset === "C") return { fontWeight: 900, strokeWidth: 1.4 };
  return { fontWeight: 700, strokeWidth: 0.7 };
}

function getTextOutlinePreset(mode = "off") {
  if (mode === "strong") {
    return {
      canvasStrokeWidth: 2.6,
      canvasStrokeColor: "rgba(0,0,0,0.92)",
      previewShadow: "0 0 3px rgba(0,0,0,0.92), 0 0 6px rgba(0,0,0,0.72)",
    };
  }
  if (mode === "subtle") {
    return {
      canvasStrokeWidth: 1.25,
      canvasStrokeColor: "rgba(0,0,0,0.82)",
      previewShadow: "0 0 2px rgba(0,0,0,0.8)",
    };
  }
  return {
    canvasStrokeWidth: 0,
    canvasStrokeColor: "rgba(0,0,0,0)",
    previewShadow: "",
  };
}

function getImagePreviewTextShadow(thickness = "B", outlineMode = "off", textColor = "#ffffff") {
  const parts = [];
  const thick = getThicknessPresetStyle(thickness);
  if (thick.strokeWidth > 1) parts.push(`0 0 0 ${textColor}`, `0 0 1px ${textColor}`);
  else if (thick.strokeWidth > 0) parts.push(`0 0 0 ${textColor}`);
  const outline = getTextOutlinePreset(outlineMode);
  if (outline.previewShadow) parts.push(outline.previewShadow);
  return parts.length ? parts.join(", ") : "none";
}

async function renderRowTextToPngBlob({
  rowText,
  rowLabel,
  showRowLabel = true,
  metaLines = [],
  textColor = "#ffffff",
  bgMode = "transparent",
  bgColor = "#000000",
  thickness = "B",
  textOutline = "off",
  includeBranding = true,
  brandingText = EXPORT_BRANDING_TEXT,
  pixelRatio = 2,
  targetPixelWidth = null,
  paddingPreset = "normal",
}) {
  const lines = String(rowText ?? "").split(/\r?\n/);
  const safeLines = lines.length ? lines : [""];
  const family = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
  const { fontWeight, strokeWidth } = getThicknessPresetStyle(thickness);
  const outline = getTextOutlinePreset(textOutline);

  const fontSize = 24;
  const lineHeight = Math.round(fontSize * 1.35);
  const padding = getPngExportPaddingPixels(paddingPreset);
  const padX = padding.x;
  const padY = padding.y;
  const metaGap = 6;
  const metaBlockGap = 10;
  const labelGap = 18;
  const labelFontSize = 16;
  const metaFontSize = 13;
  const brandingGap = 12;
  const brandingFontSize = 12;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable.");

  ctx.font = `${fontWeight} ${fontSize}px ${family}`;
  const maxLineWidth = safeLines.reduce((m, ln) => Math.max(m, ctx.measureText(String(ln)).width), 0);
  ctx.font = `700 ${labelFontSize}px ${family}`;
  const hasRowLabel = !!(showRowLabel && rowLabel);
  const labelWidth = hasRowLabel ? ctx.measureText(rowLabel).width : 0;
  ctx.font = `600 ${metaFontSize}px ${family}`;
  const safeMetaLines = Array.isArray(metaLines) ? metaLines.map((x) => String(x || "")) : [];
  const maxMetaWidth = safeMetaLines.reduce((m, ln) => Math.max(m, ctx.measureText(ln).width), 0);

  const contentW = Math.max(maxLineWidth, labelWidth, maxMetaWidth);
  const cleanBrandingText = String(brandingText || "").trim();
  const hasBranding = includeBranding && cleanBrandingText.length > 0;
  ctx.font = `600 ${brandingFontSize}px ${family}`;
  const brandingWidth = hasBranding ? ctx.measureText(cleanBrandingText).width : 0;
  const metaBlockHeight = safeMetaLines.length ? safeMetaLines.length * (metaFontSize + metaGap) - metaGap : 0;
  const topBlockHeight = metaBlockHeight + (safeMetaLines.length && hasRowLabel ? metaBlockGap : 0) + (hasRowLabel ? labelFontSize + labelGap : 0);
  const width = Math.ceil(Math.max(contentW, brandingWidth) + padX * 2);
  const brandingHeight = hasBranding ? brandingGap + brandingFontSize : 0;
  const height = Math.ceil(padY * 2 + topBlockHeight + safeLines.length * lineHeight + brandingHeight);
  const baseOutputWidth = width * pixelRatio;
  const outputScale =
    Number.isFinite(Number(targetPixelWidth)) && Number(targetPixelWidth) > 0 ? Number(targetPixelWidth) / baseOutputWidth : 1;
  const renderScale = pixelRatio * outputScale;

  canvas.width = Math.max(1, Math.round(baseOutputWidth * outputScale));
  canvas.height = Math.max(1, Math.round(height * renderScale));
  ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
  ctx.clearRect(0, 0, width, height);

  if (bgMode === "solid") {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.fillStyle = textColor;
  let yCursor = padY;
  if (safeMetaLines.length) {
    ctx.font = `600 ${metaFontSize}px ${family}`;
    ctx.textBaseline = "top";
    safeMetaLines.forEach((line, i) => {
      const y = yCursor + i * (metaFontSize + metaGap);
      if (outline.canvasStrokeWidth > 0) {
        ctx.strokeStyle = outline.canvasStrokeColor;
        ctx.lineWidth = outline.canvasStrokeWidth;
        ctx.strokeText(String(line), padX, y);
      }
      ctx.fillText(String(line), padX, y);
    });
    yCursor += metaBlockHeight;
  }

  if (hasRowLabel) {
    if (safeMetaLines.length) yCursor += metaBlockGap;
    ctx.font = `700 ${labelFontSize}px ${family}`;
    ctx.textBaseline = "top";
    if (outline.canvasStrokeWidth > 0) {
      ctx.strokeStyle = outline.canvasStrokeColor;
      ctx.lineWidth = outline.canvasStrokeWidth;
      ctx.strokeText(rowLabel, padX, yCursor);
    }
    ctx.fillText(rowLabel, padX, yCursor);
    yCursor += labelFontSize + labelGap;
  }

  ctx.font = `${fontWeight} ${fontSize}px ${family}`;
  ctx.textBaseline = "top";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.strokeStyle = textColor;
  ctx.lineWidth = strokeWidth;
  const yStart = yCursor;
  safeLines.forEach((line, i) => {
    const y = yStart + i * lineHeight;
    if (outline.canvasStrokeWidth > 0) {
      ctx.strokeStyle = outline.canvasStrokeColor;
      ctx.lineWidth = outline.canvasStrokeWidth;
      ctx.strokeText(String(line), padX, y);
    }
    ctx.strokeStyle = textColor;
    ctx.lineWidth = strokeWidth;
    if (strokeWidth > 0) ctx.strokeText(String(line), padX, y);
    ctx.fillText(String(line), padX, y);
  });

  if (hasBranding) {
    const brandY = yStart + safeLines.length * lineHeight + brandingGap;
    const brandingColor = getAutoContrastedTextColor(bgMode === "solid" ? bgColor : "#000000", textColor);
    ctx.font = `600 ${brandingFontSize}px ${family}`;
    ctx.fillStyle = withAlpha(brandingColor, 0.8);
    if (outline.canvasStrokeWidth > 0) {
      ctx.strokeStyle = withAlpha(outline.canvasStrokeColor, 0.75);
      ctx.lineWidth = Math.max(0.8, outline.canvasStrokeWidth * 0.6);
      ctx.strokeText(cleanBrandingText, padX, brandY);
    }
    ctx.fillText(cleanBrandingText, padX, brandY);
  }

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Failed to encode PNG.");
  return blob;
}

async function renderRowsTextToPngBlob({
  rows,
  showRowLabels = true,
  textColor = "#ffffff",
  bgMode = "transparent",
  bgColor = "#000000",
  thickness = "B",
  textOutline = "off",
  includeBranding = true,
  brandingText = EXPORT_BRANDING_TEXT,
  pixelRatio = 2,
  targetPixelWidth = null,
  paddingPreset = "normal",
}) {
  const safeRows = Array.isArray(rows) && rows.length ? rows : [{ rowLabel: "", rowText: "" }];
  const family = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
  const { fontWeight, strokeWidth } = getThicknessPresetStyle(thickness);
  const outline = getTextOutlinePreset(textOutline);

  const fontSize = 24;
  const lineHeight = Math.round(fontSize * 1.35);
  const padding = getPngExportPaddingPixels(paddingPreset);
  const padX = padding.x;
  const padY = padding.y;
  const metaGap = 6;
  const metaBlockGap = 10;
  const labelGap = 18;
  const labelFontSize = 16;
  const metaFontSize = 13;
  const rowGap = 24;
  const brandingGap = 12;
  const brandingFontSize = 12;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable.");

  const blocks = safeRows.map((row) => {
    const rowLabel = showRowLabels ? String(row?.rowLabel ?? "").trim() : "";
    const metaLines = Array.isArray(row?.metaLines) ? row.metaLines.map((x) => String(x || "")) : [];
    const lines = String(row?.rowText ?? "").split(/\r?\n/);
    const safeLines = lines.length ? lines : [""];
    return { rowLabel, metaLines, safeLines };
  });

  let contentW = 0;
  ctx.font = `${fontWeight} ${fontSize}px ${family}`;
  blocks.forEach((block) => {
    const maxLineWidth = block.safeLines.reduce((m, ln) => Math.max(m, ctx.measureText(String(ln)).width), 0);
    contentW = Math.max(contentW, maxLineWidth);
  });
  ctx.font = `700 ${labelFontSize}px ${family}`;
  blocks.forEach((block) => {
    if (!block.rowLabel) return;
    contentW = Math.max(contentW, ctx.measureText(block.rowLabel).width);
  });
  ctx.font = `600 ${metaFontSize}px ${family}`;
  blocks.forEach((block) => {
    block.metaLines.forEach((line) => {
      contentW = Math.max(contentW, ctx.measureText(String(line)).width);
    });
  });

  const blocksH = blocks.reduce((sum, block) => {
    const metaBlockHeight = block.metaLines.length ? block.metaLines.length * (metaFontSize + metaGap) - metaGap : 0;
    const blockTop =
      metaBlockHeight + (metaBlockHeight && block.rowLabel ? metaBlockGap : 0) + (block.rowLabel ? labelFontSize + labelGap : 0);
    return sum + blockTop + block.safeLines.length * lineHeight;
  }, 0);
  const totalGap = rowGap * Math.max(0, blocks.length - 1);
  const cleanBrandingText = String(brandingText || "").trim();
  const hasBranding = includeBranding && cleanBrandingText.length > 0;
  ctx.font = `600 ${brandingFontSize}px ${family}`;
  const brandingWidth = hasBranding ? ctx.measureText(cleanBrandingText).width : 0;
  const brandingHeight = hasBranding ? brandingGap + brandingFontSize : 0;

  const width = Math.ceil(Math.max(contentW, brandingWidth) + padX * 2);
  const height = Math.ceil(padY * 2 + blocksH + totalGap + brandingHeight);
  const baseOutputWidth = width * pixelRatio;
  const outputScale =
    Number.isFinite(Number(targetPixelWidth)) && Number(targetPixelWidth) > 0 ? Number(targetPixelWidth) / baseOutputWidth : 1;
  const renderScale = pixelRatio * outputScale;

  canvas.width = Math.max(1, Math.round(baseOutputWidth * outputScale));
  canvas.height = Math.max(1, Math.round(height * renderScale));
  ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
  ctx.clearRect(0, 0, width, height);

  if (bgMode === "solid") {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.strokeStyle = textColor;
  ctx.lineWidth = strokeWidth;
  ctx.fillStyle = textColor;
  ctx.textBaseline = "top";

  let yCursor = padY;
  blocks.forEach((block, blockIndex) => {
    if (block.metaLines.length) {
      ctx.font = `600 ${metaFontSize}px ${family}`;
      block.metaLines.forEach((line, i) => {
        const y = yCursor + i * (metaFontSize + metaGap);
        if (outline.canvasStrokeWidth > 0) {
          ctx.strokeStyle = outline.canvasStrokeColor;
          ctx.lineWidth = outline.canvasStrokeWidth;
          ctx.strokeText(String(line), padX, y);
        }
        ctx.fillText(String(line), padX, y);
      });
      yCursor += block.metaLines.length * (metaFontSize + metaGap) - metaGap;
    }

    if (block.rowLabel) {
      if (block.metaLines.length) yCursor += metaBlockGap;
      ctx.font = `700 ${labelFontSize}px ${family}`;
      if (outline.canvasStrokeWidth > 0) {
        ctx.strokeStyle = outline.canvasStrokeColor;
        ctx.lineWidth = outline.canvasStrokeWidth;
        ctx.strokeText(block.rowLabel, padX, yCursor);
      }
      ctx.fillText(block.rowLabel, padX, yCursor);
      yCursor += labelFontSize + labelGap;
    }

    ctx.font = `${fontWeight} ${fontSize}px ${family}`;
    block.safeLines.forEach((line) => {
      if (outline.canvasStrokeWidth > 0) {
        ctx.strokeStyle = outline.canvasStrokeColor;
        ctx.lineWidth = outline.canvasStrokeWidth;
        ctx.strokeText(String(line), padX, yCursor);
      }
      ctx.strokeStyle = textColor;
      ctx.lineWidth = strokeWidth;
      if (strokeWidth > 0) ctx.strokeText(String(line), padX, yCursor);
      ctx.fillText(String(line), padX, yCursor);
      yCursor += lineHeight;
    });

    if (blockIndex < blocks.length - 1) yCursor += rowGap;
  });

  if (hasBranding) {
    const brandingColor = getAutoContrastedTextColor(bgMode === "solid" ? bgColor : "#000000", textColor);
    const brandY = yCursor + brandingGap;
    ctx.font = `600 ${brandingFontSize}px ${family}`;
    ctx.fillStyle = withAlpha(brandingColor, 0.8);
    if (outline.canvasStrokeWidth > 0) {
      ctx.strokeStyle = withAlpha(outline.canvasStrokeColor, 0.75);
      ctx.lineWidth = Math.max(0.8, outline.canvasStrokeWidth * 0.6);
      ctx.strokeText(cleanBrandingText, padX, brandY);
    }
    ctx.fillText(cleanBrandingText, padX, brandY);
  }

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Failed to encode PNG.");
  return blob;
}

function crc32Bytes(bytes) {
  let c = -1;
  for (let i = 0; i < bytes.length; i += 1) {
    c ^= bytes[i];
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ -1) >>> 0;
}

function u16le(n) {
  const b = new Uint8Array(2);
  const v = new DataView(b.buffer);
  v.setUint16(0, n & 0xffff, true);
  return b;
}

function u32le(n) {
  const b = new Uint8Array(4);
  const v = new DataView(b.buffer);
  v.setUint32(0, n >>> 0, true);
  return b;
}

async function buildStoredZipBlob(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const filenameBytes = encoder.encode(String(file.name || "file.bin"));
    const data = new Uint8Array(await file.blob.arrayBuffer());
    const crc = crc32Bytes(data);
    const size = data.length;

    const localHeader = concatBytes([
      u32le(0x04034b50),
      u16le(20),
      u16le(0x0800),
      u16le(0),
      u16le(0),
      u16le(0),
      u32le(crc),
      u32le(size),
      u32le(size),
      u16le(filenameBytes.length),
      u16le(0),
      filenameBytes,
    ]);
    localParts.push(localHeader, data);

    const centralHeader = concatBytes([
      u32le(0x02014b50),
      u16le(20),
      u16le(20),
      u16le(0x0800),
      u16le(0),
      u16le(0),
      u16le(0),
      u32le(crc),
      u32le(size),
      u32le(size),
      u16le(filenameBytes.length),
      u16le(0),
      u16le(0),
      u16le(0),
      u16le(0),
      u32le(0),
      u32le(offset),
      filenameBytes,
    ]);
    centralParts.push(centralHeader);

    offset += localHeader.length + data.length;
  }

  const centralDir = concatBytes(centralParts);
  const localDir = concatBytes(localParts);
  const eocd = concatBytes([
    u32le(0x06054b50),
    u16le(0),
    u16le(0),
    u16le(files.length),
    u16le(files.length),
    u32le(centralDir.length),
    u32le(localDir.length),
    u16le(0),
  ]);
  return new Blob([localDir, centralDir, eocd], { type: "application/zip" });
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

const LIGHT_THEME = {
  bg: "#F7F6F3",
  surfaceWarm: "#FFFEFB",
  border: "#D9D2C7",
  text: "#161411",
  textFaint: "rgba(22,20,17,0.72)",
  textMuted: "rgba(22,20,17,0.64)",
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
  textFaint: "rgba(245,245,245,0.72)",
  textMuted: "rgba(245,245,245,0.64)",
  accent: "#5BD4A1",
  accentSoft: "rgba(91,212,161,0.16)",
  danger: "#FF4B6A",
  dangerBg: "rgba(255,75,106,0.12)",
  starActive: "#F5C518",
};

function EditorApp({ navigateTo, pendingOpenPanel = "", onPendingPanelHandled, updateUserState, userState }) {
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
      // Migration guard: older/bad states persisted 1 as "default".
      // Keep app default behavior at 32 unless user explicitly picks another sensible default.
      if (Number(stored) === 1) return DEFAULT_COLS;
      return clampColsValue(stored, DEFAULT_COLS);
    } catch {
      return DEFAULT_COLS;
    }
  });
  const [defaultColsInput, setDefaultColsInput] = useState(String(defaultCols));
  const [colsAutoDelayMs, setColsAutoDelayMs] = useState(DEFAULT_COLS_AUTO_DELAY_MS);
  const activeAccent = ACCENT_PRESETS.find((p) => p.id === accentColorId) || ACCENT_PRESETS[0];
  const BASE_THEME = isDarkMode ? DARK_THEME : LIGHT_THEME;
  const THEME = {
    ...BASE_THEME,
    accent: activeAccent.hex,
    accentSoft: withAlpha(activeAccent.hex, isDarkMode ? 0.2 : 0.16),
  };
  const isLoggedIn = Boolean(userState?.isLoggedIn);
  const editorHasMembership = Boolean(userState?.hasMembership);
  const userPlanType = editorHasMembership ? normalizePlanId(userState?.planType) : null;
  const planPermissions = editorHasMembership ? getPlanPermissions(userPlanType) : null;
  const canUsePaidEditorFeatures = editorHasMembership;
  const canSaveTabs = Boolean(editorHasMembership && planPermissions?.canSave);
  const canExportPdfTabs = Boolean(editorHasMembership && planPermissions?.canExportPdf);
  const canExportPngTabs = Boolean(editorHasMembership && planPermissions?.canExportPng);
  const canUseTapToSync = Boolean(editorHasMembership && planPermissions?.canUseTapToSync);
  const maxSavedTabs = Number.isFinite(planPermissions?.maxSavedTabs) ? planPermissions.maxSavedTabs : Infinity;
  const showGridTabbyOnboarding = !editorHasMembership;

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
    const style = document.createElement("style");
    style.setAttribute("data-tabstudio-global", "true");
    style.textContent = `
      html, body, #root { width: 100%; min-height: 100%; margin: 0; }
      body { background: ${THEME.bg}; }
      :root {
        --tabstudio-accent: ${THEME.accent};
        --tabstudio-focus-ring: ${withAlpha(THEME.accent, isDarkMode ? 0.62 : 0.5)};
        --tabstudio-control-bg: ${THEME.surfaceWarm};
        --tabstudio-control-border: ${withAlpha(THEME.text, isDarkMode ? 0.34 : 0.24)};
        --tabstudio-control-hover-border: ${withAlpha(THEME.text, isDarkMode ? 0.52 : 0.38)};
        --tabstudio-control-active-bg: ${withAlpha(THEME.accent, isDarkMode ? 0.18 : 0.12)};
        --tabstudio-control-active-border: ${withAlpha(THEME.accent, 0.78)};
        --tabstudio-control-mark: ${THEME.accent};
        --tabstudio-control-disabled: ${withAlpha(THEME.text, isDarkMode ? 0.3 : 0.26)};
        --tabstudio-interact-hover-border: ${withAlpha(THEME.accent, 0.6)};
        --tabstudio-interact-hover-bg: ${withAlpha(THEME.accent, isDarkMode ? 0.16 : 0.1)};
        --tabstudio-interact-hover-ring: ${withAlpha(THEME.accent, isDarkMode ? 0.2 : 0.14)};
        --tabstudio-interact-active-ring: ${withAlpha(THEME.accent, isDarkMode ? 0.28 : 0.18)};
        --tabstudio-interact-selected-border: ${withAlpha(THEME.accent, 0.86)};
        --tabstudio-interact-selected-bg: ${withAlpha(THEME.accent, isDarkMode ? 0.24 : 0.16)};
        --tabstudio-interact-selected-ring: ${withAlpha(THEME.accent, isDarkMode ? 0.3 : 0.22)};
      }
      .tab-cols-input { -moz-appearance: textfield; appearance: textfield; }
      .tab-cols-input::selection { background: transparent; color: inherit; }
      .tab-cols-input::-moz-selection { background: transparent; color: inherit; }
      .tab-cols-input::-webkit-outer-spin-button,
      .tab-cols-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      input[type="checkbox"],
      input[type="radio"] {
        -webkit-appearance: none;
        appearance: none;
        margin: 0;
        width: 16px;
        height: 16px;
        box-sizing: border-box;
        display: inline-grid;
        place-content: center;
        vertical-align: middle;
        flex-shrink: 0;
        border: 1px solid var(--tabstudio-control-border);
        background: var(--tabstudio-control-bg);
        color: var(--tabstudio-control-mark);
        accent-color: var(--tabstudio-accent);
        cursor: pointer;
        transition: border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease, transform 160ms ease, opacity 160ms ease;
      }
      input[type="checkbox"] { border-radius: 5px; }
      input[type="radio"] { border-radius: 999px; }
      input[type="checkbox"]::before,
      input[type="radio"]::before {
        content: "";
        display: block;
      }
      input[type="checkbox"]::before {
        width: 4px;
        height: 8px;
        border-right: 2px solid var(--tabstudio-control-mark);
        border-bottom: 2px solid var(--tabstudio-control-mark);
        transform: rotate(45deg) scale(0.7);
        transform-origin: center;
        opacity: 0;
        transition: transform 150ms ease, opacity 150ms ease;
      }
      input[type="radio"]::before {
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: var(--tabstudio-control-mark);
        transform: scale(0);
        opacity: 0;
        transition: transform 150ms ease, opacity 150ms ease;
      }
      input[type="checkbox"]:hover,
      input[type="radio"]:hover {
        border-color: var(--tabstudio-control-hover-border);
      }
      input[type="checkbox"]:checked,
      input[type="radio"]:checked {
        border-color: var(--tabstudio-control-active-border);
        background: var(--tabstudio-control-active-bg);
      }
      input[type="checkbox"]:checked::before {
        opacity: 1;
        transform: rotate(45deg) scale(1);
      }
      input[type="radio"]:checked::before {
        opacity: 1;
        transform: scale(1);
      }
      input[type="checkbox"]:focus-visible,
      input[type="radio"]:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px var(--tabstudio-focus-ring);
      }
      input[type="checkbox"]:active,
      input[type="radio"]:active {
        transform: translateY(0.5px);
      }
      input[type="checkbox"]:disabled,
      input[type="radio"]:disabled {
        opacity: 0.55;
        border-color: var(--tabstudio-control-disabled);
        cursor: not-allowed;
      }
      .tabby-widget-btn,
      .tabby-widget-btn:hover,
      .tabby-widget-btn:active,
      .tabby-widget-btn:focus,
      .tabby-widget-btn:focus-visible {
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
        outline: none !important;
        transform: none !important;
        filter: none !important;
      }
      .tabby-upgrade-cta {
        height: 36px;
        border: none !important;
        border-color: transparent !important;
        border-radius: 12px;
        padding: 0 10px;
        background: ${TABBY_ASSIST_MINT} !important;
        color: #ffffff !important;
        font-size: 16px;
        font-weight: 900;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.25) !important;
        transform: translateY(0) !important;
        filter: none !important;
        transition: all 0.15s ease;
      }
      .tabby-upgrade-cta:hover {
        border-color: transparent !important;
        background: ${TABBY_ASSIST_MINT_STRONG} !important;
        color: #ffffff !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.25), 0 6px 16px rgba(16,185,129,0.35) !important;
        transform: translateY(-1px) !important;
        filter: none !important;
      }
      .tabby-upgrade-cta:active {
        border-color: transparent !important;
        background: ${TABBY_ASSIST_MINT_STRONG} !important;
        color: #ffffff !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.25), 0 6px 16px rgba(16,185,129,0.35) !important;
        transform: translateY(1px) scale(0.985) !important;
        filter: none !important;
      }
      .tabby-highlight {
        position: relative !important;
        z-index: 70 !important;
        opacity: 1 !important;
        filter: brightness(1.14) contrast(1.06) !important;
        box-shadow:
          0 0 0 4px rgba(52, 211, 153, 0.96),
          0 0 0 1px rgba(16, 185, 129, 0.72),
          0 0 34px rgba(16, 185, 129, 0.5),
          inset 0 0 0 999px rgba(52, 211, 153, 0.11) !important;
      }
      .tabby-tour-step-indicator {
        color: ${TABBY_ASSIST_MINT};
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.01em;
      }
      .tabby-tour-action-primary {
        min-height: 30px;
        border: none !important;
        border-radius: 10px;
        padding: 0 10px;
        background: ${TABBY_ASSIST_MINT} !important;
        color: #ffffff !important;
        font-size: 12px;
        font-weight: 900;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.24);
        transform: translateY(0);
        transition: all 0.15s ease;
      }
      .tabby-tour-action-primary:hover {
        background: ${TABBY_ASSIST_MINT_STRONG} !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.24), 0 6px 14px rgba(16,185,129,0.3) !important;
        transform: translateY(-1px);
      }
      .tabby-tour-action-primary:active {
        background: ${TABBY_ASSIST_MINT_STRONG} !important;
        transform: translateY(1px) scale(0.985);
      }
      .tabby-tour-dim-layer {
        position: fixed;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10;
        pointer-events: none;
      }
      .tab-grid-row-scroll {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .tab-grid-row-scroll::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
      }
      .tabstudio-settings-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: ${withAlpha(THEME.text, isDarkMode ? 0.4 : 0.3)} transparent;
      }
      .tabstudio-settings-scrollbar::-webkit-scrollbar {
        width: 7px;
      }
      .tabstudio-settings-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .tabstudio-settings-scrollbar::-webkit-scrollbar-thumb {
        background: ${withAlpha(THEME.text, isDarkMode ? 0.4 : 0.3)};
        border-radius: 999px;
      }
      .tabstudio-settings-scrollbar::-webkit-scrollbar-thumb:hover {
        background: ${withAlpha(THEME.text, isDarkMode ? 0.54 : 0.44)};
      }
      .tabstudio-ui-interactive,
      button,
      [role="button"],
      [role="menuitem"] {
        transition:
          transform 130ms ease,
          filter 140ms ease,
          background 150ms ease,
          border-color 150ms ease,
          color 150ms ease,
          box-shadow 150ms ease;
      }
      .tabstudio-ui-interactive:not([disabled]):not([aria-disabled="true"]):hover,
      button:not(:disabled):not([aria-disabled="true"]):not(.tabstudio-brand-logo-btn):hover,
      [role="button"]:not([aria-disabled="true"]):hover,
      [role="menuitem"]:not([aria-disabled="true"]):hover {
        border-color: var(--tabstudio-interact-hover-border) !important;
        background: var(--tabstudio-interact-hover-bg);
        box-shadow: 0 0 0 2px var(--tabstudio-interact-hover-ring);
        transform: translateY(-0.5px);
        filter: brightness(1.03) saturate(1.04);
      }
      .tabstudio-ui-interactive:not([disabled]):not([aria-disabled="true"]):active,
      button:not(:disabled):not([aria-disabled="true"]):not(.tabstudio-brand-logo-btn):active,
      [role="button"]:not([aria-disabled="true"]):active,
      [role="menuitem"]:not([aria-disabled="true"]):active {
        box-shadow: 0 0 0 2px var(--tabstudio-interact-active-ring);
        transform: translateY(0.5px) scale(0.988);
        filter: brightness(0.97);
      }
      .tabstudio-ui-interactive[aria-selected="true"],
      .tabstudio-ui-interactive[aria-pressed="true"],
      .tabstudio-ui-interactive[data-selected="true"],
      .tabstudio-ui-interactive.is-selected,
      button[aria-selected="true"],
      button[aria-pressed="true"],
      button[data-selected="true"],
      [role="button"][aria-selected="true"],
      [role="button"][aria-pressed="true"],
      [role="menuitem"][aria-selected="true"] {
        border-color: var(--tabstudio-interact-selected-border) !important;
        background: var(--tabstudio-interact-selected-bg) !important;
        box-shadow: 0 0 0 2px var(--tabstudio-interact-selected-ring) !important;
      }
      .tabstudio-editor-option {
        transition:
          transform 130ms ease,
          filter 140ms ease,
          background 150ms ease,
          border-color 150ms ease,
          color 150ms ease,
          box-shadow 150ms ease;
      }
      .tabstudio-editor-option:hover {
        border-color: var(--tabstudio-interact-hover-border) !important;
        background: var(--tabstudio-interact-hover-bg) !important;
        box-shadow: 0 0 0 2px var(--tabstudio-interact-hover-ring) !important;
      }
      .tabstudio-editor-option[aria-selected="true"] {
        border-color: var(--tabstudio-interact-selected-border) !important;
        background: var(--tabstudio-interact-selected-bg) !important;
        box-shadow: 0 0 0 2px var(--tabstudio-interact-selected-ring) !important;
      }
      .tab-grid-cell-button {
        transform: none !important;
        filter: none !important;
      }
      .tab-grid-cell-button:hover {
        border-color: ${gridCellHoverStyle.default.borderColor} !important;
        background: ${gridCellHoverStyle.default.background} !important;
        box-shadow: ${gridCellHoverStyle.default.boxShadow} !important;
        transform: none !important;
      }
      .tab-grid-cell-button[data-empty="true"]:hover {
        border-color: ${gridCellHoverStyle.empty.borderColor} !important;
        background: ${gridCellHoverStyle.empty.background} !important;
        box-shadow: ${gridCellHoverStyle.empty.boxShadow} !important;
      }
      .tab-grid-cell-button[data-column-selector="true"]:hover {
        border-color: ${gridCellHoverStyle.columnSelector.borderColor} !important;
        background: ${gridCellHoverStyle.columnSelector.background} !important;
        box-shadow: ${gridCellHoverStyle.columnSelector.boxShadow} !important;
      }
      .tab-grid-cell-button:active {
        border-color: ${gridCellHoverStyle.active.borderColor} !important;
        background: ${gridCellHoverStyle.active.background} !important;
        box-shadow: ${gridCellHoverStyle.active.boxShadow} !important;
        transform: none !important;
      }
      .tab-grid-cell-button[data-selected="true"],
      .tab-grid-cell-button[data-cursor="true"],
      .tab-grid-cell-button[data-replay-active="true"] {
        border-color: var(--tabstudio-interact-selected-border) !important;
        background: var(--tabstudio-interact-selected-bg) !important;
        box-shadow: 0 0 0 2px var(--tabstudio-interact-selected-ring) !important;
      }
      .tab-grid-cell-button[data-selected="true"]:hover,
      .tab-grid-cell-button[data-cursor="true"]:hover,
      .tab-grid-cell-button[data-replay-active="true"]:hover {
        border-color: var(--tabstudio-interact-selected-border) !important;
        background: ${gridCellHoverStyle.selectedHover.background} !important;
        box-shadow: 0 0 0 2px var(--tabstudio-interact-selected-ring) !important;
      }
      .tab-cols-adjust-btn:hover {
        background: ${withAlpha(THEME.accent, isDarkMode ? 0.18 : 0.12)} !important;
        color: ${THEME.accent} !important;
        text-shadow: 0 0 8px ${withAlpha(THEME.accent, 0.4)} !important;
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
      @keyframes tabbyHeaderNudgeFloat {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-3px);
        }
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
      @keyframes tabstudioCellInputFlash {
        0% {
          opacity: 0;
        }
        22% {
          opacity: 0.22;
        }
        100% {
          opacity: 0;
        }
      }
      @keyframes tabstudioTickToDotArc {
        0% { transform: translateX(0px) translateY(0px) scale(1); }
        22% { transform: translateX(-1px) translateY(-8px) scale(0.95); }
        46% { transform: translateX(-5px) translateY(2px) scale(0.82); }
        66% { transform: translateX(-7px) translateY(-2px) scale(0.72); }
        100% { transform: translateX(-9px) translateY(0px) scale(0.6); }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, [THEME.bg, THEME.accent, isDarkMode]);

  useEffect(() => {
    document.title = "TabStudio — Tabs, Simplified.";
  }, []);

  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [albumName, setAlbumName] = useState("");
  const profileDisplayNameFromState = String(userState?.profile?.displayName || "").trim();
  const resolvedSignedInAccountName = profileDisplayNameFromState || String(userState?.email || "").trim() || "Account";
  const accountFullName = isLoggedIn ? resolvedSignedInAccountName : "Account";
  const accountPlanId = editorHasMembership ? normalizePlanId(userState?.planType) : null;
  const accountTier =
    accountPlanId === "creator" ? "Creator Plan" : accountPlanId === "band" ? "Band Plan" : accountPlanId === "solo" ? "Solo Plan" : "Free Plan";
  const accountEmail = isLoggedIn ? String(userState?.email || "").trim() : "";
  const accountMemberSince = "";
  const accountRenewalDate = "";
  const accountBillingCycle = "";
  const [profileDisplayName, setProfileDisplayName] = useState(() => String(userState?.profile?.displayName || "").trim());
  const [profileHandle, setProfileHandle] = useState(ACCOUNT_MOCK_DATA.profile.handle);
  const [profileBio, setProfileBio] = useState(ACCOUNT_MOCK_DATA.profile.bio);
  const [profileWebsite, setProfileWebsite] = useState(ACCOUNT_MOCK_DATA.profile.website);
  const [accountAvatarDataUrl, setAccountAvatarDataUrl] = useState(() => String(userState?.profile?.avatarDataUrl || ""));
  const [securityEmail, setSecurityEmail] = useState(() => String(userState?.email || "").trim());
  const [securityTwoFactorEnabled, setSecurityTwoFactorEnabled] = useState(false);
  const [subscriptionAutoRenew, setSubscriptionAutoRenew] = useState(true);
  const [billingEmail, setBillingEmail] = useState(() => String(userState?.email || "").trim());
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState("Visa •••• 4242");
  const recentSessions = [];
  const recentInvoices = ACCOUNT_MOCK_DATA.billing.invoices;
  useEffect(() => {
    setAccountAvatarDataUrl(String(userState?.profile?.avatarDataUrl || ""));
  }, [userState?.profile?.avatarDataUrl]);
  useEffect(() => {
    setProfileDisplayName(String(userState?.profile?.displayName || "").trim());
  }, [userState?.profile?.displayName]);
  useEffect(() => {
    const nextEmail = String(userState?.email || "").trim();
    setSecurityEmail(nextEmail);
    setBillingEmail(nextEmail);
  }, [userState?.email]);
  const saveAccountProfile = useCallback(() => {
    updateUserState?.((prev) => ({
      ...prev,
      profile: {
        ...normalizeProfileData(prev?.profile),
        displayName: String(profileDisplayName || "").trim(),
        avatarDataUrl: String(accountAvatarDataUrl || ""),
      },
    }));
  }, [accountAvatarDataUrl, profileDisplayName, updateUserState]);
  const accountSummaryName = isLoggedIn ? resolvedSignedInAccountName : "Sign in to TabStudio";
  const accountSummaryTier = !isLoggedIn
    ? "Guest"
    : editorHasMembership
    ? normalizePlanId(userState?.planType) === "creator"
      ? "Creator Plan"
      : normalizePlanId(userState?.planType) === "band"
      ? "Band Plan"
      : "Solo Plan"
    : "Free Plan";
  const openSettingsAccountEntry = useCallback(() => {
    setSettingsLanguageOpen(false);
    setProjectsLibraryOpen(false);
    setExportModalOpen(false);
    setImageExportProgress("");
    setSettingsOpen(false);
    setSettingsFullscreen(false);
    if (!isLoggedIn) {
      navigateTo("/signin");
      return;
    }
    setAccountProfileSection("overview");
    setAccountProfileOpen(true);
  }, [isLoggedIn, navigateTo]);

  const openMembershipFromAccount = useCallback(() => {
    setAccountProfileOpen(false);
    navigateTo("/membership");
  }, [navigateTo]);
  const handleAccountSignOut = useCallback(async () => {
    const { error } = await signOut();
    if (error) throw error;
    clearPersistedUserScopedClientState();
    resetUserScopedEditorAndLibraryState();
    setSupabaseSession(null);
    setSupabaseUser(null);
    setForcedProfileSetupAfterPayment(false);
    updateUserState((prev) => ({
      ...prev,
      authUserId: "",
      isLoggedIn: false,
      hasMembership: false,
      everHadMembership: false,
      planTier: "free",
      planType: null,
      email: "",
      profile: normalizeProfileData(null),
    }));
    setAccountProfileOpen(false);
    navigateTo("/editor");
  }, [navigateTo, updateUserState]);

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
  const customTuningModalRef = useRef(null);
  const customNoteReplaceOnTypeRef = useRef(Array(DEFAULT_TUNING.length).fill(false));

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
  const [showCapoControl, setShowCapoControl] = useState(true);
  const [showTempoControl, setShowTempoControl] = useState(false);
  const [tempoBpm, setTempoBpm] = useState("120");
  const [tempoFocused, setTempoFocused] = useState(false);
  const [tempoReplaceOnType, setTempoReplaceOnType] = useState(false);
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
    const extras = userTunings.filter(
      (tuningOption) => Array.isArray(tuningOption?.lowToHigh) && tuningOption.lowToHigh.length === currentInstrument.stringCount
    );
    return [...orderedPresetTunings, ...extras];
  }, [orderedPresetTunings, userTunings, currentInstrument.stringCount]);

  const [tuning, setTuning] = useState(DEFAULT_TUNING);
  const [tuningLabel, setTuningLabel] = useState("Standard");
  const [tuningOpen, setTuningOpen] = useState(false);

  const [cols, setCols] = useState(() => {
    const initial = clampColsValue(defaultCols, DEFAULT_COLS);
    return initial <= MIN_COLS ? DEFAULT_COLS : initial;
  });
  const [colsInput, setColsInput] = useState(() => {
    const initial = clampColsValue(defaultCols, DEFAULT_COLS);
    return String(initial <= MIN_COLS ? DEFAULT_COLS : initial);
  });
  const [colsReplaceOnType, setColsReplaceOnType] = useState(false);
  const [grid, setGrid] = useState(() => {
    const initial = clampColsValue(defaultCols, DEFAULT_COLS);
    const nextCols = initial <= MIN_COLS ? DEFAULT_COLS : initial;
    return makeBlankGrid(6, nextCols);
  });
  const [cursor, setCursor] = useState({ r: 0, c: 0 });
  const [gridTargetingActive, setGridTargetingActive] = useState(false);
  const [pressedBtnId, setPressedBtnId] = useState("");
  const [headerHoverBtn, setHeaderHoverBtn] = useState("");
  const [microHoverBtnId, setMicroHoverBtnId] = useState("");
  const [dropdownHoverKey, setDropdownHoverKey] = useState("");

  const [overwriteNext, setOverwriteNext] = useState(false);
  const overwriteNextRef = useRef(false);
  useEffect(() => void (overwriteNextRef.current = overwriteNext), [overwriteNext]);

  const [completedRows, setCompletedRows] = useState([]);
  const [selectedRowIds, setSelectedRowIds] = useState(() => new Set());
  const [completedRowsOpen, setCompletedRowsOpen] = useState(true);
  const [rowDeleteConfirmIds, setRowDeleteConfirmIds] = useState(null);
  const [rowDeleteConfirmSource, setRowDeleteConfirmSource] = useState("");
  const [songDeleteConfirmTarget, setSongDeleteConfirmTarget] = useState(null);
  const [libraryDeleteConfirmTarget, setLibraryDeleteConfirmTarget] = useState(null);
  const [chordDeleteConfirmId, setChordDeleteConfirmId] = useState("");
  const [tapSyncOpen, setTapSyncOpen] = useState(false);
  const [tapSyncMode, setTapSyncMode] = useState("note"); // note | row
  const [tapSyncRecording, setTapSyncRecording] = useState(false);
  const [tapSyncReplayRunning, setTapSyncReplayRunning] = useState(false);
  const [tapSyncStatusText, setTapSyncStatusText] = useState("Ready to sync.");
  const [tapSyncShowTimestamps, setTapSyncShowTimestamps] = useState(true);
  const [tapSyncReplayDuration, setTapSyncReplayDuration] = useState("medium"); // short | medium | long
  const [tapSyncReplaceOnClick, setTapSyncReplaceOnClick] = useState(true);
  const [tapSyncAutoScroll, setTapSyncAutoScroll] = useState(false);
  const [tapSyncNoteTimings, setTapSyncNoteTimings] = useState(() => ({})); // { "r:c": ms }
  const [tapSyncRowTimings, setTapSyncRowTimings] = useState(() => ({})); // { rowId: ms }
  const [tapSyncReplayItemId, setTapSyncReplayItemId] = useState("");

  const [insertOpen, setInsertOpen] = useState(false);
  const insertBtnRef = useRef(null);
  const insertPanelRef = useRef(null);
  const [insertPanelShiftX, setInsertPanelShiftX] = useState(0);

  const [chordsOpen, setChordsOpen] = useState(false);
  const chordsBtnRef = useRef(null);
  const chordsPanelRef = useRef(null);
  const [chordsPanelShiftX, setChordsPanelShiftX] = useState(0);
  const [chordsSection, setChordsSection] = useState(() => {
    try {
      const raw = String(localStorage.getItem(LS_CHORDS_SECTION_KEY) ?? "").trim().toLowerCase();
      return raw === "custom" ? "custom" : "presets";
    } catch {
      return "presets";
    }
  });
  const [chordName, setChordName] = useState("");
  const [selectedChordId, setSelectedChordId] = useState("");
  const [lastAppliedChordId, setLastAppliedChordId] = useState("");

  // Edit chord modal
  const [editChordModalOpen, setEditChordModalOpen] = useState(false);
  const [editChordTargetId, setEditChordTargetId] = useState("");
  const [editChordIsPreset, setEditChordIsPreset] = useState(false);
  const [editChordNameHeader, setEditChordNameHeader] = useState("");
  const [editChordFrets, setEditChordFrets] = useState(() => ["", "", "", "", "", ""]);
  const [editChordHoverIndex, setEditChordHoverIndex] = useState(-1);

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
  const colsRapidClickRef = useRef({ count: 0, lastTs: 0 });
  const colsReplaceOnTypeRef = useRef(false);
  const colsDragRef = useRef({ active: false, pointerId: null, lastY: 0, carry: 0 });
  const tempoInputRef = useRef(null);
  const tempoAutoCommitTimerRef = useRef(null);
  const tempoReplaceOnTypeRef = useRef(false);
  const tempoDragRef = useRef({ active: false, pointerId: null, lastY: 0, carry: 0 });
  const gridRowScrollRefs = useRef([]);
  const syncingRowScrollRef = useRef(false);
  const lastGridClipboardRef = useRef(null);
  const draftRestoreDoneRef = useRef(false);
  const tapSyncStartMsRef = useRef(0);
  const tapSyncReplayTimersRef = useRef([]);

  const cursorRef = useRef(cursor);
  const colsRef = useRef(cols);
  const gridRef = useRef(grid);
  useEffect(() => void (cursorRef.current = cursor), [cursor]);
  useEffect(() => void (colsRef.current = cols), [cols]);
  useEffect(() => void (gridRef.current = grid), [grid]);
  useEffect(() => void (colsReplaceOnTypeRef.current = colsReplaceOnType), [colsReplaceOnType]);
  useEffect(() => void (capoReplaceOnTypeRef.current = capoReplaceOnType), [capoReplaceOnType]);
  useEffect(() => void (tempoReplaceOnTypeRef.current = tempoReplaceOnType), [tempoReplaceOnType]);
  useEffect(() => setColsInput(String(cols)), [cols]);
  useEffect(() => {
    // Fresh storage should always boot at 32 columns.
    // Keep this guard startup-only so user-chosen values still work afterward.
    try {
      const hasStoredDefault = localStorage.getItem(LS_DEFAULT_COLS_KEY) != null;
      if (!hasStoredDefault) {
        setDefaultCols(DEFAULT_COLS);
        setCols((prev) => (Number(prev) <= MIN_COLS ? DEFAULT_COLS : prev));
      }
    } catch {}
  }, []);
  useEffect(() => {
    gridRowScrollRefs.current = gridRowScrollRefs.current.slice(0, tuning.length);
  }, [tuning.length]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_CHORDS_SECTION_KEY, chordsSection === "custom" ? "custom" : "presets");
    } catch {
      // ignore storage errors
    }
  }, [chordsSection]);

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
  useEffect(() => () => clearTapSyncReplayTimers(), []);

  const tuningBtnRef = useRef(null);
  const tuningPanelRef = useRef(null);

  const chordToolEnabled = currentInstrument.id === "gtr6" && tuning.length === 6;
  const currentChordLowToHigh = appToLowToHigh(tuning);
  const currentChordTuningId = buildChordTuningId(currentInstrument.id, currentChordLowToHigh);
  const standard = isStandardGuitarTuning(currentInstrument.id, currentChordLowToHigh);

  const effectivePresetChords = useMemo(() => {
    if (!standard) return [];
    return PRESET_CHORDS.map((c) => {
      const override = presetChordOverrides[c.id];
      if (!override) return c;
      return { ...c, frets: override.frets.slice() };
    });
  }, [presetChordOverrides, standard]);

  const sharedStandardPresetChords = useMemo(
    () =>
      PRESET_CHORDS.map((c) => {
        const override = presetChordOverrides[c.id];
        if (!override) return c;
        return { ...c, frets: override.frets.slice() };
      }),
    [presetChordOverrides]
  );

  const currentUserChords = useMemo(
    () =>
      userChords.filter((chord) => {
        const chordTuningId = String(chord?.tuningId || "");
        if (chordTuningId) return chordTuningId === currentChordTuningId;
        return standard;
      }),
    [currentChordTuningId, standard, userChords]
  );

  const allChords = useMemo(() => [...effectivePresetChords, ...currentUserChords], [currentUserChords, effectivePresetChords]);

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
  const tapSyncCurrentTimings = tapSyncMode === "note" ? tapSyncNoteTimings : tapSyncRowTimings;
  const tapSyncTimingCount = Object.keys(tapSyncCurrentTimings || {}).length;

  useEffect(() => {
    stopTapSyncReplay();
    setTapSyncRecording(false);
    if (tapSyncMode === "row" && completedRows.length === 0) {
      setTapSyncStatusText("Complete at least one row to use Row Sync.");
      return;
    }
    if (tapSyncMode === "note" && !hasGridContent) {
      setTapSyncStatusText("Add some tab notes to use Note Sync.");
      return;
    }
    if (tapSyncTimingCount > 0) {
      setTapSyncStatusText("Sync captured. Replay to preview.");
    } else {
      setTapSyncStatusText("Ready to sync.");
    }
  }, [tapSyncMode, completedRows.length, hasGridContent, tapSyncTimingCount]);

  function getTapSyncHighlightDurationMs() {
    if (tapSyncReplayDuration === "short") return 140;
    if (tapSyncReplayDuration === "long") return 420;
    return 260;
  }

  function clearTapSyncReplayTimers() {
    tapSyncReplayTimersRef.current.forEach((id) => window.clearTimeout(id));
    tapSyncReplayTimersRef.current = [];
  }

  function stopTapSyncReplay() {
    clearTapSyncReplayTimers();
    setTapSyncReplayRunning(false);
    setTapSyncReplayItemId("");
  }

  function clearTapSyncForMode(mode = tapSyncMode) {
    if (mode === "note") setTapSyncNoteTimings({});
    else setTapSyncRowTimings({});
    stopTapSyncReplay();
    setTapSyncStatusText("No sync timings recorded yet.");
  }

  function startTapSyncRecording() {
    if (tapSyncRecording) return;
    if (tapSyncMode === "row" && completedRows.length === 0) {
      setTapSyncStatusText("Complete at least one row to use Row Sync.");
      return;
    }
    if (tapSyncMode === "note" && !hasGridContent) {
      setTapSyncStatusText("Add some tab notes to use Note Sync.");
      return;
    }
    stopTapSyncReplay();
    tapSyncStartMsRef.current = Date.now();
    setTapSyncRecording(true);
    setTapSyncStatusText("Sync is recording...");
  }

  function stopTapSyncRecording() {
    if (!tapSyncRecording) return;
    setTapSyncRecording(false);
    if (tapSyncTimingCount > 0) setTapSyncStatusText("Sync captured. Replay to preview.");
    else setTapSyncStatusText("No sync timings recorded yet.");
  }

  function redoTapSync() {
    clearTapSyncForMode(tapSyncMode);
    tapSyncStartMsRef.current = Date.now();
    setTapSyncRecording(true);
    setTapSyncStatusText("Sync is recording...");
  }

  function maybeAutoScrollTapSyncReplay(mode, itemId) {
    if (!tapSyncAutoScroll) return;
    if (mode === "row") {
      const node = document.querySelector(`[data-sync-row-id=\"${itemId}\"]`);
      if (node && typeof node.scrollIntoView === "function") {
        try {
          node.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch {}
      }
      return;
    }
    const node = document.querySelector(`[data-sync-cell-id=\"${itemId}\"]`);
    if (node && typeof node.scrollIntoView === "function") {
      try {
        node.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      } catch {}
    }
  }

  function replayTapSync() {
    const source = tapSyncMode === "note" ? tapSyncNoteTimings : tapSyncRowTimings;
    const entries = Object.entries(source || {})
      .map(([itemId, timestampMs]) => ({ itemId, timestampMs: Number(timestampMs || 0) }))
      .filter((x) => Number.isFinite(x.timestampMs))
      .sort((a, b) => a.timestampMs - b.timestampMs);
    if (!entries.length) {
      setTapSyncStatusText("No sync timings recorded yet.");
      return;
    }
    stopTapSyncReplay();
    setTapSyncReplayRunning(true);
    const highlightMs = getTapSyncHighlightDurationMs();
    entries.forEach((entry) => {
      const showId = window.setTimeout(() => {
        setTapSyncReplayItemId(`${tapSyncMode}:${entry.itemId}`);
        maybeAutoScrollTapSyncReplay(tapSyncMode, entry.itemId);
      }, Math.max(0, entry.timestampMs));
      const hideId = window.setTimeout(() => {
        setTapSyncReplayItemId((prev) => (prev === `${tapSyncMode}:${entry.itemId}` ? "" : prev));
      }, Math.max(0, entry.timestampMs + highlightMs));
      tapSyncReplayTimersRef.current.push(showId, hideId);
    });
    const doneId = window.setTimeout(() => {
      setTapSyncReplayRunning(false);
      setTapSyncReplayItemId("");
      setTapSyncStatusText("Replay complete.");
    }, entries[entries.length - 1].timestampMs + highlightMs + 40);
    tapSyncReplayTimersRef.current.push(doneId);
  }

  function recordTapSyncNote(r, c) {
    if (!tapSyncRecording || tapSyncMode !== "note") return;
    const value = String(gridRef.current?.[r]?.[c] ?? "").trim();
    if (!value) {
      setTapSyncStatusText("Add some tab notes to use Note Sync.");
      return;
    }
    const id = `${r}:${c}`;
    setTapSyncNoteTimings((prev) => {
      if (!tapSyncReplaceOnClick && Object.prototype.hasOwnProperty.call(prev, id)) return prev;
      const next = { ...prev, [id]: Math.max(0, Date.now() - tapSyncStartMsRef.current) };
      return next;
    });
    setTapSyncStatusText("Sync is recording...");
  }

  function recordTapSyncRow(rowId) {
    if (!tapSyncRecording || tapSyncMode !== "row") return;
    const id = String(rowId || "");
    if (!id) return;
    setTapSyncRowTimings((prev) => {
      if (!tapSyncReplaceOnClick && Object.prototype.hasOwnProperty.call(prev, id)) return prev;
      const next = { ...prev, [id]: Math.max(0, Date.now() - tapSyncStartMsRef.current) };
      return next;
    });
    setTapSyncStatusText("Sync is recording...");
  }

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
const libraryUndoStackRef = useRef([]);
const libraryRedoStackRef = useRef([]);
const editingCellRef = useRef(null); // tracks the cell for the current typing session

  function pushUndoSnapshot(snapshot) {
    undoStackRef.current.push(snapshot);
    if (undoStackRef.current.length > 250) undoStackRef.current.shift();
  }

  function snapshotNow() {
    return { grid: clone2D(gridRef.current), cursor: { ...cursorRef.current } };
  }

  function pushLibraryUndoSnapshot(snapshot) {
    libraryUndoStackRef.current.push(snapshot);
    if (libraryUndoStackRef.current.length > 250) libraryUndoStackRef.current.shift();
  }

  function snapshotLibraryNow() {
    return {
      libraryData: cloneJson(libraryData, makeEmptyLibrary()),
      artist: String(artist || ""),
      albumName: String(albumName || ""),
      selectedLibraryArtistKey: String(selectedLibraryArtistKey || ""),
      selectedLibraryAlbumName: String(selectedLibraryAlbumName || ""),
      selectedLibrarySongName: String(selectedLibrarySongName || ""),
      currentLoadedSongId: String(currentLoadedSongId || ""),
      currentLoadedSongPath: currentLoadedSongPath ? { ...currentLoadedSongPath } : null,
    };
  }

  function applyLibrarySnapshot(snapshot) {
    if (!snapshot) return;
    setLibraryData(normalizeLibraryData(cloneJson(snapshot.libraryData, makeEmptyLibrary())));
    setArtist(String(snapshot.artist || ""));
    setAlbumName(String(snapshot.albumName || ""));
    setSelectedLibraryArtistKey(String(snapshot.selectedLibraryArtistKey || ""));
    setSelectedLibraryAlbumName(String(snapshot.selectedLibraryAlbumName || ""));
    setSelectedLibrarySongName(String(snapshot.selectedLibrarySongName || ""));
    setCurrentLoadedSongId(String(snapshot.currentLoadedSongId || ""));
    setCurrentLoadedSongPath(
      snapshot?.currentLoadedSongPath && typeof snapshot.currentLoadedSongPath === "object"
        ? {
            artistName: String(snapshot.currentLoadedSongPath.artistName || ""),
            albumName: String(snapshot.currentLoadedSongPath.albumName || ""),
            songName: String(snapshot.currentLoadedSongPath.songName || ""),
          }
        : null
    );
  }

  function commitGridChange(nextGrid, nextCursor = null) {
    pushUndoSnapshot(snapshotNow());
    redoStackRef.current = [];
    setGrid(nextGrid);
    if (nextCursor) setCursor(nextCursor);
  }

  function undo() {
    if (projectsLibraryOpen) {
      const stack = libraryUndoStackRef.current;
      if (!stack.length) return;
      const prev = stack.pop();
      libraryRedoStackRef.current.push(snapshotLibraryNow());
      applyLibrarySnapshot(prev);
      return;
    }
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
    if (projectsLibraryOpen) {
      const stack = libraryRedoStackRef.current;
      if (!stack.length) return;
      const next = stack.pop();
      pushLibraryUndoSnapshot(snapshotLibraryNow());
      applyLibrarySnapshot(next);
      return;
    }
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

  // Saved project data includes editor state + metadata so it can be reopened exactly.
  function buildCurrentProjectSnapshot() {
    return {
      songName: String(songTitle || "").trim(),
      artistName: String(artist || "").trim() || "Unsorted",
      albumName: String(albumName || "").trim() || NO_ALBUM_NAME,
      instrumentId,
      tuning: cloneJson(tuning, DEFAULT_TUNING.slice()),
      tuningLabel: String(tuningLabel || "").trim() || "Custom",
      cols: clampColsValue(cols, DEFAULT_COLS),
      grid: cloneJson(grid, makeBlankGrid(tuning.length, clampColsValue(cols, DEFAULT_COLS))),
      capoEnabled: Boolean(capoEnabled),
      capoFret: String(capoFret || ""),
      showCapoControl: Boolean(showCapoControl),
      showTempoControl: Boolean(showTempoControl),
      tempoBpm: String(tempoBpm || "120"),
      completedRows: cloneJson(completedRows, []),
      chordName: String(chordName || ""),
      selectedChordId: String(selectedChordId || ""),
      lastAppliedChordId: String(lastAppliedChordId || ""),
    };
  }

  function buildPhaseBProjectSnapshot() {
    const cleanSongName = String(songTitle || "").trim();
    const targetArtistName = String(artist || "").trim() || "Unsorted";
    const targetAlbumName = String(albumName || "").trim() || NO_ALBUM_NAME;

    return {
      ...buildCurrentProjectSnapshot(),
      songId: String(currentLoadedSongIdRef.current || ""),
      songName: cleanSongName,
      artistName: targetArtistName,
      albumName: targetAlbumName,
    };
  }

  const currentProjectSignature = useMemo(
    () => projectSnapshotSignature(buildCurrentProjectSnapshot()),
    [
      songTitle,
      artist,
      albumName,
      instrumentId,
      tuning,
      tuningLabel,
      cols,
      grid,
      capoEnabled,
      capoFret,
      showCapoControl,
      showTempoControl,
      tempoBpm,
      completedRows,
      chordName,
      selectedChordId,
      lastAppliedChordId,
    ]
  );

  function applyProjectSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return;
    documentSessionKeyRef.current += 1;
    const nextTuning = Array.isArray(snapshot.tuning) && snapshot.tuning.length ? snapshot.tuning.slice() : DEFAULT_TUNING.slice();
    const nextCols = clampColsValue(snapshot.cols, DEFAULT_COLS);
    const nextGrid = makeBlankGrid(nextTuning.length, nextCols);
    const sourceGrid = Array.isArray(snapshot.grid) ? snapshot.grid : [];
    for (let r = 0; r < nextTuning.length; r += 1) {
      for (let c = 0; c < nextCols; c += 1) {
        nextGrid[r][c] = String(sourceGrid?.[r]?.[c] ?? "");
      }
    }

    undoStackRef.current = [];
    redoStackRef.current = [];
    clearCellSelection();
    setInsertOpen(false);
    setSongTitle(String(snapshot.songName || ""));
    setArtist(String(snapshot.artistName || "").trim() === "Unsorted" ? "" : String(snapshot.artistName || ""));
    setAlbumName(String(snapshot.albumName || "").trim() === NO_ALBUM_NAME ? "" : String(snapshot.albumName || ""));
    setCurrentLoadedSongId(String(snapshot.songId || ""));
    setInstrumentId(String(snapshot.instrumentId || "gtr6"));
    setTuning(nextTuning);
    setTuningLabel(String(snapshot.tuningLabel || "Custom"));
    setCols(nextCols);
    setGrid(nextGrid);
    setCursor({ r: 0, c: 0 });
    setCapoEnabled(Boolean(snapshot.capoEnabled));
    setCapoFret(String(snapshot.capoFret || ""));
    setShowCapoControl(snapshot.showCapoControl !== false);
    setShowTempoControl(Boolean(snapshot.showTempoControl));
    setTempoBpm(String(snapshot.tempoBpm || "120"));
    setCompletedRows(cloneJson(snapshot.completedRows, []));
    setChordName(String(snapshot.chordName || ""));
    setSelectedChordId(String(snapshot.selectedChordId || ""));
    setLastAppliedChordId(String(snapshot.lastAppliedChordId || ""));
    setCompletedRowsOpen(true);
    setOverwriteNext(true);
    lastFlushedProjectSignatureRef.current = projectSnapshotSignature({
      ...snapshot,
      songName: String(snapshot.songName || ""),
      artistName: String(snapshot.artistName || "").trim() || "Unsorted",
      albumName: String(snapshot.albumName || "").trim() || NO_ALBUM_NAME,
      instrumentId: String(snapshot.instrumentId || "gtr6"),
      tuning: Array.isArray(snapshot.tuning) && snapshot.tuning.length ? snapshot.tuning.slice() : DEFAULT_TUNING.slice(),
      tuningLabel: String(snapshot.tuningLabel || "Custom"),
      cols: nextCols,
      grid: nextGrid,
      capoEnabled: Boolean(snapshot.capoEnabled),
      capoFret: String(snapshot.capoFret || ""),
      showCapoControl: snapshot.showCapoControl !== false,
      showTempoControl: Boolean(snapshot.showTempoControl),
      tempoBpm: String(snapshot.tempoBpm || "120"),
      completedRows: cloneJson(snapshot.completedRows, []),
      chordName: String(snapshot.chordName || ""),
      selectedChordId: String(snapshot.selectedChordId || ""),
      lastAppliedChordId: String(snapshot.lastAppliedChordId || ""),
    });
    clearEditorSaveStatusTimers();
    setEditorSaveStatus("");
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    focusKeyCapture();
  }

  function normalizeDraftSnapshot(draftPayload) {
    const sourceSnapshot = draftPayload?.snapshot && typeof draftPayload.snapshot === "object" ? draftPayload.snapshot : {};
    const fallbackSongName = String(draftPayload?.songTitle || "").trim();
    const fallbackArtistName = String(draftPayload?.artist || "").trim() || "Unsorted";
    const fallbackAlbumName = String(draftPayload?.albumName || "").trim() || NO_ALBUM_NAME;
    return {
      ...sourceSnapshot,
      songId: String(sourceSnapshot.songId || draftPayload?.songId || ""),
      songName: String(sourceSnapshot.songName || fallbackSongName || "").trim(),
      artistName: String(sourceSnapshot.artistName || fallbackArtistName || "Unsorted").trim() || "Unsorted",
      albumName: String(sourceSnapshot.albumName || fallbackAlbumName || NO_ALBUM_NAME).trim() || NO_ALBUM_NAME,
      instrumentId: String(sourceSnapshot.instrumentId || instrumentId || "gtr6"),
      tuning: Array.isArray(sourceSnapshot.tuning) && sourceSnapshot.tuning.length ? sourceSnapshot.tuning : cloneJson(tuning, DEFAULT_TUNING.slice()),
      cols: clampColsValue(sourceSnapshot.cols, clampColsValue(cols, DEFAULT_COLS)),
      grid: Array.isArray(sourceSnapshot.grid) ? sourceSnapshot.grid : cloneJson(grid, makeBlankGrid(tuning.length, clampColsValue(cols, DEFAULT_COLS))),
      completedRows: Array.isArray(sourceSnapshot.completedRows)
        ? cloneJson(sourceSnapshot.completedRows, [])
        : cloneJson(draftPayload?.tabRows, []),
      capoEnabled: sourceSnapshot.capoEnabled ?? draftPayload?.capo?.enabled ?? capoEnabled,
      capoFret: String(sourceSnapshot.capoFret ?? draftPayload?.capo?.fret ?? capoFret ?? ""),
      showCapoControl: sourceSnapshot.showCapoControl ?? showCapoControl,
      showTempoControl: sourceSnapshot.showTempoControl ?? showTempoControl,
      tempoBpm: String(sourceSnapshot.tempoBpm ?? tempoBpm ?? "120"),
    };
  }

  function upsertSnapshotIntoLibrary(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return;
    const cleanSongName = String(snapshot.songName || "").trim();
    if (!cleanSongName) return;
    const targetArtistName = String(snapshot.artistName || "").trim() || "Unsorted";
    const targetAlbumName = String(snapshot.albumName || "").trim() || NO_ALBUM_NAME;
    const nowIso = new Date().toISOString();
    setLibraryData((prev) => {
      const next = normalizeLibraryData(cloneJson(prev, makeEmptyLibrary()));
      const albums = ensureArtistBucket(next, targetArtistName);
      if (!albums[targetAlbumName] || typeof albums[targetAlbumName] !== "object") {
        albums[targetAlbumName] = { songs: {} };
      }
      if (!albums[targetAlbumName].songs || typeof albums[targetAlbumName].songs !== "object") {
        albums[targetAlbumName].songs = {};
      }
      const existing = albums[targetAlbumName].songs[cleanSongName];
      albums[targetAlbumName].songs[cleanSongName] = {
        ...(existing || {}),
        ...cloneJson(snapshot, {}),
        songId: String(snapshot.songId || existing?.songId || createSongId()),
        songName: cleanSongName,
        artistName: targetArtistName,
        albumName: targetAlbumName,
        updatedAt: nowIso,
        createdAt: String(existing?.createdAt || nowIso),
      };
      return next;
    });
    setSelectedLibraryArtistKey(targetArtistName === "Unsorted" ? "" : targetArtistName);
    setSelectedLibraryAlbumName(targetAlbumName);
    setSelectedLibrarySongName(cleanSongName);
  }

  const [libraryData, setLibraryData] = useState(() => readLibraryData());
  const [selectedLibraryArtistKey, setSelectedLibraryArtistKey] = useState("");
  const [selectedLibraryAlbumName, setSelectedLibraryAlbumName] = useState("");
  const [selectedLibrarySongName, setSelectedLibrarySongName] = useState("");
  const [currentLoadedSongId, setCurrentLoadedSongId] = useState("");
  const [currentLoadedSongPath, setCurrentLoadedSongPath] = useState(null);
  const [currentProjectId, setCurrentProjectId] = useState("");
  const [userProjects, setUserProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsLoadError, setProjectsLoadError] = useState("");
  const [projectActionBusyId, setProjectActionBusyId] = useState("");
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [shortcutsShowBoth, setShortcutsShowBoth] = useState(false);
  const [shortcutsCategoryFilter, setShortcutsCategoryFilter] = useState("all");
  const [tabWritingOpen, setTabWritingOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [accountProfileOpen, setAccountProfileOpen] = useState(false);
  const [projectsLibraryOpen, setProjectsLibraryOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [uiDialog, setUiDialog] = useState(null);
  const [saveSoonNotice, setSaveSoonNotice] = useState("");
  const [editorSaveState, setEditorSaveState] = useState("idle");
  const [editorSaveStatus, setEditorSaveStatus] = useState("");
  const autosaveTimerRef = useRef(null);
  const autosaveRetryTimerRef = useRef(null);
  const editorSaveStatusTimerRef = useRef(null);
  const editorSaveStatusHideTimerRef = useRef(null);
  const saveInFlightRef = useRef(false);
  const queuedSaveRef = useRef(false);
  const pendingManualSaveRef = useRef(false);
  const savePromiseRef = useRef(null);
  const lastFlushedProjectSignatureRef = useRef("");
  const lastFailedSaveSignatureRef = useRef("");
  const currentProjectSignatureRef = useRef("");
  const currentLoadedSongIdRef = useRef("");
  const currentProjectIdRef = useRef("");
  const documentSessionKeyRef = useRef(1);
  const membershipGateLastShownAtRef = useRef(0);
  const [hasMeaningfulEditorInteraction, setHasMeaningfulEditorInteraction] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(LS_HEADER_TABBY_ENGAGED_SESSION_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [tabbyHoverTooltipVisible, setTabbyHoverTooltipVisible] = useState(false);
  const [lockedFeatureTooltip, setLockedFeatureTooltip] = useState(null);
  const [isHoveringTabby, setIsHoveringTabby] = useState(false);
  const [blockTabbyHoverTooltip, setBlockTabbyHoverTooltip] = useState(false);
  const [gridTabbyHidden, setGridTabbyHidden] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(LS_TABBY_HIDDEN_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [gridTabbyHiding, setGridTabbyHiding] = useState(false);
  const [tourStep, setTourStep] = useState(0); // 0 inactive, 1..4 active
  const [tabbyTourSpotlightRect, setTabbyTourSpotlightRect] = useState(null);
  const gridTabbyUpgradePromptTimerRef = useRef(null);
  const [tabsMilestonesTriggered, setTabsMilestonesTriggered] = useState(() => readMilestonesTriggered());
  const [milestoneConfetti, setMilestoneConfetti] = useState(null);
  const [milestoneToast, setMilestoneToast] = useState("");
  const [firstExportGlowActive, setFirstExportGlowActive] = useState(false);
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
  const [languageFooterHover, setLanguageFooterHover] = useState(false);
  const [settingsAccentHoverId, setSettingsAccentHoverId] = useState("");
  const [settingsLanguagePreview, setSettingsLanguagePreview] = useState("en");
  const [settingsLanguageOpen, setSettingsLanguageOpen] = useState(false);
  const milestoneConfettiTimerRef = useRef(null);
  const milestoneToastTimerRef = useRef(null);
  const firstExportGlowTimerRef = useRef(null);
  const editorSurfaceRef = useRef(null);
  const tabWriterAreaRef = useRef(null);
  const songMetaSectionRef = useRef(null);
  const songDetailsSectionRef = useRef(null);
  const saveProjectsGroupRef = useRef(null);
  const instrumentSectionRef = useRef(null);
  const tuningSectionRef = useRef(null);
  const customTuningAddBtnRef = useRef(null);
  const capoSectionRef = useRef(null);
  const colsControlRef = useRef(null);
  const chordsSectionRef = useRef(null);
  const insertSectionRef = useRef(null);
  const completeRowBtnRef = useRef(null);
  const gridHighlightRef = useRef(null);
  const saveHeaderBtnRef = useRef(null);
  const songTitleInputRef = useRef(null);
  const artistSelectRef = useRef(null);
  const albumSelectRef = useRef(null);
  const artistMenuRef = useRef(null);
  const albumMenuRef = useRef(null);
  const newArtistInputRef = useRef(null);
  const newAlbumInputRef = useRef(null);
  const completedRowsToggleRef = useRef(null);
  const completedRowsActionsRef = useRef(null);
  const completedRowsSectionRef = useRef(null);
  const previousAuthUserIdRef = useRef(String(userState?.authUserId || ""));

  function clearPersistedUserScopedClientState() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(LS_LIBRARY_V1_KEY);
      window.localStorage.removeItem(LS_TABSTUDIO_DRAFT_KEY);
      window.localStorage.removeItem(LS_RESTORE_DRAFT_AFTER_MEMBERSHIP_KEY);
      window.localStorage.removeItem(LS_RESTORE_DRAFT_AFTER_SIGNIN_KEY);
    } catch {}
  }

  function resetUserScopedEditorAndLibraryState() {
    clearProjectSaveTimers();
    clearEditorSaveStatusTimers();
    resetPhaseBLibraryRecordsCache();
    draftRestoreDoneRef.current = false;
    saveInFlightRef.current = false;
    queuedSaveRef.current = false;
    pendingManualSaveRef.current = false;
    savePromiseRef.current = null;
    lastFailedSaveSignatureRef.current = "";
    currentLoadedSongIdRef.current = "";
    currentProjectIdRef.current = "";
    documentSessionKeyRef.current += 1;
    undoStackRef.current = [];
    redoStackRef.current = [];
    libraryUndoStackRef.current = [];
    libraryRedoStackRef.current = [];
    clearCellSelection();
    setLibraryData(makeEmptyLibrary());
    setSelectedLibraryArtistKey("");
    setSelectedLibraryAlbumName("");
    setSelectedLibrarySongName("");
    setProjectsLibraryOpen(false);
    setCurrentLoadedSongPath(null);
    setCurrentProjectId("");
    setCurrentLoadedSongId("");
    setUserProjects([]);
    setProjectsLoadError("");
    setProjectsLoading(false);
    setProjectActionBusyId("");
    setSongTitle("");
    setArtist("");
    setAlbumName("");
    setInstrumentId("gtr6");
    setTuning(DEFAULT_TUNING.slice());
    setTuningLabel("Standard");
    setCols(DEFAULT_COLS);
    setGrid(makeBlankGrid(DEFAULT_TUNING.length, DEFAULT_COLS));
    setCursor({ r: 0, c: 0 });
    setCapoEnabled(false);
    setCapoFret("");
    setShowCapoControl(true);
    setShowTempoControl(false);
    setTempoBpm("120");
    setCompletedRows([]);
    setChordName("");
    setSelectedChordId("");
    setLastAppliedChordId("");
    setInsertOpen(false);
    setOverwriteNext(false);
    setSaveSoonNotice("");
    setEditorSaveState("idle");
    setEditorSaveStatus("");
    const clearedSignature = projectSnapshotSignature({
      songName: "",
      artistName: "Unsorted",
      albumName: NO_ALBUM_NAME,
      instrumentId: "gtr6",
      tuning: DEFAULT_TUNING.slice(),
      tuningLabel: "Standard",
      cols: DEFAULT_COLS,
      grid: makeBlankGrid(DEFAULT_TUNING.length, DEFAULT_COLS),
      capoEnabled: false,
      capoFret: "",
      showCapoControl: true,
      showTempoControl: false,
      tempoBpm: "120",
      completedRows: [],
      chordName: "",
      selectedChordId: "",
      lastAppliedChordId: "",
    });
    lastFlushedProjectSignatureRef.current = clearedSignature;
    currentProjectSignatureRef.current = clearedSignature;
  }

  useEffect(() => {
    const nextAuthUserId = String(userState?.authUserId || "");
    const previousAuthUserId = previousAuthUserIdRef.current;
    if (previousAuthUserId && previousAuthUserId !== nextAuthUserId) {
      clearPersistedUserScopedClientState();
      resetUserScopedEditorAndLibraryState();
    }
    previousAuthUserIdRef.current = nextAuthUserId;
  }, [userState?.authUserId]);

  function clearEditorSaveStatusTimers() {
    if (editorSaveStatusTimerRef.current) {
      window.clearTimeout(editorSaveStatusTimerRef.current);
      editorSaveStatusTimerRef.current = null;
    }
    if (editorSaveStatusHideTimerRef.current) {
      window.clearTimeout(editorSaveStatusHideTimerRef.current);
      editorSaveStatusHideTimerRef.current = null;
    }
  }

  function clearProjectSaveTimers() {
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    if (autosaveRetryTimerRef.current) {
      window.clearTimeout(autosaveRetryTimerRef.current);
      autosaveRetryTimerRef.current = null;
    }
  }

  function setEditorSaveFeedback(nextState, nextStatus = "", { hideAfterMs = 0 } = {}) {
    clearEditorSaveStatusTimers();
    setEditorSaveState(nextState);
    setEditorSaveStatus(nextStatus);
    if (hideAfterMs > 0) {
      editorSaveStatusHideTimerRef.current = window.setTimeout(() => {
        setEditorSaveState("idle");
        setEditorSaveStatus("");
        editorSaveStatusHideTimerRef.current = null;
      }, hideAfterMs);
    }
  }

  useEffect(() => {
    try {
      const shouldRestoreFromMembership = String(localStorage.getItem(LS_RESTORE_DRAFT_AFTER_MEMBERSHIP_KEY) || "").toLowerCase() === "true";
      const shouldRestoreFromSignin = String(localStorage.getItem(LS_RESTORE_DRAFT_AFTER_SIGNIN_KEY) || "").toLowerCase() === "true";
      if (!draftRestoreDoneRef.current && (shouldRestoreFromMembership || shouldRestoreFromSignin)) {
        return;
      }
      const draft = {
        songId: String(currentLoadedSongId || ""),
        songTitle: String(songTitle || ""),
        artist: String(artist || ""),
        albumName: String(albumName || ""),
        tuning: Array.isArray(tuning) ? tuning.slice() : DEFAULT_TUNING.slice(),
        capo: {
          enabled: Boolean(capoEnabled),
          fret: String(capoFret || ""),
        },
        tabRows: Array.isArray(completedRows) ? cloneJson(completedRows, []) : [],
        timestamp: new Date().toISOString(),
        snapshot: buildCurrentProjectSnapshot(),
      };
      localStorage.setItem(LS_TABSTUDIO_DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }, [currentLoadedSongId, songTitle, artist, tuning, capoEnabled, capoFret, completedRows, grid, cols, albumName, tempoBpm, showTempoControl, instrumentId]);

  useEffect(() => {
    if (draftRestoreDoneRef.current) return;
    if (!isLoggedIn) return;
    try {
      const shouldRestoreFromMembership = String(localStorage.getItem(LS_RESTORE_DRAFT_AFTER_MEMBERSHIP_KEY) || "").toLowerCase() === "true";
      const shouldRestoreFromSignin = String(localStorage.getItem(LS_RESTORE_DRAFT_AFTER_SIGNIN_KEY) || "").toLowerCase() === "true";
      const shouldRestore = shouldRestoreFromMembership || shouldRestoreFromSignin;
      if (!shouldRestore) return;
      const rawDraft = localStorage.getItem(LS_TABSTUDIO_DRAFT_KEY);
      if (!rawDraft) {
        localStorage.removeItem(LS_RESTORE_DRAFT_AFTER_MEMBERSHIP_KEY);
        localStorage.removeItem(LS_RESTORE_DRAFT_AFTER_SIGNIN_KEY);
        draftRestoreDoneRef.current = true;
        return;
      }
      const parsed = JSON.parse(rawDraft);
      const snapshot = normalizeDraftSnapshot(parsed);
      if (snapshot && typeof snapshot === "object") {
        applyProjectSnapshot(snapshot);
        upsertSnapshotIntoLibrary(snapshot);
      }
      localStorage.removeItem(LS_RESTORE_DRAFT_AFTER_MEMBERSHIP_KEY);
      localStorage.removeItem(LS_RESTORE_DRAFT_AFTER_SIGNIN_KEY);
      draftRestoreDoneRef.current = true;
    } catch {
      try {
        localStorage.removeItem(LS_RESTORE_DRAFT_AFTER_MEMBERSHIP_KEY);
        localStorage.removeItem(LS_RESTORE_DRAFT_AFTER_SIGNIN_KEY);
      } catch {}
      draftRestoreDoneRef.current = true;
    }
  }, [isLoggedIn]);

  function ensureArtistBucket(nextLibrary, targetArtistName) {
    if (targetArtistName === "Unsorted") {
      if (!nextLibrary.unsorted || typeof nextLibrary.unsorted !== "object") nextLibrary.unsorted = { albums: {} };
      if (!nextLibrary.unsorted.albums || typeof nextLibrary.unsorted.albums !== "object") {
        nextLibrary.unsorted.albums = {};
      }
      return nextLibrary.unsorted.albums;
    }
    if (!nextLibrary.artists[targetArtistName] || typeof nextLibrary.artists[targetArtistName] !== "object") {
      nextLibrary.artists[targetArtistName] = { albums: {} };
    }
    if (!nextLibrary.artists[targetArtistName].albums || typeof nextLibrary.artists[targetArtistName].albums !== "object") {
      nextLibrary.artists[targetArtistName].albums = {};
    }
    return nextLibrary.artists[targetArtistName].albums;
  }

  const refreshUserProjects = useCallback(async () => {
    if (!isLoggedIn) {
      setUserProjects([]);
      setProjectsLoadError("");
      return [];
    }

    setProjectsLoading(true);
    setProjectsLoadError("");
    try {
      const projects = await getUserProjects();
      setUserProjects(Array.isArray(projects) ? projects : []);
      return Array.isArray(projects) ? projects : [];
    } catch (error) {
      const message = String(error?.message || "Unable to load your projects.");
      setProjectsLoadError(message);
      return [];
    } finally {
      setProjectsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      setCurrentProjectId("");
      setUserProjects([]);
      setProjectsLoadError("");
      setProjectsLoading(false);
      return;
    }
    void refreshUserProjects();
  }, [isLoggedIn, refreshUserProjects]);

  async function requireAuthenticatedSupabaseUserId() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user?.id) throw new Error("You must be signed in before saving.");
    return String(user.id);
  }

  async function findOrCreatePhaseBArtist(userId, artistName) {
    const cleanArtistName = String(artistName || "").trim();
    if (!cleanArtistName || cleanArtistName === "Unsorted") return null;

    const existingArtist = await supabase
      .from("artists")
      .select("id, name")
      .eq("user_id", userId)
      .eq("name", cleanArtistName)
      .limit(1)
      .maybeSingle();
    if (existingArtist.error) throw existingArtist.error;
    if (existingArtist.data?.id) {
      return { id: String(existingArtist.data.id), name: String(existingArtist.data.name || cleanArtistName) };
    }

    const createdArtist = await supabase
      .from("artists")
      .insert({ user_id: userId, name: cleanArtistName })
      .select("id, name")
      .single();
    if (createdArtist.error) throw createdArtist.error;
    return { id: String(createdArtist.data.id), name: String(createdArtist.data.name || cleanArtistName) };
  }

  async function findOrCreatePhaseBAlbum(userId, albumName, artistId) {
    const cleanAlbumName = String(albumName || "").trim();
    if (!cleanAlbumName || cleanAlbumName === NO_ALBUM_NAME) return null;

    let albumLookup = supabase.from("albums").select("id, title, artist_id").eq("user_id", userId).eq("title", cleanAlbumName).limit(1);
    albumLookup = artistId ? albumLookup.eq("artist_id", artistId) : albumLookup.is("artist_id", null);
    const existingAlbum = await albumLookup.maybeSingle();
    if (existingAlbum.error) throw existingAlbum.error;
    if (existingAlbum.data?.id) {
      return {
        id: String(existingAlbum.data.id),
        title: String(existingAlbum.data.title || cleanAlbumName),
        artistId: String(existingAlbum.data.artist_id || ""),
      };
    }

    const createdAlbum = await supabase
      .from("albums")
      .insert({
        user_id: userId,
        title: cleanAlbumName,
        artist_id: artistId || null,
      })
      .select("id, title, artist_id")
      .single();
    if (createdAlbum.error) throw createdAlbum.error;
    return {
      id: String(createdAlbum.data.id),
      title: String(createdAlbum.data.title || cleanAlbumName),
      artistId: String(createdAlbum.data.artist_id || ""),
    };
  }

  async function syncPhaseBSongSnapshot({ songId = "", title, artistName, albumName, snapshot }) {
    const userId = await requireAuthenticatedSupabaseUserId();
    const artistRecord = await findOrCreatePhaseBArtist(userId, artistName);
    const albumRecord = await findOrCreatePhaseBAlbum(userId, albumName, artistRecord?.id || "");
    const targetAlbumId = String(albumRecord?.id || "");
    const cleanTitle = String(title || "").trim();
    const snapshotPayload = {
      ...cloneJson(snapshot, {}),
      songId: String(songId || snapshot?.songId || ""),
      songName: cleanTitle,
      artistName: String(artistName || "").trim() || "Unsorted",
      albumName: String(albumName || "").trim() || NO_ALBUM_NAME,
    };

    const currentSongId = String(songId || "").trim();
    if (currentSongId) {
      const updatedSong = await supabase
        .from("songs")
        .update({
          title: cleanTitle,
          album_id: targetAlbumId || null,
          project_data: snapshotPayload,
        })
        .eq("id", currentSongId)
        .eq("user_id", userId)
        .select("id, title, album_id")
        .maybeSingle();
      if (updatedSong.error) throw updatedSong.error;
      if (updatedSong.data?.id) {
        return {
          id: String(updatedSong.data.id),
          title: String(updatedSong.data.title || cleanTitle),
          albumId: String(updatedSong.data.album_id || ""),
        };
      }
    }

    let songLookup = supabase.from("songs").select("id, title, album_id").eq("user_id", userId).eq("title", cleanTitle).limit(1);
    songLookup = targetAlbumId ? songLookup.eq("album_id", targetAlbumId) : songLookup.is("album_id", null);
    const existingSong = await songLookup.maybeSingle();
    if (existingSong.error) throw existingSong.error;

    if (existingSong.data?.id) {
      const updatedExistingSong = await supabase
        .from("songs")
        .update({
          album_id: targetAlbumId || null,
          project_data: {
            ...snapshotPayload,
            songId: String(existingSong.data.id),
          },
        })
        .eq("id", existingSong.data.id)
        .eq("user_id", userId)
        .select("id, title, album_id")
        .single();
      if (updatedExistingSong.error) throw updatedExistingSong.error;
      return {
        id: String(updatedExistingSong.data.id),
        title: String(updatedExistingSong.data.title || cleanTitle),
        albumId: String(updatedExistingSong.data.album_id || ""),
      };
    }

    const createdSong = await supabase
      .from("songs")
      .insert({
        user_id: userId,
        title: cleanTitle,
        album_id: targetAlbumId || null,
        project_data: snapshotPayload,
      })
      .select("id, title, album_id")
      .single();
    if (createdSong.error) throw createdSong.error;
    return {
      id: String(createdSong.data.id),
      title: String(createdSong.data.title || cleanTitle),
      albumId: String(createdSong.data.album_id || ""),
    };
  }

  async function getPhaseBSongById(songId) {
    const id = String(songId || "").trim();
    if (!id) return null;

    const userId = await requireAuthenticatedSupabaseUserId();
    const { data, error } = await supabase
      .from("songs")
      .select("id, title, album_id, project_data")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  async function openSupabaseProject(projectInput) {
    const inlineProject = projectInput && typeof projectInput === "object" ? projectInput : null;
    const id = String(inlineProject?.id || projectInput || "").trim();
    if (!id) return;
    if (hasUnflushedEditorChanges && canSaveTabs && isLoggedIn && String(songTitle || "").trim()) {
      await flushProjectSaveUntilSettled({ reason: "switch-document" });
    }

    setProjectActionBusyId(id);
    setProjectsLoadError("");
    try {
      const latestInlineSong = inlineProject ? await getPhaseBSongById(id) : null;
      const project = inlineProject
        ? {
            ...inlineProject,
            ...(latestInlineSong || {}),
            id: String(latestInlineSong?.id || inlineProject?.id || ""),
            title: String(latestInlineSong?.title || inlineProject?.title || ""),
            project_data:
              latestInlineSong?.project_data && typeof latestInlineSong.project_data === "object"
                ? latestInlineSong.project_data
                : inlineProject?.project_data && typeof inlineProject.project_data === "object"
                ? inlineProject.project_data
                : {},
          }
        : await getProjectById(id);
      const inlineSongId = inlineProject ? String(project?.id || "") : "";
      const snapshot =
        project?.project_data && typeof project.project_data === "object"
          ? {
              ...project.project_data,
              songId: inlineSongId || String(project?.project_data?.songId || ""),
              songName: project.title || project.project_data.songName || "",
            }
          : {
              songId: inlineSongId,
              songName: project?.title || "",
              artistName: project?.artist || "",
              albumName: project?.album || "",
            };

      applyProjectSnapshot(snapshot);
      setSongTitle(String(project?.title || snapshot.songName || ""));
      setArtist(String(project?.artist || snapshot.artistName || ""));
      setAlbumName(String(project?.album || snapshot.albumName || ""));
      setCurrentProjectId(inlineProject ? String(project?.legacyProjectId || "") : String(project?.id || ""));
      setCurrentLoadedSongId(String(snapshot.songId || ""));
      setCurrentLoadedSongPath(
        inlineProject
          ? {
              artistName: String(project?.artist || snapshot.artistName || ""),
              albumName: String(project?.album || snapshot.albumName || ""),
              songName: String(project?.title || snapshot.songName || ""),
            }
          : null
      );
      setProjectsLibraryOpen(false);
      await refreshUserProjects();
    } catch (error) {
      setProjectsLoadError(String(error?.message || "Unable to open this project."));
    } finally {
      setProjectActionBusyId("");
    }
  }

  const saveEditorSnapshotToPhaseB = useCallback(async () => {
    const snapshot = buildPhaseBProjectSnapshot();
    const cleanSongName = String(snapshot.songName || "").trim();
    const targetArtistName = String(snapshot.artistName || "").trim() || "Unsorted";
    const targetAlbumName = String(snapshot.albumName || "").trim() || NO_ALBUM_NAME;

    if (!cleanSongName) {
      return {
        skipped: true,
        reason: "missing-title",
        snapshot,
        cleanSongName,
        targetArtistName,
        targetAlbumName,
      };
    }

    const syncedSong = await syncPhaseBSongSnapshot({
      songId: String(currentLoadedSongIdRef.current || snapshot.songId || ""),
      title: cleanSongName,
      artistName: targetArtistName,
      albumName: targetAlbumName,
      snapshot,
    });

    return {
      skipped: false,
      snapshot: {
        ...snapshot,
        songId: String(syncedSong?.id || snapshot.songId || ""),
      },
      syncedSong,
      cleanSongName,
      targetArtistName,
      targetAlbumName,
    };
  }, [
    songTitle,
    artist,
    albumName,
    instrumentId,
    tuning,
    tuningLabel,
    cols,
    grid,
    capoEnabled,
    capoFret,
    showCapoControl,
    showTempoControl,
    tempoBpm,
    completedRows,
    chordName,
    selectedChordId,
    lastAppliedChordId,
  ]);

  function scheduleProjectSave(delayMs = EDITOR_AUTOSAVE_DELAY_MS, options = { manual: false, reason: "autosave" }) {
    if (typeof window === "undefined") return;
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = window.setTimeout(() => {
      autosaveTimerRef.current = null;
      void flushProjectSave(options);
    }, Math.max(0, Number(delayMs) || 0));
  }

  const flushProjectSave = useCallback(
    async ({ manual = false, reason = manual ? "manual" : "autosave" } = {}) => {
      if (!canSaveTabs) {
        if (manual) showMembershipGateToast("save");
        return false;
      }
      if (!isLoggedIn) {
        if (manual) navigateTo("/signin");
        return false;
      }
      if (saveInFlightRef.current) {
        queuedSaveRef.current = true;
        if (manual) pendingManualSaveRef.current = true;
        return savePromiseRef.current || false;
      }

      clearProjectSaveTimers();

      const saveStartedForDocument = documentSessionKeyRef.current;
      const saveStartedWithSignature = currentProjectSignatureRef.current;
      let saveSucceeded = false;

      saveInFlightRef.current = true;
      setEditorSaveFeedback("saving", "Saving...");

      const saveTask = (async () => {
        const saveResult = await saveEditorSnapshotToPhaseB();
        if (saveResult?.skipped) {
          if (manual) {
            setEditorSaveFeedback("error", "Add a song name to save.", { hideAfterMs: 2200 });
          } else {
            setEditorSaveFeedback("dirty", "");
          }
          return false;
        }

        const { snapshot, syncedSong, cleanSongName, targetArtistName, targetAlbumName } = saveResult;
        const savedSignature = projectSnapshotSignature(snapshot);
        const projectRecord = currentProjectIdRef.current
          ? await updateProject(currentProjectIdRef.current, {
              title: cleanSongName,
              artist: targetArtistName === "Unsorted" ? "" : targetArtistName,
              album: targetAlbumName === NO_ALBUM_NAME ? "" : targetAlbumName,
              projectData: snapshot,
            })
          : await createProject({
              title: cleanSongName,
              artist: targetArtistName === "Unsorted" ? "" : targetArtistName,
              album: targetAlbumName === NO_ALBUM_NAME ? "" : targetAlbumName,
              projectData: snapshot,
            });

        const sameDocumentStillOpen = documentSessionKeyRef.current === saveStartedForDocument;
        const syncedSongId = String(syncedSong?.id || "");
        const legacyProjectId = String(projectRecord?.id || "");

        if (sameDocumentStillOpen) {
          currentLoadedSongIdRef.current = syncedSongId;
          currentProjectIdRef.current = legacyProjectId;
          setCurrentLoadedSongId(syncedSongId);
          setCurrentLoadedSongPath({
            artistName: targetArtistName,
            albumName: targetAlbumName,
            songName: cleanSongName,
          });
          setCurrentProjectId(legacyProjectId);
        }

        setUserProjects((prev) => {
          const next = Array.isArray(prev) ? prev.filter((item) => item?.id !== projectRecord?.id) : [];
          return [projectRecord, ...next].sort(
            (a, b) => new Date(b?.updated_at || 0).getTime() - new Date(a?.updated_at || 0).getTime()
          );
        });

        if (!sameDocumentStillOpen) return true;

        lastFailedSaveSignatureRef.current = "";
        lastFlushedProjectSignatureRef.current = savedSignature;
        if (currentProjectSignatureRef.current === savedSignature) {
          setEditorSaveFeedback("saved", "Saved", { hideAfterMs: 1800 });
        } else {
          queuedSaveRef.current = true;
          setEditorSaveFeedback("dirty", "");
        }

        saveSucceeded = true;
        return true;
      })()
        .catch((error) => {
          const message = String(error?.message || "Unable to save this project.");
          lastFailedSaveSignatureRef.current = saveStartedWithSignature;
          setEditorSaveFeedback("error", manual ? message : "Save issue");
          if (canSaveTabs && isLoggedIn && String(songTitle || "").trim()) {
            autosaveRetryTimerRef.current = window.setTimeout(() => {
              autosaveRetryTimerRef.current = null;
              void flushProjectSave({ manual: false, reason: "retry" });
            }, EDITOR_AUTOSAVE_RETRY_MS);
          }
          return false;
        })
        .finally(() => {
          saveInFlightRef.current = false;
          savePromiseRef.current = null;

          const hasNewDirtyState = currentProjectSignatureRef.current !== lastFlushedProjectSignatureRef.current;
          const shouldRunAnotherPass = queuedSaveRef.current || hasNewDirtyState;
          const shouldRunManualPass = pendingManualSaveRef.current;

          queuedSaveRef.current = false;
          pendingManualSaveRef.current = false;

          if (saveSucceeded && shouldRunAnotherPass && canSaveTabs && isLoggedIn && String(songTitle || "").trim()) {
            const followUpDelayMs = shouldRunManualPass || shouldRunImmediateFollowUpSave(reason) ? 0 : 250;
            scheduleProjectSave(followUpDelayMs, {
              manual: shouldRunManualPass,
              reason: shouldRunManualPass ? "manual-queued" : `${reason}-queued`,
            });
          } else if (!hasNewDirtyState && editorSaveState === "dirty") {
            setEditorSaveFeedback("idle", "");
          }
        });

      savePromiseRef.current = saveTask;
      return saveTask;
    },
    [
      canSaveTabs,
      isLoggedIn,
      navigateTo,
      songTitle,
      showMembershipGateToast,
      saveEditorSnapshotToPhaseB,
      editorSaveState,
    ]
  );

  const flushProjectSaveUntilSettled = useCallback(
    async ({ reason = "switch-document", maxPasses = EDITOR_SETTLED_SAVE_MAX_PASSES } = {}) => {
      if (!canSaveTabs || !isLoggedIn) return false;
      if (!String(songTitle || "").trim()) return false;

      const targetDocumentSession = documentSessionKeyRef.current;

      for (let pass = 0; pass < Math.max(1, Number(maxPasses) || 1); pass += 1) {
        await flushProjectSave({
          manual: false,
          reason: pass === 0 ? reason : `${reason}-settled-${pass + 1}`,
        });

        if (savePromiseRef.current) {
          await savePromiseRef.current;
        }

        if (documentSessionKeyRef.current !== targetDocumentSession) return true;
        if (currentProjectSignatureRef.current === lastFlushedProjectSignatureRef.current && !saveInFlightRef.current) {
          return true;
        }
      }

      return currentProjectSignatureRef.current === lastFlushedProjectSignatureRef.current;
    },
    [canSaveTabs, flushProjectSave, isLoggedIn, songTitle]
  );

  function handleSaveTabClick() {
    flushProjectSave({ manual: true });
  }

  const hasUnflushedEditorChanges = canSaveTabs && currentProjectSignature !== lastFlushedProjectSignatureRef.current;

  useEffect(() => {
    currentProjectSignatureRef.current = currentProjectSignature;
  }, [currentProjectSignature]);

  useEffect(() => {
    currentLoadedSongIdRef.current = String(currentLoadedSongId || "");
  }, [currentLoadedSongId]);

  useEffect(() => {
    currentProjectIdRef.current = String(currentProjectId || "");
  }, [currentProjectId]);

  useEffect(() => {
    if (!lastFlushedProjectSignatureRef.current) {
      lastFlushedProjectSignatureRef.current = currentProjectSignature;
      if (canSaveTabs) setEditorSaveFeedback("idle", "");
      return;
    }
    if (!canSaveTabs) {
      clearProjectSaveTimers();
      if (!saveInFlightRef.current) setEditorSaveFeedback("idle", "");
      return;
    }
    if (!hasUnflushedEditorChanges) {
      clearProjectSaveTimers();
      if (!saveInFlightRef.current && editorSaveState === "dirty") {
        setEditorSaveFeedback("idle", "");
      }
      return;
    }
    if (saveInFlightRef.current) {
      queuedSaveRef.current = true;
      return;
    }
    if (!String(songTitle || "").trim()) {
      setEditorSaveFeedback("dirty", "");
      return;
    }
    if (editorSaveState === "error" && autosaveRetryTimerRef.current) {
      if (lastFailedSaveSignatureRef.current === currentProjectSignature) {
        return;
      }
      window.clearTimeout(autosaveRetryTimerRef.current);
      autosaveRetryTimerRef.current = null;
      lastFailedSaveSignatureRef.current = "";
    }
    setEditorSaveFeedback("dirty", "");
    scheduleProjectSave(EDITOR_AUTOSAVE_DELAY_MS, { manual: false, reason: "autosave" });
  }, [canSaveTabs, currentProjectSignature, currentProjectId, currentLoadedSongId, editorSaveState, hasUnflushedEditorChanges, songTitle]);

  useEffect(() => {
    return () => {
      clearProjectSaveTimers();
      clearEditorSaveStatusTimers();
      if (currentProjectSignatureRef.current !== lastFlushedProjectSignatureRef.current) {
        void flushProjectSaveUntilSettled({ reason: "unmount", maxPasses: 2 });
      }
    };
  }, [flushProjectSaveUntilSettled]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const triggerFinalSave = () => {
      if (currentProjectSignatureRef.current === lastFlushedProjectSignatureRef.current) return;
      if (!canSaveTabs || !isLoggedIn) return;
      if (!String(songTitle || "").trim()) return;
      void flushProjectSaveUntilSettled({ reason: "final-flush", maxPasses: 2 });
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerFinalSave();
      }
    };
    const handlePageHide = () => {
      triggerFinalSave();
    };
    const handleBeforeUnload = () => {
      if (currentProjectSignatureRef.current === lastFlushedProjectSignatureRef.current) return;
      if (!canSaveTabs || !isLoggedIn) return;
      if (!String(songTitle || "").trim()) return;
      void flushProjectSaveUntilSettled({ reason: "beforeunload", maxPasses: 2 });
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [canSaveTabs, flushProjectSaveUntilSettled, isLoggedIn, songTitle]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    if (!projectsLibraryOpen) return undefined;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [projectsLibraryOpen]);

  function handleOpenTabClick() {
    if (!canUsePaidEditorFeatures) {
      showMembershipGateToast("projects");
      return;
    }
    setAccountProfileOpen(false);
    setExportModalOpen(false);
    setImageExportProgress("");
    setSelectedLibraryArtistKey("");
    setSelectedLibraryAlbumName("");
    setSelectedLibrarySongName("");
    void refreshUserProjects();
    setProjectsLibraryOpen(true);
  }

  async function loadLibrarySongByPath(artistName, album, song) {
    if (!artistName || !album || !song) return;
    if (hasUnflushedEditorChanges && canSaveTabs && isLoggedIn && String(songTitle || "").trim()) {
      await flushProjectSaveUntilSettled({ reason: "switch-document" });
    }
    const songs =
      artistName === "Unsorted"
        ? libraryData?.unsorted?.albums?.[album]?.songs || {}
        : libraryData?.artists?.[artistName]?.albums?.[album]?.songs || {};
    const snapshot = songs?.[song];
    if (!snapshot) return;
    setSelectedLibraryArtistKey(artistName === "Unsorted" ? "" : artistName);
    setSelectedLibraryAlbumName(album);
    setSelectedLibrarySongName(song);
    setCurrentLoadedSongId(String(snapshot.songId || ""));
    setCurrentLoadedSongPath({ artistName, albumName: album, songName: song });
    setCurrentProjectId("");
    applyProjectSnapshot(snapshot);
    setProjectsLibraryOpen(false);
  }

  function deleteLibrarySong(artistName, album, song) {
    if (!artistName || !album || !song) return;
    const deletingSongSnapshot =
      artistName === "Unsorted"
        ? libraryData?.unsorted?.albums?.[album]?.songs?.[song] || null
        : libraryData?.artists?.[artistName]?.albums?.[album]?.songs?.[song] || null;
    pushLibraryUndoSnapshot(snapshotLibraryNow());
    libraryRedoStackRef.current = [];
    setLibraryData((prev) => {
      const next = normalizeLibraryData(cloneJson(prev, makeEmptyLibrary()));
      const artistAlbums =
        artistName === "Unsorted"
          ? next?.unsorted?.albums || {}
          : next?.artists?.[artistName]?.albums || {};
      if (!artistAlbums?.[album]?.songs) return next;
      delete artistAlbums[album].songs[song];
      return next;
    });
    if (selectedLibrarySongName === song) setSelectedLibrarySongName("");
    if (
      (String(currentLoadedSongId || "").trim() &&
        String(currentLoadedSongId || "").trim() === String(deletingSongSnapshot?.songId || "").trim()) ||
      (currentLoadedSongPath?.artistName === artistName &&
        currentLoadedSongPath?.albumName === album &&
        currentLoadedSongPath?.songName === song)
    ) {
      clearProjectSaveTimers();
      lastFlushedProjectSignatureRef.current = projectSnapshotSignature(buildCurrentProjectSnapshot());
      currentLoadedSongIdRef.current = "";
      currentProjectIdRef.current = "";
      setEditorSaveFeedback("saved", "Saved", { hideAfterMs: 1200 });
      setCurrentLoadedSongId("");
      setCurrentLoadedSongPath(null);
      setCurrentProjectId("");
    }
  }

  function requestDeleteLibrarySong(artistName, album, song) {
    if (!artistName || !album || !song) return;
    setSongDeleteConfirmTarget({ artistName, album, song });
  }

  function closeDeleteLibrarySongConfirm() {
    setSongDeleteConfirmTarget(null);
  }

  function confirmDeleteLibrarySong() {
    if (!songDeleteConfirmTarget) return;
    const { artistName, album, song } = songDeleteConfirmTarget;
    setSongDeleteConfirmTarget(null);
    deleteLibrarySong(artistName, album, song);
  }

  function renameLibraryArtist(artistName) {
    if (!artistName || artistName === "Unsorted") return;
    openPromptDialog({
      title: "Rename artist",
      message: "Update the artist name.",
      placeholder: "Artist name",
      initialValue: artistName,
      confirmLabel: "Save",
      cancelLabel: "Cancel",
      extraActionLabel: "Delete artist",
      extraActionDanger: true,
      onExtraAction: () => requestDeleteLibraryArtist(artistName),
      onConfirm: (value) => {
        const nextName = String(value || "").trim();
        if (!nextName || nextName === artistName || nextName.toLowerCase() === "unsorted") return;
        setLibraryData((prev) => {
          const next = normalizeLibraryData(cloneJson(prev, makeEmptyLibrary()));
          const source = next?.artists?.[artistName];
          if (!source) return next;
          const target = next?.artists?.[nextName];
          if (target?.albums && source?.albums) {
            const merged = { ...target.albums };
            for (const album of Object.keys(source.albums)) {
              const targetSongs = merged?.[album]?.songs || {};
              const sourceSongs = source?.albums?.[album]?.songs || {};
              merged[album] = { songs: { ...targetSongs, ...sourceSongs } };
            }
            next.artists[nextName] = { albums: merged };
          } else {
            next.artists[nextName] = source;
          }
          delete next.artists[artistName];
          return next;
        });
        if (String(artist || "").trim() === artistName) setArtist(nextName);
        if ((selectedLibraryArtistKey || "Unsorted") === artistName) {
          setSelectedLibraryArtistKey(nextName);
        }
      },
    });
  }

  function deleteLibraryArtist(artistName) {
    if (!artistName || artistName === "Unsorted") return;
    pushLibraryUndoSnapshot(snapshotLibraryNow());
    libraryRedoStackRef.current = [];
    setLibraryData((prev) => {
      const next = normalizeLibraryData(cloneJson(prev, makeEmptyLibrary()));
      delete next?.artists?.[artistName];
      return next;
    });
    if (String(artist || "").trim() === artistName) {
      setArtist("");
      setAlbumName("");
    }
    if ((selectedLibraryArtistKey || "Unsorted") === artistName) {
      setSelectedLibraryArtistKey("");
      setSelectedLibraryAlbumName("");
      setSelectedLibrarySongName("");
    }
  }

  function renameLibraryAlbum(artistName, albumNameCurrent) {
    if (!artistName || !albumNameCurrent) return;
    const artistOptions = ["Unsorted", ...Object.keys(libraryData?.artists || {}).filter((name) => !isPlaceholderArtistName(name))];
    openPromptDialog({
      title: "Rename album",
      message: "Update the album name.",
      placeholder: "Album name",
      initialValue: albumNameCurrent,
      confirmLabel: "Save",
      cancelLabel: "Cancel",
      extraActionLabel: "Delete album",
      extraActionDanger: true,
      onExtraAction: () => requestDeleteLibraryAlbum(artistName, albumNameCurrent),
      assignmentArtistLabel: "Artist",
      assignmentArtistName: artistName,
      assignmentArtistOptions: artistOptions,
      onConfirm: (value, dialogState) => {
        const nextName = String(value || "").trim();
        const targetArtistName = String(dialogState?.assignmentArtistName || artistName).trim() || "Unsorted";
        if (!nextName) return;
        setLibraryData((prev) => {
          const next = normalizeLibraryData(cloneJson(prev, makeEmptyLibrary()));
          const sourceAlbums =
            artistName === "Unsorted" ? next?.unsorted?.albums || {} : next?.artists?.[artistName]?.albums || {};
          const source = sourceAlbums?.[albumNameCurrent];
          if (!source) return next;
          delete sourceAlbums[albumNameCurrent];
          const targetAlbums = ensureArtistBucket(next, targetArtistName);
          const target = targetAlbums?.[nextName];
          const mergedSongs = { ...(target?.songs || {}) };
          for (const [songName, snapshot] of Object.entries(source?.songs || {})) {
            mergedSongs[songName] = {
              ...(snapshot || {}),
              songName,
              artistName: targetArtistName,
              albumName: nextName,
              updatedAt: new Date().toISOString(),
            };
          }
          targetAlbums[nextName] = { songs: mergedSongs };
          return next;
        });
        if ((String(artist || "").trim() || "Unsorted") === artistName && String(albumName || "").trim() === albumNameCurrent) {
          setArtist(targetArtistName === "Unsorted" ? "" : targetArtistName);
          setAlbumName(nextName === NO_ALBUM_NAME ? "" : nextName);
        }
        if (selectedLibraryAlbumName === albumNameCurrent) {
          setSelectedLibraryArtistKey(targetArtistName === "Unsorted" ? "" : targetArtistName);
          setSelectedLibraryAlbumName(nextName);
        }
        if (currentLoadedSongPath?.artistName === artistName && currentLoadedSongPath?.albumName === albumNameCurrent) {
          setCurrentLoadedSongPath({
            artistName: targetArtistName,
            albumName: nextName,
            songName: currentLoadedSongPath.songName,
          });
        }
      },
    });
  }

  function deleteLibraryAlbum(artistName, album) {
    if (!artistName || !album) return;
    if (album === NO_ALBUM_NAME) return;
    pushLibraryUndoSnapshot(snapshotLibraryNow());
    libraryRedoStackRef.current = [];
    setLibraryData((prev) => {
      const next = normalizeLibraryData(cloneJson(prev, makeEmptyLibrary()));
      const albums =
        artistName === "Unsorted" ? next?.unsorted?.albums || {} : next?.artists?.[artistName]?.albums || {};
      delete albums[album];
      return next;
    });
    if ((String(artist || "").trim() || "Unsorted") === artistName && String(albumName || "").trim() === album) {
      setAlbumName("");
    }
    if (selectedLibraryAlbumName === album) {
      setSelectedLibraryAlbumName("");
      setSelectedLibrarySongName("");
    }
  }

  function requestDeleteLibraryArtist(artistName) {
    if (!artistName || artistName === "Unsorted") return;
    setLibraryDeleteConfirmTarget({
      type: "artist",
      artistName,
      album: "",
      stage: "idle",
      remaining: LIBRARY_DELETE_WAIT_SECONDS,
    });
  }

  function requestDeleteLibraryAlbum(artistName, album) {
    if (!artistName || !album || album === NO_ALBUM_NAME) return;
    setLibraryDeleteConfirmTarget({
      type: "album",
      artistName,
      album,
      stage: "idle",
      remaining: LIBRARY_DELETE_WAIT_SECONDS,
    });
  }

  function closeDeleteLibraryConfirm() {
    setLibraryDeleteConfirmTarget(null);
  }

  function confirmDeleteLibraryConfirm() {
    if (!libraryDeleteConfirmTarget) return;
    if (libraryDeleteConfirmTarget.stage === "idle") {
      setLibraryDeleteConfirmTarget((prev) =>
        prev
          ? {
              ...prev,
              stage: "countdown",
              remaining: LIBRARY_DELETE_WAIT_SECONDS,
            }
          : prev
      );
      return;
    }
    if (libraryDeleteConfirmTarget.stage === "countdown") return;
    const { type, artistName, album } = libraryDeleteConfirmTarget;
    setLibraryDeleteConfirmTarget(null);
    if (type === "artist") {
      deleteLibraryArtist(artistName);
    } else if (type === "album") {
      deleteLibraryAlbum(artistName, album);
    }
  }

  function skipDeleteLibraryWaitAndDeleteNow() {
    if (!libraryDeleteConfirmTarget) return;
    const { type, artistName, album } = libraryDeleteConfirmTarget;
    setLibraryDeleteConfirmTarget(null);
    if (type === "artist") {
      deleteLibraryArtist(artistName);
    } else if (type === "album") {
      deleteLibraryAlbum(artistName, album);
    }
  }

  function renameLibrarySong(artistName, album, song) {
    if (!artistName || !album || !song) return;
    const artistOptions = ["Unsorted", ...Object.keys(libraryData?.artists || {}).filter((name) => !isPlaceholderArtistName(name))];
    const albumOptionsByArtist = artistOptions.reduce((acc, optionArtistName) => {
      const albums =
        optionArtistName === "Unsorted"
          ? Object.keys(libraryData?.unsorted?.albums || {})
          : Object.keys(libraryData?.artists?.[optionArtistName]?.albums || {});
      acc[optionArtistName] = albums.length ? albums : [NO_ALBUM_NAME];
      return acc;
    }, {});
    openPromptDialog({
      title: "Rename song",
      message: "Update the song name.",
      placeholder: "Song name",
      initialValue: song,
      confirmLabel: "Save",
      cancelLabel: "Cancel",
      assignmentArtistLabel: "Artist",
      assignmentArtistName: artistName,
      assignmentArtistOptions: artistOptions,
      assignmentAlbumLabel: "Album",
      assignmentAlbumName: album,
      assignmentAlbumOptionsByArtist: albumOptionsByArtist,
      onConfirm: (value, dialogState) => {
        const nextName = String(value || "").trim();
        const targetArtistName = String(dialogState?.assignmentArtistName || artistName).trim() || "Unsorted";
        const targetAlbumName = String(dialogState?.assignmentAlbumName || album).trim() || NO_ALBUM_NAME;
        if (!nextName) return;
        setLibraryData((prev) => {
          const next = normalizeLibraryData(cloneJson(prev, makeEmptyLibrary()));
          const sourceAlbums =
            artistName === "Unsorted" ? next?.unsorted?.albums || {} : next?.artists?.[artistName]?.albums || {};
          const songs = sourceAlbums?.[album]?.songs || {};
          const source = songs?.[song];
          if (!source) return next;
          delete songs[song];
          const targetAlbums = ensureArtistBucket(next, targetArtistName);
          if (!targetAlbums[targetAlbumName] || typeof targetAlbums[targetAlbumName] !== "object") {
            targetAlbums[targetAlbumName] = { songs: {} };
          }
          if (!targetAlbums[targetAlbumName].songs || typeof targetAlbums[targetAlbumName].songs !== "object") {
            targetAlbums[targetAlbumName].songs = {};
          }
          const targetSongs = targetAlbums[targetAlbumName].songs;
          const target = targetSongs?.[nextName];
          targetSongs[nextName] = {
            ...(target || {}),
            ...(source || {}),
            songName: nextName,
            artistName: targetArtistName,
            albumName: targetAlbumName,
            updatedAt: new Date().toISOString(),
          };
          return next;
        });
        if (String(songTitle || "").trim() === song) setSongTitle(nextName);
        if (selectedLibrarySongName === song) {
          setSelectedLibraryArtistKey(targetArtistName === "Unsorted" ? "" : targetArtistName);
          setSelectedLibraryAlbumName(targetAlbumName);
          setSelectedLibrarySongName(nextName);
        }
        if (
          (String(currentLoadedSongId || "").trim() &&
            String(currentLoadedSongId || "").trim() ===
              String(
                (artistName === "Unsorted"
                  ? libraryData?.unsorted?.albums?.[album]?.songs?.[song]
                  : libraryData?.artists?.[artistName]?.albums?.[album]?.songs?.[song]
                )?.songId || ""
              ).trim()) ||
          currentLoadedSongPath?.artistName === artistName &&
          currentLoadedSongPath?.albumName === album &&
          currentLoadedSongPath?.songName === song
        ) {
          setCurrentLoadedSongPath({ artistName: targetArtistName, albumName: targetAlbumName, songName: nextName });
        }
      },
    });
  }

  function moveLibraryArtist(sourceArtistName, targetArtistName) {
    if (!sourceArtistName || !targetArtistName || sourceArtistName === "Unsorted" || targetArtistName === "Unsorted") return;
    if (sourceArtistName === targetArtistName) return;
    pushLibraryUndoSnapshot(snapshotLibraryNow());
    libraryRedoStackRef.current = [];
    setLibraryData((prev) => {
      const next = normalizeLibraryData(cloneJson(prev, makeEmptyLibrary()));
      const entries = Object.entries(next.artists || {});
      const sourceIndex = entries.findIndex(([name]) => name === sourceArtistName);
      const targetIndex = entries.findIndex(([name]) => name === targetArtistName);
      if (sourceIndex < 0 || targetIndex < 0) return next;
      const [sourceEntry] = entries.splice(sourceIndex, 1);
      const insertionIndex = entries.findIndex(([name]) => name === targetArtistName);
      entries.splice(insertionIndex < 0 ? entries.length : insertionIndex, 0, sourceEntry);
      next.artists = Object.fromEntries(entries);
      return next;
    });
  }

  function moveLibraryAlbum(sourceArtistName, albumNameCurrent, targetArtistName, targetAlbumName = "") {
    if (!sourceArtistName || !albumNameCurrent || !targetArtistName) return;
    if (sourceArtistName === targetArtistName && (!targetAlbumName || targetAlbumName === albumNameCurrent)) return;
    pushLibraryUndoSnapshot(snapshotLibraryNow());
    libraryRedoStackRef.current = [];
    setLibraryData((prev) => {
      const next = normalizeLibraryData(cloneJson(prev, makeEmptyLibrary()));
      const sourceAlbums =
        sourceArtistName === "Unsorted" ? next?.unsorted?.albums || {} : next?.artists?.[sourceArtistName]?.albums || {};
      const sourceAlbum = sourceAlbums?.[albumNameCurrent];
      if (!sourceAlbum) return next;
      delete sourceAlbums[albumNameCurrent];

      const targetAlbums = ensureArtistBucket(next, targetArtistName);
      const existingTargetAlbum = targetAlbums?.[albumNameCurrent];
      const mergedSongs = { ...(existingTargetAlbum?.songs || {}) };
      for (const songName of Object.keys(sourceAlbum?.songs || {})) {
        mergedSongs[songName] = {
          ...(sourceAlbum.songs?.[songName] || {}),
          songName,
          artistName: targetArtistName,
          albumName: albumNameCurrent,
          updatedAt: new Date().toISOString(),
        };
      }

      const targetEntries = Object.entries(targetAlbums).filter(([name]) => name !== albumNameCurrent);
      const movedAlbumEntry = [
        albumNameCurrent,
        {
          songs: mergedSongs,
        },
      ];
      const insertionIndex = targetAlbumName ? targetEntries.findIndex(([name]) => name === targetAlbumName) : -1;
      targetEntries.splice(insertionIndex < 0 ? targetEntries.length : insertionIndex, 0, movedAlbumEntry);

      const rebuiltTargetAlbums = Object.fromEntries(targetEntries);
      if (targetArtistName === "Unsorted") {
        next.unsorted.albums = rebuiltTargetAlbums;
      } else {
        next.artists[targetArtistName].albums = rebuiltTargetAlbums;
      }
      if (sourceArtistName !== targetArtistName) {
        if (sourceArtistName === "Unsorted") {
          next.unsorted.albums = { ...next.unsorted.albums };
        } else if (next.artists[sourceArtistName]) {
          next.artists[sourceArtistName].albums = { ...sourceAlbums };
        }
      }
      return next;
    });

    if ((String(artist || "").trim() || "Unsorted") === sourceArtistName && String(albumName || "").trim() === albumNameCurrent) {
      setArtist(targetArtistName === "Unsorted" ? "" : targetArtistName);
      setAlbumName(albumNameCurrent);
    }
    if ((selectedLibraryArtistLabel || "Unsorted") === sourceArtistName && selectedLibraryAlbumName === albumNameCurrent) {
      setSelectedLibraryArtistKey(targetArtistName === "Unsorted" ? "" : targetArtistName);
      setSelectedLibraryAlbumName(albumNameCurrent);
    }
    if (currentLoadedSongPath?.artistName === sourceArtistName && currentLoadedSongPath?.albumName === albumNameCurrent) {
      setCurrentLoadedSongPath({
        artistName: targetArtistName,
        albumName: albumNameCurrent,
        songName: currentLoadedSongPath.songName,
      });
    }
  }

  function moveLibrarySong(sourceArtistName, sourceAlbumName, songName, targetArtistName, targetAlbumName, targetSongName = "") {
    if (!sourceArtistName || !sourceAlbumName || !songName || !targetArtistName || !targetAlbumName) return;
    if (
      sourceArtistName === targetArtistName &&
      sourceAlbumName === targetAlbumName &&
      (!targetSongName || targetSongName === songName)
    ) {
      return;
    }
    pushLibraryUndoSnapshot(snapshotLibraryNow());
    libraryRedoStackRef.current = [];
    setLibraryData((prev) => {
      const next = normalizeLibraryData(cloneJson(prev, makeEmptyLibrary()));
      const sourceAlbums =
        sourceArtistName === "Unsorted" ? next?.unsorted?.albums || {} : next?.artists?.[sourceArtistName]?.albums || {};
      const sourceSongs = sourceAlbums?.[sourceAlbumName]?.songs || {};
      const sourceSnapshot = sourceSongs?.[songName];
      if (!sourceSnapshot) return next;
      delete sourceSongs[songName];

      const targetAlbums = ensureArtistBucket(next, targetArtistName);
      if (!targetAlbums[targetAlbumName] || typeof targetAlbums[targetAlbumName] !== "object") {
        targetAlbums[targetAlbumName] = { songs: {} };
      }
      if (!targetAlbums[targetAlbumName].songs || typeof targetAlbums[targetAlbumName].songs !== "object") {
        targetAlbums[targetAlbumName].songs = {};
      }

      const targetSongs = targetAlbums[targetAlbumName].songs || {};
      const targetEntries = Object.entries(targetSongs).filter(([name]) => name !== songName);
      const movedSongEntry = [
        songName,
        {
          ...sourceSnapshot,
          songName,
          artistName: targetArtistName,
          albumName: targetAlbumName,
          updatedAt: new Date().toISOString(),
        },
      ];
      const insertionIndex = targetSongName ? targetEntries.findIndex(([name]) => name === targetSongName) : -1;
      targetEntries.splice(insertionIndex < 0 ? targetEntries.length : insertionIndex, 0, movedSongEntry);
      targetAlbums[targetAlbumName].songs = Object.fromEntries(targetEntries);
      return next;
    });

    if ((String(artist || "").trim() || "Unsorted") === sourceArtistName && String(albumName || "").trim() === sourceAlbumName) {
      setArtist(targetArtistName === "Unsorted" ? "" : targetArtistName);
      setAlbumName(targetAlbumName === NO_ALBUM_NAME ? "" : targetAlbumName);
    }
    if ((selectedLibraryArtistLabel || "Unsorted") === sourceArtistName && selectedLibraryAlbumName === sourceAlbumName && selectedLibrarySongName === songName) {
      setSelectedLibraryArtistKey(targetArtistName === "Unsorted" ? "" : targetArtistName);
      setSelectedLibraryAlbumName(targetAlbumName);
      setSelectedLibrarySongName(songName);
    }
    if (
      currentLoadedSongPath?.artistName === sourceArtistName &&
      currentLoadedSongPath?.albumName === sourceAlbumName &&
      currentLoadedSongPath?.songName === songName
    ) {
      setCurrentLoadedSongPath({
        artistName: targetArtistName,
        albumName: targetAlbumName,
        songName,
      });
    }
  }

  function moveLibrarySongToAlbum(sourceArtistName, sourceAlbumName, songName, targetArtistName, targetAlbumName) {
    moveLibrarySong(sourceArtistName, sourceAlbumName, songName, targetArtistName, targetAlbumName);
  }

  function confirmCreateArtist() {
    const name = String(newArtistDraft || "").trim();
    if (!name || name.toLowerCase() === "unsorted") {
      setArtistCreateOpen(false);
      setNewArtistDraft("");
      return;
    }
    setLibraryData((prev) => {
      const next = normalizeLibraryData(cloneJson(prev, makeEmptyLibrary()));
      if (!next.artists[name]) next.artists[name] = { albums: { [NO_ALBUM_NAME]: { songs: {} } } };
      if (!next.artists[name].albums?.[NO_ALBUM_NAME]) next.artists[name].albums[NO_ALBUM_NAME] = { songs: {} };
      return next;
    });
    setArtist(name);
    setAlbumName("");
    setSelectedLibraryArtistKey(name);
    setSelectedLibraryAlbumName("");
    setSelectedLibrarySongName("");
    setArtistCreateOpen(false);
    setNewArtistDraft("");
  }

  function confirmCreateAlbum() {
    const name = String(newAlbumDraft || "").trim();
    if (!name) {
      setAlbumCreateOpen(false);
      setNewAlbumDraft("");
      return;
    }
    const targetArtistName = String(artist || "").trim() || "Unsorted";
    setLibraryData((prev) => {
      const next = normalizeLibraryData(cloneJson(prev, makeEmptyLibrary()));
      const albums = ensureArtistBucket(next, targetArtistName);
      if (!albums[name]) albums[name] = { songs: {} };
      return next;
    });
    setAlbumName(name);
    setAlbumCreateOpen(false);
    setNewAlbumDraft("");
  }

  function confirmCreateLibraryAlbum() {
    const name = String(libraryNewAlbumDraft || "").trim();
    if (!name) {
      setLibraryAlbumCreateOpen(false);
      setLibraryNewAlbumDraft("");
      return;
    }
    const targetArtistName = String(selectedLibraryArtistLabel || "").trim() || "Unsorted";
    setLibraryData((prev) => {
      const next = normalizeLibraryData(cloneJson(prev, makeEmptyLibrary()));
      const albums = ensureArtistBucket(next, targetArtistName);
      if (!albums[name]) albums[name] = { songs: {} };
      if (!albums[name].songs || typeof albums[name].songs !== "object") albums[name].songs = {};
      return next;
    });
    setSelectedLibraryArtistKey(targetArtistName === "Unsorted" ? "" : targetArtistName);
    setSelectedLibraryAlbumName(name);
    setSelectedLibrarySongName("");
    setArtist(targetArtistName === "Unsorted" ? "" : targetArtistName);
    setAlbumName(name);
    setLibraryAlbumCreateOpen(false);
    setLibraryNewAlbumDraft("");
  }

  function confirmCreateLibrarySong() {
    const name = String(libraryNewSongDraft || "").trim();
    if (!name) {
      setLibrarySongCreateOpen(false);
      setLibraryNewSongDraft("");
      return;
    }
    const targetArtistName = String(selectedLibraryArtistLabel || "").trim() || "Unsorted";
    const targetAlbumName = String(selectedLibraryAlbumName || "").trim() || NO_ALBUM_NAME;
    const nowIso = new Date().toISOString();
    const existingLibrarySong =
      targetArtistName === "Unsorted"
        ? libraryData?.unsorted?.albums?.[targetAlbumName]?.songs?.[name] || null
        : libraryData?.artists?.[targetArtistName]?.albums?.[targetAlbumName]?.songs?.[name] || null;
    const nextSongId = String(existingLibrarySong?.songId || createSongId());
    setLibraryData((prev) => {
      const next = normalizeLibraryData(cloneJson(prev, makeEmptyLibrary()));
      const albums = ensureArtistBucket(next, targetArtistName);
      if (!albums[targetAlbumName] || typeof albums[targetAlbumName] !== "object") {
        albums[targetAlbumName] = { songs: {} };
      }
      if (!albums[targetAlbumName].songs || typeof albums[targetAlbumName].songs !== "object") {
        albums[targetAlbumName].songs = {};
      }
      const existing = albums[targetAlbumName].songs[name];
      const snapshot = existing || buildCurrentProjectSnapshot();
      snapshot.songId = String(existing?.songId || nextSongId);
      snapshot.songName = name;
      snapshot.artistName = targetArtistName;
      snapshot.albumName = targetAlbumName;
      snapshot.updatedAt = nowIso;
      snapshot.createdAt = String(existing?.createdAt || nowIso);
      albums[targetAlbumName].songs[name] = snapshot;
      return next;
    });
    setSelectedLibraryArtistKey(targetArtistName === "Unsorted" ? "" : targetArtistName);
    setSelectedLibraryAlbumName(targetAlbumName);
    setSelectedLibrarySongName(name);
    setCurrentLoadedSongId(nextSongId);
    setCurrentLoadedSongPath({
      artistName: targetArtistName,
      albumName: targetAlbumName,
      songName: name,
    });
    setCurrentProjectId("");
    setSongTitle(name);
    setArtist(targetArtistName === "Unsorted" ? "" : targetArtistName);
    setAlbumName(targetAlbumName === NO_ALBUM_NAME ? "" : targetAlbumName);
    setLibrarySongCreateOpen(false);
    setLibraryNewSongDraft("");
  }

  function openConfirmDialog({
    title = "Confirm",
    message = "",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    danger = false,
    onConfirm = null,
  }) {
    setUiDialog({
      type: "confirm",
      title,
      message,
      confirmLabel,
      cancelLabel,
      danger,
      value: "",
      onConfirm,
    });
  }

  function openPromptDialog({
    title = "Rename",
    message = "",
    placeholder = "",
    initialValue = "",
    confirmLabel = "Save",
    cancelLabel = "Cancel",
    danger = false,
    extraActionLabel = "",
    extraActionDanger = false,
    assignmentArtistLabel = "",
    assignmentArtistName = "",
    assignmentArtistOptions = null,
    assignmentAlbumLabel = "",
    assignmentAlbumName = "",
    assignmentAlbumOptionsByArtist = null,
    onExtraAction = null,
    onConfirm = null,
  }) {
    const initialArtistName = String(assignmentArtistName || "").trim() || "Unsorted";
    const initialAlbumOptions =
      assignmentAlbumOptionsByArtist && typeof assignmentAlbumOptionsByArtist === "object"
        ? assignmentAlbumOptionsByArtist[initialArtistName] || assignmentAlbumOptionsByArtist.Unsorted || [NO_ALBUM_NAME]
        : null;
    const initialAlbumName =
      String(assignmentAlbumName || "").trim() ||
      String(initialAlbumOptions?.[0] || NO_ALBUM_NAME);
    setUiDialog({
      type: "prompt",
      title,
      message,
      placeholder,
      confirmLabel,
      cancelLabel,
      danger,
      extraActionLabel,
      extraActionDanger,
      assignmentArtistLabel,
      assignmentArtistName: initialArtistName,
      assignmentArtistOptions,
      assignmentArtistOpen: false,
      assignmentAlbumLabel,
      assignmentAlbumName: initialAlbumName,
      assignmentAlbumOptionsByArtist,
      assignmentAlbumOpen: false,
      value: String(initialValue || ""),
      onExtraAction,
      onConfirm,
    });
  }

  function closeUiDialog() {
    setUiDialog(null);
  }

  function submitUiDialog() {
    if (!uiDialog) return;
    const onConfirm = uiDialog?.onConfirm;
    const value = uiDialog?.type === "prompt" ? String(uiDialog?.value ?? "") : undefined;
    const dialogState = uiDialog;
    setUiDialog(null);
    if (typeof onConfirm === "function") onConfirm(value, dialogState);
  }

  function runUiDialogExtraAction() {
    if (!uiDialog) return;
    const onExtraAction = uiDialog?.onExtraAction;
    setUiDialog(null);
    if (typeof onExtraAction === "function") onExtraAction();
  }

  function triggerTabsCreatedMilestone(milestoneValue) {
    const surfaceRect = editorSurfaceRef.current?.getBoundingClientRect?.();
    const gridRect = tabWriterAreaRef.current?.getBoundingClientRect?.();
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
      const path = typeof e.composedPath === "function" ? e.composedPath() : [];
      const insideGridCell = path.some((node) => node?.dataset?.gridCell === "true");
      if (insideGridCell) {
        setGridTargetingActive(true);
        return;
      }
      setGridTargetingActive(false);
      clearCellSelection();
      try {
        keyCaptureRef.current?.blur?.();
      } catch {}
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

  useEffect(() => {
    if (!songDeleteConfirmTarget) return;
    const onEnter = (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      e.stopPropagation();
      confirmDeleteLibrarySong();
    };
    window.addEventListener("keydown", onEnter, true);
    return () => window.removeEventListener("keydown", onEnter, true);
  }, [songDeleteConfirmTarget]);

  useEffect(() => {
    if (!libraryDeleteConfirmTarget) return;
    const onEnter = (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      e.stopPropagation();
      confirmDeleteLibraryConfirm();
    };
    window.addEventListener("keydown", onEnter, true);
    return () => window.removeEventListener("keydown", onEnter, true);
  }, [libraryDeleteConfirmTarget]);

  useEffect(() => {
    if (!libraryDeleteConfirmTarget || libraryDeleteConfirmTarget.stage !== "countdown") return;
    const timer = window.setTimeout(() => {
      setLibraryDeleteConfirmTarget((prev) => {
        if (!prev || prev.stage !== "countdown") return prev;
        const nextRemaining = Math.max(0, Number(prev.remaining || 0) - 1);
        if (nextRemaining <= 0) {
          return { ...prev, stage: "armed", remaining: 0 };
        }
        return { ...prev, remaining: nextRemaining };
      });
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [libraryDeleteConfirmTarget]);

  useEffect(() => {
    if (!chordDeleteConfirmId) return;
    const onEnter = (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      e.stopPropagation();
      confirmDeleteUserChord();
    };
    window.addEventListener("keydown", onEnter, true);
    return () => window.removeEventListener("keydown", onEnter, true);
  }, [chordDeleteConfirmId]);

  function onCellPointerDown(e, r, c) {
    e.preventDefault();
    recordTapSyncNote(r, c);
    setGridTargetingActive(true);
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

  function captureSelectedGridShape() {
    const selectedCellsRaw = getSelectedCellCoords();
    const selectedCells = selectedCellsRaw.length ? selectedCellsRaw : [{ r: cursorRef.current.r, c: cursorRef.current.c }];
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
    return {
      text,
      rows: lines.map((line) => String(line).split("\t")),
      bounds: { minR, maxR, minC, maxC },
      selectedCells,
    };
  }

  function rememberGridClipboardShape(shape) {
    if (!shape) return;
    lastGridClipboardRef.current = {
      kind: "grid-shape",
      text: shape.text,
      rows: shape.rows,
      bounds: shape.bounds,
    };
  }

  async function copySelectionToClipboard() {
    const shape = captureSelectedGridShape();
    if (!shape) return false;
    const { text } = shape;
    rememberGridClipboardShape(shape);

    try {
      await navigator.clipboard.writeText(text);
      return true;
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
        return true;
      } catch {}
    }
    return false;
  }

  async function cutSelectionToClipboard() {
    const shape = captureSelectedGridShape();
    if (!shape) return false;
    const copied = await copySelectionToClipboard();
    if (!copied) return false;
    const edits = shape.selectedCells.map(({ r, c }) => ({ r, c, v: "" }));
    if (edits.length) setManyCells(edits);
    setOverwriteNext(true);
    return true;
  }

  function handleGridCopy(e) {
    if (e.target !== keyCaptureRef.current) return;
    if (!gridTargetingActive) return;
    const shape = captureSelectedGridShape();
    if (!shape) return;
    rememberGridClipboardShape(shape);
    try {
      e.clipboardData?.setData("text/plain", shape.text);
      e.preventDefault();
      e.stopPropagation();
    } catch {}
  }

  function handleGridCut(e) {
    if (e.target !== keyCaptureRef.current) return;
    if (!gridTargetingActive) return;
    const shape = captureSelectedGridShape();
    if (!shape) return;
    rememberGridClipboardShape(shape);
    try {
      e.clipboardData?.setData("text/plain", shape.text);
      e.preventDefault();
      e.stopPropagation();
    } catch {
      return;
    }
    const edits = shape.selectedCells.map(({ r, c }) => ({ r, c, v: "" }));
    if (edits.length) setManyCells(edits);
    setOverwriteNext(true);
  }

  function pasteClipboardTextIntoGrid(text) {
    const raw = String(text ?? "");
    if (!raw.length) return false;
    const rows = raw
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .map((line) => line.split("\t"));
    if (!rows.length) return false;

    const rememberedClipboard = lastGridClipboardRef.current?.text === raw ? lastGridClipboardRef.current : null;

    const prev = gridRef.current;
    const next = prev.map((row) => row.slice());

    const sourceRows = rememberedClipboard?.kind === "grid-shape" ? rememberedClipboard.rows : rows;
    const startRow =
      rememberedClipboard?.kind === "grid-shape" && rememberedClipboard?.bounds
        ? rememberedClipboard.bounds.minR
        : sourceRows.length > 1
        ? 0
        : cursorRef.current.r;
    const startCol = cursorRef.current.c;
    for (let r = 0; r < sourceRows.length; r += 1) {
      const targetRow = startRow + r;
      if (targetRow < 0 || targetRow >= tuning.length) continue;
      const row = sourceRows[r];
      for (let c = 0; c < row.length; c += 1) {
        const targetCol = startCol + c;
        if (targetCol < 0 || targetCol >= colsRef.current) continue;
        next[targetRow][targetCol] = String(row[c] ?? "");
      }
    }

    commitGridChange(next, { r: startRow, c: startCol });
    setOverwriteNext(true);
    return true;
  }

  function handleGridPaste(e) {
    if (e.target !== keyCaptureRef.current) return;
    if (!gridTargetingActive) return;
    const text = e.clipboardData?.getData("text") ?? "";
    if (!text) return;
    const pasted = pasteClipboardTextIntoGrid(text);
    if (!pasted) return;
    e.preventDefault();
    e.stopPropagation();
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

  function saveChordExportTuning(name, lowToHigh) {
    const trimmedName = String(name || "").trim();
    const targetStringCount = Math.max(1, Number(currentInstrument?.stringCount) || 0);
    const notes = Array.isArray(lowToHigh) ? lowToHigh.map((s) => String(s ?? "").trim()).slice(0, targetStringCount) : [];
    if (!trimmedName) return null;
    if (notes.length !== targetStringCount || notes.some((s) => !s)) return null;
    const id = `user_tuning_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const next = { id, name: trimmedName, lowToHigh: notes };
    setUserTunings((prev) => [...prev, next]);
    return next;
  }

  function deleteUserTuning(id) {
    const ok = window.confirm("Delete this saved tuning?");
    if (!ok) return;
    setUserTunings((prev) => prev.filter((t) => t.id !== id));
  }

  function getColumnValues(col) {
    return Array.from({ length: tuning.length }, (_, r) => String(gridRef.current?.[r]?.[col] ?? ""));
  }

  function saveCustomChordToLibrary(
    name,
    frets,
    {
      selectSavedChord = true,
      instrumentId: instrumentIdOverride,
      tuningId: tuningIdOverride,
      tuningName: tuningNameOverride,
      stringCount: stringCountOverride,
    } = {}
  ) {
    const hasExplicitExportContext =
      instrumentIdOverride != null || tuningIdOverride != null || tuningNameOverride != null || stringCountOverride != null;
    if (!hasExplicitExportContext && !chordToolEnabled) return "";
    const trimmedName = String(name || "").trim();
    if (!trimmedName) return "";
    const resolvedStringCount = Math.max(1, Number(stringCountOverride) || Number(currentInstrument?.stringCount) || 0);
    const nextFrets = Array.isArray(frets) ? frets.map((value) => String(value ?? "").trim()).slice(0, resolvedStringCount) : [];
    while (nextFrets.length < resolvedStringCount) nextFrets.push("");
    if (!nextFrets.some((value) => value !== "")) return "";

    const id = `userChord_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setUserChords((prev) => [
      ...prev,
      {
        id,
        name: trimmedName,
        frets: nextFrets,
        tuningId: String(tuningIdOverride || currentChordTuningId),
        tuningName: String(tuningNameOverride || tuningLabel || "Custom"),
        instrumentId: String(instrumentIdOverride || currentInstrument.id || "gtr6"),
      },
    ]);
    if (selectSavedChord) setSelectedChordId(id);
    return id;
  }

  function saveChordFromSelectedColumn() {
    if (!chordToolEnabled) return;
    const name = chordName.trim();
    if (!name) return;
    const col = cursorRef.current.c;
    const values = getColumnValues(col);
    if (!values.some((x) => x.trim() !== "")) return;

    const id = saveCustomChordToLibrary(name, values.map((v) => v.trim()));
    if (!id) return;
    setChordName("");
    focusKeyCapture();
  }

  function deleteUserChord(id) {
    setUserChords((prev) => prev.filter((c) => c.id !== id));
    setSelectedChordId((cur) => (cur === id ? "" : cur));
    setLastAppliedChordId((cur) => (cur === id ? "" : cur));
    focusKeyCapture();
  }

  function requestDeleteUserChord(id) {
    if (!id) return;
    setChordDeleteConfirmId(id);
  }

  function closeDeleteUserChordConfirm() {
    setChordDeleteConfirmId("");
  }

  function confirmDeleteUserChord() {
    if (!chordDeleteConfirmId) return;
    const targetId = chordDeleteConfirmId;
    setChordDeleteConfirmId("");
    deleteUserChord(targetId);
  }

  function applyChordIdToSelectedColumn(chordId) {
    if (!chordToolEnabled) return;
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
    setChordsOpen(false);
  }

  function repeatLastChord() {
    if (!lastAppliedChordId) return;
    applyChordIdToSelectedColumn(lastAppliedChordId);
  }

  function completeRow({ advanceToNextString = false } = {}) {
    if (!canUsePaidEditorFeatures) {
      showMembershipGateToast("complete-row");
      return;
    }
    const id = `row_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const trimmed = trimGridToContent(gridView, 1);
    const currentCursor = cursorRef.current;
    const nextRowIndex = advanceToNextString ? Math.min(tuning.length - 1, currentCursor.r + 1) : 0;

    setCompletedRows((prev) => {
      const nextIndex = prev.length + 1;
      const defaultName = `Row ${nextIndex}`;
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
      const validIds = new Set(completedRows.map((r) => r.id));
      const next = new Set();
      prev.forEach((rowId) => {
        if (validIds.has(rowId)) next.add(rowId);
      });

      // If everything is currently selected, a row toggle clears the whole selection.
      if (completedRows.length > 0 && next.size === completedRows.length) {
        return new Set();
      }

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
      name: row.name ? `${row.name} (copy)` : "Row (copy)",
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
    if (!insertOpen) {
      setInsertPanelShiftX(0);
      return;
    }
    const updateInsertPanelPosition = () => {
      const btnEl = insertBtnRef.current;
      const panelEl = insertPanelRef.current;
      if (!btnEl || !panelEl || typeof window === "undefined") return;
      const btnRect = btnEl.getBoundingClientRect();
      const panelWidth = panelEl.getBoundingClientRect().width || 0;
      const viewportPad = 18;
      const desiredLeft = btnRect.left;
      const minLeft = viewportPad;
      const maxLeft = Math.max(minLeft, window.innerWidth - viewportPad - panelWidth);
      const clampedLeft = Math.min(Math.max(desiredLeft, minLeft), maxLeft);
      setInsertPanelShiftX(clampedLeft - desiredLeft);
    };

    const raf = window.requestAnimationFrame(updateInsertPanelPosition);
    window.addEventListener("resize", updateInsertPanelPosition);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateInsertPanelPosition);
    };
  }, [insertOpen]);

  useEffect(() => {
    if (!tuningOpen) return;
    const onDown = (e) => {
      if (eventPathIncludes(e, tuningBtnRef.current)) return;
      if (eventPathIncludes(e, tuningPanelRef.current)) return;
      if (eventPathIncludes(e, customTuningModalRef.current)) return;
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
    if (!chordsOpen) {
      setChordsPanelShiftX(0);
      return;
    }
    const updateChordsPanelPosition = () => {
      const btnEl = chordsBtnRef.current;
      const panelEl = chordsPanelRef.current;
      if (!btnEl || !panelEl || typeof window === "undefined") return;
      const btnRect = btnEl.getBoundingClientRect();
      const panelWidth = panelEl.getBoundingClientRect().width || 0;
      const viewportPad = 18;
      const desiredLeft = btnRect.left;
      const minLeft = viewportPad;
      const maxLeft = Math.max(minLeft, window.innerWidth - viewportPad - panelWidth);
      const clampedLeft = Math.min(Math.max(desiredLeft, minLeft), maxLeft);
      setChordsPanelShiftX(clampedLeft - desiredLeft);
    };

    const raf = window.requestAnimationFrame(updateChordsPanelPosition);
    window.addEventListener("resize", updateChordsPanelPosition);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateChordsPanelPosition);
    };
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

  const shortcutPlatformInfo = useMemo(() => {
    const classifyPlatform = (value) => {
      const normalized = String(value || "").toLowerCase();
      if (!normalized) return null;
      if (
        normalized.includes("mac") ||
        normalized.includes("darwin") ||
        normalized.includes("iphone") ||
        normalized.includes("ipad") ||
        normalized.includes("ipod")
      ) {
        return "mac";
      }
      if (normalized.includes("win")) return "win";
      return null;
    };
    try {
      const fromUaData = classifyPlatform(navigator?.userAgentData?.platform);
      const fromPlatform = classifyPlatform(navigator?.platform);
      const fromUserAgent = classifyPlatform(navigator?.userAgent);
      const evidence = [fromUaData, fromPlatform, fromUserAgent].filter(Boolean);
      const hasMac = evidence.includes("mac");
      const hasWin = evidence.includes("win");
      if (hasMac && hasWin) return { platform: null, reliable: false };
      if (hasMac) return { platform: "mac", reliable: true };
      if (hasWin) return { platform: "win", reliable: true };
      return { platform: null, reliable: false };
    } catch {
      return { platform: null, reliable: false };
    }
  }, []);
  const shortcutPlatform = shortcutPlatformInfo.platform;
  const shortcutsAutoShowBoth = !shortcutPlatformInfo.reliable || !shortcutPlatform;
  const shortcutsDisplayBoth = shortcutsAutoShowBoth || shortcutsShowBoth;
  const filteredShortcuts = useMemo(() => {
    if (shortcutsCategoryFilter === "all") return SHORTCUTS_REFERENCE;
    return SHORTCUTS_REFERENCE.filter((item) => getShortcutCategoryId(item) === shortcutsCategoryFilter);
  }, [shortcutsCategoryFilter]);
  const isSpanishUi = settingsLanguagePreview === "es";
  const tr = (en, es) => (isSpanishUi ? `${es || en} (${en})` : en);
  const sloganText = useMemo(() => getSloganText(), []);
  const [sloganOffsetX, setSloganOffsetX] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_SLOGAN_OFFSET_X;
    try {
      const raw = localStorage.getItem(LS_SLOGAN_OFFSET_X_KEY);
      const n = Number(raw);
      if (!Number.isFinite(n)) return DEFAULT_SLOGAN_OFFSET_X;
      return Math.max(-120, Math.min(40, n));
    } catch {
      return DEFAULT_SLOGAN_OFFSET_X;
    }
  });
  const [headerIntroText, setHeaderIntroText] = useState("");
  const [headerIntroVisible, setHeaderIntroVisible] = useState(false);
  const [headerIntroOpacity, setHeaderIntroOpacity] = useState(0);
  const [headerIntroTabsAnchored, setHeaderIntroTabsAnchored] = useState(false);
  const [headerSloganTextOpacity, setHeaderSloganTextOpacity] = useState(() => {
    if (typeof window === "undefined") return 1;
    try {
      return Boolean(sessionStorage.getItem(HEADER_INTRO_SESSION_KEY)) ? 1 : 0;
    } catch {
      return 1;
    }
  });
  const [headerSloganTickVisible, setHeaderSloganTickVisible] = useState(false);
  const [headerSloganTickOpacity, setHeaderSloganTickOpacity] = useState(0);
  const [headerSloganTickMorphActive, setHeaderSloganTickMorphActive] = useState(false);
  const [headerSloganDotVisible, setHeaderSloganDotVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return Boolean(sessionStorage.getItem(HEADER_INTRO_SESSION_KEY));
    } catch {
      return true;
    }
  });
  const [headerSloganReady, setHeaderSloganReady] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return Boolean(sessionStorage.getItem(HEADER_INTRO_SESSION_KEY));
    } catch {
      return true;
    }
  });
  const [headerSloganAtFinalX, setHeaderSloganAtFinalX] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return Boolean(sessionStorage.getItem(HEADER_INTRO_SESSION_KEY));
    } catch {
      return true;
    }
  });
  const [headerSloganFits, setHeaderSloganFits] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 1320;
  });
  const showHeaderSlogan = headerSloganFits;
  const introActionText = /\s+tabs$/i.test(headerIntroText) ? headerIntroText.replace(/\s+tabs$/i, "") : headerIntroText;
  const introIsWriteStep = /^write\b/i.test(headerIntroText);
  const introIsPlayStep = /^play\b/i.test(headerIntroText);
  const tabbyTourSteps = useMemo(
    () => [
      {
        step: 1,
        focusTarget: "song-details",
        highlightTargets: ["song-name", "artist", "album"],
        bubblePlacement: "left-center",
        text: "This is where you add your song details.",
      },
      {
        step: 2,
        focusTarget: "save-projects",
        highlightTargets: ["save", "projects"],
        bubblePlacement: "left-center",
        text: "When you're ready, save here. Saved tabs are stored in Projects.",
      },
      {
        step: 3,
        focusTarget: "instrument",
        highlightTargets: ["instrument"],
        bubblePlacement: "left-center",
        text: "Select the instrument for this tab. TabStudio will automatically adjust the strings and tuning.",
      },
      {
        step: 4,
        focusTarget: "tuning",
        highlightTargets: ["tuning"],
        bubblePlacement: "above-left",
        text: "Choose a tuning here.",
      },
      {
        step: 5,
        focusTarget: "custom-tunings",
        highlightTargets: ["custom-tunings"],
        bubblePlacement: "above-left",
        text: "You can also save your own custom tunings for songs that use something different.",
      },
      {
        step: 6,
        focusTarget: "capo",
        highlightTargets: ["capo"],
        bubblePlacement: "left-center",
        text: "Add a capo here if your song needs one.",
      },
      {
        step: 7,
        focusTarget: "grid-writing",
        highlightTargets: ["grid"],
        bubblePlacement: "left-center",
        text: "Type your tab here by clicking any cell and entering fret numbers.",
      },
      {
        step: 8,
        focusTarget: "insert",
        highlightTargets: ["insert"],
        bubblePlacement: "above-left",
        text: "You can add playing symbols too, like a hammer-on.",
      },
      {
        step: 9,
        focusTarget: "chords",
        highlightTargets: ["chords"],
        bubblePlacement: "above-left",
        text: "Select a chord here and apply it to your tab like this.",
      },
      {
        step: 10,
        focusTarget: "idea-tools",
        highlightTargets: ["idea-tools"],
        bubblePlacement: "left-center",
        text: "Use this to adjust the amount of columns.",
      },
      {
        step: 11,
        focusTarget: "complete-row",
        highlightTargets: ["complete-row"],
        bubblePlacement: "left-center",
        text: "When a row is finished, complete it here so you can keep working on the next one.",
      },
      {
        step: 12,
        focusTarget: "upgrade",
        highlightTargets: ["complete-row"],
        bubblePlacement: "left-center",
        text: "Want to save, export, and unlock the full workflow? Check out the membership options here.",
      },
    ],
    []
  );
  const activeTabbyTourStep = tabbyTourSteps.find((item) => item.step === tourStep) || null;
  const tabbyTourActiveTarget = activeTabbyTourStep?.focusTarget || "";
  const isTabbyTourActive = tourStep > 0 && tourStep <= tabbyTourSteps.length;
  const lockedFeatureTooltipVisible = !!lockedFeatureTooltip;
  const isTabbyHoverTooltipActive =
    isHoveringTabby && tabbyHoverTooltipVisible && !blockTabbyHoverTooltip && !lockedFeatureTooltipVisible;
  const gridTabbyBubblePlacement = "left-center";
  const gridTabbyBubbleLayout = useMemo(() => {
    if (gridTabbyBubblePlacement === "above-left") {
      return {
        tailSide: "bottom-center",
        style: {
          right: "calc(100% - 12px)",
          bottom: "calc(100% + 14px)",
        },
        translateY: "0",
      };
    }
    return {
      tailSide: "right-center",
      style: {
        right: "calc(100% + 16px)",
        top: "50%",
      },
      translateY: "-50%",
    };
  }, [gridTabbyBubblePlacement]);
  const isFinalTabbyTourStep = tourStep >= tabbyTourSteps.length;
  const getTabbyTourTargetElement = useCallback(() => {
    const targetRef =
      tabbyTourActiveTarget === "song-details"
        ? songDetailsSectionRef
        : tabbyTourActiveTarget === "save-projects"
        ? saveProjectsGroupRef
        : tabbyTourActiveTarget === "instrument"
        ? instrumentSectionRef
        : tabbyTourActiveTarget === "tuning"
        ? tuningSectionRef
        : tabbyTourActiveTarget === "custom-tunings"
        ? customTuningAddBtnRef
        : tabbyTourActiveTarget === "capo"
        ? capoSectionRef
        : tabbyTourActiveTarget === "grid-writing"
        ? gridHighlightRef
        : tabbyTourActiveTarget === "insert"
        ? insertSectionRef
        : tabbyTourActiveTarget === "chords"
        ? chordsSectionRef
        : tabbyTourActiveTarget === "idea-tools"
        ? colsControlRef
        : tabbyTourActiveTarget === "complete-row" || tabbyTourActiveTarget === "upgrade"
        ? completeRowBtnRef
        : null;
    return (
      targetRef?.current ||
      (tabbyTourActiveTarget === "song-details"
        ? songMetaSectionRef.current
        : tabbyTourActiveTarget === "custom-tunings"
        ? tuningSectionRef.current
        : null)
    );
  }, [tabbyTourActiveTarget]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_SLOGAN_OFFSET_X_KEY, String(sloganOffsetX));
    } catch {}
  }, [sloganOffsetX]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setHeaderSloganFits(window.innerWidth >= 1320);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let seen = false;
    try {
      seen = Boolean(sessionStorage.getItem(HEADER_INTRO_SESSION_KEY));
    } catch {}
    if (seen) {
      setHeaderSloganReady(true);
      setHeaderSloganAtFinalX(true);
      setHeaderSloganTextOpacity(1);
      setHeaderIntroTabsAnchored(true);
      setHeaderSloganTickVisible(false);
      setHeaderSloganTickOpacity(0);
      setHeaderSloganTickMorphActive(false);
      setHeaderSloganDotVisible(true);
      setHeaderIntroVisible(false);
      setHeaderIntroText("");
      setHeaderIntroOpacity(0);
      return;
    }

    setHeaderSloganReady(false);
    setHeaderSloganAtFinalX(false);
    setHeaderSloganTextOpacity(0);
    setHeaderIntroTabsAnchored(false);
    setHeaderSloganTickMorphActive(false);
    setHeaderSloganDotVisible(false);

    const introWords = ["Write Tabs", "Save Tabs", "Play Tabs"];
    const introStartDelayMs = 520;
    const fadeInMs = 550;
    const visibleMs = 1050;
    const fadeOutMs = 550;
    const totalPerWordMs = fadeInMs + visibleMs + fadeOutMs;

    const timers = [];
    const rafIds = [];

    introWords.forEach((word, index) => {
      const startMs = introStartDelayMs + index * totalPerWordMs;
      timers.push(
        setTimeout(() => {
          setHeaderIntroVisible(true);
          setHeaderIntroText(word);
          const startsPlay = /^play\s+tabs$/i.test(word);
          setHeaderIntroOpacity(startsPlay ? (isDarkMode ? 0.8 : 0.72) : 0);
          const rafId = window.requestAnimationFrame(() => setHeaderIntroOpacity(1));
          rafIds.push(rafId);
        }, startMs)
      );
      timers.push(setTimeout(() => setHeaderIntroOpacity(0), startMs + fadeInMs + visibleMs));
    });
    timers.push(setTimeout(() => setHeaderIntroTabsAnchored(true), introStartDelayMs + fadeInMs));

    const handoffStartMs = introStartDelayMs + introWords.length * totalPerWordMs;
    timers.push(
      setTimeout(() => {
        setHeaderSloganReady(true);
        setHeaderSloganTextOpacity(0);
        setHeaderSloganTickVisible(true);
        setHeaderSloganTickOpacity(1);
        setHeaderSloganTickMorphActive(false);
        setHeaderSloganDotVisible(false);
      }, handoffStartMs)
    );
    const sloganFadeLeadMs = 120;
    const sloganFadeMs = 1100;
    const holdBeforeSlideMs = 3080;
    const slideDurationMs = HEADER_TAGLINE_SLIDE_MS;
    timers.push(setTimeout(() => setHeaderSloganTextOpacity(1), handoffStartMs + sloganFadeLeadMs));
    timers.push(setTimeout(() => setHeaderIntroOpacity(0), handoffStartMs + 20));
    timers.push(
      setTimeout(() => {
        setHeaderIntroVisible(false);
        setHeaderIntroText("");
      }, handoffStartMs + sloganFadeLeadMs + 160)
    );
    const slideStartMs = handoffStartMs + sloganFadeLeadMs + sloganFadeMs + holdBeforeSlideMs;
    timers.push(setTimeout(() => setHeaderSloganAtFinalX(true), slideStartMs));
    const tickFadeStartMs = slideStartMs + slideDurationMs;
    timers.push(
      setTimeout(() => {
        setHeaderSloganTickMorphActive(true);
        setHeaderSloganDotVisible(true);
        setHeaderSloganTickOpacity(0);
      }, tickFadeStartMs)
    );
    timers.push(
      setTimeout(() => {
        setHeaderSloganTickVisible(false);
        setHeaderSloganTickMorphActive(false);
      }, tickFadeStartMs + slideDurationMs + 760)
    );
    timers.push(
      setTimeout(() => {
        try {
          sessionStorage.setItem(HEADER_INTRO_SESSION_KEY, "1");
        } catch {}
      }, handoffStartMs + sloganFadeLeadMs + sloganFadeMs + 120)
    );

    return () => {
      for (const t of timers) clearTimeout(t);
      for (const id of rafIds) window.cancelAnimationFrame(id);
    };
  }, []);

  const isPlaceholderArtistName = useCallback((value) => {
    const label = String(value || "").trim();
    return !label || label.toLowerCase() === "unsorted";
  }, []);
  const isPlaceholderAlbumName = useCallback((value) => {
    const label = String(value || "").trim();
    return !label || label.toLowerCase() === String(NO_ALBUM_NAME || "").toLowerCase();
  }, []);
  const availableArtistNames = useMemo(
    () => Object.keys(libraryData?.artists || {}).filter((name) => !isPlaceholderArtistName(name)),
    [libraryData, isPlaceholderArtistName]
  );
  const effectiveArtistLabel = isPlaceholderArtistName(artist) ? "" : String(artist || "").trim();
  const effectiveAlbumLabel = isPlaceholderAlbumName(albumName) ? "" : String(albumName || "").trim();
  const albumsForCurrentArtist = useMemo(() => {
    if (!effectiveArtistLabel) return [];
    return Object.keys(libraryData?.artists?.[effectiveArtistLabel]?.albums || {})
      .filter((name) => !isPlaceholderAlbumName(name));
  }, [libraryData, effectiveArtistLabel, isPlaceholderAlbumName]);
  const selectedLibraryArtistLabel = isPlaceholderArtistName(selectedLibraryArtistKey) ? "" : String(selectedLibraryArtistKey || "");
  const selectedLibraryAlbums = useMemo(() => {
    const artistNames = Object.keys(libraryData?.artists || {}).filter((name) => !isPlaceholderArtistName(name));
    const out = [];
    for (const artistName of artistNames) {
      const albums = libraryData?.artists?.[artistName]?.albums || {};
      for (const albumName of Object.keys(albums)) {
        if (isPlaceholderAlbumName(albumName)) continue;
        out.push({
          artistName,
          albumName,
          key: `${artistName}__${albumName}`,
        });
      }
    }
    const unsortedAlbums = libraryData?.unsorted?.albums || {};
    for (const albumName of Object.keys(unsortedAlbums)) {
      if (isPlaceholderAlbumName(albumName)) continue;
      out.push({
        artistName: "Unsorted",
        albumName,
        key: `Unsorted__${albumName}`,
      });
    }
    return out;
  }, [libraryData, isPlaceholderArtistName, isPlaceholderAlbumName]);
  const selectedLibrarySongs = useMemo(() => {
    const artistNames = Object.keys(libraryData?.artists || {}).filter((name) => !isPlaceholderArtistName(name));
    const out = [];
    for (const artistName of artistNames) {
      const albums = libraryData?.artists?.[artistName]?.albums || {};
      for (const albumName of Object.keys(albums)) {
        const songs = albums?.[albumName]?.songs || {};
        for (const songName of Object.keys(songs)) {
          out.push({
            artistName,
            albumName,
            songName,
            key: `${artistName}__${albumName}__${songName}`,
          });
        }
      }
    }
    const unsortedAlbums = libraryData?.unsorted?.albums || {};
    for (const albumName of Object.keys(unsortedAlbums)) {
      const songs = unsortedAlbums?.[albumName]?.songs || {};
      for (const songName of Object.keys(songs)) {
        out.push({
          artistName: "Unsorted",
          albumName,
          songName,
          key: `Unsorted__${albumName}__${songName}`,
        });
      }
    }
    return out;
  }, [libraryData, isPlaceholderArtistName]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsFullscreen, setSettingsFullscreen] = useState(() =>
    readLocalStorageBool(LS_SETTINGS_FULLSCREEN_KEY, false)
  );
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const isEditorGridActiveSurface = !projectsLibraryOpen && !exportModalOpen && !settingsOpen && !accountProfileOpen;
  const isVisibleTabbyTourActive = isTabbyTourActive && isEditorGridActiveSurface;
  const activeGridTabbyTooltipMode = !isEditorGridActiveSurface
    ? "none"
    : isVisibleTabbyTourActive
    ? "tour"
    : lockedFeatureTooltipVisible
    ? "locked"
    : isTabbyHoverTooltipActive
    ? "hover"
    : "none";
  const gridTabbyBubbleWidth = isVisibleTabbyTourActive ? "min(336px, calc(100vw - 56px))" : "min(272px, calc(100vw - 56px))";
  const isGridTabbyTooltipVisible = activeGridTabbyTooltipMode !== "none";
  const tabbyTourHighlightClassFor = useCallback(
    (target) =>
      isVisibleTabbyTourActive &&
      Array.isArray(activeTabbyTourStep?.highlightTargets) &&
      activeTabbyTourStep.highlightTargets.includes(target)
        ? "tabby-highlight"
        : "",
    [isVisibleTabbyTourActive, activeTabbyTourStep]
  );
  const [helpMenuHoverPath, setHelpMenuHoverPath] = useState("");
  const settingsBtnRef = useRef(null);
  const helpBtnRef = useRef(null);
  const helpMenuRef = useRef(null);
  const helpMenuHoverOpenTimerRef = useRef(null);
  const helpMenuHoverCloseTimerRef = useRef(null);
  const settingsPanelRef = useRef(null);
  const settingsExpandHandleRef = useRef(null);
  const settingsLanguageBtnRef = useRef(null);
  const settingsLanguageMenuRef = useRef(null);
  const uiDialogInputRef = useRef(null);
  const libraryNewAlbumInputRef = useRef(null);
  const libraryNewSongInputRef = useRef(null);
  const settingsPanelWidth = 304;
  const settingsPanelWidthCss = `min(${settingsPanelWidth}px, calc(100vw - 16px))`;

  const [tabCopyMode, setTabCopyMode] = useState("copy"); // 'move' | 'copy'
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
  const markMeaningfulEditorInteraction = useCallback(() => {
    setHasMeaningfulEditorInteraction((prev) => {
      if (prev) return prev;
      try {
        sessionStorage.setItem(LS_HEADER_TABBY_ENGAGED_SESSION_KEY, "1");
      } catch {}
      return true;
    });
  }, []);

  const hasAnyGridInput = useMemo(
    () =>
      Array.isArray(grid) &&
      grid.some((row) => Array.isArray(row) && row.some((cell) => String(cell || "").trim().length > 0)),
    [grid]
  );

  useEffect(() => {
    if (hasMeaningfulEditorInteraction) return;
    const songTouched = String(songTitle || "").trim().length > 0;
    const artistTouched = String(artist || "").trim().length > 0;
    const albumTouched = String(albumName || "").trim().length > 0;
    const nonDefaultInstrument = instrumentId !== "gtr6";
    const nonDefaultTuning = String(tuningLabel || "").trim().toLowerCase() !== "standard";
    const capoTouched = Boolean(capoEnabled) || String(capoFret || "").trim().length > 0;
    if (songTouched || artistTouched || albumTouched || hasAnyGridInput || nonDefaultInstrument || nonDefaultTuning || capoTouched) {
      markMeaningfulEditorInteraction();
    }
  }, [
    hasMeaningfulEditorInteraction,
    songTitle,
    artist,
    albumName,
    hasAnyGridInput,
    instrumentId,
    tuningLabel,
    capoEnabled,
    capoFret,
    markMeaningfulEditorInteraction,
  ]);

  function showMembershipGateToast(feature = "save") {
    markMeaningfulEditorInteraction();
    const now = Date.now();
    if (now - membershipGateLastShownAtRef.current < 1400) return;
    membershipGateLastShownAtRef.current = now;
    let next = null;
    if (feature === "save") {
      next = {
        message: "Become a member to save your tabs and come back anytime.",
        cta: "Become a Member",
      };
    } else if (feature === "projects") {
      next = {
        message: "Become a member to keep your tabs organised in Projects.",
        cta: "Become a Member",
      };
    } else if (feature === "complete-row") {
      next = {
        message: "Become a member to unlock full editing tools like Complete Row.",
        cta: "Become a Member",
      };
    } else if (feature === "export-pdf") {
      next = {
        message: "Become a member to export clean PDF or PNG tabs.",
        cta: "Become a Member",
      };
    } else if (feature === "solo-export") {
      next = {
        message: "You're currently on Solo. Upgrade to Band or Creator to unlock exports.",
        cta: "View Plans",
      };
    } else if (feature === "creator-export") {
      next = {
        message: "You're on Band. Upgrade to Creator to unlock PNG exports and creator-ready graphics.",
        cta: "View Plans",
      };
    } else if (feature === "export-image" || feature === "tap-sync") {
      next = {
        message: "Become a member to export clean PDF or PNG tabs.",
        cta: "Become a Member",
      };
    } else if (feature === "save-limit") {
      setSaveSoonNotice(
        userPlanType === "solo"
          ? "Solo plans can save up to 50 tabs. Upgrade to Band or Creator for more space."
          : "Band plans can save up to 250 tabs. Upgrade to Creator for unlimited tabs."
      );
      return;
    }

    const shouldShowLockedTabbyPrompt = Boolean(next && (showGridTabbyOnboarding || next.cta === "View Plans"));
    if (shouldShowLockedTabbyPrompt) {
      setGridTabbyHidden(false);
      setGridTabbyHiding(false);
      try {
        localStorage.removeItem(LS_TABBY_HIDDEN_KEY);
      } catch {}
      setBlockTabbyHoverTooltip(true);
      setTabbyHoverTooltipVisible(false);
      setIsHoveringTabby(false);
      setLockedFeatureTooltip(next);
      if (gridTabbyUpgradePromptTimerRef.current) window.clearTimeout(gridTabbyUpgradePromptTimerRef.current);
      gridTabbyUpgradePromptTimerRef.current = window.setTimeout(() => {
        setBlockTabbyHoverTooltip(true);
        setTabbyHoverTooltipVisible(false);
        setIsHoveringTabby(false);
        setLockedFeatureTooltip(null);
      }, 5200);
      setSaveSoonNotice("");
    }
  }

  const finishTabbyTour = useCallback(() => {
    setTourStep(0);
    try {
      localStorage.setItem(LS_TABBY_TOUR_COMPLETE_KEY, "true");
    } catch {}
  }, []);
  const closeTabbyTourToIdle = useCallback(() => {
    finishTabbyTour();
    setIsHoveringTabby(false);
    setTabbyHoverTooltipVisible(false);
  }, [finishTabbyTour]);
  const goToMembershipFromFinalTourStep = useCallback(() => {
    finishTabbyTour();
    navigateTo("/membership");
  }, [finishTabbyTour, navigateTo]);

  const openGridTabbyWalkthrough = useCallback(() => {
    setLockedFeatureTooltip(null);
    setIsHoveringTabby(false);
    setTabbyHoverTooltipVisible(false);
    setTourStep(1);
  }, []);

  const hideGridTabbyAssistant = useCallback(() => {
    if (gridTabbyHidden || gridTabbyHiding) return;
    setGridTabbyHiding(true);
    setIsHoveringTabby(false);
    setTabbyHoverTooltipVisible(false);
    setLockedFeatureTooltip(null);
    setBlockTabbyHoverTooltip(false);
    setTourStep(0);
    window.setTimeout(() => {
      setGridTabbyHidden(true);
      setGridTabbyHiding(false);
      try {
        localStorage.setItem(LS_TABBY_HIDDEN_KEY, "true");
      } catch {}
    }, 180);
  }, [gridTabbyHidden, gridTabbyHiding]);
  const setTabbyAssistantVisible = useCallback((visible) => {
    if (visible) {
      setGridTabbyHidden(false);
      setGridTabbyHiding(false);
      try {
        localStorage.removeItem(LS_TABBY_HIDDEN_KEY);
      } catch {}
      return;
    }
    setIsHoveringTabby(false);
    setTabbyHoverTooltipVisible(false);
    setLockedFeatureTooltip(null);
    setBlockTabbyHoverTooltip(false);
    setTourStep(0);
    setGridTabbyHiding(false);
    setGridTabbyHidden(true);
    try {
      localStorage.setItem(LS_TABBY_HIDDEN_KEY, "true");
    } catch {}
  }, []);
  const handleLockedTooltipMembershipClick = useCallback(() => {
    setIsHoveringTabby(false);
    setBlockTabbyHoverTooltip(true);
    setLockedFeatureTooltip(null);
    setTabbyHoverTooltipVisible(false);
    navigateTo("/membership");
  }, [navigateTo]);

  const goToNextTabbyTourStep = useCallback(() => {
    setTourStep((prev) => {
      if (prev >= tabbyTourSteps.length) return prev;
      const next = prev + 1;
      if (next > tabbyTourSteps.length) return prev;
      return next;
    });
  }, [tabbyTourSteps.length]);

  const goToPrevTabbyTourStep = useCallback(() => {
    setTourStep((prev) => Math.max(1, prev - 1));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !showGridTabbyOnboarding) return;
    if (gridTabbyHidden) return;
    try {
      if (window.localStorage.getItem(LS_TABBY_INTRO_SEEN_KEY) === "true") return;
      window.localStorage.setItem(LS_TABBY_INTRO_SEEN_KEY, "true");
    } catch {}
  }, [showGridTabbyOnboarding, gridTabbyHidden]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const syncHiddenState = () => {
      try {
        const hidden = window.localStorage.getItem(LS_TABBY_HIDDEN_KEY) === "true";
        setGridTabbyHidden(hidden);
        if (!hidden) setGridTabbyHiding(false);
      } catch {}
    };
    const onStorage = (e) => {
      if (!e?.key || e.key === LS_TABBY_HIDDEN_KEY) syncHiddenState();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", syncHiddenState);
    document.addEventListener("visibilitychange", syncHiddenState);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", syncHiddenState);
      document.removeEventListener("visibilitychange", syncHiddenState);
    };
  }, []);

  useEffect(() => {
    if (!isTabbyTourActive) return;
    const el = getTabbyTourTargetElement();
    if (!el?.scrollIntoView) return;
    try {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    } catch {}
  }, [isTabbyTourActive, getTabbyTourTargetElement]);

  useEffect(() => {
    if (!isTabbyTourActive || typeof window === "undefined") {
      setTabbyTourSpotlightRect(null);
      return;
    }
    const spotlightPad = 8;
    const updateSpotlightRect = () => {
      const el = getTabbyTourTargetElement();
      if (!el?.getBoundingClientRect) {
        setTabbyTourSpotlightRect(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const left = Math.max(0, rect.left - spotlightPad);
      const top = Math.max(0, rect.top - spotlightPad);
      const right = Math.min(vw, rect.right + spotlightPad);
      const bottom = Math.min(vh, rect.bottom + spotlightPad);
      setTabbyTourSpotlightRect({
        left,
        top,
        width: Math.max(0, right - left),
        height: Math.max(0, bottom - top),
      });
    };
    const rafId = window.requestAnimationFrame(updateSpotlightRect);
    window.addEventListener("resize", updateSpotlightRect);
    window.addEventListener("scroll", updateSpotlightRect, true);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateSpotlightRect);
      window.removeEventListener("scroll", updateSpotlightRect, true);
    };
  }, [isTabbyTourActive, getTabbyTourTargetElement, tourStep, instrumentOpen, tuningOpen, chordsOpen, insertOpen]);

  useEffect(() => {
    if (!isTabbyTourActive) return;
    const showInstrumentPanel = tabbyTourActiveTarget === "instrument";
    const showTuningPanel = tabbyTourActiveTarget === "tuning" || tabbyTourActiveTarget === "custom-tunings";
    const showInsertPanel = tabbyTourActiveTarget === "insert";
    const showChordsPanel = tabbyTourActiveTarget === "chords" && chordToolEnabled;

    setInstrumentOpen(showInstrumentPanel);
    setTuningOpen(showTuningPanel);
    setInsertOpen(showInsertPanel);
    if (chordToolEnabled) setChordsOpen(showChordsPanel);
  }, [
    isTabbyTourActive,
    tabbyTourActiveTarget,
    setInstrumentOpen,
    setTuningOpen,
    setInsertOpen,
    setChordsOpen,
    chordToolEnabled,
  ]);

  useEffect(() => {
    if (isTabbyTourActive) return;
    // Close any tour-opened panels when the tour exits.
    setInstrumentOpen(false);
    setTuningOpen(false);
    setInsertOpen(false);
    if (chordToolEnabled) setChordsOpen(false);
  }, [isTabbyTourActive, setInstrumentOpen, setTuningOpen, setInsertOpen, setChordsOpen, chordToolEnabled]);

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
      if (gridTabbyUpgradePromptTimerRef.current) clearTimeout(gridTabbyUpgradePromptTimerRef.current);
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
      localStorage.setItem(LS_SETTINGS_FULLSCREEN_KEY, settingsFullscreen ? "true" : "false");
    } catch {}
  }, [settingsFullscreen]);

  useEffect(() => {
    if (!settingsOpen) return;
    const onDown = (e) => {
      if (eventPathIncludes(e, settingsBtnRef.current)) return;
      if (eventPathIncludes(e, settingsPanelRef.current)) return;
      if (eventPathIncludes(e, settingsExpandHandleRef.current)) return;
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
    if (!helpMenuOpen) return;
    const onDown = (e) => {
      if (eventPathIncludes(e, helpBtnRef.current)) return;
      if (eventPathIncludes(e, helpMenuRef.current)) return;
      setHelpMenuOpen(false);
      setHelpMenuHoverPath("");
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [helpMenuOpen]);

  useEffect(
    () => () => {
      if (helpMenuHoverOpenTimerRef.current) {
        window.clearTimeout(helpMenuHoverOpenTimerRef.current);
        helpMenuHoverOpenTimerRef.current = null;
      }
      if (helpMenuHoverCloseTimerRef.current) {
        window.clearTimeout(helpMenuHoverCloseTimerRef.current);
        helpMenuHoverCloseTimerRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    if (!settingsOpen) setSettingsLanguageOpen(false);
  }, [settingsOpen]);

  useEffect(() => {
    if (!artistCreateOpen) return;
    requestAnimationFrame(() => {
      try {
        newArtistInputRef.current?.focus?.();
      } catch {}
    });
  }, [artistCreateOpen]);

  useEffect(() => {
    if (!albumCreateOpen) return;
    requestAnimationFrame(() => {
      try {
        newAlbumInputRef.current?.focus?.();
      } catch {}
    });
  }, [albumCreateOpen]);

  useEffect(() => {
    if (uiDialog?.type !== "prompt") return;
    requestAnimationFrame(() => {
      try {
        uiDialogInputRef.current?.focus?.();
        uiDialogInputRef.current?.select?.();
      } catch {}
    });
  }, [uiDialog?.type]);

  useEffect(() => {
    if (!libraryAlbumCreateOpen) return;
    requestAnimationFrame(() => {
      try {
        libraryNewAlbumInputRef.current?.focus?.();
      } catch {}
    });
  }, [libraryAlbumCreateOpen]);

  useEffect(() => {
    if (!librarySongCreateOpen) return;
    requestAnimationFrame(() => {
      try {
        libraryNewSongInputRef.current?.focus?.();
      } catch {}
    });
  }, [librarySongCreateOpen]);

  useEffect(() => {
    if (!artistCreateOpen) return;
    const onDown = (e) => {
      if (eventPathIncludes(e, newArtistInputRef.current)) return;
      if (String(newArtistDraft || "").trim()) return;
      setArtistCreateOpen(false);
      setNewArtistDraft("");
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [artistCreateOpen, newArtistDraft]);

  useEffect(() => {
    if (!artistMenuOpen) return;
    const onDown = (e) => {
      if (eventPathIncludes(e, artistSelectRef.current)) return;
      if (eventPathIncludes(e, artistMenuRef.current)) return;
      setArtistMenuOpen(false);
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [artistMenuOpen]);

  useEffect(() => {
    if (!albumCreateOpen) return;
    const onDown = (e) => {
      if (eventPathIncludes(e, newAlbumInputRef.current)) return;
      if (String(newAlbumDraft || "").trim()) return;
      setAlbumCreateOpen(false);
      setNewAlbumDraft("");
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [albumCreateOpen, newAlbumDraft]);

  useEffect(() => {
    if (!albumMenuOpen) return;
    const onDown = (e) => {
      if (eventPathIncludes(e, albumSelectRef.current)) return;
      if (eventPathIncludes(e, albumMenuRef.current)) return;
      setAlbumMenuOpen(false);
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [albumMenuOpen]);

  useEffect(() => {
    if (projectsLibraryOpen) return;
    setLibraryAlbumCreateOpen(false);
    setLibraryNewAlbumDraft("");
    setLibrarySongCreateOpen(false);
    setLibraryNewSongDraft("");
  }, [projectsLibraryOpen]);

  useEffect(() => {
    setLibrarySongCreateOpen(false);
    setLibraryNewSongDraft("");
  }, [selectedLibraryAlbumName]);

  useEffect(() => {
    if (!artistCreateOpen) return;
    setAlbumCreateOpen(false);
  }, [artistCreateOpen]);

  useEffect(() => {
    if (!albumCreateOpen) return;
    setArtistCreateOpen(false);
  }, [albumCreateOpen]);

  useEffect(() => {
    if (!artistCreateOpen) return;
    setArtistMenuOpen(false);
  }, [artistCreateOpen]);

  useEffect(() => {
    if (!albumCreateOpen) return;
    setAlbumMenuOpen(false);
  }, [albumCreateOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_UI_LANG_KEY, "en");
    } catch {}
  }, []);

    const [pdfShowSong, setPdfShowSong] = useState(true);
  const [pdfShowArtist, setPdfShowArtist] = useState(true);
  const [pdfShowAlbum, setPdfShowAlbum] = useState(true);
  const [pdfShowInstrument, setPdfShowInstrument] = useState(true);
  const [pdfShowTuning, setPdfShowTuning] = useState(true);
  const [pdfShowCapo, setPdfShowCapo] = useState(true);
  const [pdfShowTempo, setPdfShowTempo] = useState(true);
  const [pdfShowHeaderBranding, setPdfShowHeaderBranding] = useState(false);
  const [pdfRowGrouping, setPdfRowGrouping] = useState("fill");
  const [exportFormat, setExportFormat] = useState("pdf");
  const [imageExportRowIds, setImageExportRowIds] = useState([]);
  const [imageMultiExportMode, setImageMultiExportMode] = useState("individual");
  const [imageExportBusy, setImageExportBusy] = useState(false);
  const [imageExportProgress, setImageExportProgress] = useState("");
  const [videoExportBusy, setVideoExportBusy] = useState(false);
  const [videoExportProgress, setVideoExportProgress] = useState("");
  const [videoPlaybackSpeed, setVideoPlaybackSpeed] = useState(1);
  const [videoBgMode, setVideoBgMode] = useState("transparent");
  const [videoBgColor, setVideoBgColor] = useState("#000000");
  const [videoAnimationStyle, setVideoAnimationStyle] = useState("both"); // row | note | both
  const [videoBrandingMode, setVideoBrandingMode] = useState("clean"); // clean | tabstudio | affiliate
  const [videoAudioUrl, setVideoAudioUrl] = useState("");
  const [videoAudioName, setVideoAudioName] = useState("");
  const [videoAudioPlaybackRate, setVideoAudioPlaybackRate] = useState(1);
  const [videoSyncTimings, setVideoSyncTimings] = useState(() => ({})); // { "rowId:r:c": ms }
  const [videoSyncCursorIndex, setVideoSyncCursorIndex] = useState(0);
  const [videoSyncStartedAtMs, setVideoSyncStartedAtMs] = useState(0);
  const [videoSyncRecording, setVideoSyncRecording] = useState(false);
  const videoAudioRef = useRef(null);
  const exportPlanType = normalizePlanId(userState?.planType || userState?.planTier);
  const exportBrandingLocked = exportPlanType === "band";
  const [imageBgMode, setImageBgMode] = useState(() => {
    try {
      const raw = String(localStorage.getItem(LS_EXPORT_BG_MODE_KEY) ?? "").trim().toLowerCase();
      return raw === "solid" ? "solid" : "transparent";
    } catch {
      return "transparent";
    }
  });
  const [imageExportSize, setImageExportSize] = useState(() => {
    try {
      return normalizePngExportSize(localStorage.getItem(LS_EXPORT_IMAGE_SIZE_KEY));
    } catch {
      return "original";
    }
  });
  const [imageExportPadding, setImageExportPadding] = useState(() => {
    try {
      return normalizePngExportPadding(localStorage.getItem(LS_EXPORT_IMAGE_PADDING_KEY));
    } catch {
      return "normal";
    }
  });
  const [imageBgColor, setImageBgColor] = useState(() => {
    try {
      return normalizeHexColorOrFallback(localStorage.getItem(LS_EXPORT_BG_COLOR_KEY), "#000000");
    } catch {
      return "#000000";
    }
  });
  const [imageTextColor, setImageTextColor] = useState(() => {
    try {
      return normalizeHexColorOrFallback(localStorage.getItem(LS_EXPORT_TEXT_COLOR_KEY), "#ffffff");
    } catch {
      return "#ffffff";
    }
  });
  const [imageThickness, setImageThickness] = useState(() => {
    try {
      const raw = String(localStorage.getItem(LS_EXPORT_THICKNESS_KEY) ?? "").trim().toUpperCase();
      return raw === "A" || raw === "B" || raw === "C" ? raw : "B";
    } catch {
      return "B";
    }
  });
  const [imageTextOutline, setImageTextOutline] = useState(() => {
    try {
      const raw = String(localStorage.getItem(LS_EXPORT_TEXT_OUTLINE_KEY) ?? "").trim().toLowerCase();
      if (raw === "subtle" || raw === "strong") return raw;
      return "off";
    } catch {
      return "off";
    }
  });
  const [imageShowRowNames, setImageShowRowNames] = useState(() => {
    try {
      const raw = String(localStorage.getItem(LS_EXPORT_SHOW_ROW_NAMES_KEY) ?? "").trim().toLowerCase();
      if (raw === "false" || raw === "0" || raw === "no") return false;
      return true;
    } catch {
      return true;
    }
  });
  const [imageShowArtist, setImageShowArtist] = useState(() => {
    try {
      return String(localStorage.getItem(LS_EXPORT_SHOW_ARTIST_KEY) ?? "").trim().toLowerCase() === "true";
    } catch {
      return false;
    }
  });
  const [imageShowAlbum, setImageShowAlbum] = useState(() => {
    try {
      return String(localStorage.getItem(LS_EXPORT_SHOW_ALBUM_KEY) ?? "").trim().toLowerCase() === "true";
    } catch {
      return false;
    }
  });
  const [imageShowSong, setImageShowSong] = useState(() => {
    try {
      return String(localStorage.getItem(LS_EXPORT_SHOW_SONG_KEY) ?? "").trim().toLowerCase() === "true";
    } catch {
      return false;
    }
  });
  const [imageShowInstrument, setImageShowInstrument] = useState(() => {
    try {
      return String(localStorage.getItem(LS_EXPORT_SHOW_INSTRUMENT_KEY) ?? "").trim().toLowerCase() === "true";
    } catch {
      return false;
    }
  });
  const [imageShowTuning, setImageShowTuning] = useState(() => {
    try {
      return String(localStorage.getItem(LS_EXPORT_SHOW_TUNING_KEY) ?? "").trim().toLowerCase() === "true";
    } catch {
      return false;
    }
  });
  const [imageShowCapo, setImageShowCapo] = useState(() => {
    try {
      return String(localStorage.getItem(LS_EXPORT_SHOW_CAPO_KEY) ?? "").trim().toLowerCase() === "true";
    } catch {
      return false;
    }
  });
  const [imageShowTempo, setImageShowTempo] = useState(() => {
    try {
      return String(localStorage.getItem(LS_EXPORT_SHOW_TEMPO_KEY) ?? "").trim().toLowerCase() === "true";
    } catch {
      return false;
    }
  });
  const [imageShowBranding, setImageShowBranding] = useState(() => {
    try {
      const profilePref = userState?.profile?.exportBrandingPrefs?.includeTabStudioLink;
      if (typeof profilePref === "boolean") return profilePref;
      const raw = String(localStorage.getItem(LS_EXPORT_SHOW_IMAGE_BRANDING_KEY) ?? "").trim().toLowerCase();
      if (raw === "false" || raw === "0" || raw === "no") return false;
      return true;
    } catch {
      return true;
    }
  });
  const [exportUseAffiliateBranding, setExportUseAffiliateBranding] = useState(() =>
    Boolean(userState?.profile?.exportBrandingPrefs?.useAffiliateLink)
  );
  const effectiveImageShowBranding = exportBrandingLocked ? true : imageShowBranding;
  const exportAffiliateLinkText = useMemo(() => getAffiliateExportLink(userState?.profile), [userState?.profile]);
  const exportBrandingText = useMemo(
    () =>
      getResolvedExportBrandingText({
        includeBranding: effectiveImageShowBranding,
        useAffiliateLink: exportUseAffiliateBranding,
        profile: userState?.profile,
      }),
    [effectiveImageShowBranding, exportUseAffiliateBranding, userState?.profile]
  );

  useEffect(() => {
    if (!exportBrandingLocked) return;
    setImageShowBranding(true);
  }, [exportBrandingLocked]);

  useEffect(() => {
    if (exportAffiliateLinkText) return;
    setExportUseAffiliateBranding(false);
  }, [exportAffiliateLinkText]);

  useEffect(() => {
    const profilePrefs = userState?.profile?.exportBrandingPrefs;
    if (!profilePrefs || typeof profilePrefs !== "object") return;
    const nextInclude = exportBrandingLocked ? true : profilePrefs.includeTabStudioLink !== false;
    const nextAffiliate = Boolean(profilePrefs.useAffiliateLink);
    setImageShowBranding((current) => (current === nextInclude ? current : nextInclude));
    setExportUseAffiliateBranding((current) => (current === nextAffiliate ? current : nextAffiliate));
  }, [exportBrandingLocked, userState?.profile?.exportBrandingPrefs]);

  useEffect(() => {
    if (projectsLibraryOpen || exportModalOpen || !settingsOpen) setHelpMenuOpen(false);
  }, [projectsLibraryOpen, exportModalOpen, settingsOpen]);

  useEffect(() => {
    if (!settingsOpen) return;
    const onSettingsArrowNav = (e) => {
      if (e.defaultPrevented) return;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const activeEl = document.activeElement;
      const target = e.target;
      const isTextEntry = isTextEntryElement(target) || isTextEntryElement(activeEl);
      if (isTextEntry) return;

      const inGridScope = !!(activeEl && (activeEl === keyCaptureRef.current || tabWriterAreaRef.current?.contains(activeEl)));
      if (inGridScope) return;

      const hasOpenBlockingMenu =
        Boolean(uiDialog) ||
        helpMenuOpen ||
        settingsLanguageOpen ||
        artistMenuOpen ||
        albumMenuOpen ||
        instrumentOpen ||
        tuningOpen ||
        capoOpen ||
        chordsOpen ||
        insertOpen ||
        customOpen ||
        editChordModalOpen ||
        exportModalOpen ||
        projectsLibraryOpen ||
        accountProfileOpen;
      if (hasOpenBlockingMenu) return;

      if (e.key === "ArrowRight") {
        if (settingsFullscreen) return;
        e.preventDefault();
        e.stopPropagation();
        setSettingsFullscreen(true);
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        if (settingsFullscreen) {
          setSettingsFullscreen(false);
        } else {
          setSettingsOpen(false);
          setSettingsFullscreen(false);
        }
      }
    };
    window.addEventListener("keydown", onSettingsArrowNav, true);
    return () => window.removeEventListener("keydown", onSettingsArrowNav, true);
  }, [
    settingsOpen,
    settingsFullscreen,
    uiDialog,
    helpMenuOpen,
    settingsLanguageOpen,
    artistMenuOpen,
    albumMenuOpen,
    instrumentOpen,
    tuningOpen,
    capoOpen,
    chordsOpen,
    insertOpen,
    customOpen,
    editChordModalOpen,
    exportModalOpen,
    projectsLibraryOpen,
    accountProfileOpen,
    isTextEntryElement,
  ]);

  const [pdfSettingsOpenSection, setPdfSettingsOpenSection] = useState("song");
  const [pdfPreviewScale, setPdfPreviewScale] = useState(0.58);
  const [exportPdfHover, setExportPdfHover] = useState(false);
  const [imageSettingsOpenSection, setImageSettingsOpenSection] = useState("rows");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imagePreviewDims, setImagePreviewDims] = useState({ width: 0, height: 0 });
  const [imagePreviewBusy, setImagePreviewBusy] = useState(false);
  const [imagePreviewMetaText, setImagePreviewMetaText] = useState("");
  const imagePreviewUrlRef = useRef("");
  const anyExportBusy = imageExportBusy || videoExportBusy;
  const exportUndoStackRef = useRef([]);
  const exportRedoStackRef = useRef([]);
  const exportHistorySuspendedRef = useRef(false);
  const exportHistoryLastSnapshotRef = useRef(null);

  const snapshotExportState = useCallback(
    () => ({
      exportFormat,
      pdfShowSong,
      pdfShowArtist,
      pdfShowAlbum,
      pdfShowInstrument,
      pdfShowTuning,
      pdfShowCapo,
      pdfShowTempo,
      pdfShowHeaderBranding,
      pdfRowGrouping,
      pdfSettingsOpenSection,
      imageSettingsOpenSection,
      imageExportRowIds: [...imageExportRowIds],
      imageMultiExportMode,
      imageExportSize,
      imageExportPadding,
      imageBgMode,
      imageBgColor,
      imageTextColor,
      imageThickness,
      imageTextOutline,
      imageShowRowNames,
      imageShowArtist,
      imageShowAlbum,
      imageShowSong,
      imageShowInstrument,
      imageShowTuning,
      imageShowCapo,
      imageShowTempo,
      imageShowBranding,
      exportUseAffiliateBranding,
      videoPlaybackSpeed,
      videoBgMode,
      videoBgColor,
      videoAnimationStyle,
      videoBrandingMode,
    }),
    [
      exportFormat,
      pdfShowSong,
      pdfShowArtist,
      pdfShowAlbum,
      pdfShowInstrument,
      pdfShowTuning,
      pdfShowCapo,
      pdfShowTempo,
      pdfShowHeaderBranding,
      pdfRowGrouping,
      pdfSettingsOpenSection,
      imageSettingsOpenSection,
      imageExportRowIds,
      imageMultiExportMode,
      imageExportSize,
      imageExportPadding,
      imageBgMode,
      imageBgColor,
      imageTextColor,
      imageThickness,
      imageTextOutline,
      imageShowRowNames,
      imageShowArtist,
      imageShowAlbum,
      imageShowSong,
      imageShowInstrument,
      imageShowTuning,
      imageShowCapo,
      imageShowTempo,
      imageShowBranding,
      exportUseAffiliateBranding,
      videoPlaybackSpeed,
      videoBgMode,
      videoBgColor,
      videoAnimationStyle,
      videoBrandingMode,
    ]
  );

  const applyExportStateSnapshot = useCallback((snapshot) => {
    if (!snapshot) return;
    exportHistorySuspendedRef.current = true;
    const snapshotFormat = String(snapshot.exportFormat || "pdf").toLowerCase();
    setExportFormat(snapshotFormat === "image" || snapshotFormat === "video" ? snapshotFormat : "pdf");
    setPdfShowSong(Boolean(snapshot.pdfShowSong));
    setPdfShowArtist(Boolean(snapshot.pdfShowArtist));
    setPdfShowAlbum(Boolean(snapshot.pdfShowAlbum));
    setPdfShowInstrument(Boolean(snapshot.pdfShowInstrument));
    setPdfShowTuning(Boolean(snapshot.pdfShowTuning));
    setPdfShowCapo(Boolean(snapshot.pdfShowCapo));
    setPdfShowTempo(Boolean(snapshot.pdfShowTempo));
    setPdfShowHeaderBranding(Boolean(snapshot.pdfShowHeaderBranding));
    setPdfRowGrouping(snapshot.pdfRowGrouping === "grouped" ? "grouped" : "fill");
    setPdfSettingsOpenSection(String(snapshot.pdfSettingsOpenSection || ""));
    setImageSettingsOpenSection(String(snapshot.imageSettingsOpenSection || ""));
    setImageExportRowIds(Array.isArray(snapshot.imageExportRowIds) ? snapshot.imageExportRowIds : []);
    setImageMultiExportMode(snapshot.imageMultiExportMode === "combined" ? "combined" : "individual");
    setImageExportSize(normalizePngExportSize(snapshot.imageExportSize));
    setImageExportPadding(normalizePngExportPadding(snapshot.imageExportPadding));
    setImageBgMode(snapshot.imageBgMode === "solid" ? "solid" : "transparent");
    setImageBgColor(normalizeHexColorOrFallback(snapshot.imageBgColor, "#000000"));
    setImageTextColor(normalizeHexColorOrFallback(snapshot.imageTextColor, "#ffffff"));
    setImageThickness(["A", "B", "C"].includes(String(snapshot.imageThickness || "").toUpperCase()) ? String(snapshot.imageThickness || "").toUpperCase() : "B");
    setImageTextOutline(["off", "subtle", "strong"].includes(String(snapshot.imageTextOutline || "").toLowerCase()) ? String(snapshot.imageTextOutline || "").toLowerCase() : "off");
    setImageShowRowNames(Boolean(snapshot.imageShowRowNames));
    setImageShowArtist(Boolean(snapshot.imageShowArtist));
    setImageShowAlbum(Boolean(snapshot.imageShowAlbum));
    setImageShowSong(Boolean(snapshot.imageShowSong));
    setImageShowInstrument(Boolean(snapshot.imageShowInstrument));
    setImageShowTuning(Boolean(snapshot.imageShowTuning));
    setImageShowCapo(Boolean(snapshot.imageShowCapo));
    setImageShowTempo(Boolean(snapshot.imageShowTempo));
    setImageShowBranding(
      exportBrandingLocked ? true : snapshot.imageShowBranding === undefined ? true : Boolean(snapshot.imageShowBranding)
    );
    setExportUseAffiliateBranding(Boolean(snapshot.exportUseAffiliateBranding));
    const videoSpeed = Number(snapshot.videoPlaybackSpeed);
    setVideoPlaybackSpeed(videoSpeed === 0.75 || videoSpeed === 0.6 ? videoSpeed : 1);
    setVideoBgMode(snapshot.videoBgMode === "solid" ? "solid" : "transparent");
    setVideoBgColor(normalizeHexColorOrFallback(snapshot.videoBgColor, "#000000"));
    setVideoAnimationStyle(
      snapshot.videoAnimationStyle === "row" || snapshot.videoAnimationStyle === "note" ? snapshot.videoAnimationStyle : "both"
    );
    setVideoBrandingMode(
      snapshot.videoBrandingMode === "tabstudio" || snapshot.videoBrandingMode === "affiliate"
        ? snapshot.videoBrandingMode
        : "clean"
    );
    exportHistoryLastSnapshotRef.current = cloneJson(snapshot, null);
    requestAnimationFrame(() => {
      exportHistorySuspendedRef.current = false;
    });
  }, [exportBrandingLocked]);

  const exportUndo = useCallback(() => {
    const stack = exportUndoStackRef.current;
    if (!stack.length) return;
    const prev = stack.pop();
    exportRedoStackRef.current.push(snapshotExportState());
    applyExportStateSnapshot(prev);
  }, [applyExportStateSnapshot, snapshotExportState]);

  const exportRedo = useCallback(() => {
    const stack = exportRedoStackRef.current;
    if (!stack.length) return;
    const next = stack.pop();
    exportUndoStackRef.current.push(snapshotExportState());
    applyExportStateSnapshot(next);
  }, [applyExportStateSnapshot, snapshotExportState]);

  // Global ESC key handler to close overlays/menus in a top-down order.
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key !== "Escape") return;

      const active = document.activeElement;
      if (
        active &&
        (active === songTitleInputRef.current ||
          active === artistSelectRef.current ||
          active === albumSelectRef.current ||
          active === newArtistInputRef.current ||
          active === newAlbumInputRef.current)
      ) {
        e.preventDefault();
        e.stopPropagation();
        try {
          active.blur?.();
        } catch {}
        focusKeyCapture();
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (uiDialog) {
        closeUiDialog();
        return;
      }
      if (isVisibleTabbyTourActive) {
        closeTabbyTourToIdle();
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

      if (rowDeleteConfirmIds) {
        setRowDeleteConfirmIds(null);
        setRowDeleteConfirmSource("");
        return;
      }

      if (songDeleteConfirmTarget) {
        setSongDeleteConfirmTarget(null);
        return;
      }

      if (libraryDeleteConfirmTarget) {
        setLibraryDeleteConfirmTarget(null);
        return;
      }

      if (chordDeleteConfirmId) {
        setChordDeleteConfirmId("");
        return;
      }

      // Always close the freshest overlay first: settings before page-level views.
      if (settingsOpen) {
        setSettingsOpen(false);
        setSettingsFullscreen(false);
        return;
      }

      if (accountProfileOpen) {
        setAccountProfileOpen(false);
        return;
      }
      if (exportModalOpen) {
        setExportModalOpen(false);
        setImageExportProgress("");
        return;
      }
      if (projectsLibraryOpen) {
        setProjectsLibraryOpen(false);
        return;
      }

      // Then close one open panel at a time.
      if (insertOpen) return void setInsertOpen(false);
      if (chordsOpen) return void setChordsOpen(false);
      if (capoOpen) return void setCapoOpen(false);
      if (tuningOpen) return void setTuningOpen(false);
      if (instrumentOpen) return void setInstrumentOpen(false);
      if (artistMenuOpen) return void setArtistMenuOpen(false);
      if (albumMenuOpen) return void setAlbumMenuOpen(false);
    };

    window.addEventListener("keydown", handleEsc, true);
    return () => window.removeEventListener("keydown", handleEsc, true);
  }, [
    uiDialog,
    editChordModalOpen,
    customOpen,
    rowDeleteConfirmIds,
    songDeleteConfirmTarget,
    libraryDeleteConfirmTarget,
    chordDeleteConfirmId,
    accountProfileOpen,
    exportModalOpen,
    projectsLibraryOpen,
    insertOpen,
    chordsOpen,
    capoOpen,
    tuningOpen,
    instrumentOpen,
    artistMenuOpen,
    albumMenuOpen,
    settingsOpen,
    isVisibleTabbyTourActive,
    closeTabbyTourToIdle,
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
        if (exportModalOpen) {
          if (e.shiftKey) exportRedo();
          else exportUndo();
        } else {
          if (e.shiftKey) redo();
          else undo();
        }
        return;
      }
      if (!e.metaKey && e.ctrlKey && lower === "y") {
        consume();
        if (exportModalOpen) exportRedo();
        else redo();
        return;
      }
      if (lower === "s") {
        if (exportModalOpen || projectsLibraryOpen) return;
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
        openExportModal();
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
        setTabWritingOpen(false);
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
        artistSelectRef.current?.focus?.();
        return;
      }
      if (key === "Backspace" || key === "Delete") {
        consume();
        clearCurrentRowWithConfirm();
        return;
      }

      if (lower === "k") {
        consume();
        if (chordToolEnabled) {
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
        if (!showCapoControl) return;
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
    chordToolEnabled,
    isTextEntryElement,
    redo,
    undo,
    handleSaveTabClick,
    handleOpenTabClick,
    openExportModal,
    moveSelectedCompletedRows,
    duplicateSelectedRows,
    deleteSelectedRows,
    clearCurrentRowWithConfirm,
    showCapoControl,
  ]);

  const [compactGrid] = useState(false);
  const [strongCursor] = useState(true);

  const selectedExportRows = useMemo(() => {
    const picked = new Set(imageExportRowIds);
    return completedRows.filter((row) => picked.has(row.id));
  }, [completedRows, imageExportRowIds]);
  const selectedExportCount = selectedExportRows.length;
  const selectedExportVideoNotes = useMemo(
    () => collectVideoSyncNoteSequence(selectedExportRows),
    [selectedExportRows]
  );
  const selectedExportVideoNoteCount = selectedExportVideoNotes.length;
  const selectedExportMissingVideoSyncCount = useMemo(
    () =>
      selectedExportVideoNotes.filter((note) => !Number.isFinite(Number(videoSyncTimings?.[note.id]))).length,
    [selectedExportVideoNotes, videoSyncTimings]
  );
  const canExportVideoNow = selectedExportCount > 0 && selectedExportVideoNoteCount > 0 && selectedExportMissingVideoSyncCount === 0;

  useEffect(() => {
    if (!selectedExportVideoNotes.length) {
      setVideoSyncCursorIndex(0);
      return;
    }
    const firstMissing = selectedExportVideoNotes.findIndex((note) => !Number.isFinite(Number(videoSyncTimings?.[note.id])));
    setVideoSyncCursorIndex(firstMissing >= 0 ? firstMissing : selectedExportVideoNotes.length);
  }, [selectedExportVideoNotes, videoSyncTimings]);

  useEffect(() => {
    if (!videoAudioUrl) return undefined;
    return () => {
      URL.revokeObjectURL(videoAudioUrl);
    };
  }, [videoAudioUrl]);

  useEffect(() => {
    const audio = videoAudioRef.current;
    if (!audio) return;
    try {
      audio.playbackRate = videoAudioPlaybackRate;
    } catch {}
  }, [videoAudioPlaybackRate, videoAudioUrl]);
  useEffect(() => {
    if (!exportModalOpen || exportFormat !== "image") return;
    if (selectedExportCount <= 0) {
      if (imagePreviewUrlRef.current) {
        URL.revokeObjectURL(imagePreviewUrlRef.current);
        imagePreviewUrlRef.current = "";
      }
      setImagePreviewUrl("");
      setImagePreviewDims({ width: 0, height: 0 });
      setImagePreviewMetaText("");
      setImagePreviewBusy(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setImagePreviewBusy(true);
      try {
        const previewRows =
          selectedExportRows.length > 1 && imageMultiExportMode === "combined"
            ? selectedExportRows.map((row, i) => ({
                rowLabel: makeExportRowLabel(row, i),
                rowText: getExportRowText(row, i),
                metaLines: buildImageExportMetaLines({
                  row,
                  songTitle,
                  artist,
                  albumName,
                  capoEnabled,
                  capoFret,
                  tempoEnabled: showTempoControl,
                  tempoBpm,
                  showSong: imageShowSong,
                  showArtist: imageShowArtist,
                  showAlbum: imageShowAlbum,
                  showInstrument: imageShowInstrument,
                  showTuning: imageShowTuning,
                  showCapo: showCapoControl && imageShowCapo,
                  showTempo: showTempoControl && imageShowTempo,
                }),
              }))
            : [
                {
                  rowLabel: makeExportRowLabel(selectedExportRows[0], 0),
                  rowText: getExportRowText(selectedExportRows[0], 0),
                  metaLines: buildImageExportMetaLines({
                    row: selectedExportRows[0],
                    songTitle,
                    artist,
                    albumName,
                    capoEnabled,
                    capoFret,
                    tempoEnabled: showTempoControl,
                    tempoBpm,
                    showSong: imageShowSong,
                    showArtist: imageShowArtist,
                    showAlbum: imageShowAlbum,
                    showInstrument: imageShowInstrument,
                    showTuning: imageShowTuning,
                    showCapo: showCapoControl && imageShowCapo,
                    showTempo: showTempoControl && imageShowTempo,
                  }),
                },
              ];

        const previewBlob =
          previewRows.length > 1 && imageMultiExportMode === "combined"
            ? await renderRowsTextToPngBlob({
                rows: previewRows,
                showRowLabels: imageShowRowNames,
                textColor: imageTextColor,
                bgMode: imageBgMode,
                bgColor: imageBgColor,
                thickness: imageThickness,
                textOutline: imageTextOutline,
                includeBranding: effectiveImageShowBranding,
                brandingText: exportBrandingText,
                pixelRatio: 2,
                paddingPreset: imageExportPadding,
              })
            : await renderRowTextToPngBlob({
                rowText: previewRows[0].rowText,
                rowLabel: previewRows[0].rowLabel,
                showRowLabel: imageShowRowNames,
                metaLines: previewRows[0].metaLines,
                textColor: imageTextColor,
                bgMode: imageBgMode,
                bgColor: imageBgColor,
                thickness: imageThickness,
                textOutline: imageTextOutline,
                includeBranding: effectiveImageShowBranding,
                brandingText: exportBrandingText,
                pixelRatio: 2,
                paddingPreset: imageExportPadding,
              });

        if (cancelled) return;
        const objectUrl = URL.createObjectURL(previewBlob);
        const dimensions = await new Promise((resolve) => {
          const probe = new Image();
          probe.onload = () =>
            resolve({
              width: probe.naturalWidth || 0,
              height: probe.naturalHeight || 0,
            });
          probe.onerror = () => resolve({ width: 0, height: 0 });
          probe.src = objectUrl;
        });
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        if (imagePreviewUrlRef.current) URL.revokeObjectURL(imagePreviewUrlRef.current);
        imagePreviewUrlRef.current = objectUrl;
        setImagePreviewUrl(objectUrl);
        setImagePreviewDims(dimensions);
        if (previewRows.length > 1) {
          setImagePreviewMetaText(
            `${dimensions.width} x ${dimensions.height}px · Combined export (${selectedExportRows.length} rows)`
          );
        } else if (selectedExportRows.length > 1 && imageMultiExportMode === "individual") {
          setImagePreviewMetaText(
            `${dimensions.width} x ${dimensions.height}px · Per-image output (1 of ${selectedExportRows.length})`
          );
        } else {
          setImagePreviewMetaText(`${dimensions.width} x ${dimensions.height}px`);
        }
      } catch {
        if (cancelled) return;
        if (imagePreviewUrlRef.current) {
          URL.revokeObjectURL(imagePreviewUrlRef.current);
          imagePreviewUrlRef.current = "";
        }
        setImagePreviewUrl("");
        setImagePreviewDims({ width: 0, height: 0 });
        setImagePreviewMetaText("");
      } finally {
        if (!cancelled) setImagePreviewBusy(false);
      }
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    exportModalOpen,
    exportFormat,
    selectedExportCount,
    selectedExportRows,
    imageMultiExportMode,
    imageShowRowNames,
    imageTextColor,
    imageExportPadding,
    imageBgMode,
    imageBgColor,
    imageThickness,
    imageTextOutline,
    imageShowSong,
    imageShowArtist,
    imageShowAlbum,
    imageShowInstrument,
    imageShowTuning,
    imageShowCapo,
    imageShowTempo,
    effectiveImageShowBranding,
    exportBrandingText,
    showCapoControl,
    showTempoControl,
    songTitle,
    artist,
    albumName,
    capoEnabled,
    capoFret,
    tempoBpm,
  ]);
  useEffect(
    () => () => {
      if (!imagePreviewUrlRef.current) return;
      URL.revokeObjectURL(imagePreviewUrlRef.current);
      imagePreviewUrlRef.current = "";
    },
    []
  );
  useEffect(() => {
    if (!exportModalOpen || exportFormat !== "video" || !videoSyncRecording) return undefined;
    const onSpaceSync = (e) => {
      if (e.code !== "Space") return;
      const active = document.activeElement;
      if (isTextEntryElement(active) || isTextEntryElement(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      recordNextVideoSyncPoint();
    };
    window.addEventListener("keydown", onSpaceSync, true);
    return () => window.removeEventListener("keydown", onSpaceSync, true);
  }, [exportModalOpen, exportFormat, videoSyncRecording, isTextEntryElement, selectedExportVideoNotes, videoSyncCursorIndex]);

  const pdfPreviewLayout = useMemo(
    () =>
      buildPdfPageLayout({
        title: String(songTitle || "").trim(),
        artist: String(artist || "").trim(),
        albumName: String(albumName || "").trim(),
        instrumentLabel: String(currentInstrument?.label || "").trim(),
        tuningLabel,
        capoEnabled,
        capoFret: hasConfiguredCapo(capoEnabled, capoFret) ? String(capoFret).trim() : "",
        tempoEnabled: showTempoControl,
        tempoBpm: hasConfiguredTempo(showTempoControl, tempoBpm) ? String(tempoBpm).trim() : "",
        completedRows,
        showSong: pdfShowSong,
        showArtist: pdfShowArtist,
        showAlbum: pdfShowAlbum,
        showInstrument: pdfShowInstrument,
        showTuning: pdfShowTuning,
        showCapo: showCapoControl && pdfShowCapo,
        showTempo: showTempoControl && pdfShowTempo,
        showHeaderBranding: false,
        footerBrandingText: exportBrandingText,
        rowGrouping: pdfRowGrouping,
      }),
    [
      songTitle,
      artist,
      albumName,
      currentInstrument?.label,
      tuningLabel,
      capoEnabled,
      capoFret,
      showTempoControl,
      tempoBpm,
      completedRows,
      pdfShowSong,
      pdfShowArtist,
      pdfShowAlbum,
      pdfShowInstrument,
      pdfShowTuning,
      pdfShowCapo,
      pdfShowTempo,
      showCapoControl,
      exportBrandingText,
      pdfRowGrouping,
    ]
  );

  useEffect(() => {
    try {
      localStorage.setItem(LS_EXPORT_BG_MODE_KEY, imageBgMode);
    } catch {}
  }, [imageBgMode]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_EXPORT_IMAGE_SIZE_KEY, imageExportSize);
    } catch {}
  }, [imageExportSize]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_EXPORT_IMAGE_PADDING_KEY, imageExportPadding);
    } catch {}
  }, [imageExportPadding]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_EXPORT_BG_COLOR_KEY, imageBgColor);
    } catch {}
  }, [imageBgColor]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_EXPORT_TEXT_COLOR_KEY, imageTextColor);
    } catch {}
  }, [imageTextColor]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_EXPORT_THICKNESS_KEY, imageThickness);
    } catch {}
  }, [imageThickness]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_EXPORT_TEXT_OUTLINE_KEY, imageTextOutline);
    } catch {}
  }, [imageTextOutline]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_EXPORT_SHOW_ROW_NAMES_KEY, imageShowRowNames ? "true" : "false");
    } catch {}
  }, [imageShowRowNames]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_EXPORT_SHOW_ARTIST_KEY, imageShowArtist ? "true" : "false");
    } catch {}
  }, [imageShowArtist]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_EXPORT_SHOW_ALBUM_KEY, imageShowAlbum ? "true" : "false");
    } catch {}
  }, [imageShowAlbum]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_EXPORT_SHOW_SONG_KEY, imageShowSong ? "true" : "false");
    } catch {}
  }, [imageShowSong]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_EXPORT_SHOW_INSTRUMENT_KEY, imageShowInstrument ? "true" : "false");
    } catch {}
  }, [imageShowInstrument]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_EXPORT_SHOW_TUNING_KEY, imageShowTuning ? "true" : "false");
    } catch {}
  }, [imageShowTuning]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_EXPORT_SHOW_CAPO_KEY, imageShowCapo ? "true" : "false");
    } catch {}
  }, [imageShowCapo]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_EXPORT_SHOW_TEMPO_KEY, imageShowTempo ? "true" : "false");
    } catch {}
  }, [imageShowTempo]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_EXPORT_SHOW_IMAGE_BRANDING_KEY, effectiveImageShowBranding ? "true" : "false");
    } catch {}
  }, [effectiveImageShowBranding]);
  useEffect(() => {
    updateUserState?.((prev) => {
      const currentPrefs = prev?.profile?.exportBrandingPrefs || {};
      const nextPrefs = {
        includeTabStudioLink: effectiveImageShowBranding,
        useAffiliateLink: exportAffiliateLinkText ? exportUseAffiliateBranding : false,
      };
      if (
        currentPrefs.includeTabStudioLink === nextPrefs.includeTabStudioLink &&
        currentPrefs.useAffiliateLink === nextPrefs.useAffiliateLink
      ) {
        return prev;
      }
      return {
        ...prev,
        profile: {
          ...(prev?.profile || {}),
          exportBrandingPrefs: {
            ...currentPrefs,
            ...nextPrefs,
          },
        },
      };
    });
  }, [effectiveImageShowBranding, exportUseAffiliateBranding, exportAffiliateLinkText, updateUserState]);

  useEffect(() => {
    if (!showCapoControl) setCapoOpen(false);
  }, [showCapoControl]);

  useEffect(() => {
    if (imageBgMode !== "solid") return;
    const nextText = getAutoContrastedTextColor(imageBgColor, imageTextColor);
    if (nextText !== imageTextColor) setImageTextColor(nextText);
  }, [imageBgMode, imageBgColor, imageTextColor]);

  useEffect(() => {
    if (!exportModalOpen) {
      exportUndoStackRef.current = [];
      exportRedoStackRef.current = [];
      exportHistoryLastSnapshotRef.current = null;
      exportHistorySuspendedRef.current = false;
      return;
    }
    const current = snapshotExportState();
    const previous = exportHistoryLastSnapshotRef.current;
    if (!previous) {
      exportHistoryLastSnapshotRef.current = cloneJson(current, null);
      return;
    }
    if (exportHistorySuspendedRef.current) {
      exportHistoryLastSnapshotRef.current = cloneJson(current, null);
      return;
    }
    if (JSON.stringify(previous) === JSON.stringify(current)) return;
    exportUndoStackRef.current.push(cloneJson(previous, null));
    if (exportUndoStackRef.current.length > 250) exportUndoStackRef.current.shift();
    exportRedoStackRef.current = [];
    exportHistoryLastSnapshotRef.current = cloneJson(current, null);
  }, [exportModalOpen, snapshotExportState]);

  useEffect(() => {
    if (!exportModalOpen) return;
    setImageExportRowIds(completedRows.map((row) => row.id));
    setImageMultiExportMode("individual");
    setImageExportProgress("");
  }, [exportModalOpen, completedRows]);

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
  const resetEditorSettingsToDefaults = useCallback(() => {
    setTabCopyMode("move");
    setScrollScope("all");
    setShowCapoControl(true);
    setShowTempoControl(true);
    setThemeMode("dark");
    setAccentColorId("white");
    setDefaultCols(DEFAULT_COLS);
    setColsAutoDelayMs(DEFAULT_COLS_AUTO_DELAY_MS);
    setPdfShowSong(true);
    setPdfShowArtist(true);
    setPdfShowAlbum(true);
    setPdfShowInstrument(true);
    setPdfShowTuning(true);
    setPdfShowCapo(true);
    setPdfShowTempo(true);
    setPdfShowHeaderBranding(true);
  }, []);
  const openResetEditorSettingsDialog = useCallback(() => {
    setUiDialog({
      title: "Reset editor settings?",
      message: "This will restore all TabStudio editor preferences to their default values.",
      cancelLabel: "Cancel",
      confirmLabel: "Reset Settings",
      onConfirm: () => {
        resetEditorSettingsToDefaults();
      },
    });
  }, [resetEditorSettingsToDefaults]);
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
  function resetColsToDefault(sourceEl) {
    clearColsAutoCommitTimer();
    // Triple-click reset is intentionally hard-locked to 32 columns.
    setCols(TRIPLE_CLICK_RESET_COLS);
    setColsInput(String(TRIPLE_CLICK_RESET_COLS));
    setColsReplaceOnType(false);
    colsReplaceOnTypeRef.current = false;
    colsRapidClickRef.current = { count: 0, lastTs: 0 };
    if (sourceEl && typeof sourceEl.blur === "function") sourceEl.blur();
    focusKeyCapture();
  }
  function handleColsTripleClickReset(event) {
    const detail = Number(event?.detail ?? event?.nativeEvent?.detail ?? 0);
    if (detail >= 3) {
      resetColsToDefault(event?.currentTarget);
      return true;
    }
    const now = Date.now();
    const burst = colsRapidClickRef.current;
    const withinBurst = now - Number(burst.lastTs || 0) <= 420;
    burst.count = withinBurst ? Number(burst.count || 0) + 1 : 1;
    burst.lastTs = now;
    if (burst.count >= 3) {
      resetColsToDefault(event?.currentTarget);
      return true;
    }
    return false;
  }
  function nudgeCols(delta) {
    if (!Number.isFinite(delta) || delta === 0) return;
    clearColsAutoCommitTimer();
    setColsReplaceOnType(false);
    colsReplaceOnTypeRef.current = false;
    setCols((prev) => {
      const base = Number.isFinite(prev) ? prev : colsRef.current;
      return Math.max(MIN_COLS, Math.min(MAX_COLS, base + delta));
    });
  }
  useEffect(() => {
    const el = colsInputRef.current;
    if (!el) return;
    const onWheelNative = (event) => {
      event.preventDefault();
      if (event.deltaY < 0) nudgeCols(-1);
      else if (event.deltaY > 0) nudgeCols(1);
    };
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, [nudgeCols]);
  useEffect(() => () => clearColsAutoCommitTimer(), []);

  function commitTempoInput(rawValue = tempoBpm) {
    const raw = String(rawValue ?? "").replace(/[^\d]/g, "").slice(0, 3);
    if (!raw) {
      setTempoBpm("120");
      return;
    }
    const parsed = Number(raw);
    const next = Math.max(30, Math.min(300, Number.isFinite(parsed) ? parsed : 120));
    setTempoBpm(String(next));
  }
  function clearTempoAutoCommitTimer() {
    if (tempoAutoCommitTimerRef.current) {
      window.clearTimeout(tempoAutoCommitTimerRef.current);
      tempoAutoCommitTimerRef.current = null;
    }
  }
  function scheduleTempoAutoCommit(rawValue) {
    const raw = String(rawValue ?? "").replace(/[^\d]/g, "").slice(0, 3);
    clearTempoAutoCommitTimer();
    if (!raw) return;
    if (raw.length >= 3) {
      commitTempoInput(raw);
      setTempoReplaceOnType(false);
      tempoReplaceOnTypeRef.current = false;
      return;
    }
    tempoAutoCommitTimerRef.current = window.setTimeout(() => {
      commitTempoInput(raw);
      setTempoReplaceOnType(false);
      tempoReplaceOnTypeRef.current = false;
      tempoAutoCommitTimerRef.current = null;
    }, colsAutoDelayMs);
  }
  function nudgeTempo(delta) {
    if (!Number.isFinite(delta) || delta === 0) return;
    clearTempoAutoCommitTimer();
    setTempoReplaceOnType(false);
    tempoReplaceOnTypeRef.current = false;
    setTempoBpm((prev) => {
      const parsed = Number(String(prev ?? "").trim());
      const base = Number.isFinite(parsed) ? parsed : 120;
      const next = Math.max(30, Math.min(300, base + delta));
      return String(next);
    });
  }
  useEffect(() => {
    const el = tempoInputRef.current;
    if (!el) return;
    const onWheelNative = (event) => {
      event.preventDefault();
      if (event.deltaY < 0) nudgeTempo(-1);
      else if (event.deltaY > 0) nudgeTempo(1);
    };
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, [nudgeTempo]);
  useEffect(() => () => clearTempoAutoCommitTimer(), []);

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

  function validateTempo() {
    const raw = String(tempoBpm ?? "").trim();
    if (!raw) {
      setTempoBpm("120");
      return true;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 30 || n > 300) {
      window.alert("Error: please enter a tempo between 30 and 300 BPM.");
      setTempoBpm("120");
      return false;
    }
    setTempoBpm(String(n));
    return true;
  }

  function exportPdfNow() {
    if (!canExportPdfTabs) {
      showMembershipGateToast(userPlanType === "solo" ? "solo-export" : "export-pdf");
      focusKeyCapture();
      return;
    }
    const safeTitle = (songTitle || "TabStudio")
      .trim()
      .replace(/[^\w\- ]+/g, "")
      .replace(/\s+/g, " ");
    const filename = `${safeTitle || "TabStudio"} - tabs.pdf`;

    if (!validateCapo()) {
      focusKeyCapture();
      return;
    }
    if (showTempoControl && !validateTempo()) {
      focusKeyCapture();
      return;
    }

    const capoValueForPdf = hasConfiguredCapo(capoEnabled, capoFret) ? String(Number(capoFret)) : "";
    const tempoValueForPdf = hasConfiguredTempo(showTempoControl, tempoBpm) ? String(Number(tempoBpm)) : "";

    const bytes = buildPdfBytes({
      title: songTitle.trim(),
      artist: artist.trim(),
      albumName: albumName.trim(),
      instrumentLabel: String(currentInstrument?.label || "").trim(),
      tuningLabel,
      capoEnabled,
      capoFret: capoValueForPdf,
      tempoEnabled: showTempoControl,
      tempoBpm: tempoValueForPdf,
      completedRows,
      showSong: pdfShowSong,
      showArtist: pdfShowArtist,
      showAlbum: pdfShowAlbum,
      showInstrument: pdfShowInstrument,
      showTuning: pdfShowTuning,
      showCapo: showCapoControl && pdfShowCapo,
      showTempo: showTempoControl && pdfShowTempo,
      showHeaderBranding: false,
      footerBrandingText: exportBrandingText,
      rowGrouping: pdfRowGrouping,
      thickness: imageThickness,
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

  function openExportModal() {
    if (!editorHasMembership) {
      showMembershipGateToast("export-pdf");
      focusKeyCapture();
      return;
    }
    if (userPlanType === "solo") {
      showMembershipGateToast("solo-export");
      focusKeyCapture();
      return;
    }
    setAccountProfileOpen(false);
    setProjectsLibraryOpen(false);
    setExportModalOpen(true);
    setExportFormat("pdf");
    setImageExportProgress("");
    setVideoExportProgress("");
  }

  function openAccountProfilePanel() {
    setAccountProfileSection("overview");
    setProjectsLibraryOpen(false);
    setExportModalOpen(false);
    setImageExportProgress("");
    setVideoExportProgress("");
    setSettingsOpen(false);
    setSettingsFullscreen(false);
    setAccountProfileOpen(true);
  }

  function returnToTabWriterFromLogo() {
    setProjectsLibraryOpen(false);
    setExportModalOpen(false);
    setImageExportProgress("");
    setVideoExportProgress("");
    setSettingsFullscreen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    focusKeyCapture();
  }

  useEffect(() => {
    if (!pendingOpenPanel) return;
    const panel = String(pendingOpenPanel || "").toLowerCase();
    if (panel === "projects") {
      if (!canUsePaidEditorFeatures) {
        showMembershipGateToast("projects");
        onPendingPanelHandled?.();
        return;
      }
      setProjectsLibraryOpen(true);
      setExportModalOpen(false);
      setSettingsOpen(false);
      setSettingsFullscreen(false);
    } else if (panel === "export") {
      setSettingsOpen(false);
      setSettingsFullscreen(false);
      openExportModal();
    } else if (panel === "account") {
      setProjectsLibraryOpen(false);
      setExportModalOpen(false);
      setSettingsOpen(false);
      setSettingsFullscreen(false);
      if (!isLoggedIn) {
        navigateTo("/signin");
        onPendingPanelHandled?.();
        return;
      }
      setAccountProfileSection("overview");
      setAccountProfileOpen(true);
    } else if (panel === "account-billing") {
      setProjectsLibraryOpen(false);
      setExportModalOpen(false);
      setSettingsOpen(false);
      setSettingsFullscreen(false);
      if (!isLoggedIn) {
        navigateTo("/signin");
        onPendingPanelHandled?.();
        return;
      }
      setAccountProfileSection("billing");
      setAccountProfileOpen(true);
    } else if (panel === "settings") {
      setProjectsLibraryOpen(false);
      setExportModalOpen(false);
      setSettingsOpen(true);
      setSettingsFullscreen(false);
    }
    onPendingPanelHandled?.();
  }, [pendingOpenPanel, onPendingPanelHandled, canUsePaidEditorFeatures, showMembershipGateToast]);

  useEffect(() => {
    if (isLoggedIn) return;
    if (!accountProfileOpen) return;
    setAccountProfileOpen(false);
  }, [isLoggedIn, accountProfileOpen]);

  function toggleImageExportRow(id) {
    setImageExportRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return Array.from(next);
    });
  }

  function handleVideoAudioFileChange(file) {
    if (!file) return;
    const audioType = String(file.type || "");
    if (audioType && !audioType.startsWith("audio/")) {
      window.alert("Please choose a valid audio file.");
      return;
    }
    if (videoAudioUrl) URL.revokeObjectURL(videoAudioUrl);
    const url = URL.createObjectURL(file);
    setVideoAudioUrl(url);
    setVideoAudioName(String(file.name || "audio"));
    setVideoSyncRecording(false);
    setVideoSyncStartedAtMs(0);
  }

  function clearVideoSyncAll() {
    setVideoSyncTimings({});
    setVideoSyncCursorIndex(0);
    setVideoSyncRecording(false);
    setVideoSyncStartedAtMs(0);
  }

  function clearVideoSyncRow(rowId) {
    const targetId = String(rowId || "");
    if (!targetId) return;
    setVideoSyncTimings((prev) => {
      const next = {};
      Object.entries(prev || {}).forEach(([id, ms]) => {
        if (!id.startsWith(`${targetId}:`)) next[id] = ms;
      });
      return next;
    });
    setVideoSyncCursorIndex((prev) => {
      const missingIdx = selectedExportVideoNotes.findIndex(
        (note, i) => i >= prev && String(note.rowId) === targetId
      );
      return missingIdx >= 0 ? missingIdx : prev;
    });
  }

  function startVideoSyncRecording() {
    if (!selectedExportVideoNoteCount) {
      window.alert("Select at least one row that includes notes before syncing.");
      return;
    }
    const audio = videoAudioRef.current;
    if (!audio || !videoAudioUrl) {
      window.alert("Load an audio file before starting sync.");
      return;
    }
    clearVideoSyncAll();
    try {
      audio.currentTime = 0;
      audio.playbackRate = videoAudioPlaybackRate;
      audio.play().catch(() => {});
    } catch {}
    setVideoSyncStartedAtMs(Date.now());
    setVideoSyncRecording(true);
    setVideoExportProgress("Sync recording started.");
  }

  function stopVideoSyncRecording() {
    setVideoSyncRecording(false);
    const audio = videoAudioRef.current;
    try {
      audio?.pause?.();
    } catch {}
    setVideoExportProgress("Sync recording stopped.");
  }

  function recordNextVideoSyncPoint() {
    if (!videoSyncRecording) return;
    if (videoSyncCursorIndex >= selectedExportVideoNotes.length) return;
    const nextNote = selectedExportVideoNotes[videoSyncCursorIndex];
    if (!nextNote) return;
    const audio = videoAudioRef.current;
    const timestampMs = audio && Number.isFinite(audio.currentTime)
      ? Math.max(0, Math.round(audio.currentTime * 1000))
      : Math.max(0, Date.now() - videoSyncStartedAtMs);
    setVideoSyncTimings((prev) => ({ ...prev, [nextNote.id]: timestampMs }));
    setVideoSyncCursorIndex((prev) => {
      const next = Math.min(selectedExportVideoNotes.length, prev + 1);
      if (next >= selectedExportVideoNotes.length) {
        setVideoSyncRecording(false);
        setVideoExportProgress("Sync complete.");
      } else {
        setVideoExportProgress(`Synced ${next} / ${selectedExportVideoNotes.length} notes.`);
      }
      return next;
    });
  }

  async function exportVideoNow() {
    if (!canExportPngTabs) {
      showMembershipGateToast(userPlanType === "solo" ? "solo-export" : editorHasMembership ? "creator-export" : "export-image");
      return;
    }
    if (videoExportBusy) return;
    if (!selectedExportCount) {
      window.alert("Select at least one row to export video.");
      return;
    }
    if (!selectedExportVideoNoteCount) {
      window.alert("Selected rows do not contain synced notes for video export.");
      return;
    }
    if (selectedExportMissingVideoSyncCount > 0) {
      window.alert("Please complete sync timings for all notes in the selected rows before exporting video.");
      return;
    }

    const safeTitle = sanitizeExportFileBase(songTitle) || "TabStudio";
    setVideoExportBusy(true);
    setVideoExportProgress("Rendering video...");
    try {
      const videoRows = selectedExportRows.filter((row) => row.kind === "tab");
      const includeBranding = exportBrandingLocked || videoBrandingMode === "tabstudio" || videoBrandingMode === "affiliate";
      const includeAffiliateBranding = videoBrandingMode === "affiliate";
      const blob = await buildVideoExportBlob({
        rows: videoRows,
        syncTimingsMs: videoSyncTimings,
        playbackSpeed: videoPlaybackSpeed,
        backgroundMode: videoBgMode,
        backgroundColor: videoBgColor,
        textColor: imageTextColor,
        includeBranding,
        includeAffiliateBranding,
        affiliateCode: String(userState?.profile?.affiliateCode || ""),
        animationStyle: videoAnimationStyle,
        onProgress: ({ frame, totalFrames }) => {
          if (totalFrames > 0) {
            setVideoExportProgress(`Rendering video... ${Math.min(totalFrames, frame)} / ${totalFrames}`);
          }
        },
        normalizeHexColorOrFallback,
        tabbyAssistMint: TABBY_ASSIST_MINT,
        withAlpha,
      });
      const mime = String(blob.type || "").toLowerCase();
      const extension = mime.includes("mp4") ? "mp4" : "webm";
      downloadBlobFile(blob, `${safeTitle} - tab-playback.${extension}`);
      setVideoExportProgress(`Exported video (${extension.toUpperCase()}).`);
    } catch (err) {
      console.error(err);
      setVideoExportProgress("");
      window.alert("Video export failed. Please try again.");
    } finally {
      setVideoExportBusy(false);
      focusKeyCapture();
    }
  }

  async function exportImagesNow() {
    if (!canExportPngTabs) {
      showMembershipGateToast(userPlanType === "solo" ? "solo-export" : editorHasMembership ? "creator-export" : "export-image");
      return;
    }
    if (imageExportBusy) return;
    if (selectedExportCount <= 0) {
      window.alert("Select at least one row to export as image.");
      return;
    }
    if (showTempoControl && !validateTempo()) {
      return;
    }

    const safeTitle = sanitizeExportFileBase(songTitle) || "TabStudio";
    setImageExportBusy(true);
    setImageExportProgress("");

    try {
      const targetPixelWidth = getPngExportTargetWidth(imageExportSize);
      if (selectedExportRows.length > 1 && imageMultiExportMode === "combined") {
        setImageExportProgress("Exporting combined image...");
        const combinedBlob = await renderRowsTextToPngBlob({
          rows: selectedExportRows.map((row, i) => ({
            rowLabel: makeExportRowLabel(row, i),
            rowText: getExportRowText(row, i),
            metaLines: buildImageExportMetaLines({
              row,
              songTitle,
              artist,
              albumName,
              capoEnabled,
              capoFret,
              tempoEnabled: showTempoControl,
              tempoBpm,
              showSong: imageShowSong,
              showArtist: imageShowArtist,
              showAlbum: imageShowAlbum,
              showInstrument: imageShowInstrument,
              showTuning: imageShowTuning,
              showCapo: showCapoControl && imageShowCapo,
              showTempo: showTempoControl && imageShowTempo,
            }),
          })),
          showRowLabels: imageShowRowNames,
          textColor: imageTextColor,
          bgMode: imageBgMode,
          bgColor: imageBgColor,
          thickness: imageThickness,
          textOutline: imageTextOutline,
          includeBranding: effectiveImageShowBranding,
          brandingText: exportBrandingText,
          pixelRatio: 2,
          targetPixelWidth,
          paddingPreset: imageExportPadding,
        });
        downloadBlobFile(combinedBlob, `${safeTitle} - selected rows.png`);
        setImageExportProgress("Exported combined image.");
      } else {
        const files = [];
        for (let i = 0; i < selectedExportRows.length; i += 1) {
          const row = selectedExportRows[i];
          setImageExportProgress(`Exporting ${i + 1} / ${selectedExportRows.length} rows...`);
          const blob = await renderRowTextToPngBlob({
            rowText: getExportRowText(row, i),
            rowLabel: makeExportRowLabel(row, i),
            showRowLabel: imageShowRowNames,
            metaLines: buildImageExportMetaLines({
              row,
              songTitle,
              artist,
              albumName,
              capoEnabled,
              capoFret,
              tempoEnabled: showTempoControl,
              tempoBpm,
              showSong: imageShowSong,
              showArtist: imageShowArtist,
              showAlbum: imageShowAlbum,
              showInstrument: imageShowInstrument,
              showTuning: imageShowTuning,
              showCapo: showCapoControl && imageShowCapo,
              showTempo: showTempoControl && imageShowTempo,
            }),
            textColor: imageTextColor,
            bgMode: imageBgMode,
            bgColor: imageBgColor,
            thickness: imageThickness,
            textOutline: imageTextOutline,
            includeBranding: effectiveImageShowBranding,
            brandingText: exportBrandingText,
            pixelRatio: 2,
            targetPixelWidth,
            paddingPreset: imageExportPadding,
          });
          files.push({
            name: `${safeTitle} - Row ${String(i + 1).padStart(2, "0")}.png`,
            blob,
          });
        }

        if (files.length === 1) {
          downloadBlobFile(files[0].blob, files[0].name);
        } else {
          const zipBlob = await buildStoredZipBlob(files);
          downloadBlobFile(zipBlob, `${safeTitle} - rows.zip`);
        }
        setImageExportProgress(`Exported ${files.length} image${files.length > 1 ? "s" : ""}.`);
      }
    } catch (err) {
      console.error(err);
      setImageExportProgress("");
      window.alert("Image export failed. Please try again.");
    } finally {
      setImageExportBusy(false);
      focusKeyCapture();
    }
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
    if (!gridTargetingActive) return;

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

    // Grid-only:
    // - Shift + 1..N jumps to string row (same column)
    // - Shift + 9 / Shift + 0 inserts "(" / ")"
    // - Other Shift+number symbols are blocked in grid
    if (!isMod && !e.altKey && e.shiftKey && /^Digit[0-9]$/.test(String(e.code || ""))) {
      e.preventDefault();
      e.stopPropagation();
      const digit = Number(String(e.code).replace("Digit", ""));
      const targetRow = digit - 1;
      if (targetRow >= 0 && targetRow < tuning.length) {
        const { c } = cursorRef.current;
        setRandomCellSelection(new Set());
        clearCellSelection();
        setCursor({ r: targetRow, c });
        setOverwriteNext(true);
      } else if (digit === 9 || digit === 0) {
        const bracketValue = digit === 9 ? "(" : ")";
        const { r, c } = cursorRef.current;
        const overwrite = overwriteNextRef.current;

        if (hasCellSelection) {
          const edits = getSelectedCellsEdits(bracketValue);
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
          setCell(r, c, bracketValue);
        } else {
          setCell(r, c, cur === "" ? bracketValue : cur + bracketValue);
        }
        setOverwriteNext(false);
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        completeRow({ advanceToNextString: true });
      } else {
        moveCursor(1, 0);
        setOverwriteNext(true);
      }
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const hasSingleCellSelection =
        randomCellSelection.size === 0 &&
        !!selectionBounds &&
        selectionBounds.r1 === selectionBounds.r2 &&
        selectionBounds.c1 === selectionBounds.c2;
      if (hasSingleCellSelection) {
        setCellSelection(null);
      }

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

    // Grid-only quick navigation:
    // Shift + =  -> jump down to Completed Rows section
    // Shift + -  -> jump back to top tab writer
    if (!isMod && !e.altKey && e.shiftKey && String(e.code || "") === "Equal") {
      e.preventDefault();
      e.stopPropagation();
      setCompletedRowsOpen(true);
      requestAnimationFrame(() => {
        const section = completedRowsSectionRef.current;
        if (section && typeof section.scrollIntoView === "function") {
          section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setTimeout(() => focusKeyCapture(), 120);
      });
      return;
    }

    if (!isMod && !e.altKey && e.shiftKey && String(e.code || "") === "Minus") {
      e.preventDefault();
      e.stopPropagation();
      requestAnimationFrame(() => {
        const top = tabWriterAreaRef.current;
        if (top && typeof top.scrollIntoView === "function") {
          top.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          try {
            window.scrollTo({ top: 0, behavior: "smooth" });
          } catch {
            window.scrollTo(0, 0);
          }
        }
        setTimeout(() => focusKeyCapture(), 120);
      });
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

  const baseBtn = buttonBase(THEME);

  const btnSmallPill = buttonPill(THEME);

  const btnSmallPillDanger = {
    ...btnSmallPill,
    borderColor: THEME.dangerBorder ?? "#f1b4b4",
    background: THEME.dangerSoft ?? "#fff5f5",
    color: THEME.dangerText ?? "#b02a2a",
  };
  const btnSecondary = buttonSecondary(THEME);
  const btnSmallPillClose = buttonMicro(THEME);
  const actionEditBtn = {
    ...btnSecondary,
    width: 36,
    minWidth: 36,
    height: 36,
    padding: 0,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 900,
    color: THEME.text,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const actionDeleteBtn = {
    ...btnSecondary,
    width: 36,
    minWidth: 36,
    height: 36,
    padding: 0,
    borderRadius: 10,
    fontSize: 18,
    lineHeight: 1,
    fontWeight: 950,
    color: THEME.danger,
    borderColor: withAlpha(THEME.danger, 0.35),
    background: THEME.surfaceWarm,
  };
  const rowDeleteBtn = {
    ...actionDeleteBtn,
  };
  const btnPrimary = buttonPrimary(THEME);
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
  const settingsSectionToggleVisual = (isOpen) =>
    isOpen
      ? {
          borderColor: withAlpha(THEME.accent, 0.72),
          color: THEME.accent,
          background: withAlpha(THEME.accent, 0.08),
          boxShadow: `0 0 0 2px ${withAlpha(THEME.accent, isDarkMode ? 0.16 : 0.11)}`,
        }
      : {
          borderColor: THEME.border,
          color: THEME.text,
          background: "transparent",
          boxShadow: "none",
        };
  const settingsAccordionCardStyle = (isOpen) => ({
    marginTop: 10,
    borderRadius: 12,
    border: `1px solid ${isOpen ? withAlpha(THEME.accent, 0.6) : THEME.border}`,
    background: THEME.surfaceWarm,
    overflow: "hidden",
    flexShrink: 0,
    boxShadow: isOpen ? `0 0 0 1px ${withAlpha(THEME.accent, isDarkMode ? 0.2 : 0.14)}` : "none",
  });
  const settingsExpandedContentStyle = {
    padding: 10,
    borderTop: `1px solid ${THEME.border}`,
    background: withAlpha(THEME.text, isDarkMode ? 0.02 : 0.015),
    fontSize: 12,
    display: "grid",
    gap: 10,
  };
  const settingsSubgroupStyle = {
    border: `1px solid ${THEME.border}`,
    borderRadius: 10,
    background: withAlpha(THEME.text, isDarkMode ? 0.02 : 0.01),
    padding: "9px 10px",
    display: "grid",
    gap: 8,
  };
  const settingsSubgroupHeadingStyle = {
    fontSize: 11,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    fontWeight: 900,
    color: withAlpha(THEME.text, isDarkMode ? 0.84 : 0.8),
    lineHeight: 1.2,
  };
  const settingsControlRowStyle = {
    minHeight: 28,
    display: "flex",
    alignItems: "center",
    gap: 8,
  };
  const settingsHintTextStyle = {
    fontSize: 11,
    color: THEME.textFaint,
    lineHeight: 1.4,
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
    const neutralBaseBg = "transparent";
    const neutralBaseBorder = "transparent";
    const neutralHoverBg = withAlpha("#FFFFFF", 0.08);
    const neutralHoverBorder = withAlpha("#FFFFFF", 0.18);
    const saveHoverBg = isDarkMode ? withAlpha(THEME.text, 0.17) : withAlpha(THEME.text, 0.12);
    const saveBorder = withAlpha(THEME.text, isDarkMode ? 0.5 : 0.36);
    const isAccentState = activeSelected && !isSavePrimary;
    const ghostBaseColor = withAlpha(THEME.text, 0.78);
    const ghostHoverColor = withAlpha(THEME.text, 0.95);
    const baseColor = disabled
      ? THEME.textFaint
      : isSavePrimary
      ? THEME.text
      : isAccentState
      ? THEME.accent
      : hovered || pressed
      ? ghostHoverColor
      : ghostBaseColor;
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
      : neutralBaseBorder;
    const background = disabled
      ? "transparent"
      : isSavePrimary
      ? hovered
      ? saveHoverBg
      : "transparent"
      : isAccentState
      ? withAlpha(THEME.accent, isDarkMode ? 0.12 : 0.08)
      : hovered
      ? neutralHoverBg
      : neutralBaseBg;
    return {
      border: `1px solid ${borderColor}`,
      background,
      color: baseColor,
      borderRadius: 10,
      height: iconOnly ? 38 : 36,
      minWidth: iconOnly ? 38 : arrow ? 36 : 0,
      padding: iconOnly ? 0 : arrow ? 0 : "0 14px",
      lineHeight: 1,
      fontWeight: iconOnly ? 600 : arrow ? 900 : isSavePrimary ? 900 : 600,
      fontSize: iconOnly ? 19 : arrow ? 24 : 16,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      boxSizing: "border-box",
      cursor: disabled ? "not-allowed" : "pointer",
      transform: pressed ? "translateY(1px) scale(0.985)" : hovered && isSavePrimary ? "translateY(-0.5px)" : "translateY(0)",
      position: "relative",
      top: arrow ? 1 : 0,
      outline: "none",
      boxShadow:
        isSavePrimary && hovered && !disabled
          ? `0 0 0 2px ${withAlpha(THEME.accent, isDarkMode ? 0.2 : 0.15)}`
          : "none",
      transition: "all 0.15s ease",
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

  const microBtnHoverHandlers = (id, disabled = false) =>
    disabled
      ? {}
      : {
          onMouseEnter: () => setMicroHoverBtnId(id),
          onMouseLeave: () => setMicroHoverBtnId((prev) => (prev === id ? "" : prev)),
          onFocus: () => setMicroHoverBtnId(id),
          onBlur: () => setMicroHoverBtnId((prev) => (prev === id ? "" : prev)),
        };

  const microBtnInteractiveStyle = (id, baseStyle, disabled = false) => {
    const hovered = !disabled && microHoverBtnId === id;
    const pressed = !disabled && pressedBtnId === id;
    return {
      ...baseStyle,
      cursor: disabled ? "not-allowed" : "pointer",
      borderColor: hovered ? withAlpha(THEME.text, isDarkMode ? 0.34 : 0.24) : baseStyle.borderColor,
      background: hovered ? withAlpha(THEME.text, isDarkMode ? 0.1 : 0.06) : baseStyle.background,
      color: hovered ? THEME.text : baseStyle.color,
      transform: pressed ? "translateY(1px) scale(0.985)" : hovered ? "translateY(-0.5px)" : "translateY(0)",
      boxShadow: hovered ? `0 0 0 2px ${withAlpha(THEME.accent, isDarkMode ? 0.13 : 0.1)}` : "none",
      transition:
        "transform 170ms ease, background 170ms ease, border-color 170ms ease, color 170ms ease, box-shadow 170ms ease",
    };
  };

  const dropdownOptionStyle = ({ selected = false, hovered = false, compact = false, activeText = false } = {}) => {
    const hoverBg = withAlpha(THEME.accent, isDarkMode ? 0.14 : 0.08);
    const selectedBg = withAlpha(THEME.accent, isDarkMode ? 0.17 : 0.11);
    const neutralBg = THEME.surfaceWarm;
    return {
      textAlign: "left",
      padding: compact ? "9px 10px" : "10px 10px",
      borderRadius: compact ? 12 : 14,
      border: `1px solid ${selected ? withAlpha(THEME.accent, 0.78) : hovered ? withAlpha(THEME.accent, 0.46) : THEME.border}`,
      background: selected ? selectedBg : hovered ? hoverBg : neutralBg,
      cursor: "pointer",
      fontWeight: 900,
      color: selected || activeText ? THEME.accent : THEME.text,
      boxSizing: "border-box",
      transition: "background 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease",
      boxShadow: selected || hovered ? `0 0 0 2px ${withAlpha(THEME.accent, isDarkMode ? 0.17 : 0.12)}` : "none",
    };
  };
  const gridCellHoverStyle = gridCellHoverVisual(withAlpha, {
    isDarkMode,
    accent: THEME.accent,
  });
  const modalMiniInputHoverStyle = modalMiniInputHoverVisual(withAlpha, {
    isDarkMode,
    accent: THEME.accent,
  });

  const tuningMatchesCurrent = (candidateLowToHigh) => {
    const current = appToLowToHigh(tuning);
    if (!Array.isArray(candidateLowToHigh) || candidateLowToHigh.length !== current.length) return false;
    return candidateLowToHigh.every(
      (token, idx) =>
        String(token ?? "")
          .replace(/\s+/g, "")
          .toUpperCase() ===
        String(current[idx] ?? "")
          .replace(/\s+/g, "")
          .toUpperCase()
    );
  };

  const card = cardBase(THEME);

  const field = inputEditor(THEME);
  const songMetaGridColumns = "repeat(3, minmax(0, 1fr))";

  const pillMono = {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontWeight: 950,
  };

  const capoLabel = capoEnabled ? "Capo: Yes" : "Capo: No";
  const undoDisabled = exportModalOpen
    ? exportUndoStackRef.current.length === 0
    : projectsLibraryOpen
    ? libraryUndoStackRef.current.length === 0
    : undoStackRef.current.length === 0;
  const redoDisabled = exportModalOpen
    ? exportRedoStackRef.current.length === 0
    : projectsLibraryOpen
    ? libraryRedoStackRef.current.length === 0
    : redoStackRef.current.length === 0;

  const userTuningsById = useMemo(() => {
    const m = new Map();
    for (const t of userTunings) m.set(t.id, t);
    return m;
  }, [userTunings]);

  const validCompletedRowIds = useMemo(() => new Set(completedRows.map((r) => r.id)), [completedRows]);
  const selectionCount = useMemo(() => {
    let count = 0;
    selectedRowIds.forEach((id) => {
      if (validCompletedRowIds.has(id)) count += 1;
    });
    return count;
  }, [selectedRowIds, validCompletedRowIds]);
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
  const editorModalOverlayStyle = modalOverlay({ background: "rgba(0,0,0,0.35)", zIndex: 5000 });
  const editorModalCardStyle = modalCard(THEME);
  const editorModalHeaderStyle = modalHeader({ marginBottom: 8 });
  const editorModalCloseStyle = modalCloseButton(THEME);

  function openEditChordModal(chord) {
    if (!chord) return;
    setSelectedChordId(String(chord.id || ""));
    setEditChordTargetId(chord.id);
    setEditChordIsPreset(PRESET_CHORDS.some((p) => p.id === chord.id));
    setEditChordNameHeader(chord.name || "");
    const frets = (chord.frets ?? []).map((x) => String(x ?? ""));
    const pad = [...frets];
    while (pad.length < 6) pad.push("");
    setEditChordFrets(pad.slice(0, 6));
    setEditChordHoverIndex(-1);
    setEditChordModalOpen(true);
  }

  function closeEditChordModal() {
    setEditChordModalOpen(false);
    setEditChordHoverIndex(-1);
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

  useEffect(() => {
    if (!selectedChordId) return;
    if (allChords.some((chord) => chord.id === selectedChordId)) return;
    setSelectedChordId("");
  }, [allChords, selectedChordId]);

  // Custom tuning modal helpers (for now uses 6-string layout)
  const customAppNotes = lowToHighToApp(customLowToHigh);
  function sanitizeCustomNoteValue(value) {
    return String(value ?? "")
      .replace(/[^a-z]/gi, "")
      .toUpperCase()
      .slice(0, 1);
  }
  function setCustomAppNote(index, value) {
    setCustomLowToHigh((prev) => {
      const app = lowToHighToApp(prev);
      const nextApp = app.slice();
      nextApp[index] = sanitizeCustomNoteValue(value);
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
            aria-label="Go to tab writer"
            onClick={returnToTabWriterFromLogo}
            style={{
              width: 210,
              height: 62,
              overflow: "hidden",
              borderRadius: 4,
              flexShrink: 0,
              position: "relative",
              top: 1,
              cursor: "pointer",
              border: "none",
              background: "transparent",
              padding: 0,
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
          </button>
        </div>

        <section style={{ display: "grid", gap: 12 }}>
          <h1
            style={{
              margin: 0,
              marginLeft: 0,
              width: 220,
              minWidth: 220,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              alignSelf: "flex-end",
              marginBottom: 11.25,
              fontSize: 13,
              fontWeight: 400,
              color: THEME.text,
              opacity: isDarkMode ? 0.75 : 0.65,
              letterSpacing: 0.2,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "visible",
            }}
          >
            {headerSloganReady ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  transform: `translate3d(${headerSloganAtFinalX ? 0 : 76}px, 0, 0)`,
                  transition: `transform ${HEADER_TAGLINE_SLIDE_MS}ms ${HEADER_TAGLINE_SLIDE_EASE}`,
                  willChange: "transform",
                }}
              >
                <span
                  style={{
                    opacity: headerSloganTextOpacity,
                    transition: `opacity ${HEADER_TAGLINE_FADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                  }}
                >
                  {"Tabs"}
                </span>
                <span
                  style={{
                    marginLeft: 0,
                    opacity: headerSloganTextOpacity,
                    transition: `opacity ${HEADER_TAGLINE_FADE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                  }}
                >
                  {sloganText.startsWith("Tabs") ? `${sloganText.slice(4)}` : sloganText}
                </span>
                <span
                  style={{
                    marginLeft: 0,
                    opacity: headerSloganDotVisible ? 1 : 0,
                    transition: "opacity 1700ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  .
                </span>
                {headerSloganTickVisible && (
                  <span
                    style={{
                      marginLeft: 2,
                      opacity: headerSloganTickOpacity,
                      transform: headerSloganTickMorphActive ? "translateX(-9px) scale(0.6)" : "translateX(0) scale(1)",
                      transition: "opacity 1700ms cubic-bezier(0.22, 1, 0.36, 1), transform 1700ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  >
                    ✓
                  </span>
                )}
              </span>
            ) : (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  color: THEME.text,
                  opacity: isDarkMode ? 0.9 : 0.88,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    minWidth: 78,
                    textAlign: "right",
                    opacity: headerIntroOpacity,
                    transition: "opacity 700ms ease",
                    fontStyle: "italic",
                    textShadow: isDarkMode
                      ? "0 0 10px rgba(255,255,255,0.18), 0 0 2px rgba(255,255,255,0.16)"
                      : "0 0 8px rgba(20,20,20,0.12), 0 0 2px rgba(20,20,20,0.1)",
                  }}
                >
                  {headerIntroVisible ? introActionText : ""}
                </span>
                <span
                  style={{
                    minWidth: 42,
                    opacity: headerIntroVisible
                      ? introIsPlayStep
                        ? headerIntroOpacity
                        : headerIntroTabsAnchored
                          ? isDarkMode
                            ? 0.8
                            : 0.72
                          : headerIntroOpacity
                      : 0,
                    transition: "opacity 700ms ease",
                  }}
                >
                  Tabs
                </span>
              </span>
            )}
          </h1>
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
        padding: "0 18px 18px",
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
        onCopy={handleGridCopy}
        onCut={handleGridCut}
        onPaste={handleGridPaste}
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
          ...siteHeaderBarStyle(THEME),
          marginLeft: -18,
          marginRight: -18,
        }}
      >
        <div style={siteHeaderLeftGroupStyle}>
          <button
            className={brandLogoButtonClass}
            type="button"
            aria-label="Go to tab writer"
            onClick={returnToTabWriterFromLogo}
            style={siteHeaderLogoButtonStyle}
          >
            <img
              src={isDarkMode ? logoDark : logoLight}
              alt="TabStudio"
              style={siteHeaderLogoImageStyle}
            />
          </button>
          <div style={siteHeaderSloganStyle(THEME.text, isDarkMode ? 0.75 : 0.65)}>
            Tabs, simplified.
          </div>
        </div>

        <div style={siteHeaderRightGroupStyle}>
          {!accountProfileOpen ? (
            <>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={exportModalOpen ? exportUndo : undo}
                  disabled={undoDisabled}
                  {...headerBtnHoverHandlers("undo", undoDisabled)}
                  {...pressHandlers("undo", undoDisabled)}
                  style={headerTextBtnStyle("undo", {
                    disabled: undoDisabled,
                    arrow: true,
                  })}
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
                  onClick={exportModalOpen ? exportRedo : redo}
                  disabled={redoDisabled}
                  {...headerBtnHoverHandlers("redo", redoDisabled)}
                  {...pressHandlers("redo", redoDisabled)}
                  style={headerTextBtnStyle("redo", {
                    disabled: redoDisabled,
                    arrow: true,
                  })}
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

              <div
                aria-hidden="true"
                style={{
                  opacity: 0.34,
                  fontSize: 18,
                  fontWeight: 700,
                  lineHeight: 1,
                  margin: "0 2px",
                }}
              >
                |
              </div>
            </>
          ) : null}

          <div ref={saveProjectsGroupRef} style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {!accountProfileOpen && !projectsLibraryOpen && !exportModalOpen ? (
              <button
                type="button"
                onClick={handleSaveTabClick}
                ref={saveHeaderBtnRef}
                className={tabbyTourHighlightClassFor("save")}
                {...headerBtnHoverHandlers("saveTab")}
                {...pressHandlers("saveTab")}
                style={headerTextBtnStyle("saveTab", { primary: true })}
              >
                {tr("Save", "Guardar")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleOpenTabClick}
              className={tabbyTourHighlightClassFor("projects")}
              {...headerBtnHoverHandlers("openTab")}
              {...pressHandlers("openTab")}
              style={headerTextBtnStyle("openTab", { activeSelected: projectsLibraryOpen })}
            >
              {tr("Projects", "Proyectos")}
            </button>

            <button
              type="button"
              onClick={openExportModal}
              {...headerBtnHoverHandlers("export")}
              {...pressHandlers("export")}
              style={headerTextBtnStyle("export")}
            >
              {tr("Export", "Exportar")}
            </button>

            <div
              aria-hidden="true"
              style={{
                opacity: 0.34,
                fontSize: 18,
                fontWeight: 700,
                lineHeight: 1,
                margin: "0 2px",
              }}
            >
              |
            </div>

            {!isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => navigateTo("/signin")}
                  {...headerBtnHoverHandlers("signIn")}
                  {...pressHandlers("signIn")}
                  style={headerTextBtnStyle("signIn")}
                >
                  Sign In
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo("/membership")}
                  {...headerBtnHoverHandlers("becomeMember")}
                  {...pressHandlers("becomeMember")}
                  style={siteHeaderPrimaryCtaStyle({
                    hovered: headerHoverBtn === "becomeMember",
                    pressed: pressedBtnId === "becomeMember",
                  })}
                >
                  Become a Member
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={openAccountProfilePanel}
                {...headerBtnHoverHandlers("account")}
                {...pressHandlers("account")}
                style={headerTextBtnStyle("account")}
              >
                Account
              </button>
            )}

            <div
              aria-hidden="true"
              style={{
                opacity: 0.34,
                fontSize: 18,
                fontWeight: 700,
                lineHeight: 1,
                margin: "0 2px",
              }}
            >
              |
            </div>

            <div
              style={{ position: "relative" }}
              onMouseEnter={() => {
                if (helpMenuHoverCloseTimerRef.current) {
                  window.clearTimeout(helpMenuHoverCloseTimerRef.current);
                  helpMenuHoverCloseTimerRef.current = null;
                }
              }}
              onMouseLeave={() => {
                if (helpMenuHoverOpenTimerRef.current) {
                  window.clearTimeout(helpMenuHoverOpenTimerRef.current);
                  helpMenuHoverOpenTimerRef.current = null;
                }
                if (helpMenuHoverCloseTimerRef.current) {
                  window.clearTimeout(helpMenuHoverCloseTimerRef.current);
                }
                helpMenuHoverCloseTimerRef.current = window.setTimeout(() => {
                  setHelpMenuOpen(false);
                  setHelpMenuHoverPath("");
                  helpMenuHoverCloseTimerRef.current = null;
                }, 120);
              }}
            >
              <button
                ref={helpBtnRef}
                type="button"
                onClick={() => setHelpMenuOpen((v) => !v)}
                onMouseEnter={() => {
                  setHeaderHoverBtn("help");
                  if (helpMenuHoverCloseTimerRef.current) {
                    window.clearTimeout(helpMenuHoverCloseTimerRef.current);
                    helpMenuHoverCloseTimerRef.current = null;
                  }
                  if (helpMenuOpen || helpMenuHoverOpenTimerRef.current) return;
                  helpMenuHoverOpenTimerRef.current = window.setTimeout(() => {
                    setHelpMenuOpen(true);
                    helpMenuHoverOpenTimerRef.current = null;
                  }, 500);
                }}
                onMouseLeave={() => {
                  setHeaderHoverBtn((prev) => (prev === "help" ? "" : prev));
                  if (helpMenuHoverOpenTimerRef.current) {
                    window.clearTimeout(helpMenuHoverOpenTimerRef.current);
                    helpMenuHoverOpenTimerRef.current = null;
                  }
                }}
                onBlur={() => setHeaderHoverBtn((prev) => (prev === "help" ? "" : prev))}
                {...pressHandlers("help")}
                style={{
                  ...headerTextBtnStyle("help", { iconOnly: true }),
                  fontSize: 20,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
                aria-label="Help"
              >
                ?
              </button>
              {helpMenuOpen && (
                <div
                  ref={helpMenuRef}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 8px)",
                    minWidth: 260,
                    borderRadius: 12,
                    border: `1px solid ${THEME.border}`,
                    background: THEME.surfaceWarm,
                    boxShadow: "0 16px 32px rgba(0,0,0,0.28)",
                    overflow: "hidden",
                    zIndex: 1400,
                    padding: 8,
                    display: "grid",
                    gap: 8,
                  }}
                >
                  {[
                    {
                      label: "About TabStudio",
                      description: "Learn about the app and its purpose",
                      path: "/about",
                    },
                    {
                      label: "FAQs",
                      description: "Common questions and answers",
                      path: "/faq",
                    },
                    {
                      label: "Support",
                      description: "Report bugs or get help",
                      path: "/support",
                    },
                  ].map((item) => (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => {
                        setHelpMenuOpen(false);
                        setHelpMenuHoverPath("");
                        navigateTo(item.path);
                      }}
                      onMouseEnter={() => setHelpMenuHoverPath(item.path)}
                      onMouseLeave={() => setHelpMenuHoverPath((prev) => (prev === item.path ? "" : prev))}
                      style={{
                        width: "100%",
                        ...btnSecondary,
                        minHeight: 56,
                        padding: "10px 12px",
                        borderRadius: 10,
                        borderColor: helpMenuHoverPath === item.path ? withAlpha(THEME.accent, 0.7) : THEME.border,
                        background:
                          helpMenuHoverPath === item.path ? withAlpha(THEME.accent, isDarkMode ? 0.14 : 0.09) : "transparent",
                        color: THEME.text,
                        fontWeight: 800,
                        justifyContent: "flex-start",
                        display: "grid",
                        gap: 4,
                        textAlign: "left",
                        transform: helpMenuHoverPath === item.path ? "translateY(-1px)" : "translateY(0)",
                        boxShadow:
                          helpMenuHoverPath === item.path ? `0 0 0 2px ${withAlpha(THEME.accent, isDarkMode ? 0.12 : 0.08)}` : "none",
                        transition: "background 140ms ease, border-color 140ms ease, transform 140ms ease, box-shadow 140ms ease",
                      }}
                    >
                      <span style={{ fontWeight: 900, color: THEME.text }}>{item.label}</span>
                      <span style={{ fontSize: 11, color: THEME.textFaint, fontWeight: 700 }}>{item.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              ref={settingsBtnRef}
              type="button"
              onClick={() =>
                setSettingsOpen((v) => {
                  const next = !v;
                  if (next) setSettingsFullscreen(false);
                  return next;
                })
              }
              {...headerBtnHoverHandlers("settings")}
              {...pressHandlers("settings")}
              style={headerTextBtnStyle("settings", { iconOnly: true })}
              aria-label="Settings"
            >
              ⛭
            </button>
          </div>
        </div>
      </div>

      {isVisibleTabbyTourActive ? (
        tabbyTourSpotlightRect && tabbyTourSpotlightRect.width > 0 && tabbyTourSpotlightRect.height > 0 ? (
          <>
            <div
              className={tabbyTourDimLayerClass}
              aria-hidden="true"
              style={{ top: 0, left: 0, right: 0, height: tabbyTourSpotlightRect.top }}
            />
            <div
              className={tabbyTourDimLayerClass}
              aria-hidden="true"
              style={{
                top: tabbyTourSpotlightRect.top,
                left: 0,
                width: tabbyTourSpotlightRect.left,
                height: tabbyTourSpotlightRect.height,
              }}
            />
            <div
              className={tabbyTourDimLayerClass}
              aria-hidden="true"
              style={{
                top: tabbyTourSpotlightRect.top,
                left: tabbyTourSpotlightRect.left + tabbyTourSpotlightRect.width,
                right: 0,
                height: tabbyTourSpotlightRect.height,
              }}
            />
            <div
              className={tabbyTourDimLayerClass}
              aria-hidden="true"
              style={{
                top: tabbyTourSpotlightRect.top + tabbyTourSpotlightRect.height,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          </>
        ) : (
          <div className={tabbyTourDimLayerClass} aria-hidden="true" style={{ inset: 0 }} />
        )
      ) : null}

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
        <SettingsPanel
          shared={{
            ACCENT_PRESETS,
            AvatarSilhouetteIcon,
            SHORTCUTS_ACTION_ES,
            SHORTCUTS_CATEGORY_FILTERS,
            SHORTCUTS_DESC_ES,
            SHORTCUTS_SCOPE_ES,
            TABBY_ASSIST_MINT,
            TABBY_ASSIST_MINT_STRONG,
            TABSTUDIO_TUTORIAL_URL,
            accountAvatarDataUrl,
            accountSummaryName,
            accountSummaryTier,
            activeAccent,
            accentColorId,
            btnSecondary,
            btnSmallPillClose,
            commitDefaultColsInput,
            defaultColsInput,
            editorHasMembership,
            filteredShortcuts,
            getAvatarInitials,
            gridTabbyHidden,
            isDarkMode,
            isLoggedIn,
            languageFooterHover,
            openResetEditorSettingsDialog,
            openSettingsAccountEntry,
            pillMono,
            profileFooterHover,
            resolvedTheme,
            scrollScope,
            setAccentColorId,
            setAboutOpen,
            setDefaultColsInput,
            setFaqsOpen,
            setLanguageFooterHover,
            setProfileFooterHover,
            setScrollScope,
            setSettingsAccentHoverId,
            setSettingsFullscreen,
            setSettingsLanguageOpen,
            setSettingsLanguagePreview,
            setSettingsOpen,
            setShortcutsCategoryFilter,
            setShortcutsOpen,
            setShortcutsShowBoth,
            setShowCapoControl,
            setShowTempoControl,
            setTabWritingOpen,
            setTabbyAssistantVisible,
            setTabCopyMode,
            setThemeMode,
            settingsAccordionCardStyle,
            settingsAccentHoverId,
            settingsControlRowStyle,
            settingsExpandedContentStyle,
            settingsExpandHandleRef,
            settingsFullscreen,
            settingsHintTextStyle,
            settingsLanguageBtnRef,
            settingsLanguageMenuRef,
            settingsLanguageOpen,
            settingsLanguagePreview,
            settingsOpen,
            settingsPanelRef,
            settingsPanelWidth,
            settingsPanelWidthCss,
            settingsSectionToggleVisual,
            settingsSubgroupHeadingStyle,
            settingsSubgroupStyle,
            shortcutPlatform,
            shortcutsAutoShowBoth,
            shortcutsCategoryFilter,
            shortcutsDisplayBoth,
            shortcutsOpen,
            shortcutsShowBoth,
            showCapoControl,
            showTempoControl,
            tabCopyMode,
            tabWritingOpen,
            themeMode,
            THEME,
            tr,
            withAlpha,
          }}
        />

        {/* Main editor */}
        <div
          ref={editorSurfaceRef}
          className="tab-editor-surface"
          style={{
            width: "100%",
            minWidth: 0,
            transform: settingsOpen && !settingsFullscreen && !accountProfileOpen ? `translateX(${settingsPanelWidthCss})` : undefined,
            transition: "transform 220ms ease",
          }}
        >
          {/* Song info */}
          <EditorMetadataPanel
            shared={{
              actionDeleteBtn,
              albumCreateOpen,
              albumMenuOpen,
              albumMenuRef,
              albumSelectRef,
              albumsForCurrentArtist,
              allTunings,
              appToLowToHigh,
              applyTuningOption,
              artistCreateOpen,
              artistMenuOpen,
              artistMenuRef,
              artistSelectRef,
              availableArtistNames,
              btnSecondary,
              btnSmallPillClose,
              capoBtnRef,
              capoEnabled,
              capoFret,
              capoFretFocused,
              capoInputRef,
              capoLabel,
              capoOpen,
              capoPanelRef,
              capoReplaceOnTypeRef,
              capoSectionRef,
              card,
              cellSize,
              confirmCreateAlbum,
              confirmCreateArtist,
              currentInstrument,
              customOpen,
              customTuningAddBtnRef,
              deleteUserTuning,
              effectiveAlbumLabel,
              effectiveArtistLabel,
              expandedInstrumentGroup,
              favInstrumentIds,
              favouriteInstruments,
              field,
              focusKeyCapture,
              formatLowToHighString,
              formatTuningName,
              groupedInstruments,
              handleInstrumentChange,
              instrumentBtnRef,
              instrumentId,
              instrumentOpen,
              instrumentPanelRef,
              instrumentSectionRef,
              isDarkMode,
              newAlbumDraft,
              newAlbumInputRef,
              newArtistDraft,
              newArtistInputRef,
              pillMono,
              resetCustomFormToCurrent,
              setAlbumCreateOpen,
              setAlbumMenuOpen,
              setAlbumName,
              setArtist,
              setArtistCreateOpen,
              setArtistMenuOpen,
              setCapoEnabled,
              setCapoFret,
              setCapoFretFocused,
              setCapoOpen,
              setCapoReplaceOnType,
              setCustomOpen,
              setExpandedInstrumentGroup,
              setInstrumentOpen,
              setNewAlbumDraft,
              setNewArtistDraft,
              setSongTitle,
              setTuningOpen,
              showCapoControl,
              showTempoControl,
              songMetaGridColumns,
              songMetaSectionRef,
              songTitle,
              songTitleInputRef,
              tabbyTourHighlightClassFor,
              tempoPanelNode: showTempoControl ? (
                <div style={{ minWidth: 0 }}>
                  <label
                    style={{
                      display: "block",
                      margin: "0 0 7px 10px",
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: withAlpha(THEME.text, isDarkMode ? 0.72 : 0.7),
                      lineHeight: 1.1,
                    }}
                  >
                    TEMPO
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        ...field,
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        minWidth: 0,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {`Tempo: ${
                        (() => {
                          const parsed = Number(String(tempoBpm ?? "").trim());
                          if (!Number.isFinite(parsed)) return 120;
                          return Math.max(30, Math.min(300, parsed));
                        })()
                      } BPM`}
                    </div>
                    <input
                      ref={tempoInputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={tempoBpm}
                      onMouseDown={() => {
                        clearTempoAutoCommitTimer();
                        setTempoReplaceOnType(true);
                        tempoReplaceOnTypeRef.current = true;
                      }}
                      onPointerDown={(e) => {
                        if (e.button !== 0) return;
                        tempoDragRef.current = {
                          active: true,
                          pointerId: e.pointerId,
                          lastY: e.clientY,
                          carry: 0,
                        };
                        try {
                          e.currentTarget.setPointerCapture(e.pointerId);
                        } catch {}
                      }}
                      onPointerMove={(e) => {
                        const drag = tempoDragRef.current;
                        if (!drag.active || drag.pointerId !== e.pointerId) return;
                        const deltaPx = drag.lastY - e.clientY;
                        drag.lastY = e.clientY;
                        drag.carry += deltaPx;
                        const stepPx = 10;
                        if (Math.abs(drag.carry) < stepPx) return;
                        const steps = drag.carry > 0 ? Math.floor(drag.carry / stepPx) : Math.ceil(drag.carry / stepPx);
                        drag.carry -= steps * stepPx;
                        nudgeTempo(steps);
                      }}
                      onPointerUp={(e) => {
                        const drag = tempoDragRef.current;
                        if (drag.pointerId !== e.pointerId) return;
                        drag.active = false;
                        drag.pointerId = null;
                        drag.carry = 0;
                        try {
                          e.currentTarget.releasePointerCapture(e.pointerId);
                        } catch {}
                      }}
                      onPointerCancel={(e) => {
                        const drag = tempoDragRef.current;
                        if (drag.pointerId !== e.pointerId) return;
                        drag.active = false;
                        drag.pointerId = null;
                        drag.carry = 0;
                      }}
                      onSelect={(e) => {
                        const len = String(tempoBpm ?? "").length;
                        try {
                          e.currentTarget.setSelectionRange(len, len);
                        } catch {}
                      }}
                      onDragStart={(e) => e.preventDefault()}
                      onChange={(e) => {
                        const raw = String(e.target.value ?? "").replace(/[^\d]/g, "").slice(0, 3);
                        setTempoBpm(raw);
                        scheduleTempoAutoCommit(raw);
                      }}
                      onFocus={() => {
                        setTempoFocused(true);
                        clearTempoAutoCommitTimer();
                        setTempoReplaceOnType(true);
                        tempoReplaceOnTypeRef.current = true;
                      }}
                      onBlur={() => {
                        setTempoFocused(false);
                        clearTempoAutoCommitTimer();
                        commitTempoInput();
                        setTempoReplaceOnType(false);
                        tempoReplaceOnTypeRef.current = false;
                      }}
                      onKeyDown={(e) => {
                        if (/^\d$/.test(e.key)) {
                          e.preventDefault();
                          const replace = tempoReplaceOnTypeRef.current;
                          setTempoBpm((prev) => {
                            const base = replace ? "" : String(prev ?? "");
                            const nextRaw = `${base}${e.key}`.replace(/[^\d]/g, "").slice(0, 3);
                            scheduleTempoAutoCommit(nextRaw);
                            return nextRaw;
                          });
                          if (replace) {
                            setTempoReplaceOnType(false);
                            tempoReplaceOnTypeRef.current = false;
                          }
                          return;
                        }
                        if (e.key === "Backspace") {
                          e.preventDefault();
                          const nextRaw = String(tempoBpm ?? "").slice(0, -1);
                          setTempoReplaceOnType(false);
                          tempoReplaceOnTypeRef.current = false;
                          setTempoBpm(nextRaw);
                          scheduleTempoAutoCommit(nextRaw);
                          return;
                        }
                        if (e.key === "Delete") {
                          e.preventDefault();
                          setTempoReplaceOnType(false);
                          tempoReplaceOnTypeRef.current = false;
                          setTempoBpm("");
                          clearTempoAutoCommitTimer();
                          return;
                        }
                        if (e.key === "Enter") {
                          e.preventDefault();
                          clearTempoAutoCommitTimer();
                          commitTempoInput();
                          setTempoReplaceOnType(false);
                          tempoReplaceOnTypeRef.current = false;
                          e.currentTarget.blur();
                          focusKeyCapture();
                          return;
                        }
                        if (e.key === "Tab") return;
                        e.preventDefault();
                      }}
                      style={{
                        width: 56,
                        height: cellSize,
                        borderRadius: 12,
                        border: `1px solid ${tempoFocused ? THEME.accent : THEME.border}`,
                        outline: "none",
                        boxShadow: tempoFocused ? `0 0 0 3px ${withAlpha(THEME.accent, 0.18)}` : "none",
                        textAlign: "center",
                        ...pillMono,
                        background: THEME.surfaceWarm,
                        color: THEME.text,
                        caretColor: "transparent",
                        cursor: "pointer",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        boxSizing: "border-box",
                      }}
                      title="Tempo (30–300 BPM)"
                    />
                  </div>
                </div>
              ) : null,
              THEME,
              toggleFavouriteInstrument,
              tr,
              tuning,
              tuningBtnRef,
              tuningLabel,
              tuningMatchesCurrent,
              tuningOpen,
              tuningPanelRef,
              tuningSectionRef,
              userTuningsById,
              validateCapo,
              withAlpha,
            }}
          />

          <div ref={tabWriterAreaRef}>
          {/* Toolbar */}
          <EditorToolbar
            shared={{
              actionDeleteBtn,
              actionEditBtn,
              allChords,
              applyChordToSelectedColumn,
              btnPrimary,
              btnSecondary,
              btnSmallPillClose,
              chordName,
              chordsBtnRef,
              chordsOpen,
              chordsPanelRef,
              chordsPanelShiftX,
              chordsSection,
              chordsSectionRef,
              clearAll,
              clearColsAutoCommitTimer,
              colsControlRef,
              colsDragRef,
              colsInput,
              colsInputRef,
              colsRapidClickRef,
              colsReplaceOnTypeRef,
              commitColsInput,
              completeRow,
              completeRowBtnRef,
              cursorRef,
              EditIcon,
              effectivePresetChords,
              field,
              fillSelectedColumnWith,
              focusKeyCapture,
              gridRef,
              handleColsTripleClickReset,
              hasGridContent,
              INSERT_OPTIONS,
              insertBtnRef,
              insertIntoSelectedCell,
              insertOpen,
              insertPanelRef,
              insertPanelShiftX,
              insertSectionRef,
              lastAppliedChordId,
              MAX_COLS,
              MIN_COLS,
              nudgeCols,
              openEditChordModal,
              pillMono,
              pressHandlers,
              pressedBtnId,
              pressVisual,
              repeatLastChord,
              requestDeleteUserChord,
              saveChordFromSelectedColumn,
              saveCustomChordToLibrary,
              scheduleColsAutoCommit,
              selectedChordId,
              setCell,
              setChordName,
              setChordsOpen,
              setChordsSection,
              setCols,
              setColsInput,
              setColsReplaceOnType,
              setInsertOpen,
              setOverwriteNext,
              setSelectedChordId,
              standard: chordToolEnabled,
              tabbyTourHighlightClassFor,
              THEME,
              toolbarMenuBtn,
              toolbarToggleVisual,
              tr,
              userChords: currentUserChords,
              withAlpha,
            }}
          />

          {/* Grid */}
          <TabGrid
            shared={{
              capoFretFocused,
              cellIdleBg,
              cellSize,
              cols,
              cursor,
              firstExportGlowActive,
              formatTapSyncTimestamp,
              gridHighlightRef,
              gridRowScrollRefs,
              gridTargetingActive,
              gridView,
              handleGridRowScroll,
              isCellSelected,
              isDarkMode,
              onCellPointerDown,
              onCellPointerEnter,
              tabbyTourHighlightClassFor,
              tapSyncMode,
              tapSyncNoteTimings,
              tapSyncReplayItemId,
              tapSyncShowTimestamps,
              THEME,
              tuning,
              withAlpha,
            }}
          />

            {isEditorGridActiveSurface ? (
              <TabbyAssistant
                shared={{
                  activeGridTabbyTooltipMode,
                  activeTabbyTourStep,
                  blockTabbyHoverTooltip,
                  btnSecondary,
                  btnSmallPillClose,
                  closeTabbyTourToIdle,
                  finishTabbyTour,
                  goToMembershipFromFinalTourStep,
                  goToNextTabbyTourStep,
                  goToPrevTabbyTourStep,
                  gridTabbyBubbleLayout,
                  gridTabbyBubbleWidth,
                  gridTabbyHidden,
                  gridTabbyHiding,
                  isDarkMode,
                  isFinalTabbyTourStep,
                  isGridTabbyTooltipVisible,
                  isTabbyTourActive: isVisibleTabbyTourActive,
                  lockedFeatureTooltip,
                  lockedFeatureTooltipVisible,
                  onBecomeMemberFromLockedTooltip: handleLockedTooltipMembershipClick,
                  onHideAssistant: hideGridTabbyAssistant,
                  onOpenWalkthrough: openGridTabbyWalkthrough,
                  setBlockTabbyHoverTooltip,
                  setIsHoveringTabby,
                  setTabbyHoverTooltipVisible,
                  showGridTabbyOnboarding,
                  TABBY_ASSIST_MINT,
                  tabbyDark,
                  tabbyLight,
                  tabbyTourActionPrimaryClass,
                  tabbyTourStepsLength: tabbyTourSteps.length,
                  THEME,
                  tourStep,
                  VIEWPORT_TABBY_ASSET_MAX_WIDTH_PX,
                  VIEWPORT_TABBY_BOTTOM_PX,
                  VIEWPORT_TABBY_CONTAINER_SIZE_PX,
                  VIEWPORT_TABBY_GLOW_SIZE_PX,
                  VIEWPORT_TABBY_RIGHT_PX,
                  VIEWPORT_TABBY_Z_INDEX,
                  withAlpha,
                }}
              />
            ) : null}
          </div>

          {/* Completed rows */}
          {completedRows.length > 0 && (
            <div ref={completedRowsSectionRef} style={{ marginTop: 16 }}>
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
                  <span style={{ fontSize: 12, opacity: 0.95 }}>{completedRowsOpen ? "▲" : "▼"}</span>
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
                    const rowSyncTimestampMs = tapSyncRowTimings[row.id];
                    const rowReplayActive = tapSyncReplayItemId === `row:${row.id}`;
                    const rowHasTiming = Number.isFinite(Number(rowSyncTimestampMs));

                    
  return (
                      <div
                        key={row.id}
                        data-sync-row-id={row.id}
                        style={{
                          ...card,
                          borderColor: rowReplayActive ? withAlpha(THEME.accent, 0.9) : card.borderColor || THEME.border,
                          boxShadow: rowReplayActive ? `0 0 0 1px ${withAlpha(THEME.accent, 0.28)} inset` : card.boxShadow || "none",
                        }}
                        draggable
                        onDragStart={(e) => onDragStartRow(e, row.id)}
                        onDragOver={onDragOverRow}
                        onDrop={(e) => onDropRow(e, row.id)}
                        onClick={(e) => {
                          const target = e.target;
                          if (target instanceof Element && target.closest("button,input,textarea,select,a")) return;
                          recordTapSyncRow(row.id);
                        }}
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
                                {row.name || `Row ${idx + 1}`}
                              </button>
                            )}

                            <span style={{ fontSize: 12, color: THEME.textFaint }}>({idx + 1})</span>
                            {tapSyncShowTimestamps && tapSyncMode === "row" && rowHasTiming && (
                              <span style={{ fontSize: 11, fontWeight: 900, color: THEME.accent }}>
                                {formatTapSyncTimestamp(rowSyncTimestampMs)}
                              </span>
                            )}
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
                                style={{ ...actionEditBtn }}
                                title="Edit row"
                                aria-label="Edit row"
                              >
                                <EditIcon />
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

          {uiDialog && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.52)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                zIndex: 5250,
              }}
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) closeUiDialog();
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
                  <div style={{ fontSize: 20, fontWeight: 950, color: THEME.text }}>{uiDialog.title || "Confirm"}</div>
                  <button type="button" onClick={closeUiDialog} style={{ ...btnSmallPillClose }}>
                    Close
                  </button>
                </div>
                {!!String(uiDialog.message || "").trim() && (
                  <div style={{ marginTop: 8, color: THEME.textFaint, fontSize: 14 }}>{uiDialog.message}</div>
                )}
                {uiDialog.type === "prompt" && (
                  <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                    <input
                      ref={uiDialogInputRef}
                      value={String(uiDialog.value || "")}
                      onChange={(e) => setUiDialog((prev) => (prev ? { ...prev, value: e.target.value } : prev))}
                      placeholder={String(uiDialog.placeholder || "")}
                      style={{ ...field, fontWeight: 800 }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          submitUiDialog();
                          return;
                        }
                        if (e.key === "Escape") {
                          e.preventDefault();
                          closeUiDialog();
                        }
                      }}
                    />
                    {Array.isArray(uiDialog.assignmentArtistOptions) && uiDialog.assignmentArtistOptions.length > 0 && (
                      <label style={{ display: "grid", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: THEME.textFaint }}>
                          {uiDialog.assignmentArtistLabel || "Artist"}
                        </span>
                        <div style={{ position: "relative" }}>
                          <button
                            type="button"
                            onClick={() =>
                              setUiDialog((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      assignmentArtistOpen: !prev.assignmentArtistOpen,
                                      assignmentAlbumOpen: false,
                                    }
                                  : prev
                              )
                            }
                            style={{
                              ...field,
                              fontWeight: 800,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 10,
                              textAlign: "left",
                              borderColor: uiDialog.assignmentArtistOpen ? THEME.accent : THEME.border,
                              boxShadow: uiDialog.assignmentArtistOpen ? `0 0 0 3px ${withAlpha(THEME.accent, 0.16)}` : "none",
                            }}
                          >
                            <span>{String(uiDialog.assignmentArtistName || "Unsorted")}</span>
                            <span style={{ opacity: 0.95 }}>{uiDialog.assignmentArtistOpen ? "▲" : "▼"}</span>
                          </button>
                          {uiDialog.assignmentArtistOpen && (
                            <div
                              style={{
                                ...menuPanel(THEME),
                                position: "absolute",
                                top: "calc(100% + 8px)",
                                left: 0,
                                right: 0,
                                zIndex: 20,
                                maxHeight: 220,
                                overflowY: "auto",
                              }}
                            >
                              <div style={{ display: "grid", gap: 6 }}>
                                {uiDialog.assignmentArtistOptions.map((option) => {
                                  const selected = option === String(uiDialog.assignmentArtistName || "Unsorted");
                                  return (
                                    <button
                                      key={option}
                                      type="button"
                                      onClick={() =>
                                        setUiDialog((prev) => {
                                          if (!prev) return prev;
                                          const nextArtistName = option;
                                          const nextAlbumOptions =
                                            prev.assignmentAlbumOptionsByArtist?.[nextArtistName] ||
                                            prev.assignmentAlbumOptionsByArtist?.Unsorted ||
                                            [NO_ALBUM_NAME];
                                          return {
                                            ...prev,
                                            assignmentArtistName: nextArtistName,
                                            assignmentArtistOpen: false,
                                            assignmentAlbumOpen: false,
                                            assignmentAlbumName: nextAlbumOptions.includes(prev.assignmentAlbumName)
                                              ? prev.assignmentAlbumName
                                              : nextAlbumOptions[0] || NO_ALBUM_NAME,
                                          };
                                        })
                                      }
                                      style={{
                                        ...(selected
                                          ? menuItemSelected(THEME, {
                                              borderColor: withAlpha(THEME.text, 0.28),
                                              background: withAlpha(THEME.text, 0.08),
                                              boxShadow: `0 0 0 1px ${withAlpha(THEME.text, 0.12)} inset`,
                                            })
                                          : menuItem(THEME)),
                                        minHeight: 46,
                                      }}
                                    >
                                      <span>{option}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </label>
                    )}
                    {uiDialog.assignmentAlbumOptionsByArtist && (
                      <label style={{ display: "grid", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: THEME.textFaint }}>
                          {uiDialog.assignmentAlbumLabel || "Album"}
                        </span>
                        <div style={{ position: "relative" }}>
                          <button
                            type="button"
                            onClick={() =>
                              setUiDialog((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      assignmentAlbumOpen: !prev.assignmentAlbumOpen,
                                      assignmentArtistOpen: false,
                                    }
                                  : prev
                              )
                            }
                            style={{
                              ...field,
                              fontWeight: 800,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 10,
                              textAlign: "left",
                              borderColor: uiDialog.assignmentAlbumOpen ? THEME.accent : THEME.border,
                              boxShadow: uiDialog.assignmentAlbumOpen ? `0 0 0 3px ${withAlpha(THEME.accent, 0.16)}` : "none",
                            }}
                          >
                            <span>{String(uiDialog.assignmentAlbumName || NO_ALBUM_NAME)}</span>
                            <span style={{ opacity: 0.95 }}>{uiDialog.assignmentAlbumOpen ? "▲" : "▼"}</span>
                          </button>
                          {uiDialog.assignmentAlbumOpen && (
                            <div
                              style={{
                                ...menuPanel(THEME),
                                position: "absolute",
                                top: "calc(100% + 8px)",
                                left: 0,
                                right: 0,
                                zIndex: 20,
                                maxHeight: 220,
                                overflowY: "auto",
                              }}
                            >
                              <div style={{ display: "grid", gap: 6 }}>
                                {(
                                  uiDialog.assignmentAlbumOptionsByArtist?.[String(uiDialog.assignmentArtistName || "Unsorted")] ||
                                  uiDialog.assignmentAlbumOptionsByArtist?.Unsorted ||
                                  [NO_ALBUM_NAME]
                                ).map((option) => {
                                  const selected = option === String(uiDialog.assignmentAlbumName || NO_ALBUM_NAME);
                                  return (
                                    <button
                                      key={option}
                                      type="button"
                                      onClick={() =>
                                        setUiDialog((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                assignmentAlbumName: option,
                                                assignmentAlbumOpen: false,
                                              }
                                            : prev
                                        )
                                      }
                                      style={{
                                        ...(selected
                                          ? menuItemSelected(THEME, {
                                              borderColor: withAlpha(THEME.text, 0.28),
                                              background: withAlpha(THEME.text, 0.08),
                                              boxShadow: `0 0 0 1px ${withAlpha(THEME.text, 0.12)} inset`,
                                            })
                                          : menuItem(THEME)),
                                        minHeight: 46,
                                      }}
                                    >
                                      <span>{option}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </label>
                    )}
                  </div>
                )}
                <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  {uiDialog.type === "prompt" && typeof uiDialog.onExtraAction === "function" && (
                    <button
                      type="button"
                      onClick={runUiDialogExtraAction}
                      style={{
                        ...btnSecondary,
                        height: 36,
                        padding: "0 12px",
                        marginRight: "auto",
                        borderColor: uiDialog.extraActionDanger ? "rgba(176,0,32,0.25)" : THEME.border,
                        color: uiDialog.extraActionDanger ? THEME.danger : THEME.text,
                        background: uiDialog.extraActionDanger ? THEME.dangerBg : THEME.surfaceWarm,
                      }}
                    >
                      {uiDialog.extraActionLabel || "Delete"}
                    </button>
                  )}
                  <button type="button" onClick={closeUiDialog} style={{ ...btnSecondary, height: 36, padding: "0 12px" }}>
                    {uiDialog.cancelLabel || "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={submitUiDialog}
                    style={{
                      ...btnSecondary,
                      height: 36,
                      padding: "0 12px",
                      borderColor: uiDialog.danger ? "rgba(176,0,32,0.25)" : withAlpha(THEME.accent, 0.6),
                      color: uiDialog.danger ? THEME.danger : THEME.accent,
                      background: uiDialog.danger ? THEME.dangerBg : THEME.surfaceWarm,
                    }}
                  >
                    {uiDialog.confirmLabel || "Confirm"}
                  </button>
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
                    Close
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

          {songDeleteConfirmTarget && (
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
                if (e.target === e.currentTarget) closeDeleteLibrarySongConfirm();
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
                  <div style={{ fontSize: 20, fontWeight: 950, color: THEME.text }}>Delete song?</div>
                  <button type="button" onClick={closeDeleteLibrarySongConfirm} style={{ ...btnSmallPillClose }}>
                    Close
                  </button>
                </div>
                <div style={{ marginTop: 8, color: THEME.textFaint, fontSize: 14 }}>
                  {`"${songDeleteConfirmTarget.song}" will be removed from this album. This action cannot be undone.`}
                </div>
                <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button
                    type="button"
                    onClick={closeDeleteLibrarySongConfirm}
                    style={{ ...btnSecondary, height: 36, padding: "0 12px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteLibrarySong}
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

          {libraryDeleteConfirmTarget && (
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
                if (e.target === e.currentTarget) closeDeleteLibraryConfirm();
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
                    {libraryDeleteConfirmTarget.type === "artist" ? "Delete artist?" : "Delete album?"}
                  </div>
                  <button type="button" onClick={closeDeleteLibraryConfirm} style={{ ...btnSmallPillClose }}>
                    Close
                  </button>
                </div>
                <div style={{ marginTop: 8, color: THEME.textFaint, fontSize: 14 }}>
                  {libraryDeleteConfirmTarget.type === "artist"
                    ? `"${libraryDeleteConfirmTarget.artistName}" and all albums/songs will be removed.`
                    : `"${libraryDeleteConfirmTarget.album}" and all songs in it will be removed.`}
                </div>
                <div style={{ marginTop: 8, color: THEME.textFaint, fontSize: 13 }}>
                  {libraryDeleteConfirmTarget.stage === "countdown" &&
                    `Delete unlocks in ${libraryDeleteConfirmTarget.remaining}s. You can still cancel.`}
                </div>
                <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                  <div>
                    {libraryDeleteConfirmTarget.stage === "countdown" && (
                      <button
                        type="button"
                        onClick={skipDeleteLibraryWaitAndDeleteNow}
                        style={{
                          ...btnSecondary,
                          height: 36,
                          padding: "0 12px",
                          borderColor: "rgba(176,0,32,0.25)",
                          color: THEME.danger,
                          background: THEME.dangerBg,
                        }}
                      >
                        Delete now
                      </button>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={closeDeleteLibraryConfirm}
                      style={{ ...btnSecondary, height: 36, padding: "0 12px" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmDeleteLibraryConfirm}
                      disabled={libraryDeleteConfirmTarget.stage === "countdown"}
                      style={{
                        ...btnSecondary,
                        height: 36,
                        padding: "0 12px",
                        borderColor: "rgba(176,0,32,0.25)",
                        color: libraryDeleteConfirmTarget.stage === "countdown" ? THEME.textMuted : THEME.danger,
                        background:
                          libraryDeleteConfirmTarget.stage === "countdown"
                            ? withAlpha(THEME.surfaceWarm, 0.55)
                            : THEME.dangerBg,
                        cursor: libraryDeleteConfirmTarget.stage === "countdown" ? "default" : "pointer",
                      }}
                    >
                      {libraryDeleteConfirmTarget.stage === "idle" && "Delete"}
                      {libraryDeleteConfirmTarget.stage === "countdown" &&
                        `Delete (${libraryDeleteConfirmTarget.remaining})`}
                      {libraryDeleteConfirmTarget.stage === "armed" && "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {chordDeleteConfirmId && (
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
                if (e.target === e.currentTarget) closeDeleteUserChordConfirm();
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
                  <div style={{ fontSize: 20, fontWeight: 950, color: THEME.text }}>Delete chord?</div>
                  <button type="button" onClick={closeDeleteUserChordConfirm} style={{ ...btnSmallPillClose }}>
                    Close
                  </button>
                </div>
                <div style={{ marginTop: 8, color: THEME.textFaint, fontSize: 14 }}>
                  {`"${
                    userChords.find((c) => c.id === chordDeleteConfirmId)?.name || "This saved chord"
                  }" will be removed. This action cannot be undone.`}
                </div>
                <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button
                    type="button"
                    onClick={closeDeleteUserChordConfirm}
                    style={{ ...btnSecondary, height: 36, padding: "0 12px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteUserChord}
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
          <AccountPage
            shared={{
              accountAvatarDataUrl,
              accountBillingCycle,
              accountEmail,
              accountFullName,
              accountMemberSince,
              accountProfileOpen,
              accountProfileSection,
              accountPlanId,
              accountRenewalDate,
              accountTier,
              billingEmail,
              btnSmallPill,
              btnSmallPillClose,
              btnSmallPillDanger,
              card,
              defaultPaymentMethod,
              editorHasMembership,
              field,
              isDarkMode,
              profileBio,
              profileDisplayName,
              profileHandle,
              profileWebsite,
              recentInvoices,
              recentSessions,
              securityEmail,
              securityTwoFactorEnabled,
              settingsPanelWidthCss,
              settingsLanguagePreview,
              setAccountAvatarDataUrl,
              setAccountProfileOpen,
              setAccountProfileSection,
              setBillingEmail,
              setDefaultPaymentMethod,
              setProfileBio,
              setProfileDisplayName,
              setProfileHandle,
              setProfileWebsite,
              setSettingsLanguagePreview,
              setSecurityEmail,
              setSecurityTwoFactorEnabled,
              setSubscriptionAutoRenew,
              subscriptionAutoRenew,
              THEME,
              toolbarMenuBtn,
              withAlpha,
              onSaveAccountProfile: saveAccountProfile,
              onOpenMembershipPlans: openMembershipFromAccount,
              onSignOut: handleAccountSignOut,
            }}
          />

          <ProjectsPage
            shared={{
              actionDeleteBtn,
              actionEditBtn,
              albumCreateOpen,
              artistCreateOpen,
              availableArtistNames,
              btnSecondary,
              btnSmallPillClose,
              confirmCreateArtist,
              confirmCreateLibraryAlbum,
              confirmCreateLibrarySong,
              EditIcon,
              field,
              libraryAlbumCreateOpen,
              libraryNewAlbumDraft,
              libraryNewAlbumInputRef,
              libraryNewSongDraft,
              libraryNewSongInputRef,
              librarySongCreateOpen,
              loadLibrarySongByPath,
              microBtnHoverHandlers,
              microBtnInteractiveStyle,
              moveLibraryAlbum,
              moveLibraryArtist,
              moveLibrarySong,
              moveLibrarySongToAlbum,
              newArtistDraft,
              newArtistInputRef,
              NO_ALBUM_NAME,
              pressHandlers,
              projectsLibraryOpen,
              renameLibraryAlbum,
              renameLibraryArtist,
              renameLibrarySong,
              requestDeleteLibrarySong,
              userProjects,
              projectsLoading,
              projectsLoadError,
              projectActionBusyId,
              refreshUserProjects,
              openSupabaseProject,
              currentProjectId,
              selectedLibraryAlbumName,
              selectedLibraryAlbums,
              selectedLibraryArtistLabel,
              selectedLibrarySongName,
              selectedLibrarySongs,
              setAlbumCreateOpen,
              setAlbumName,
              setArtist,
              setArtistCreateOpen,
              setLibraryAlbumCreateOpen,
              setLibraryNewAlbumDraft,
              setLibraryNewSongDraft,
              setLibrarySongCreateOpen,
              setNewArtistDraft,
              setProjectsLibraryOpen,
              setSelectedLibraryAlbumName,
              setSelectedLibraryArtistKey,
              setSelectedLibrarySongName,
              THEME,
              withAlpha,
            }}
          />

          {/* Export modal */}
          <ExportPage
            exportModalOpen={exportModalOpen}
            onRequestClose={() => {
              if (anyExportBusy) return;
              setExportModalOpen(false);
              setImageExportProgress("");
              setVideoExportProgress("");
            }}
            THEME={THEME}
            card={card}
            btnSecondary={btnSecondary}
            field={field}
            withAlpha={withAlpha}
            userState={userState}
            userPlanType={userPlanType}
            canExportPngTabs={canExportPngTabs}
            updateUserState={updateUserState}
            TABBY_ASSIST_MINT={TABBY_ASSIST_MINT}
            normalizeHexColorOrFallback={normalizeHexColorOrFallback}
            formatTapSyncTimestamp={formatTapSyncTimestamp}
            collectVideoSyncNoteSequence={collectVideoSyncNoteSequence}
            makeExportRowLabel={makeExportRowLabel}
            showMembershipGateToast={showMembershipGateToast}
            exportFormat={exportFormat}
            setExportFormat={setExportFormat}
            pdfSettingsOpenSection={pdfSettingsOpenSection}
            setPdfSettingsOpenSection={setPdfSettingsOpenSection}
            completedRows={completedRows}
            pdfRowGrouping={pdfRowGrouping}
            setPdfRowGrouping={setPdfRowGrouping}
            imageThickness={imageThickness}
            setImageThickness={setImageThickness}
            pdfShowArtist={pdfShowArtist}
            setPdfShowArtist={setPdfShowArtist}
            pdfShowAlbum={pdfShowAlbum}
            setPdfShowAlbum={setPdfShowAlbum}
            pdfShowSong={pdfShowSong}
            setPdfShowSong={setPdfShowSong}
            pdfShowInstrument={pdfShowInstrument}
            setPdfShowInstrument={setPdfShowInstrument}
            pdfShowTuning={pdfShowTuning}
            setPdfShowTuning={setPdfShowTuning}
            pdfShowCapo={pdfShowCapo}
            setPdfShowCapo={setPdfShowCapo}
            showTempoControl={showTempoControl}
            pdfShowTempo={pdfShowTempo}
            setPdfShowTempo={setPdfShowTempo}
            exportPdfNow={exportPdfNow}
            setExportPdfHover={setExportPdfHover}
            exportPdfHover={exportPdfHover}
            pdfPreviewScale={pdfPreviewScale}
            setPdfPreviewScale={setPdfPreviewScale}
            pdfPreviewLayout={pdfPreviewLayout}
            videoPlaybackSpeed={videoPlaybackSpeed}
            setVideoPlaybackSpeed={setVideoPlaybackSpeed}
            videoBgMode={videoBgMode}
            setVideoBgMode={setVideoBgMode}
            videoBgColor={videoBgColor}
            setVideoBgColor={setVideoBgColor}
            videoAnimationStyle={videoAnimationStyle}
            setVideoAnimationStyle={setVideoAnimationStyle}
            videoBrandingMode={videoBrandingMode}
            setVideoBrandingMode={setVideoBrandingMode}
            handleVideoAudioFileChange={handleVideoAudioFileChange}
            videoAudioName={videoAudioName}
            videoAudioUrl={videoAudioUrl}
            videoAudioRef={videoAudioRef}
            videoAudioPlaybackRate={videoAudioPlaybackRate}
            setVideoAudioPlaybackRate={setVideoAudioPlaybackRate}
            selectedExportCount={selectedExportCount}
            selectedExportVideoNoteCount={selectedExportVideoNoteCount}
            selectedExportMissingVideoSyncCount={selectedExportMissingVideoSyncCount}
            setImageExportRowIds={setImageExportRowIds}
            imageExportRowIds={imageExportRowIds}
            videoSyncTimings={videoSyncTimings}
            toggleImageExportRow={toggleImageExportRow}
            clearVideoSyncRow={clearVideoSyncRow}
            startVideoSyncRecording={startVideoSyncRecording}
            videoSyncRecording={videoSyncRecording}
            stopVideoSyncRecording={stopVideoSyncRecording}
            recordNextVideoSyncPoint={recordNextVideoSyncPoint}
            clearVideoSyncAll={clearVideoSyncAll}
            videoExportProgress={videoExportProgress}
            videoExportBusy={videoExportBusy}
            canExportVideoNow={canExportVideoNow}
            exportVideoNow={exportVideoNow}
            selectedExportVideoNotes={selectedExportVideoNotes}
            videoSyncCursorIndex={videoSyncCursorIndex}
            imageSettingsOpenSection={imageSettingsOpenSection}
            setImageSettingsOpenSection={setImageSettingsOpenSection}
            imageShowRowNames={imageShowRowNames}
            setImageShowRowNames={setImageShowRowNames}
            imageMultiExportMode={imageMultiExportMode}
            setImageMultiExportMode={setImageMultiExportMode}
            canUseTapToSync={canUseTapToSync}
            setTapSyncOpen={setTapSyncOpen}
            tapSyncOpen={tapSyncOpen}
            tapSyncMode={tapSyncMode}
            setTapSyncMode={setTapSyncMode}
            tapSyncShowTimestamps={tapSyncShowTimestamps}
            setTapSyncShowTimestamps={setTapSyncShowTimestamps}
            tapSyncReplayDuration={tapSyncReplayDuration}
            setTapSyncReplayDuration={setTapSyncReplayDuration}
            tapSyncReplaceOnClick={tapSyncReplaceOnClick}
            setTapSyncReplaceOnClick={setTapSyncReplaceOnClick}
            tapSyncAutoScroll={tapSyncAutoScroll}
            setTapSyncAutoScroll={setTapSyncAutoScroll}
            startTapSyncRecording={startTapSyncRecording}
            tapSyncReplayRunning={tapSyncReplayRunning}
            replayTapSync={replayTapSync}
            clearTapSyncForMode={clearTapSyncForMode}
            redoTapSync={redoTapSync}
            tapSyncStatusText={tapSyncStatusText}
            tapSyncTimingCount={tapSyncTimingCount}
            tapSyncNoteTimings={tapSyncNoteTimings}
            tapSyncRowTimings={tapSyncRowTimings}
            imageBgMode={imageBgMode}
            setImageBgMode={setImageBgMode}
            imageExportSize={imageExportSize}
            setImageExportSize={setImageExportSize}
            imageExportPadding={imageExportPadding}
            setImageExportPadding={setImageExportPadding}
            imageBgColor={imageBgColor}
            setImageBgColor={setImageBgColor}
            imageTextColor={imageTextColor}
            setImageTextColor={setImageTextColor}
            imageTextOutline={imageTextOutline}
            setImageTextOutline={setImageTextOutline}
            imageShowArtist={imageShowArtist}
            setImageShowArtist={setImageShowArtist}
            imageShowAlbum={imageShowAlbum}
            setImageShowAlbum={setImageShowAlbum}
            imageShowSong={imageShowSong}
            setImageShowSong={setImageShowSong}
            imageShowInstrument={imageShowInstrument}
            setImageShowInstrument={setImageShowInstrument}
            imageShowTuning={imageShowTuning}
            setImageShowTuning={setImageShowTuning}
            imageShowCapo={imageShowCapo}
            setImageShowCapo={setImageShowCapo}
            imageShowTempo={imageShowTempo}
            setImageShowTempo={setImageShowTempo}
            imageShowBranding={imageShowBranding}
            setImageShowBranding={setImageShowBranding}
            exportBrandingLocked={exportBrandingLocked}
            exportUseAffiliateBranding={exportUseAffiliateBranding}
            setExportUseAffiliateBranding={setExportUseAffiliateBranding}
            exportAffiliateLinkText={exportAffiliateLinkText}
            exportBrandingText={exportBrandingText}
            imageExportProgress={imageExportProgress}
            imageExportBusy={imageExportBusy}
            exportImagesNow={exportImagesNow}
            imagePreviewMetaText={imagePreviewMetaText}
            imagePreviewBusy={imagePreviewBusy}
            imagePreviewUrl={imagePreviewUrl}
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
            currentPresetChords={effectivePresetChords}
            sharedStandardPresetChords={sharedStandardPresetChords}
            currentUserChords={currentUserChords}
            allUserChords={userChords}
            saveCustomChordToLibrary={saveCustomChordToLibrary}
            availableChordTunings={allTunings}
            saveChordExportTuning={saveChordExportTuning}
          />

          {/* Edit chord modal */}
          {editChordModalOpen && (
            <div
              style={{
                ...editorModalOverlayStyle,
              }}
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) closeEditChordModal();
              }}
            >
              <div
                style={{
                  ...editorModalCardStyle,
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div style={editorModalHeaderStyle}>
                  <div>
                    <div style={{ fontWeight: 950, fontSize: 16 }}>Edit {editChordNameHeader || "chord"}</div>
                    <div style={{ fontSize: 12, color: THEME.textFaint, marginTop: 2 }}>Standard tuning only.</div>
                  </div>
                  <button
                    type="button"
                    onClick={closeEditChordModal}
                    style={editorModalCloseStyle}
                  >
                    Close
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
                        onMouseEnter={() => setEditChordHoverIndex(idx)}
                        onMouseLeave={() => setEditChordHoverIndex((prev) => (prev === idx ? -1 : prev))}
                        placeholder="- / 0–24 / x"
                        style={{
                          width: cellSize,
                          height: cellSize,
                          borderRadius: 12,
                          border: `1px solid ${editChordHoverIndex === idx ? modalMiniInputHoverStyle.borderColor : THEME.border}`,
                          textAlign: "center",
                          ...pillMono,
                          background: editChordHoverIndex === idx ? modalMiniInputHoverStyle.background : THEME.surfaceWarm,
                          color: THEME.text,
                          boxSizing: "border-box",
                          boxShadow: editChordHoverIndex === idx ? modalMiniInputHoverStyle.boxShadow : "none",
                          transition: "background 150ms ease, border-color 150ms ease, box-shadow 150ms ease",
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
                ...editorModalOverlayStyle,
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
                ref={customTuningModalRef}
                style={{
                  ...editorModalCardStyle,
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div style={editorModalHeaderStyle}>
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
                    style={editorModalCloseStyle}
                  >
                    Close
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
                          onMouseDown={(e) => {
                            e.preventDefault();
                            customNoteReplaceOnTypeRef.current[idx] = true;
                            try {
                              e.currentTarget.focus({ preventScroll: true });
                            } catch {
                              e.currentTarget.focus();
                            }
                            try {
                              e.currentTarget.select();
                            } catch {}
                          }}
                          onFocus={(e) => {
                            customNoteReplaceOnTypeRef.current[idx] = true;
                            try {
                              e.currentTarget.select();
                            } catch {}
                          }}
                          onBlur={() => {
                            customNoteReplaceOnTypeRef.current[idx] = false;
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const pasted = e.clipboardData?.getData("text") ?? "";
                            const normalized = sanitizeCustomNoteValue(pasted);
                            setCustomAppNote(idx, normalized);
                            customNoteReplaceOnTypeRef.current[idx] = false;
                          }}
                          onKeyDown={(e) => {
                            const key = String(e.key || "");
                            if (/^[a-z]$/i.test(key)) {
                              e.preventDefault();
                              const upper = key.toUpperCase();
                              const replace = customNoteReplaceOnTypeRef.current[idx];
                              if (replace) {
                                setCustomAppNote(idx, upper);
                                customNoteReplaceOnTypeRef.current[idx] = false;
                                return;
                              }
                              setCustomAppNote(idx, upper);
                              return;
                            }
                            if (key === "Backspace" || key === "Delete") {
                              e.preventDefault();
                              setCustomAppNote(idx, "");
                              customNoteReplaceOnTypeRef.current[idx] = false;
                              return;
                            }
                            if (key === "Tab") return;
                            if (key === "Enter") {
                              e.preventDefault();
                              e.currentTarget.blur();
                              return;
                            }
                            e.preventDefault();
                          }}
                          placeholder={DEFAULT_TUNING[idx].toUpperCase()}
                          inputMode="text"
                          autoCapitalize="characters"
                          autoCorrect="off"
                          spellCheck={false}
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

        </div>
      </div>
    </div>
  );
}
