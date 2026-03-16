import React from "react";
import AccountAffiliateSection from "../components/account/AccountAffiliateSection";
import AccountBillingSection from "../components/account/AccountBillingSection";
import AccountOverviewSection from "../components/account/AccountOverviewSection";
import AccountProfileSection from "../components/account/AccountProfileSection";
import AccountSecuritySection from "../components/account/AccountSecuritySection";
import AccountSubscriptionSection from "../components/account/AccountSubscriptionSection";
import { useAccountViewModel } from "../components/account/useAccountViewModel";

const SECTION_META = {
  overview: { title: "Overview", sub: "Membership, usage, and quick account summary." },
  profile: { title: "Profile", sub: "Public profile details and creator identity settings." },
  security: { title: "Security", sub: "Login, authentication, and active session controls." },
  subscription: { title: "Subscription", sub: "Plan details, renewals, and subscription options." },
  billing: { title: "Billing", sub: "Payment methods, invoices, and billing contact details." },
  affiliate: { title: "Affiliate", sub: "Track your referrals and earnings from the TabStudio creator program." },
};

export default function AccountPage({ shared }) {
  const {
    accountProfileOpen,
    accountProfileSection,
    btnSmallPillClose,
    isDarkMode,
    setAccountProfileOpen,
    setAccountProfileSection,
    settingsPanelWidthCss,
    toolbarMenuBtn,
    THEME,
    withAlpha,
  } = shared;

  const { data, actions, fieldDrafts } = useAccountViewModel(shared);

  if (!accountProfileOpen) return null;

  const isAffiliateEligible = data.identity.planId === "creator";
  const activeSection = accountProfileSection === "affiliate" && !isAffiliateEligible ? "overview" : accountProfileSection;
  const meta = SECTION_META[activeSection] || SECTION_META.overview;
  const sidebarItems = [
    { id: "overview", label: "Overview" },
    { id: "profile", label: "Profile" },
    { id: "security", label: "Security" },
    { id: "subscription", label: "Subscription" },
    { id: "billing", label: "Billing" },
    ...(isAffiliateEligible ? [{ id: "affiliate", label: "Affiliate" }] : []),
  ];

  const primaryActionBySection = {
    overview: actions.saveOverview,
    profile: actions.saveProfile,
    security: null,
    subscription: actions.updatePlan,
    billing: actions.saveBilling,
    affiliate: actions.copyReferralLink,
  };
  const primaryAction = primaryActionBySection[activeSection];
  const activeLanguage = data.languages.active;

  return (
    <div
      style={{
        position: "fixed",
        inset: "72px 0 0 0",
        background: THEME.bg,
        display: "flex",
        zIndex: 5300,
        overflow: "hidden",
      }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) setAccountProfileOpen(false);
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: 0,
          background: THEME.surfaceWarm,
          display: "grid",
          gridTemplateColumns: `${settingsPanelWidthCss || "320px"} minmax(0, 1fr)`,
          overflow: "visible",
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <aside
          style={{
            borderRight: `1px solid ${THEME.border}`,
            background: isDarkMode ? "#101010" : "#FFFFFF",
            padding: "14px 12px 12px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div
            style={{
              marginBottom: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <div style={{ fontWeight: 950, fontSize: 18, color: THEME.text }}>Account</div>
            <button type="button" onClick={() => setAccountProfileOpen(false)} style={{ ...btnSmallPillClose }}>
              Close
            </button>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              paddingRight: 8,
              paddingBottom: 12,
              display: "grid",
              gap: 10,
              alignContent: "start",
            }}
          >
            {sidebarItems.map((item) => {
              const active = activeSection === item.id;
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
                    background: active ? withAlpha(THEME.text, 0.035) : THEME.surfaceWarm,
                    borderColor: active ? withAlpha(THEME.text, isDarkMode ? 0.24 : 0.18) : THEME.border,
                    color: THEME.text,
                    boxShadow: "none",
                    fontWeight: active ? 900 : 850,
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              position: "relative",
              flexShrink: 0,
              paddingTop: 12,
              borderTop: `1px solid ${THEME.border}`,
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => fieldDrafts.setAccountLanguageOpen((current) => !current)}
                style={{
                  minHeight: 42,
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  borderRadius: 12,
                  border: `1px solid ${fieldDrafts.accountLanguageOpen ? withAlpha(THEME.text, isDarkMode ? 0.22 : 0.16) : THEME.border}`,
                  background: fieldDrafts.accountLanguageOpen
                    ? withAlpha(THEME.text, isDarkMode ? 0.08 : 0.045)
                    : withAlpha(THEME.text, isDarkMode ? 0.03 : 0.02),
                  width: "100%",
                  textAlign: "left",
                  cursor: "pointer",
                }}
                aria-expanded={fieldDrafts.accountLanguageOpen}
              >
                <span style={{ fontSize: 14, lineHeight: 1.1, fontWeight: 900, color: THEME.text }}>Language</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: THEME.textFaint }}>{activeLanguage.name}</span>
                  <span style={{ fontSize: 12, opacity: 0.95 }}>{fieldDrafts.accountLanguageOpen ? "▲" : "▼"}</span>
                </span>
              </button>

              {fieldDrafts.accountLanguageOpen ? (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: "calc(100% + 8px)",
                    zIndex: 5,
                    display: "grid",
                    gap: 6,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 12,
                    padding: 8,
                    background: THEME.surfaceWarm,
                    boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
                    maxHeight: 300,
                    overflowY: "auto",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: THEME.textFaint }}>
                    Not in your language yet? Contact us at Support@tabstudio.app to help us release it faster
                  </div>
                  {data.languages.available.map((lang) => {
                    const active = activeLanguage.id === lang.id;
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => {
                          fieldDrafts.setSettingsLanguagePreview?.(lang.id);
                          fieldDrafts.setAccountLanguageOpen(false);
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
                  {data.languages.upcoming.map((lang) => (
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
                      <span style={{ fontSize: 10, fontWeight: 900 }}>Coming soon</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div
              style={{
                padding: "11px 12px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                order: 99,
                borderRadius: 12,
                border: `1px solid ${withAlpha(THEME.text, isDarkMode ? 0.18 : 0.12)}`,
                background: withAlpha(THEME.text, isDarkMode ? 0.06 : 0.035),
                width: "100%",
                boxSizing: "border-box",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
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
                  overflow: "hidden",
                }}
                aria-hidden="true"
              >
                {data.identity.avatarDataUrl ? (
                  <img src={data.identity.avatarDataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  String(data.identity.fullName || "?")
                    .split(" ")
                    .map((s) => s[0] || "")
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, lineHeight: 1.1, fontWeight: 900, color: THEME.text }}>{data.identity.fullName}</div>
                <div style={{ marginTop: 3, fontSize: 12, lineHeight: 1.1, color: THEME.textFaint, fontWeight: 800 }}>
                  {data.identity.tierLabel}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ fontWeight: 950, fontSize: 20, color: THEME.text, lineHeight: 1.15 }}>{`Account — ${meta.title}`}</div>
              <div style={{ fontSize: 13, color: THEME.textFaint, fontWeight: 700 }}>{meta.sub}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {primaryAction ? (
                <button
                  type="button"
                  onClick={primaryAction.run}
                  disabled={primaryAction.state === "saving"}
                  style={{ ...btnSmallPillClose, opacity: primaryAction.state === "saving" ? 0.65 : 1 }}
                >
                  {primaryAction.label}
                </button>
              ) : null}
              <button type="button" onClick={() => setAccountProfileOpen(false)} style={{ ...btnSmallPillClose }}>
                Close
              </button>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "grid", gap: 12, paddingRight: 4 }}>
            {activeSection === "overview" ? <AccountOverviewSection shared={shared} data={data} /> : null}
            {activeSection === "profile" ? <AccountProfileSection shared={shared} data={data} actions={actions} /> : null}
            {activeSection === "security" ? (
              <AccountSecuritySection shared={shared} data={data} actions={actions} fieldDrafts={fieldDrafts} />
            ) : null}
            {activeSection === "subscription" ? <AccountSubscriptionSection shared={shared} data={data} actions={actions} /> : null}
            {activeSection === "billing" ? <AccountBillingSection shared={shared} data={data} actions={actions} /> : null}
            {activeSection === "affiliate" && isAffiliateEligible ? (
              <AccountAffiliateSection shared={shared} data={data.affiliate} actions={actions} />
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
