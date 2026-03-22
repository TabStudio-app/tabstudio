import React, { useEffect, useMemo, useState } from "react";
import { MEMBERSHIP_PLANS } from "../../features/pricing";
import {
  AccountActionMessage,
  AccountCard,
  AccountStatusPill,
  AccountValueGrid,
  AccountValueItem,
} from "./AccountSectionPrimitives";

const PLAN_RANK = {
  solo: 1,
  band: 2,
  creator: 3,
};

export default function AccountSubscriptionSection({ shared, data, actions }) {
  const { btnSecondary, withAlpha, THEME } = shared;
  const [billingCycle, setBillingCycle] = useState(data.membership.billingCycleRaw === "yearly" ? "yearly" : "monthly");
  useEffect(() => {
    setBillingCycle(data.membership.billingCycleRaw === "yearly" ? "yearly" : "monthly");
  }, [data.membership.billingCycleRaw]);

  const normalizedPlanId = String(data.identity.planId || "").trim().toLowerCase();
  const cards = useMemo(
    () =>
      MEMBERSHIP_PLANS.map((plan) => {
        const isCurrentPlan = plan.id === normalizedPlanId;
        const currentRank = PLAN_RANK[normalizedPlanId] || 0;
        const planRank = PLAN_RANK[plan.id] || 0;
        const ctaLabel = isCurrentPlan
          ? "Current Plan"
          : planRank > currentRank
          ? `Upgrade to ${plan.name}`
          : `Downgrade to ${plan.name}`;

        return {
          ...plan,
          isCurrentPlan,
          ctaLabel,
          priceLabel: billingCycle === "yearly" ? plan.yearly : plan.monthly,
        };
      }),
    [billingCycle, normalizedPlanId]
  );

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
        title="Membership options"
        subtitle="Switch plans directly from your account settings."
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 999,
              border: `1px solid ${THEME.border}`,
              background: withAlpha(THEME.text, 0.03),
              padding: 4,
            }}
          >
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              style={{
                ...btnSecondary,
                minHeight: 34,
                padding: "0 14px",
                borderRadius: 999,
                borderColor: billingCycle === "monthly" ? withAlpha(THEME.accent, 0.5) : "transparent",
                background: billingCycle === "monthly" ? withAlpha(THEME.accent, 0.1) : "transparent",
                color: billingCycle === "monthly" ? THEME.accent : THEME.textFaint,
              }}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              style={{
                ...btnSecondary,
                minHeight: 34,
                padding: "0 14px",
                borderRadius: 999,
                borderColor: billingCycle === "yearly" ? withAlpha(THEME.accent, 0.5) : "transparent",
                background: billingCycle === "yearly" ? withAlpha(THEME.accent, 0.1) : "transparent",
                color: billingCycle === "yearly" ? THEME.accent : THEME.textFaint,
              }}
            >
              Yearly
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {cards.map((plan) => (
            <div
              key={plan.id}
              style={{
                borderRadius: 12,
                border: `1px solid ${plan.isCurrentPlan ? withAlpha(THEME.accent, 0.55) : THEME.border}`,
                background: withAlpha(THEME.text, 0.02),
                padding: 14,
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 950, color: THEME.text, lineHeight: 1 }}>{plan.name}</div>
                  <div style={{ marginTop: 6, fontSize: 13, color: THEME.textFaint, lineHeight: 1.45 }}>{plan.description}</div>
                </div>
                {plan.isCurrentPlan ? <AccountStatusPill shared={shared} tone="accent">Current Plan</AccountStatusPill> : null}
              </div>

              <div style={{ fontSize: 42, fontWeight: 950, color: THEME.text, letterSpacing: "-0.03em", lineHeight: 1.02 }}>
                {plan.priceLabel}
              </div>

              <button
                type="button"
                disabled={actions.selectPlan.state === "saving" || plan.isCurrentPlan}
                onClick={() => actions.selectPlan.run(plan.id, billingCycle)}
                style={{
                  ...btnSecondary,
                  minHeight: 42,
                  borderRadius: 10,
                  justifyContent: "center",
                  background: plan.isCurrentPlan ? withAlpha(THEME.accent, 0.08) : undefined,
                  color: plan.isCurrentPlan ? THEME.accent : undefined,
                  borderColor: plan.isCurrentPlan ? withAlpha(THEME.accent, 0.45) : undefined,
                  opacity: actions.selectPlan.state === "saving" && !plan.isCurrentPlan ? 0.7 : 1,
                  cursor: plan.isCurrentPlan ? "default" : "pointer",
                }}
              >
                {plan.isCurrentPlan ? "Current Plan" : plan.ctaLabel}
              </button>

              <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6, color: THEME.textFaint, fontSize: 13, lineHeight: 1.45 }}>
                {plan.features.map((feature) => (
                  <li key={`${plan.id}-${feature}`}>{feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <AccountActionMessage shared={shared} state={actions.selectPlan.state} message={actions.selectPlan.message} align="right" />
      </AccountCard>
    </div>
  );
}
