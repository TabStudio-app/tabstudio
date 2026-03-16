import React, { useState } from "react";
import {
  AccountActionMessage,
  AccountCard,
  AccountReadOnlyField,
  AccountStatusPill,
  AccountValueGrid,
  AccountValueItem,
} from "./AccountSectionPrimitives";

export default function AccountSubscriptionSection({ shared, data, actions }) {
  const { btnSecondary, btnSmallPill, btnSmallPillDanger, withAlpha, THEME } = shared;
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const isCancelling = actions.cancelSubscription.state === "saving";
  const cancelSucceeded = actions.cancelSubscription.state === "success";
  const secondaryActionButtonStyle = {
    ...btnSecondary,
    minWidth: 152,
    justifyContent: "center",
    padding: "0 16px",
  };
  const destructiveActionButtonStyle = {
    ...btnSecondary,
    minWidth: 172,
    justifyContent: "center",
    padding: "0 16px",
    borderColor: withAlpha("#FF6E7A", 0.38),
    color: "#FFB3BA",
    background: withAlpha("#FF6E7A", 0.08),
    boxShadow: "none",
  };

  return (
    <>
      <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
        <AccountCard
          shared={shared}
          aside={<AccountStatusPill shared={shared} tone="accent">Current plan</AccountStatusPill>}
          padding={14}
        >
          <AccountValueGrid
            items={[
              <AccountValueItem key="plan" shared={shared} label="Plan" value={data.membership.planLabel} strong />,
              <AccountValueItem key="renews" shared={shared} label="Renews" value={data.membership.renewalDateLabel} />,
              <AccountValueItem key="cycle" shared={shared} label="Cycle" value={data.membership.billingCycleLabel} />,
            ]}
          />
        </AccountCard>

        <AccountCard shared={shared} title="Subscription controls" subtitle="Adjust renewal behavior or move to a different plan when you need more capacity.">
          <div style={{ display: "grid", gap: 12, minHeight: 0 }}>
            <AccountReadOnlyField
              shared={shared}
              label="Automatic renewal"
              value={data.membership.autoRenew ? "On" : "Off"}
              helper="Keep your subscription active without interruption."
              actions={
                <button
                  type="button"
                  onClick={() => shared.setSubscriptionAutoRenew((current) => !current)}
                  style={{
                    ...btnSmallPill,
                    borderColor: data.membership.autoRenew ? withAlpha(THEME.accent, 0.7) : THEME.border,
                    background: THEME.surfaceWarm,
                    color: data.membership.autoRenew ? THEME.accent : THEME.text,
                  }}
                >
                  {data.membership.autoRenew ? "On" : "Off"}
                </button>
              }
            />

            <div
              style={{
                display: "grid",
                gap: 10,
                paddingTop: 4,
                marginTop: 2,
                borderTop: `1px solid ${withAlpha(THEME.text, 0.08)}`,
              }}
            >
              <div style={{ display: "grid", gap: 6 }}>
                <AccountActionMessage shared={shared} state={actions.cancelSubscription.state} message={actions.cancelSubscription.message} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={actions.comparePlans.run}
                  disabled={actions.comparePlans.state === "saving"}
                  style={{ ...secondaryActionButtonStyle, opacity: actions.comparePlans.state === "saving" ? 0.65 : 1 }}
                >
                  {actions.comparePlans.label}
                </button>
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(true)}
                  disabled={isCancelling}
                  style={{ ...destructiveActionButtonStyle, opacity: isCancelling ? 0.65 : 1 }}
                >
                  Cancel Subscription
                </button>
              </div>
            </div>
          </div>
        </AccountCard>
      </div>

      {cancelModalOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 5400,
            background: "rgba(0,0,0,0.48)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget && !isCancelling) setCancelModalOpen(false);
          }}
        >
          <div
            style={{
              width: "min(100%, 520px)",
              borderRadius: 18,
              border: `1px solid ${THEME.border}`,
              background: THEME.surfaceWarm,
              boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
              padding: 18,
              display: "grid",
              gap: 14,
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 18, fontWeight: 950, color: THEME.text }}>Cancel Subscription?</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: THEME.textFaint }}>
                You’ll keep access until your current renewal date on <b style={{ color: THEME.text }}>{data.membership.renewalDateLabel}</b>.
                Your existing projects will remain accessible, but plan-based export and member features may change once the cancellation takes effect.
              </div>
            </div>

            <div
              style={{
                borderRadius: 12,
                border: `1px solid ${THEME.border}`,
                background: THEME.surface,
                padding: "12px 14px",
                display: "grid",
                gap: 8,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 900, color: THEME.text }}>What happens next</div>
              <div style={{ fontSize: 12, lineHeight: 1.55, color: THEME.textFaint }}>Your current billing period stays active until the end date above.</div>
              <div style={{ fontSize: 12, lineHeight: 1.55, color: THEME.textFaint }}>Your projects and account remain available after cancellation.</div>
              <div style={{ fontSize: 12, lineHeight: 1.55, color: THEME.textFaint }}>Paid export and member-only capabilities may no longer be available after the plan ends.</div>
            </div>

            <AccountActionMessage shared={shared} state={actions.cancelSubscription.state} message={actions.cancelSubscription.message} />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
              {cancelSucceeded ? (
                <button type="button" onClick={() => setCancelModalOpen(false)} style={{ ...btnSmallPill }}>
                  Done
                </button>
              ) : (
                <>
                  <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  disabled={isCancelling}
                  style={{ ...secondaryActionButtonStyle, minWidth: 150, opacity: isCancelling ? 0.65 : 1 }}
                >
                  Keep Subscription
                </button>
                <button
                  type="button"
                  onClick={actions.cancelSubscription.run}
                  disabled={isCancelling}
                  style={{ ...destructiveActionButtonStyle, minWidth: 150, opacity: isCancelling ? 0.65 : 1 }}
                >
                  {isCancelling ? "Cancelling..." : "Cancel Plan"}
                </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
