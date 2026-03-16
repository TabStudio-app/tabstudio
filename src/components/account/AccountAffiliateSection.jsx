import React from "react";
import {
  AccountActionMessage,
  AccountCard,
  AccountMetricCard,
  AccountMetricGrid,
  AccountReadOnlyField,
  AccountStatusPill,
} from "./AccountSectionPrimitives";

export default function AccountAffiliateSection({ shared, data, actions }) {
  const { btnSmallPill, THEME } = shared;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <AccountMetricGrid>
        {data.summary.map((item) => (
          <AccountMetricCard key={item.id} shared={shared} label={item.label} value={item.value} />
        ))}
      </AccountMetricGrid>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 0.95fr)", gap: 12 }}>
        <AccountCard shared={shared} title="Earnings summary" subtitle="A quick scan of current payout momentum and lifetime referral performance.">
          <div style={{ display: "grid", gap: 12 }}>
            {data.earnings.map((row, index) => (
              <div
                key={row.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: 10,
                  alignItems: "center",
                  paddingBottom: index === data.earnings.length - 1 ? 0 : 12,
                  borderBottom: index === data.earnings.length - 1 ? "none" : `1px solid ${THEME.border}`,
                }}
              >
                <div style={{ fontSize: 13, color: THEME.textFaint, fontWeight: 800 }}>{row.label}</div>
                <div style={{ fontSize: 22, lineHeight: 1.08, fontWeight: 950, color: THEME.text, letterSpacing: "-0.025em" }}>{row.value}</div>
              </div>
            ))}
          </div>
        </AccountCard>

        <AccountCard shared={shared} title="Your referral link" subtitle="Use this link in descriptions, pinned comments, resources, and anywhere TabStudio fits your creator workflow.">
          <div style={{ display: "grid", gap: 12 }}>
            <AccountReadOnlyField
              shared={shared}
              label="Referral URL"
              value={data.referralLink}
              actions={
                <button
                  type="button"
                  onClick={actions.copyReferralLink.run}
                  disabled={actions.copyReferralLink.state === "saving"}
                  style={{ ...btnSmallPill, opacity: actions.copyReferralLink.state === "saving" ? 0.65 : 1 }}
                >
                  {actions.copyReferralLink.label}
                </button>
              }
            />
            <AccountActionMessage shared={shared} state={actions.copyReferralLink.state} message={actions.copyReferralLink.message} />
          </div>
        </AccountCard>
      </div>

      <AccountCard shared={shared} title="Referral history" subtitle="Monthly referral performance and payout statuses.">
        <div
          style={{
            borderRadius: 12,
            border: `1px solid ${THEME.border}`,
            overflow: "hidden",
            background: THEME.surface,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.4fr) minmax(80px, 0.5fr) minmax(100px, 0.6fr) minmax(100px, 0.6fr)",
              gap: 10,
              padding: "12px 14px",
              borderBottom: `1px solid ${THEME.border}`,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: THEME.textFaint,
            }}
          >
            <div>Month</div>
            <div>Referrals</div>
            <div>Amount</div>
            <div>Status</div>
          </div>

          {data.history.map((entry, index) => (
            <div
              key={entry.id}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.4fr) minmax(80px, 0.5fr) minmax(100px, 0.6fr) minmax(100px, 0.6fr)",
                gap: 10,
                padding: "13px 14px",
                borderTop: index === 0 ? "none" : `1px solid ${THEME.border}`,
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 900, color: THEME.text }}>{entry.monthLabel}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: THEME.text }}>{entry.referralsLabel}</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: THEME.text }}>{entry.amountLabel}</div>
              <div>
                <AccountStatusPill shared={shared} tone={entry.status.tone}>
                  {entry.status.label}
                </AccountStatusPill>
              </div>
            </div>
          ))}
        </div>
      </AccountCard>
    </div>
  );
}
