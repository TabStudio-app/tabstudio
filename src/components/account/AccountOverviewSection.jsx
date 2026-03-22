import React from "react";
import {
  AccountCard,
  AccountMetricCard,
  AccountMetricGrid,
  AccountStatusPill,
  AccountValueGrid,
  AccountValueItem,
} from "./AccountSectionPrimitives";

export default function AccountOverviewSection({ shared, data }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <AccountCard
        shared={shared}
        title="Membership"
        subtitle="Your active plan, renewal schedule, and billing cadence at a glance."
        aside={
          <AccountStatusPill shared={shared} tone={data.identity.isMember ? "accent" : "muted"}>
            {data.identity.isMember ? "Active" : "Free"}
          </AccountStatusPill>
        }
      >
        <AccountValueGrid
          items={[
            <AccountValueItem key="plan" shared={shared} label="Current tier" value={data.membership.planLabel} strong helper="Creator tools and export access for your account." />,
            <AccountValueItem key="member" shared={shared} label="Member since" value={data.membership.memberSinceLabel} />,
            <AccountValueItem key="renewal" shared={shared} label="Subscription renews" value={data.membership.renewalDateLabel} />,
            <AccountValueItem key="cycle" shared={shared} label="Billing cycle" value={data.membership.billingCycleLabel} />,
          ]}
        />
      </AccountCard>

      <AccountMetricGrid>
        {data.usage.stats.map((item) => (
          <AccountMetricCard key={item.id} shared={shared} label={item.label} value={item.value} />
        ))}
      </AccountMetricGrid>
    </div>
  );
}
