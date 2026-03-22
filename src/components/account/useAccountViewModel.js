import { useCallback, useMemo, useState } from "react";
import { ACCOUNT_LANGUAGE_OPTIONS, ACCOUNT_MOCK_DATA } from "./accountMockData";
import { createBillingPortalSession } from "../../utils/billingPortal";
import { requestEmailChange, signIn, signOut, updatePassword } from "../../lib/auth";
import {
  accountActionLabel,
  affiliateStatusMeta,
  formatCurrency,
  formatDate,
  formatMonthYear,
  invoiceStatusMeta,
  planDisplayName,
  sessionDeviceLabel,
} from "./accountFormatters";

const DEFAULT_ACTION_STATE = {
  saveOverview: "idle",
  saveProfile: "idle",
  saveSecurity: "idle",
  updateEmail: "idle",
  updatePassword: "idle",
  enable2fa: "idle",
  signOutSessions: "idle",
  selectPlan: "idle",
  cancelSubscription: "idle",
  updatePaymentMethod: "idle",
  saveBilling: "idle",
  copyReferralLink: "idle",
};

export function useAccountViewModel(shared) {
  const {
    accountAvatarDataUrl,
    accountBillingCycle,
    accountEmail,
    accountExports30d,
    accountFullName,
    accountLastActiveLabel,
    accountMemberSince,
    accountPlanId,
    accountRenewalDate,
    accountTabsCreated,
    accountTier,
    billingEmail,
    defaultPaymentMethod,
    editorHasMembership,
    profileBio,
    profileDisplayName,
    profileHandle,
    profileWebsite,
    recentInvoices,
    recentSessions,
    securityEmail,
    securityTwoFactorEnabled,
    settingsLanguagePreview,
    onSelectPlan,
    setSettingsLanguagePreview,
    setSecurityTwoFactorEnabled,
    onSaveAccountProfile,
  } = shared;

  const [actionState, setActionState] = useState(DEFAULT_ACTION_STATE);
  const [actionMessage, setActionMessage] = useState({});
  const [emailDraft, setEmailDraft] = useState({ next: securityEmail || accountEmail || "", currentPassword: "" });
  const [passwordDraft, setPasswordDraft] = useState({ current: "", next: "", confirm: "" });
  const [accountLanguageOpen, setAccountLanguageOpen] = useState(false);
  const [emailChangeOpen, setEmailChangeOpen] = useState(false);
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);

  const runAction = useCallback((key, fn, { success = "Saved", error = "Something went wrong" } = {}) => {
    setActionState((prev) => ({ ...prev, [key]: "saving" }));
    setActionMessage((prev) => ({ ...prev, [key]: "" }));
    window.setTimeout(async () => {
      try {
        await fn?.();
        setActionState((prev) => ({ ...prev, [key]: "success" }));
        setActionMessage((prev) => ({ ...prev, [key]: success }));
      } catch {
        setActionState((prev) => ({ ...prev, [key]: "error" }));
        setActionMessage((prev) => ({ ...prev, [key]: error }));
      }
      window.setTimeout(() => {
        setActionState((prev) => ({ ...prev, [key]: "idle" }));
      }, 1600);
    }, 320);
  }, []);

  const profileUrl = useMemo(() => {
    const slug = String(profileHandle || "creator")
      .toLowerCase()
      .replace(/^@+/, "")
      .replace(/[^a-z0-9_-]/g, "") || "creator";
    return `https://tabstudio.app/u/${slug}`;
  }, [profileHandle]);

  const usageStats = useMemo(
    () => [
      { id: "tabs", label: "Tabs created", value: String(Number(accountTabsCreated) || 0) },
      { id: "exports", label: "Exports (30 days)", value: String(Number(accountExports30d) || 0) },
      { id: "active", label: "Last active", value: accountLastActiveLabel || "-" },
    ],
    [accountExports30d, accountLastActiveLabel, accountTabsCreated]
  );

  const invoiceRows = useMemo(
    () =>
      (Array.isArray(recentInvoices) ? recentInvoices : []).map((invoice) => {
        const status = invoice.status?.toLowerCase?.() || invoice.status;
        const meta = invoiceStatusMeta(status);
        return {
          id: invoice.id,
          dateLabel: formatDate(invoice.createdAt || invoice.date),
          amountLabel:
            typeof invoice.amount === "string"
              ? invoice.amount
              : formatCurrency(invoice.amountCents, invoice.currency || "USD"),
          status: meta,
          hostedInvoiceUrl: String(invoice.hostedInvoiceUrl || "").trim(),
          invoicePdf: String(invoice.invoicePdf || "").trim(),
        };
      }),
    [recentInvoices]
  );

  const sessionRows = useMemo(
    () =>
      (Array.isArray(recentSessions) ? recentSessions : []).map((session) => ({
        id: session.id || `${session.device}-${session.when || session.lastSeen}`,
        title: sessionDeviceLabel(session),
        location: session.location,
        lastSeen: session.lastSeen || session.when,
        status: session.status || "recent",
      })),
    [recentSessions]
  );

  const affiliate = useMemo(() => {
    const base = ACCOUNT_MOCK_DATA.affiliate;
    return {
      summary: [
        { id: "clicks", label: "Referral Clicks", value: String(base.summary.clicks) },
        { id: "signups", label: "Creator Signups", value: String(base.summary.signups) },
        { id: "members", label: "Active Members", value: String(base.summary.activeMembers) },
        { id: "earnings", label: "Current Monthly Earnings", value: formatCurrency(base.summary.monthlyEarningsCents) },
      ],
      earnings: [
        { id: "month", label: "This Month", value: formatCurrency(base.earnings.thisMonthCents) },
        { id: "lifetime", label: "Lifetime Earnings", value: formatCurrency(base.earnings.lifetimeCents) },
        { id: "payout", label: "Next Payout", value: formatDate(base.earnings.nextPayoutDate) },
        { id: "pending", label: "Pending Balance", value: formatCurrency(base.earnings.pendingBalanceCents) },
      ],
      history: base.history.map((entry) => ({
        id: entry.id,
        monthLabel: formatMonthYear(entry.month),
        referralsLabel: String(entry.referrals),
        amountLabel: formatCurrency(entry.amountCents),
        status: affiliateStatusMeta(entry.status),
      })),
      referralLink: base.referralLink,
    };
  }, []);

  const languages = useMemo(() => ACCOUNT_LANGUAGE_OPTIONS, []);
  const activeLanguage = languages.find((lang) => lang.id === settingsLanguagePreview) || languages[0];
  const availableLanguages = languages.filter((lang) => lang.available);
  const upcomingLanguages = languages.filter((lang) => !lang.available);

  const normalizedBillingCycle = String(accountBillingCycle || "").trim().toLowerCase();
  const billingCycleRaw = normalizedBillingCycle === "yearly" ? "yearly" : "monthly";

  const data = useMemo(
    () => ({
      identity: {
        fullName: accountFullName || "Account",
        email: accountEmail || "",
        avatarDataUrl: accountAvatarDataUrl,
        tierLabel: accountTier || planDisplayName(accountPlanId),
        planId: accountPlanId,
        isMember: Boolean(editorHasMembership),
      },
      profile: {
        displayName: profileDisplayName,
        handle: profileHandle,
        bio: profileBio,
        website: profileWebsite,
        publicProfileUrl: profileUrl,
      },
      membership: {
        planLabel: accountTier || planDisplayName(accountPlanId),
        memberSinceLabel: accountMemberSince ? formatDate(accountMemberSince) : "-",
        renewalDateLabel: accountRenewalDate ? formatDate(accountRenewalDate) : "-",
        billingCycleLabel: accountBillingCycle || "-",
        billingCycleRaw,
      },
      usage: {
        stats: usageStats,
      },
      security: {
        email: securityEmail,
        twoFactorEnabled: securityTwoFactorEnabled,
        sessions: sessionRows,
      },
      billing: {
        billingEmail,
        defaultPaymentMethod,
        invoices: invoiceRows,
      },
      affiliate,
      languages: {
        active: activeLanguage,
        available: availableLanguages,
        upcoming: upcomingLanguages,
      },
      featureFlags: {
        invoicesLive: invoiceRows.length > 0,
        devicesLive: sessionRows.length > 0,
        affiliateLive: true,
      },
    }),
    [
      accountAvatarDataUrl,
      accountBillingCycle,
      accountEmail,
      accountFullName,
      accountMemberSince,
      accountPlanId,
      accountRenewalDate,
      accountTier,
      activeLanguage,
      affiliate,
      availableLanguages,
      billingCycleRaw,
      billingEmail,
      defaultPaymentMethod,
      editorHasMembership,
      invoiceRows,
      profileBio,
      profileDisplayName,
      profileHandle,
      profileUrl,
      profileWebsite,
      securityEmail,
      securityTwoFactorEnabled,
      sessionRows,
      upcomingLanguages,
      usageStats,
    ]
  );

  const actions = useMemo(
    () => ({
      saveOverview: {
        state: actionState.saveOverview,
        label: accountActionLabel(actionState.saveOverview, "Save Changes"),
        message: actionMessage.saveOverview,
        run: () => runAction("saveOverview", () => console.info("saveOverview"), { success: "Overview saved" }),
      },
      saveProfile: {
        state: actionState.saveProfile,
        label: accountActionLabel(actionState.saveProfile, "Save Profile"),
        message: actionMessage.saveProfile,
        run: () =>
          runAction("saveProfile", () => {
            onSaveAccountProfile?.();
          }, { success: "Profile saved" }),
      },
      updateEmail: {
        state: actionState.updateEmail,
        label: accountActionLabel(actionState.updateEmail, "Save Email", "Updated", "Updating..."),
        message: actionMessage.updateEmail,
        run: () =>
          runAction(
            "updateEmail",
            async () => {
              const nextEmail = String(emailDraft.next || "").trim();
              const currentPassword = String(emailDraft.currentPassword || "").trim();
              if (!nextEmail || !nextEmail.includes("@")) throw new Error("Invalid email");
              if (!currentPassword) throw new Error("Missing password");
              if (nextEmail.toLowerCase() === String(accountEmail || securityEmail || "").trim().toLowerCase()) {
                throw new Error("Same email");
              }

              const passwordCheck = await signIn(String(accountEmail || securityEmail || "").trim(), currentPassword);
              if (passwordCheck.error) throw passwordCheck.error;

              const changeRequest = await requestEmailChange(nextEmail);
              if (changeRequest.error) throw changeRequest.error;

              setEmailDraft({ next: nextEmail, currentPassword: "" });
              setEmailChangeOpen(false);
            },
            { success: "Confirmation email sent", error: "Enter your new email and current password correctly" }
          ),
      },
      updatePassword: {
        state: actionState.updatePassword,
        label: accountActionLabel(actionState.updatePassword, "Update Password", "Updated", "Updating..."),
        message: actionMessage.updatePassword,
        run: () =>
          runAction(
            "updatePassword",
            async () => {
              const currentPassword = String(passwordDraft.current || "").trim();
              const nextPassword = String(passwordDraft.next || "").trim();
              const confirmPassword = String(passwordDraft.confirm || "").trim();

              if (!currentPassword) throw new Error("Missing current password");
              if (!nextPassword || nextPassword !== confirmPassword) throw new Error("Password mismatch");
              if (nextPassword.length < 8) throw new Error("Weak password");

              const passwordCheck = await signIn(String(accountEmail || securityEmail || "").trim(), currentPassword);
              if (passwordCheck.error) throw passwordCheck.error;

              const passwordUpdate = await updatePassword(nextPassword);
              if (passwordUpdate.error) throw passwordUpdate.error;

              setPasswordDraft({ current: "", next: "", confirm: "" });
              setPasswordChangeOpen(false);
            },
            { success: "Password updated", error: "Use your current password and a valid new password" }
          ),
      },
      saveSecurity: {
        state: actionState.saveSecurity,
        label: accountActionLabel(actionState.saveSecurity, "Save Changes"),
        message: actionMessage.saveSecurity,
        run: () => runAction("saveSecurity", () => console.info("saveSecurity"), { success: "Security settings saved" }),
      },
      enable2fa: {
        state: actionState.enable2fa,
        label: data.security.twoFactorEnabled ? "Enabled" : accountActionLabel(actionState.enable2fa, "Enable", "Enabled", "Enabling..."),
        message: actionMessage.enable2fa,
        run: () =>
          runAction("enable2fa", () => {
            setSecurityTwoFactorEnabled((current) => !current);
          }, { success: data.security.twoFactorEnabled ? "Two-factor disabled" : "Two-factor enabled" }),
      },
      signOutSessions: {
        state: actionState.signOutSessions,
        label: accountActionLabel(actionState.signOutSessions, "Sign out other sessions", "Signed out", "Signing out..."),
        message: actionMessage.signOutSessions,
        run: () =>
          runAction(
            "signOutSessions",
            async () => {
              const result = await signOut({ scope: "others" });
              if (result.error) throw result.error;
            },
            { success: "Other sessions signed out" }
          ),
      },
      selectPlan: {
        state: actionState.selectPlan,
        label: accountActionLabel(actionState.selectPlan, "Select", "Opening", "Opening..."),
        message: actionMessage.selectPlan,
        run: (planId, billingCycle) =>
          runAction(
            "selectPlan",
            async () => {
              onSelectPlan?.(planId, billingCycle);
            },
            { success: "Opening checkout", error: "Unable to open checkout" }
          ),
      },
      cancelSubscription: {
        state: actionState.cancelSubscription,
        label: accountActionLabel(actionState.cancelSubscription, "Cancel Subscription", "Requested", "Processing..."),
        message: actionMessage.cancelSubscription,
        run: () => runAction("cancelSubscription", () => console.info("cancelSubscription"), { success: "Cancellation request prepared" }),
      },
      updatePaymentMethod: {
        state: actionState.updatePaymentMethod,
        label: actionState.updatePaymentMethod === "saving" ? "Opening Portal..." : "Open Billing Portal",
        message: actionMessage.updatePaymentMethod,
        run: async () => {
          const userEmail = String(accountEmail || billingEmail || data.identity.email || "").trim();
          if (!userEmail) {
            setActionState((prev) => ({ ...prev, updatePaymentMethod: "error" }));
            setActionMessage((prev) => ({
              ...prev,
              updatePaymentMethod: "We couldn't determine which account to open in billing.",
            }));
            window.setTimeout(() => {
              setActionState((prev) => ({ ...prev, updatePaymentMethod: "idle" }));
            }, 2200);
            return;
          }

          setActionState((prev) => ({ ...prev, updatePaymentMethod: "saving" }));
          setActionMessage((prev) => ({ ...prev, updatePaymentMethod: "" }));

          try {
            const { url } = await createBillingPortalSession({
              userEmail,
              returnPath: "/account/billing",
            });
            if (typeof window !== "undefined") {
              window.location.assign(url);
            }
          } catch (error) {
            setActionState((prev) => ({ ...prev, updatePaymentMethod: "error" }));
            setActionMessage((prev) => ({
              ...prev,
              updatePaymentMethod: String(error?.message || "Unable to open the billing portal right now."),
            }));
            window.setTimeout(() => {
              setActionState((prev) => ({ ...prev, updatePaymentMethod: "idle" }));
            }, 2200);
          }
        },
      },
      saveBilling: {
        state: actionState.saveBilling,
        label: accountActionLabel(actionState.saveBilling, "Save Changes"),
        message: actionMessage.saveBilling,
        run: () => runAction("saveBilling", () => console.info("saveBilling"), { success: "Billing settings saved" }),
      },
      copyReferralLink: {
        state: actionState.copyReferralLink,
        label: actionState.copyReferralLink === "success" ? "Copied" : actionState.copyReferralLink === "error" ? "Failed" : "Copy",
        message: actionMessage.copyReferralLink,
        run: async () => {
          try {
            if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
              await navigator.clipboard.writeText(affiliate.referralLink);
              setActionState((prev) => ({ ...prev, copyReferralLink: "success" }));
              setActionMessage((prev) => ({ ...prev, copyReferralLink: "Referral link copied" }));
            } else {
              throw new Error("Clipboard unavailable");
            }
          } catch {
            setActionState((prev) => ({ ...prev, copyReferralLink: "error" }));
            setActionMessage((prev) => ({ ...prev, copyReferralLink: "Clipboard unavailable" }));
          }
          window.setTimeout(() => {
            setActionState((prev) => ({ ...prev, copyReferralLink: "idle" }));
          }, 1600);
        },
      },
    }),
    [
      actionMessage,
      actionState,
      accountEmail,
      affiliate.referralLink,
      billingEmail,
      data.security.twoFactorEnabled,
      emailDraft,
      onSaveAccountProfile,
      onSelectPlan,
      passwordDraft,
      runAction,
      setSecurityTwoFactorEnabled,
      securityEmail,
    ]
  );

  const fieldDrafts = {
    emailDraft,
    setEmailDraft,
    passwordDraft,
    setPasswordDraft,
    accountLanguageOpen,
    setAccountLanguageOpen,
    emailChangeOpen,
    setEmailChangeOpen,
    passwordChangeOpen,
    setPasswordChangeOpen,
    setSettingsLanguagePreview,
  };

  return { data, actions, fieldDrafts };
}
