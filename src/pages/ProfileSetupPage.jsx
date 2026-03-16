import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppHeader from "../components/AppHeader";
import { inputErrorText, inputHintText, inputImmersive, inputLabel } from "../utils/uiTokens";

const DEFAULT_GENDER_VALUE = "prefer-not-to-say";

function parseStoredBirthday(value) {
  const raw = String(value || "").trim();
  if (!raw) return { day: "", month: "", year: "" };
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return { day: isoMatch[3], month: isoMatch[2], year: isoMatch[1] };
  const displayMatch = raw.match(/^(\d{2}) \/ (\d{2}) \/ (\d{4})$/);
  if (displayMatch) return { day: displayMatch[1], month: displayMatch[2], year: displayMatch[3] };
  return { day: "", month: "", year: "" };
}

function buildBirthdayValue(day, month, year) {
  if (!day || !month || !year) return "";
  return `${String(day).padStart(2, "0")} / ${String(month).padStart(2, "0")} / ${String(year)}`;
}

function getDaysInMonth(month, year) {
  const numericMonth = Number(month);
  const numericYear = Number(year) || 2000;
  if (!numericMonth || numericMonth < 1 || numericMonth > 12) return 31;
  return new Date(numericYear, numericMonth, 0).getDate();
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

export default function ProfileSetupPage({ shared }) {
  const {
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
    logoDark,
    logoLight,
    onBackToEditor,
    onSaveProfile,
    siteHeaderBarStyle,
    siteHeaderLeftGroupStyle,
    siteHeaderLogoButtonStyle,
    siteHeaderLogoImageStyle,
    siteHeaderSloganStyle,
    tabbyDark,
    tabbyLight,
    userState,
    withAlpha,
  } = shared;

  const [themeRefresh, setThemeRefresh] = useState(0);
  const [profileCardHover, setProfileCardHover] = useState(false);
  const [profileTabbyFloatUp, setProfileTabbyFloatUp] = useState(false);
  const [profileFocusedField, setProfileFocusedField] = useState("");
  const [profileHoveredField, setProfileHoveredField] = useState("");
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [displayName, setDisplayName] = useState(() => String(userState?.profile?.displayName || ""));
  const [heardAbout, setHeardAbout] = useState(() => String(userState?.profile?.heardAbout || ""));
  const [gender, setGender] = useState(() => String(userState?.profile?.gender || DEFAULT_GENDER_VALUE));
  const storedBirthday = useMemo(() => parseStoredBirthday(userState?.profile?.birthday), [userState]);
  const [birthDay, setBirthDay] = useState(() => storedBirthday.day);
  const [birthMonth, setBirthMonth] = useState(() => storedBirthday.month);
  const [birthYear, setBirthYear] = useState(() => storedBirthday.year);
  const [avatarDataUrl, setAvatarDataUrl] = useState(() => String(userState?.profile?.avatarDataUrl || ""));
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [favoriteInstrumentIds, setFavoriteInstrumentIds] = useState(() => {
    const existing = Array.isArray(userState?.profile?.favoriteInstrumentIds)
      ? userState.profile.favoriteInstrumentIds
      : [];
    return existing.filter((id) => INSTRUMENTS.some((inst) => inst.id === id));
  });
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const discoveryOptions = useMemo(
    () => ["YouTube", "Instagram", "TikTok", "Reddit", "Friend / Bandmate", "Google search", "Other"],
    []
  );
  const currentYear = new Date().getFullYear();
  const monthOptions = useMemo(
    () => [
      { value: "01", label: "Jan" },
      { value: "02", label: "Feb" },
      { value: "03", label: "Mar" },
      { value: "04", label: "Apr" },
      { value: "05", label: "May" },
      { value: "06", label: "Jun" },
      { value: "07", label: "Jul" },
      { value: "08", label: "Aug" },
      { value: "09", label: "Sep" },
      { value: "10", label: "Oct" },
      { value: "11", label: "Nov" },
      { value: "12", label: "Dec" },
    ],
    []
  );
  const yearOptions = useMemo(
    () => Array.from({ length: currentYear - 1899 }, (_, index) => String(currentYear - index)),
    [currentYear]
  );

  const getSystemTheme = useCallback(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }, []);
  const isDark = useMemo(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = window.localStorage.getItem(LS_THEME_MODE_KEY);
      if (stored === "dark") return true;
      if (stored === "light") return false;
    } catch {}
    return getSystemTheme() === "dark";
  }, [getSystemTheme, themeRefresh]);
  const accentId = useMemo(() => {
    const fallback = isDark ? "white" : "black";
    if (typeof window === "undefined") return fallback;
    try {
      const stored = window.localStorage.getItem(LS_ACCENT_COLOR_KEY);
      if (ACCENT_PRESETS.some((preset) => preset.id === stored)) {
        if (isDark && stored === "black") return fallback;
        if (!isDark && stored === "white") return fallback;
        return stored;
      }
    } catch {}
    return fallback;
  }, [isDark, themeRefresh]);
  const accent = useMemo(
    () => (ACCENT_PRESETS.find((preset) => preset.id === accentId) || ACCENT_PRESETS[0]).hex,
    [accentId]
  );
  const THEME = useMemo(() => ({ ...(isDark ? DARK_THEME : LIGHT_THEME), accent }), [isDark, accent]);
  const profileAvatarFallbackLabel = useMemo(
    () => String(displayName || userState?.profile?.displayName || "").trim(),
    [displayName, userState]
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onStorage = (e) => {
      if (!e?.key || e.key === LS_THEME_MODE_KEY || e.key === LS_ACCENT_COLOR_KEY) setThemeRefresh((v) => v + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const id = window.setInterval(() => setProfileTabbyFloatUp((v) => !v), 2200);
    return () => window.clearInterval(id);
  }, []);

  const inputStyle = (field, overrides = {}) => ({
    ...inputImmersive({
      focused: profileFocusedField === field,
      hovered: profileHoveredField === field,
      minHeight: 44,
      padding: "0 12px",
      fontSize: 16,
      fontWeight: 700,
    }),
    ...overrides,
  });
  const labelStyle = inputLabel(THEME);
  const hintTextStyle = inputHintText(THEME);
  const errorTextStyle = inputErrorText();
  const birthdaySelectStyle = {
    ...inputStyle("birthday"),
    paddingRight: 28,
    colorScheme: isDark ? "dark" : "light",
    WebkitTextFillColor: isDark ? "#ffffff" : undefined,
  };
  const birthday = useMemo(() => buildBirthdayValue(birthDay, birthMonth, birthYear), [birthDay, birthMonth, birthYear]);
  const maxBirthDay = useMemo(() => getDaysInMonth(birthMonth, birthYear), [birthMonth, birthYear]);
  const dayOptions = useMemo(
    () => Array.from({ length: maxBirthDay }, (_, index) => String(index + 1).padStart(2, "0")),
    [maxBirthDay]
  );
  const isBirthdayValid = useMemo(() => {
    const match = String(birthday || "").match(/^(\d{2}) \/ (\d{2}) \/ (\d{4})$/);
    if (!match) return false;
    const [, dayText, monthText, yearText] = match;
    const day = Number(dayText);
    const month = Number(monthText);
    const year = Number(yearText);
    if (year < 1900 || year > currentYear) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    const candidate = new Date(year, month - 1, day);
    if (
      candidate.getFullYear() !== year ||
      candidate.getMonth() !== month - 1 ||
      candidate.getDate() !== day
    ) {
      return false;
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return candidate.getTime() <= today.getTime();
  }, [birthday, currentYear]);
  const shouldShowBirthdayError = Boolean(birthDay && birthMonth && birthYear) && !isBirthdayValid;

  useEffect(() => {
    if (birthDay && Number(birthDay) > maxBirthDay) {
      setBirthDay(String(maxBirthDay).padStart(2, "0"));
    }
  }, [birthDay, maxBirthDay]);

  const readImageFile = useCallback((file) => {
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarDataUrl(String(reader.result || ""));
    reader.readAsDataURL(file);
  }, []);

  const onDropAvatar = useCallback(
    (event) => {
      event.preventDefault();
      setDragOver(false);
      const file = event.dataTransfer?.files?.[0];
      readImageFile(file);
    },
    [readImageFile]
  );

  const toggleFavoriteInstrument = useCallback((instrumentId) => {
    setFavoriteInstrumentIds((prev) => {
      const next = new Set(prev);
      if (next.has(instrumentId)) next.delete(instrumentId);
      else next.add(instrumentId);
      return Array.from(next);
    });
  }, []);

  const saveAndComplete = useCallback(async () => {
    console.log("[ONBOARDING TRACE] ProfileSetupPage.saveAndComplete:start", {
      onboardingStep: 3,
      payload: {
        displayName: String(displayName || "").trim(),
        heardAbout: String(heardAbout || "").trim(),
        gender: String(gender || "").trim(),
        birthday: String(birthday || "").trim(),
        favoriteInstrumentIds,
        avatarDataUrl: String(avatarDataUrl || ""),
      },
    });
    const result = await onSaveProfile?.({
      displayName: String(displayName || "").trim(),
      heardAbout: String(heardAbout || "").trim(),
      gender: String(gender || "").trim(),
      birthday: String(birthday || "").trim(),
      favoriteInstrumentIds,
      avatarDataUrl: String(avatarDataUrl || ""),
    });
    if (result?.error) {
      console.log("[ONBOARDING TRACE] ProfileSetupPage.saveAndComplete:save-error", {
        error: result.error,
      });
      return;
    }
    console.log("[ONBOARDING TRACE] ProfileSetupPage.saveAndComplete:save-success");
    console.log("[ONBOARDING TRACE] ProfileSetupPage.saveAndComplete:post-save-action", {
      actionTriggeredAfterSave: "onBackToEditor",
    });
    onBackToEditor?.();
  }, [onSaveProfile, onBackToEditor, displayName, heardAbout, gender, birthday, favoriteInstrumentIds, avatarDataUrl]);
  const goNextStep = useCallback(() => {
    setOnboardingStep((prev) => Math.min(3, prev + 1));
  }, []);
  const canContinueStep1 =
    String(displayName || "").trim().length > 0 && String(gender || "").trim().length > 0 && isBirthdayValid;
  const canContinueStep2 = favoriteInstrumentIds.length > 0;
  const canCompleteStep3 = String(heardAbout || "").trim().length > 0;
  const canAdvance = onboardingStep === 1 ? canContinueStep1 : onboardingStep === 2 ? canContinueStep2 : canCompleteStep3;
  const handleOnboardingPrimary = useCallback(async () => {
    console.log("[ONBOARDING TRACE] ProfileSetupPage.handleOnboardingPrimary", {
      onboardingStep,
      canAdvance,
      isSavingProfile,
    });
    if (!canAdvance || isSavingProfile) return;
    if (onboardingStep === 3) {
      setIsSavingProfile(true);
      try {
        console.log("[ONBOARDING TRACE] ProfileSetupPage.handleOnboardingPrimary:save-start", {
          onboardingStep,
        });
        await saveAndComplete();
      } finally {
        setIsSavingProfile(false);
      }
      return;
    }
    goNextStep();
  }, [canAdvance, isSavingProfile, onboardingStep, saveAndComplete, goNextStep]);
  const handleLockedExit = useCallback(() => {}, []);
  return (
    <div
      style={{
        width: "100vw",
        maxWidth: "100vw",
        height: "100dvh",
        minHeight: "100vh",
        backgroundColor: THEME.bg,
        backgroundImage: `radial-gradient(1100px 760px at 50% 46%, ${withAlpha(TABBY_ASSIST_MINT, 0.1)} 0%, ${withAlpha(
          TABBY_ASSIST_MINT,
          0.04
        )} 34%, ${withAlpha(TABBY_ASSIST_MINT, 0)} 72%)`,
        backgroundRepeat: "no-repeat",
        color: THEME.text,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr)",
        overflowX: "hidden",
        overflowY: "hidden",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes tabstudio-onboarding-dot-fade {
          0%, 20% { opacity: 0.2; }
          50%, 100% { opacity: 1; }
        }
      `}</style>
      <AppHeader
        shared={{
          isDark,
          logoAriaLabel: "Back to editor",
          onLogoClick: handleLockedExit,
          rightContent: null,
          showRightGroup: false,
          siteHeaderBarStyle,
          siteHeaderLeftGroupStyle,
          siteHeaderLogoButtonStyle,
          siteHeaderLogoImageStyle,
          siteHeaderSloganStyle,
          theme: THEME,
        }}
      />
      <div
        style={{
          width: "100%",
          minHeight: "100vh",
          overflow: "hidden auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "26px 20px 36px",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "min(640px, calc(100vw - 28px))",
            display: "grid",
            alignItems: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "grid", gap: 14, alignContent: "center", justifyItems: "center", minWidth: 0 }}>
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 660,
                height: 600,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                background: `radial-gradient(circle at center, ${withAlpha(TABBY_ASSIST_MINT, 0.09)} 0%, ${withAlpha(
                  TABBY_ASSIST_MINT,
                  0.04
                )} 40%, ${withAlpha(TABBY_ASSIST_MINT, 0)} 75%)`,
                filter: `blur(${profileCardHover ? 28 : 24}px)`,
                opacity: profileCardHover ? 0.95 : 0.8,
                pointerEvents: "none",
                zIndex: 0,
                transition: "opacity 220ms ease, filter 220ms ease",
              }}
            />
            <div
              onMouseEnter={() => setProfileCardHover(true)}
              onMouseLeave={() => setProfileCardHover(false)}
              onFocus={() => setProfileCardHover(true)}
              onBlur={() => setProfileCardHover(false)}
              style={{
                width: "min(620px, 100%)",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(18,18,18,0.95)",
                padding: "30px 26px",
                boxSizing: "border-box",
                display: "grid",
                gap: 14,
                boxShadow: profileCardHover ? "0 14px 44px rgba(0,0,0,0.5)" : "0 12px 40px rgba(0,0,0,0.45)",
                transform: profileCardHover ? "translateY(-1px)" : "translateY(0)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div style={{ display: "grid", gap: 8, textAlign: "center" }}>
                <h1 style={{ margin: 0, fontSize: 39, fontWeight: 950, lineHeight: 1.04, letterSpacing: "-0.02em" }}>
                  {onboardingStep === 1
                    ? "Set up your TabStudio profile"
                    : onboardingStep === 2
                    ? "Choose your favourite instruments"
                    : "Where did you hear about TabStudio?"}
                </h1>
                <div style={{ color: withAlpha(THEME.text, 0.76), fontSize: 15, fontWeight: 700 }}>
                  {onboardingStep === 1
                    ? "Just a few quick details to finish setting up your account"
                    : onboardingStep === 2
                    ? "These will appear at the top of your instrument dropdown when writing tabs."
                    : "This helps us understand which channels are working best."}
                </div>
                <div style={{ color: THEME.textMuted, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {onboardingStep === 1 ? "Step 1 of 3 — Basic details" : `Step ${onboardingStep} of 3`}
                </div>
              </div>

              {onboardingStep === 1 && (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: THEME.textFaint }}>Profile picture</span>
                      <span style={{ fontSize: 11, fontWeight: 700, fontStyle: "italic", color: withAlpha(THEME.text, 0.58) }}>
                        optional
                      </span>
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={onDropAvatar}
                      style={{
                        borderRadius: 12,
                        border: `1px dashed ${withAlpha(THEME.accent, dragOver ? 0.8 : 0.45)}`,
                        background: dragOver ? withAlpha(THEME.accent, isDark ? 0.12 : 0.08) : withAlpha(THEME.text, isDark ? 0.03 : 0.02),
                        minHeight: 86,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: 12,
                        cursor: "pointer",
                        transition: "border-color 140ms ease, background 140ms ease",
                      }}
                    >
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: "50%",
                          border: `1px solid ${THEME.border}`,
                          background: withAlpha(THEME.text, isDark ? 0.03 : 0.02),
                          overflow: "hidden",
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        {avatarDataUrl ? (
                          <img src={avatarDataUrl} alt="Profile preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ fontSize: 14, fontWeight: 900, color: THEME.textFaint }}>
                            {getAvatarInitials(profileAvatarFallbackLabel)}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "grid", gap: 2 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 800 }}>Add a profile picture</span>
                          <span style={{ fontSize: 12, fontWeight: 700, fontStyle: "italic", color: withAlpha(THEME.text, 0.58) }}>
                            optional
                          </span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text }}>
                          Drag & drop or click to upload
                        </div>
                        <div style={{ fontSize: 12, color: THEME.textFaint, fontWeight: 700 }}>PNG, JPG, WEBP</div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => readImageFile(e.target.files?.[0])}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                    <div style={{ display: "grid", gap: 6 }}>
                      <label style={labelStyle}>Full Name</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        onMouseEnter={() => setProfileHoveredField("displayName")}
                        onMouseLeave={() => setProfileHoveredField((prev) => (prev === "displayName" ? "" : prev))}
                        onFocus={() => setProfileFocusedField("displayName")}
                        onBlur={() => setProfileFocusedField((prev) => (prev === "displayName" ? "" : prev))}
                        style={inputStyle("displayName")}
                      />
                    </div>
                    <div style={{ display: "grid", gap: 6 }}>
                      <label style={labelStyle}>Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        onMouseEnter={() => setProfileHoveredField("gender")}
                        onMouseLeave={() => setProfileHoveredField((prev) => (prev === "gender" ? "" : prev))}
                        onFocus={() => setProfileFocusedField("gender")}
                        onBlur={() => setProfileFocusedField((prev) => (prev === "gender" ? "" : prev))}
                        style={{ ...inputStyle("gender"), paddingRight: 28 }}
                      >
                        <option value={DEFAULT_GENDER_VALUE}>Prefer not to say</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="non-binary">Non-binary</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    <label style={labelStyle}>Date of birth</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                      <select
                        value={birthDay}
                        onChange={(e) => setBirthDay(e.target.value)}
                        onMouseEnter={() => setProfileHoveredField("birthday")}
                        onMouseLeave={() => setProfileHoveredField((prev) => (prev === "birthday" ? "" : prev))}
                        onFocus={() => setProfileFocusedField("birthday")}
                        onBlur={() => setProfileFocusedField((prev) => (prev === "birthday" ? "" : prev))}
                        style={birthdaySelectStyle}
                      >
                        <option value="">Day</option>
                        {dayOptions.map((day) => (
                          <option key={day} value={day}>
                            {Number(day)}
                          </option>
                        ))}
                      </select>
                      <select
                        value={birthMonth}
                        onChange={(e) => setBirthMonth(e.target.value)}
                        onMouseEnter={() => setProfileHoveredField("birthday")}
                        onMouseLeave={() => setProfileHoveredField((prev) => (prev === "birthday" ? "" : prev))}
                        onFocus={() => setProfileFocusedField("birthday")}
                        onBlur={() => setProfileFocusedField((prev) => (prev === "birthday" ? "" : prev))}
                        style={birthdaySelectStyle}
                      >
                        <option value="">Month</option>
                        {monthOptions.map((month) => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={birthYear}
                        onChange={(e) => setBirthYear(e.target.value)}
                        onMouseEnter={() => setProfileHoveredField("birthday")}
                        onMouseLeave={() => setProfileHoveredField((prev) => (prev === "birthday" ? "" : prev))}
                        onFocus={() => setProfileFocusedField("birthday")}
                        onBlur={() => setProfileFocusedField((prev) => (prev === "birthday" ? "" : prev))}
                        style={birthdaySelectStyle}
                      >
                        <option value="">Year</option>
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    {shouldShowBirthdayError ? <div style={errorTextStyle}>Please choose a valid past date</div> : null}
                  </div>
                </div>
              )}

              {onboardingStep === 2 && (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: THEME.textFaint }}>
                    Pick one or more instruments. Your selections become favourites in the editor.
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(176px, 1fr))", gap: 8 }}>
                    {INSTRUMENTS.map((inst) => {
                      const isSelected = favoriteInstrumentIds.includes(inst.id);
                      return (
                        <button
                          key={inst.id}
                          type="button"
                          onClick={() => toggleFavoriteInstrument(inst.id)}
                          style={{
                            minHeight: 38,
                            borderRadius: 10,
                            border: `1px solid ${isSelected ? withAlpha(TABBY_ASSIST_MINT, 0.8) : THEME.border}`,
                            background: isSelected ? withAlpha(TABBY_ASSIST_MINT, isDark ? 0.14 : 0.1) : withAlpha(THEME.text, isDark ? 0.03 : 0.02),
                            color: isSelected ? TABBY_ASSIST_MINT : THEME.text,
                            fontSize: 13,
                            fontWeight: 800,
                            padding: "0 10px",
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          {inst.label}
                        </button>
                      );
                    })}
                  </div>
                  <div style={hintTextStyle}>
                    Includes Guitar, Bass, Ukulele, 7-string guitar, and other supported instruments.
                  </div>
                </div>
              )}

              {onboardingStep === 3 && (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: THEME.textFaint }}>Choose one option</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {discoveryOptions.map((option) => {
                      const isSelected = heardAbout === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setHeardAbout(option)}
                          style={{
                            minHeight: 40,
                            borderRadius: 10,
                            border: `1px solid ${isSelected ? withAlpha(TABBY_ASSIST_MINT, 0.8) : THEME.border}`,
                            background: isSelected ? withAlpha(TABBY_ASSIST_MINT, isDark ? 0.14 : 0.1) : withAlpha(THEME.text, isDark ? 0.03 : 0.02),
                            color: isSelected ? TABBY_ASSIST_MINT : THEME.text,
                            fontSize: 14,
                            fontWeight: 800,
                            cursor: "pointer",
                            textAlign: "left",
                            padding: "0 12px",
                          }}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                {!canAdvance ? (
                  <div style={hintTextStyle}>
                    {onboardingStep === 1
                      ? "Display name, gender, and date of birth are required"
                      : onboardingStep === 2
                      ? "Please choose at least one favourite instrument."
                      : "Please choose where you heard about TabStudio."}
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={handleOnboardingPrimary}
                  disabled={!canAdvance || isSavingProfile}
                  style={{
                    minHeight: 46,
                    borderRadius: 11,
                    border: "none",
                    background: TABBY_ASSIST_MINT,
                    color: "#04120a",
                    fontSize: 17,
                    fontWeight: 900,
                    padding: "0 18px",
                    cursor: canAdvance && !isSavingProfile ? "pointer" : "not-allowed",
                    opacity: canAdvance && !isSavingProfile ? 1 : 0.62,
                  }}
                >
                  {onboardingStep === 3 ? (
                    isSavingProfile ? (
                      <span
                        aria-live="polite"
                        style={{ display: "inline-flex", alignItems: "baseline", justifyContent: "center", minWidth: 112 }}
                      >
                        <span>Completing</span>
                        <span aria-hidden="true" style={{ display: "inline-flex", width: 18, justifyContent: "flex-start" }}>
                          {[0, 1, 2].map((index) => (
                            <span
                              key={index}
                              style={{
                                animation: "tabstudio-onboarding-dot-fade 1.2s steps(1, end) infinite",
                                animationDelay: `${index * 0.2}s`,
                                opacity: 0.2,
                              }}
                            >
                              .
                            </span>
                          ))}
                        </span>
                      </span>
                    ) : (
                      "Complete Setup"
                    )
                  ) : (
                    "Next step"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {onboardingStep === 1 ? (
        <div
          style={{
            position: "fixed",
            right: VIEWPORT_TABBY_RIGHT_PX,
            bottom: VIEWPORT_TABBY_BOTTOM_PX,
            zIndex: VIEWPORT_TABBY_Z_INDEX,
            pointerEvents: "none",
          }}
          aria-hidden="true"
        >
          <div
            style={{
              position: "relative",
              width: VIEWPORT_TABBY_CONTAINER_SIZE_PX,
              height: VIEWPORT_TABBY_CONTAINER_SIZE_PX,
              transform: `translateY(${profileTabbyFloatUp ? -6 : 2}px)`,
              transition: "transform 2100ms cubic-bezier(0.42, 0, 0.28, 1)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <TabbySpeechBubble
              theme={THEME}
              isDark={isDark}
              accentColor={TABBY_ASSIST_MINT}
              variant="neutral"
              visible={true}
              bubbleWidth={260}
              bubbleMaxWidth={260}
              tailSide="bottom-center"
              pointerEvents="none"
              withAlpha={withAlpha}
              style={{
                position: "absolute",
                top: -10,
                left: "50%",
                transform: "translate(-50%, -100%)",
                fontSize: 12,
                fontWeight: 700,
                opacity: 0.88,
                transition: "opacity 320ms ease",
              }}
            >
              <span style={{ whiteSpace: "pre-line" }}>
                {"Welcome to the TabStudio family 🎉\nLet’s finish setting up your profile"}
              </span>
            </TabbySpeechBubble>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: VIEWPORT_TABBY_GLOW_SIZE_PX,
                height: VIEWPORT_TABBY_GLOW_SIZE_PX,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                background: `radial-gradient(circle at center, ${withAlpha("#FFFFFF", 0.24)} 0%, ${withAlpha("#FFFFFF", 0.12)} 42%, transparent 74%)`,
                filter: "blur(1px)",
              }}
            />
            <div style={{ position: "absolute", width: `min(${VIEWPORT_TABBY_ASSET_MAX_WIDTH_PX}px, 100%)` }}>
              <img
                src={isDark ? tabbyDark : tabbyLight}
                alt="Tabby"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  objectFit: "contain",
                  filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.24))",
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
