import React from "react";
import {
  AccountCard,
  AccountEmptyState,
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
        aside={<AccountStatusPill shared={shared} tone="accent">Active</AccountStatusPill>}
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

      <AccountCard shared={shared} title="What’s next" subtitle="A compact account summary area for invoices, devices, and usage trends will live here as those systems go live.">
        <AccountEmptyState shared={shared} title="Connected account activity">
          {data.usage.summaryNote}
        </AccountEmptyState>
      </AccountCard>
    </div>
  );
}
