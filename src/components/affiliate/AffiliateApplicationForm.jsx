import React, { useEffect, useMemo, useRef, useState } from "react";
import { inputErrorText, inputImmersive, inputLabel } from "../../utils/uiTokens";
import AffiliateSuccessState from "./AffiliateSuccessState";
import { createAffiliateApplication } from "../../lib/affiliateApplications";

const STEP_ONE_FIELDS = ["fullName", "email", "creatorLink", "mainPlatform", "following"];

const STEP_TWO_FIELDS = ["contentType", "tabUsage", "featurePlan", "motivation"];

const PLATFORM_OPTIONS = ["Instagram", "YouTube", "TikTok", "Multiple / Mixed"];
const FOLLOWING_OPTIONS = ["Under 1,000", "1,000-5,000", "5,000-10,000", "10,000-50,000", "50,000-100,000", "100,000+"];
const CONTENT_TYPE_OPTIONS = [
  "Guitar Lessons",
  "Song Tutorials",
  "Riff Breakdowns",
  "Covers",
  "Original Music",
  "Gear Reviews",
  "Shorts / Reels",
  "Long Form Lessons",
  "Live Streams",
  "Podcasts",
  "Other",
];
const TAB_USAGE_OPTIONS = [
  "I don't use tabs",
  "I overlay tabs in videos",
  "I share PDF tabs",
  "I link tabs in bio",
  "I teach with tabs",
  "I post screenshots of tabs",
  "Selling tabs via Patreon/other",
];
const FEATURE_PLAN_OPTIONS = [
  "Tab overlays in videos",
  "Link in bio",
  "Link in captions",
  "Lesson downloads",
  "Members content",
  "YouTube descriptions",
  "Pinned comments",
];
const MOTIVATION_OPTIONS = [
  "Give followers better tabs",
  "Replace current tab tools",
  "Create lesson material",
  "Passive income from referrals",
];

function emptyErrors() {
  return {};
}

function isValidAffiliateApplicationEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export default function AffiliateApplicationForm({ theme, withAlpha, TABBY_ASSIST_MINT, TABBY_ASSIST_MINT_STRONG, onBackToProjects }) {
  const formTopRef = useRef(null);
  const submitButtonRef = useRef(null);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hoveredField, setHoveredField] = useState("");
  const [focusedField, setFocusedField] = useState("");
  const [ctaHover, setCtaHover] = useState(false);
  const [secondaryHover, setSecondaryHover] = useState(false);
  const [skipHover, setSkipHover] = useState(false);
  const [howItWorksHover, setHowItWorksHover] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    instagram: "",
    youtube: "",
    tiktok: "",
    otherLink: "",
    mainPlatform: "",
    following: "",
    contentType: [],
    tabUsage: [],
    featurePlan: [],
    motivation: [],
    extra: "",
  });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState(emptyErrors);
  const [submitError, setSubmitError] = useState("");

  const errorTextStyle = inputErrorText();
  const labelStyle = (field) => ({
    ...inputLabel(theme),
    color: focusedField === field ? withAlpha(theme.text, 0.92) : theme.textFaint,
  });
  const fieldStyle = (field, overrides = {}) => ({
    ...inputImmersive({
      focused: focusedField === field,
      hovered: hoveredField === field,
      minHeight: 46,
      padding: "0 12px",
      fontSize: 15,
      fontWeight: 700,
    }),
    borderColor:
      focusedField === field
        ? withAlpha(TABBY_ASSIST_MINT, 0.6)
        : hoveredField === field
          ? withAlpha(theme.text, 0.18)
          : withAlpha(theme.text, 0.08),
    boxShadow: focusedField === field ? `0 0 0 2px ${withAlpha(TABBY_ASSIST_MINT, 0.16)}` : "none",
    ...overrides,
  });
  const textareaStyle = (field) =>
    fieldStyle(field, {
      minHeight: 132,
      resize: "vertical",
      padding: "12px 14px",
      lineHeight: 1.55,
      fontFamily: "inherit",
    });
  const selectStyle = (field) => ({
    ...fieldStyle(field, {
      paddingRight: 40,
      colorScheme: "dark",
      appearance: "none",
      WebkitAppearance: "none",
    }),
  });
  const tagButtonStyle = (selected) => ({
    minHeight: 34,
    borderRadius: 999,
    border: `1px solid ${selected ? withAlpha(TABBY_ASSIST_MINT, 0.72) : withAlpha(theme.text, 0.1)}`,
    background: selected
      ? `linear-gradient(180deg, ${withAlpha(TABBY_ASSIST_MINT, 0.18)} 0%, ${withAlpha(TABBY_ASSIST_MINT, 0.1)} 100%)`
      : withAlpha(theme.text, 0.035),
    color: selected ? TABBY_ASSIST_MINT : theme.text,
    padding: "0 14px",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    transition: "background 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease",
    boxShadow: selected ? `0 0 0 1px ${withAlpha(TABBY_ASSIST_MINT, 0.08)}` : "none",
  });
  const sectionCardStyle = {
    display: "grid",
    gap: 12,
    padding: "16px 16px 18px",
    borderRadius: 16,
    border: `1px solid ${withAlpha(theme.text, 0.08)}`,
    background: withAlpha(theme.text, 0.028),
  };

  const setValue = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setSubmitError("");
  };
  const toggleArrayValue = (field, value) => {
    setForm((prev) => {
      const current = Array.isArray(prev[field]) ? prev[field] : [];
      return {
        ...prev,
        [field]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
      };
    });
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const hasAnyCreatorLink = useMemo(
    () =>
      [form.instagram, form.youtube, form.tiktok, form.otherLink].some((value) => String(value || "").trim().length > 0),
    [form.instagram, form.youtube, form.tiktok, form.otherLink]
  );

  const validateStepOne = () => {
    const next = {};
    if (!String(form.fullName || "").trim()) next.fullName = "Please enter your full name.";
    if (!isValidAffiliateApplicationEmail(form.email)) next.email = "Please enter a valid email.";
    if (!String(form.mainPlatform || "").trim()) next.mainPlatform = "Please select your main platform.";
    if (!String(form.following || "").trim()) next.following = "Please choose your approximate following.";
    if (!hasAnyCreatorLink) next.creatorLink = "Please include at least one creator link or handle so we can review your work.";
    return next;
  };

  const validateStepTwo = () => {
    return {};
  };

  const handleContinue = (event) => {
    event.preventDefault();
    setSubmitError("");
    const nextErrors = validateStepOne();
    setTouched((prev) => ({
      ...prev,
      ...Object.fromEntries(STEP_ONE_FIELDS.map((field) => [field, true])),
    }));
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    if (Object.keys(nextErrors).length) return;
    setStep(2);
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    setSubmitError("");
    const nextErrors = validateStepTwo();
    setTouched((prev) => ({
      ...prev,
      ...Object.fromEntries(STEP_TWO_FIELDS.map((field) => [field, true])),
    }));
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    try {
      const { error } = await createAffiliateApplication(form);
      if (error) {
        throw error;
      }

      const formData = form;
      const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").trim().replace(/\/+$/g, "");
      const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

      if (supabaseUrl && anonKey) {
        const functionUrl = `${supabaseUrl}/functions/v1/send-transactional-email`;
        const emailPayload = {
          to: "support@tabstudio.app",
          subject: "New Affiliate Application 🚀",
          from: "TabStudio <support@tabstudio.app>",
          html: `
            <p><strong>Full Name:</strong> ${String(formData.fullName || "").trim() || "Not provided"}</p>
            <p><strong>Email:</strong> ${String(formData.email || "").trim() || "Not provided"}</p>
            <p><strong>Instagram:</strong> ${String(formData.instagram || "").trim() || "Not provided"}</p>
            <p><strong>YouTube:</strong> ${String(formData.youtube || "").trim() || "Not provided"}</p>
            <p><strong>TikTok:</strong> ${String(formData.tiktok || "").trim() || "Not provided"}</p>
            <p><strong>Other Link:</strong> ${String(formData.otherLink || "").trim() || "Not provided"}</p>
            <p><strong>Main Platform:</strong> ${String(formData.mainPlatform || "").trim() || "Not provided"}</p>
            <p><strong>Approximate Following:</strong> ${String(formData.following || "").trim() || "Not provided"}</p>
            <p><strong>Content Type:</strong> ${
              Array.isArray(formData.contentType) && formData.contentType.length
                ? formData.contentType.join(", ")
                : "None selected"
            }</p>
            <p><strong>Tab Usage:</strong> ${
              Array.isArray(formData.tabUsage) && formData.tabUsage.length
                ? formData.tabUsage.join(", ")
                : "None selected"
            }</p>
            <p><strong>Feature Plan:</strong> ${
              Array.isArray(formData.featurePlan) && formData.featurePlan.length
                ? formData.featurePlan.join(", ")
                : "None selected"
            }</p>
            <p><strong>Motivation:</strong> ${
              Array.isArray(formData.motivation) && formData.motivation.length
                ? formData.motivation.join(", ")
                : "None selected"
            }</p>
            <p><strong>Anything Else:</strong> ${String(formData.extra || "").trim() || "Not provided"}</p>
          `,
        };

        try {
          const emailResponse = await fetch(functionUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${anonKey}`,
              apikey: anonKey,
            },
            body: JSON.stringify(emailPayload),
          });
          if (!emailResponse.ok) {
            const emailErrorText = await emailResponse.text().catch(() => "");
            console.error("[AffiliateApplicationForm] notification email failed", {
              status: emailResponse.status,
              body: emailErrorText,
            });
          }
        } catch (emailError) {
          console.error("[AffiliateApplicationForm] notification email request failed", emailError);
        }
      } else {
        console.error("[AffiliateApplicationForm] missing Supabase env for notification email", {
          hasSupabaseUrl: Boolean(supabaseUrl),
          hasAnonKey: Boolean(anonKey),
        });
      }

      setSubmitted(true);
    } catch (error) {
      console.error("[AffiliateApplicationForm] submit failed", error);
      setSubmitError(
        String(error?.message || "We couldn't submit your application right now. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  if (submitted) return <AffiliateSuccessState theme={theme} withAlpha={withAlpha} onBackToProjects={onBackToProjects} />;

  const isStepOneComplete =
    String(form.fullName || "").trim().length > 0 &&
    isValidAffiliateApplicationEmail(form.email) &&
    String(form.mainPlatform || "").trim().length > 0 &&
    String(form.following || "").trim().length > 0 &&
    hasAnyCreatorLink;
  const isStepTwoComplete =
    true;

  const primaryButtonStyle = (enabled = true) => ({
    minHeight: 46,
    borderRadius: 11,
    border: `1px solid ${enabled ? withAlpha(TABBY_ASSIST_MINT, 0.72) : withAlpha(theme.text, 0.08)}`,
    background: enabled ? (ctaHover ? TABBY_ASSIST_MINT_STRONG : TABBY_ASSIST_MINT) : withAlpha(theme.text, 0.06),
    color: enabled ? "#062016" : withAlpha(theme.text, 0.38),
    fontSize: 16,
    fontWeight: 900,
    cursor: enabled ? "pointer" : "not-allowed",
    opacity: enabled ? 1 : 1,
    boxShadow: enabled && ctaHover ? `0 10px 18px ${withAlpha(TABBY_ASSIST_MINT, 0.24)}` : "none",
    transform: enabled && ctaHover ? "translateY(-1px)" : "translateY(0)",
    filter: enabled && ctaHover ? "brightness(1.05)" : "brightness(1)",
    transition: "background 180ms ease, box-shadow 180ms ease, opacity 180ms ease, border-color 180ms ease, transform 180ms ease, filter 180ms ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  });

  const secondaryButtonStyle = {
    minHeight: 46,
    borderRadius: 11,
    border: `1px solid ${withAlpha(theme.text, 0.12)}`,
    background: secondaryHover ? withAlpha(theme.text, 0.08) : withAlpha(theme.text, 0.04),
    color: theme.text,
    fontSize: 15,
    fontWeight: 900,
    cursor: "pointer",
    transition: "background 180ms ease, border-color 180ms ease",
    padding: "0 18px",
  };
  const stepLabel = step === 1 ? "Step 1 of 2" : "Step 2 of 2";
  const skipButtonStyle = {
    border: "none",
    background: "transparent",
    padding: 0,
    fontSize: 13,
    lineHeight: 1.4,
    fontWeight: 700,
    color: withAlpha(theme.text, skipHover ? 0.78 : 0.62),
    cursor: "pointer",
    transition: "color 180ms ease, text-decoration-color 180ms ease",
    textDecoration: skipHover ? "underline" : "none",
    textUnderlineOffset: 3,
  };
  const renderTagSection = ({ sectionTitle, field, question, options }) => (
    <div style={sectionCardStyle}>
      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ fontSize: 15, lineHeight: 1.2, fontWeight: 900, color: theme.text }}>{sectionTitle}</div>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <label style={labelStyle(field)}>{question}</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {options.map((option) => {
            const selected = form[field].includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setTouched((prev) => ({ ...prev, [field]: true }));
                  toggleArrayValue(field, option);
                }}
                style={tagButtonStyle(selected)}
              >
                {option}
              </button>
            );
          })}
        </div>
        {touched[field] && errors[field] ? <div style={errorTextStyle}>{errors[field]}</div> : null}
      </div>
    </div>
  );

  return (
    <div ref={formTopRef} style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: withAlpha(theme.text, 0.48),
            }}
          >
            Affiliate Application
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: withAlpha(theme.text, 0.52),
              whiteSpace: "nowrap",
            }}
          >
            {stepLabel}
          </div>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 38, lineHeight: 1.04, letterSpacing: "-0.03em", fontWeight: 950 }}>
            Apply to partner with TabStudio
          </h1>
          {step === 1 ? (
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: withAlpha(theme.text, 0.7), fontWeight: 600 }}>
              Tell us about your content, audience, and where you&apos;d feature TabStudio. Approved affiliates receive a free
              TabStudio account and partnership access.
            </p>
          ) : null}
        </div>
        {step === 1 ? (
          <div
            onMouseEnter={() => setHowItWorksHover(true)}
            onMouseLeave={() => setHowItWorksHover(false)}
            style={{
              borderRadius: 14,
              border: `1px solid ${howItWorksHover ? withAlpha(TABBY_ASSIST_MINT, 0.5) : withAlpha(theme.text, 0.08)}`,
              background: howItWorksHover
                ? `linear-gradient(135deg, ${withAlpha(TABBY_ASSIST_MINT, 0.88)} 0%, ${withAlpha(TABBY_ASSIST_MINT_STRONG, 0.74)} 100%)`
                : withAlpha(theme.text, 0.035),
              padding: "14px 16px",
              display: "grid",
              gap: 6,
              boxShadow: howItWorksHover ? `0 14px 30px ${withAlpha(TABBY_ASSIST_MINT, 0.22)}` : "none",
              transition: "background 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
              marginBottom: 10,
            }}
          >
            <div style={{ display: "grid", gap: 4 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: howItWorksHover ? "#FFFFFF" : theme.accent,
                  transition: "color 180ms ease",
                }}
              >
                How it works
              </div>
              <div
                style={{
                  fontSize: 11,
                  lineHeight: 1.45,
                  fontWeight: 600,
                  color: howItWorksHover ? withAlpha("#FFFFFF", 0.72) : withAlpha(theme.text, 0.5),
                  transition: "color 180ms ease",
                }}
              >
                Takes 1-2 minutes to apply.
              </div>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {[
                "Apply with a few quick details",
                "We review your content",
                "If approved, you get a free TabStudio Creator account + referral link",
              ].map((stepText, index) => (
                <div
                  key={stepText}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "20px minmax(0, 1fr)",
                    gap: 10,
                    alignItems: "start",
                    color: howItWorksHover ? withAlpha("#FFFFFF", 0.94) : withAlpha(theme.text, 0.74),
                    transition: "color 180ms ease",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 900, lineHeight: 1.5 }}>{index + 1}.</div>
                  <div style={{ fontSize: 14, lineHeight: 1.55, fontWeight: 700 }}>{stepText}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {step === 1 ? (
        <form onSubmit={handleContinue} style={{ display: "grid", gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 24, lineHeight: 1.1, fontWeight: 900 }}>Creator Details</h2>

          <div style={{ display: "grid", gap: 7 }}>
            <label style={labelStyle("fullName")}>Full Name</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setValue("fullName", e.target.value)}
              onMouseEnter={() => setHoveredField("fullName")}
              onMouseLeave={() => setHoveredField((prev) => (prev === "fullName" ? "" : prev))}
              onFocus={() => setFocusedField("fullName")}
              onBlur={() => {
                setFocusedField((prev) => (prev === "fullName" ? "" : prev));
                setTouched((prev) => ({ ...prev, fullName: true }));
              }}
              style={fieldStyle("fullName")}
            />
            {touched.fullName && errors.fullName ? <div style={errorTextStyle}>{errors.fullName}</div> : null}
          </div>

          <div style={{ display: "grid", gap: 7 }}>
            <label style={labelStyle("email")}>Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setValue("email", e.target.value)}
              onMouseEnter={() => setHoveredField("email")}
              onMouseLeave={() => setHoveredField((prev) => (prev === "email" ? "" : prev))}
              onFocus={() => setFocusedField("email")}
              onBlur={() => {
                setFocusedField((prev) => (prev === "email" ? "" : prev));
                setTouched((prev) => ({ ...prev, email: true }));
                setErrors((prev) => ({
                  ...prev,
                  email:
                    String(form.email || "").trim().length > 0 && !isValidAffiliateApplicationEmail(form.email)
                      ? "Please enter a valid email."
                      : "",
                }));
              }}
              style={fieldStyle("email")}
            />
            {touched.email && errors.email ? <div style={errorTextStyle}>{errors.email}</div> : null}
          </div>

          <div style={{ display: "grid", gap: 7 }}>
            <label style={labelStyle("instagram")}>Instagram Handle / URL</label>
            <input
              type="text"
              value={form.instagram}
              onChange={(e) => setValue("instagram", e.target.value)}
              onMouseEnter={() => setHoveredField("instagram")}
              onMouseLeave={() => setHoveredField((prev) => (prev === "instagram" ? "" : prev))}
              onFocus={() => setFocusedField("instagram")}
              onBlur={() => {
                setFocusedField((prev) => (prev === "instagram" ? "" : prev));
                setTouched((prev) => ({ ...prev, instagram: true, creatorLink: true }));
              }}
              style={fieldStyle("instagram")}
            />
          </div>

          <div style={{ display: "grid", gap: 7 }}>
            <label style={labelStyle("youtube")}>YouTube Channel / URL</label>
            <input
              type="text"
              value={form.youtube}
              onChange={(e) => setValue("youtube", e.target.value)}
              onMouseEnter={() => setHoveredField("youtube")}
              onMouseLeave={() => setHoveredField((prev) => (prev === "youtube" ? "" : prev))}
              onFocus={() => setFocusedField("youtube")}
              onBlur={() => {
                setFocusedField((prev) => (prev === "youtube" ? "" : prev));
                setTouched((prev) => ({ ...prev, youtube: true, creatorLink: true }));
              }}
              style={fieldStyle("youtube")}
            />
          </div>

          <div style={{ fontSize: 12, lineHeight: 1.5, color: withAlpha(theme.text, 0.56), fontWeight: 600 }}>
            Please include at least one main content platform and one link or handle so we can review your work.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
            <div style={{ display: "grid", gap: 7 }}>
              <label style={labelStyle("tiktok")}>TikTok Handle / URL (optional)</label>
              <input
                type="text"
                value={form.tiktok}
                onChange={(e) => setValue("tiktok", e.target.value)}
                onMouseEnter={() => setHoveredField("tiktok")}
                onMouseLeave={() => setHoveredField((prev) => (prev === "tiktok" ? "" : prev))}
                onFocus={() => setFocusedField("tiktok")}
                onBlur={() => {
                  setFocusedField((prev) => (prev === "tiktok" ? "" : prev));
                  setTouched((prev) => ({ ...prev, tiktok: true, creatorLink: true }));
                }}
                style={fieldStyle("tiktok")}
              />
            </div>
            <div style={{ display: "grid", gap: 7 }}>
              <label style={labelStyle("otherLink")}>Other Link / Website (optional)</label>
              <input
                type="text"
                value={form.otherLink}
                onChange={(e) => setValue("otherLink", e.target.value)}
                onMouseEnter={() => setHoveredField("otherLink")}
                onMouseLeave={() => setHoveredField((prev) => (prev === "otherLink" ? "" : prev))}
                onFocus={() => setFocusedField("otherLink")}
                onBlur={() => {
                  setFocusedField((prev) => (prev === "otherLink" ? "" : prev));
                  setTouched((prev) => ({ ...prev, otherLink: true, creatorLink: true }));
                }}
                style={fieldStyle("otherLink")}
              />
            </div>
          </div>

          {touched.creatorLink && errors.creatorLink ? <div style={errorTextStyle}>{errors.creatorLink}</div> : null}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
            <div style={{ display: "grid", gap: 7 }}>
              <label style={labelStyle("mainPlatform")}>Main Platform</label>
              <div style={{ position: "relative" }}>
                <select
                  value={form.mainPlatform}
                  onChange={(e) => setValue("mainPlatform", e.target.value)}
                  onMouseEnter={() => setHoveredField("mainPlatform")}
                  onMouseLeave={() => setHoveredField((prev) => (prev === "mainPlatform" ? "" : prev))}
                  onFocus={() => setFocusedField("mainPlatform")}
                  onBlur={() => {
                    setFocusedField((prev) => (prev === "mainPlatform" ? "" : prev));
                    setTouched((prev) => ({ ...prev, mainPlatform: true }));
                  }}
                  style={selectStyle("mainPlatform")}
                >
                  <option value="">Select a platform</option>
                  {PLATFORM_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: 14,
                    transform: "translateY(-50%)",
                    color: withAlpha(theme.text, 0.54),
                    pointerEvents: "none",
                  }}
                >
                  ▾
                </span>
              </div>
              {touched.mainPlatform && errors.mainPlatform ? <div style={errorTextStyle}>{errors.mainPlatform}</div> : null}
            </div>

            <div style={{ display: "grid", gap: 7 }}>
              <label style={labelStyle("following")}>Approximate Total Following</label>
              <div style={{ position: "relative" }}>
                <select
                  value={form.following}
                  onChange={(e) => setValue("following", e.target.value)}
                  onMouseEnter={() => setHoveredField("following")}
                  onMouseLeave={() => setHoveredField((prev) => (prev === "following" ? "" : prev))}
                  onFocus={() => setFocusedField("following")}
                  onBlur={() => {
                    setFocusedField((prev) => (prev === "following" ? "" : prev));
                    setTouched((prev) => ({ ...prev, following: true }));
                  }}
                  style={selectStyle("following")}
                >
                  <option value="">Select a range</option>
                  {FOLLOWING_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: 14,
                    transform: "translateY(-50%)",
                    color: withAlpha(theme.text, 0.54),
                    pointerEvents: "none",
                  }}
                >
                  ▾
                </span>
              </div>
              {touched.following && errors.following ? <div style={errorTextStyle}>{errors.following}</div> : null}
            </div>
          </div>

          <button
            type="submit"
            disabled={!isStepOneComplete}
            onMouseEnter={() => setCtaHover(true)}
            onMouseLeave={() => setCtaHover(false)}
            onFocus={() => setCtaHover(true)}
            onBlur={() => setCtaHover(false)}
            style={primaryButtonStyle(isStepOneComplete)}
          >
            Continue
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 24, lineHeight: 1.1, fontWeight: 900 }}>
                <span>Application Details</span>
                <span style={{ marginLeft: 8, fontSize: "0.7em", fontWeight: 600, fontStyle: "italic", color: withAlpha(theme.text, 0.42) }}>
                  (optional)
                </span>
              </h2>
              <button
                type="button"
                onClick={() => {
                  submitButtonRef.current?.focus();
                  handleSubmit();
                }}
                onMouseEnter={() => setSkipHover(true)}
                onMouseLeave={() => setSkipHover(false)}
                onFocus={() => setSkipHover(true)}
                onBlur={() => setSkipHover(false)}
                style={skipButtonStyle}
              >
                Skip this section →
              </button>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5, fontWeight: 600, color: withAlpha(theme.text, 0.56) }}>
              Select all options that apply.
            </div>
          </div>

          {renderTagSection({
            sectionTitle: "Your Content",
            field: "contentType",
            question: "What type of content do you create?",
            options: CONTENT_TYPE_OPTIONS,
          })}

          {renderTagSection({
            sectionTitle: "Tabs in Your Content",
            field: "tabUsage",
            question: "How do you currently use tabs in your content or teaching?",
            options: TAB_USAGE_OPTIONS,
          })}

          {renderTagSection({
            sectionTitle: "How You’d Use TabStudio",
            field: "featurePlan",
            question: "How would you feature TabStudio?",
            options: FEATURE_PLAN_OPTIONS,
          })}

          {renderTagSection({
            sectionTitle: "Why You Want to Join",
            field: "motivation",
            question: "Why do you want to join the TabStudio affiliate program?",
            options: MOTIVATION_OPTIONS,
          })}

          <div style={sectionCardStyle}>
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ fontSize: 15, lineHeight: 1.2, fontWeight: 900, color: theme.text }}>Anything Else</div>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <label style={{ ...labelStyle("extra"), display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                <span>Anything else you&apos;d like us to know?</span>
                <span
                  style={{
                    fontSize: 11,
                    fontStyle: "italic",
                    fontWeight: 600,
                    color: withAlpha(theme.text, 0.42),
                  }}
                >
                  (optional)
                </span>
              </label>
              <textarea
                value={form.extra}
                onChange={(e) => setValue("extra", e.target.value)}
                onMouseEnter={() => setHoveredField("extra")}
                onMouseLeave={() => setHoveredField((prev) => (prev === "extra" ? "" : prev))}
                onFocus={() => setFocusedField("extra")}
                onBlur={() => setFocusedField((prev) => (prev === "extra" ? "" : prev))}
                style={{
                  ...textareaStyle("extra"),
                  minHeight: 108,
                  fontSize: String(form.extra || "").trim().length > 0 ? 15 : 14,
                  fontStyle: String(form.extra || "").trim().length > 0 ? "normal" : "italic",
                  fontWeight: String(form.extra || "").trim().length > 0 ? 700 : 500,
                  color: String(form.extra || "").trim().length > 0 ? theme.text : withAlpha(theme.text, 0.34),
                }}
                placeholder="Optional — anything about your audience or content"
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              onMouseEnter={() => setSecondaryHover(true)}
              onMouseLeave={() => setSecondaryHover(false)}
              onFocus={() => setSecondaryHover(true)}
              onBlur={() => setSecondaryHover(false)}
              style={secondaryButtonStyle}
            >
              Back
            </button>

            <button
              ref={submitButtonRef}
              type="submit"
              disabled={!isStepTwoComplete || submitting}
              onMouseEnter={() => setCtaHover(true)}
              onMouseLeave={() => setCtaHover(false)}
              onFocus={() => setCtaHover(true)}
              onBlur={() => setCtaHover(false)}
              style={primaryButtonStyle(isStepTwoComplete && !submitting)}
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
          {submitError ? <div style={errorTextStyle}>{submitError}</div> : null}
          <div style={{ fontSize: 12, lineHeight: 1.5, fontWeight: 600, color: withAlpha(theme.text, 0.5) }}>
            Applications are reviewed manually. We&apos;ll email you after review.
          </div>
        </form>
      )}
    </div>
  );
}
