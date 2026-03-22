import React from "react";
import {
  AccountCard,
  AccountStatusPill,
  AccountValueGrid,
  AccountValueItem,
} from "./AccountSectionPrimitives";

export default function AccountSubscriptionSection({ shared, data, actions }) {
  const { btnSecondary, withAlpha, THEME } = shared;
  const secondaryActionButtonStyle = {
    ...btnSecondary,
    minWidth: 152,
    justifyContent: "center",
    padding: "0 16px",
  };

  return (
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

      <AccountCard
        shared={shared}
        title="Subscription controls"
        subtitle="Plan editing controls are hidden in this placeholder view while Stripe subscription management is being finalized."
      >
        <div style={{ display: "grid", gap: 10, minHeight: 0 }}>
          <div
            style={{
              borderRadius: 10,
              border: `1px solid ${THEME.border}`,
              background: withAlpha(THEME.text, 0.03),
              padding: "10px 12px",
              fontSize: 12.5,
              lineHeight: 1.55,
              color: THEME.textFaint,
            }}
          >
            For now, use the plans page to view available tiers and pricing.
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
          </div>
        </div>
      </AccountCard>
    </div>
  );
}
