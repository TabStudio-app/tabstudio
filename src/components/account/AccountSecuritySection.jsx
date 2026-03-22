import React from "react";
import {
  AccountActionMessage,
  AccountCard,
  AccountLabel,
  AccountReadOnlyField,
} from "./AccountSectionPrimitives";

export default function AccountSecuritySection({ shared, data, actions, fieldDrafts }) {
  const { field, btnSmallPill, THEME } = shared;
  const {
    emailDraft,
    setEmailDraft,
    passwordDraft,
    setPasswordDraft,
    emailChangeOpen,
    setEmailChangeOpen,
    passwordChangeOpen,
    setPasswordChangeOpen,
  } = fieldDrafts;

  return (
    <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
      <AccountCard shared={shared}>
        <div style={{ display: "grid", gap: 12 }}>
          <AccountReadOnlyField
            shared={shared}
            label="Account email"
            value={data.security.email}
            helper="Email changes require confirmation before they take effect."
            actions={
              <button
                type="button"
                onClick={() => {
                  setEmailDraft({ next: data.security.email, currentPassword: "" });
                  setEmailChangeOpen((current) => !current);
                }}
                style={{ ...btnSmallPill }}
              >
                Change Email
              </button>
            }
          />

          {emailChangeOpen ? (
            <div style={{ display: "grid", gap: 12, borderRadius: 12, border: `1px solid ${THEME.border}`, padding: 14, background: THEME.surface }}>
              <div style={{ fontSize: 13, lineHeight: 1.55, color: THEME.textFaint }}>
                Enter your new email and your current password. We’ll require confirmation before the new address becomes active.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                <div>
                  <AccountLabel shared={shared}>New email</AccountLabel>
                  <input
                    value={emailDraft.next}
                    onChange={(e) => setEmailDraft((current) => ({ ...current, next: e.target.value }))}
                    style={{ ...field }}
                    placeholder="New email"
                  />
                </div>
                <div>
                  <AccountLabel shared={shared}>Current password</AccountLabel>
                  <input
                    type="password"
                    value={emailDraft.currentPassword}
                    onChange={(e) => setEmailDraft((current) => ({ ...current, currentPassword: e.target.value }))}
                    style={{ ...field }}
                    placeholder="Current password"
                  />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setEmailChangeOpen(false)}
                  disabled={actions.updateEmail.state === "saving"}
                  style={{ ...btnSmallPill, opacity: actions.updateEmail.state === "saving" ? 0.65 : 1 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actions.updateEmail.state === "saving"}
                  onClick={actions.updateEmail.run}
                  style={{ ...btnSmallPill, opacity: actions.updateEmail.state === "saving" ? 0.65 : 1 }}
                >
                  {actions.updateEmail.label}
                </button>
              </div>
              <AccountActionMessage shared={shared} state={actions.updateEmail.state} message={actions.updateEmail.message} align="right" />
            </div>
          ) : null}

          <AccountReadOnlyField
            shared={shared}
            label="Password"
            value="••••••••••••"
            helper="Password changes require your current password before a new one can be saved."
            actions={
              <button type="button" onClick={() => setPasswordChangeOpen((current) => !current)} style={{ ...btnSmallPill }}>
                Change Password
              </button>
            }
          />

          {passwordChangeOpen ? (
            <div style={{ display: "grid", gap: 12, borderRadius: 12, border: `1px solid ${THEME.border}`, padding: 14, background: THEME.surface }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                <div>
                  <AccountLabel shared={shared}>Current password</AccountLabel>
                  <input
                    type="password"
                    value={passwordDraft.current}
                    onChange={(e) => setPasswordDraft((current) => ({ ...current, current: e.target.value }))}
                    style={{ ...field }}
                    placeholder="Current password"
                  />
                </div>
                <div>
                  <AccountLabel shared={shared}>New password</AccountLabel>
                  <input
                    type="password"
                    value={passwordDraft.next}
                    onChange={(e) => setPasswordDraft((current) => ({ ...current, next: e.target.value }))}
                    style={{ ...field }}
                    placeholder="New password"
                  />
                </div>
                <div>
                  <AccountLabel shared={shared}>Confirm new password</AccountLabel>
                  <input
                    type="password"
                    value={passwordDraft.confirm}
                    onChange={(e) => setPasswordDraft((current) => ({ ...current, confirm: e.target.value }))}
                    style={{ ...field }}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setPasswordChangeOpen(false)}
                  disabled={actions.updatePassword.state === "saving"}
                  style={{ ...btnSmallPill, opacity: actions.updatePassword.state === "saving" ? 0.65 : 1 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actions.updatePassword.state === "saving"}
                  onClick={actions.updatePassword.run}
                  style={{ ...btnSmallPill, opacity: actions.updatePassword.state === "saving" ? 0.65 : 1 }}
                >
                  {actions.updatePassword.label}
                </button>
              </div>
              <AccountActionMessage shared={shared} state={actions.updatePassword.state} message={actions.updatePassword.message} align="right" />
            </div>
          ) : null}
        </div>
      </AccountCard>
    </div>
  );
}
