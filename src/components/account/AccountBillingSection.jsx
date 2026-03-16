import React from "react";
import {
  AccountActionMessage,
  AccountCard,
  AccountLabel,
  AccountReadOnlyField,
  AccountStatusPill,
} from "./AccountSectionPrimitives";

export default function AccountBillingSection({ shared, data, actions }) {
  const { btnSecondary, field, billingEmail, defaultPaymentMethod, setBillingEmail, THEME } = shared;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <AccountCard shared={shared} title="Payment method" subtitle="Manage where TabStudio bills your membership and where receipts are sent.">
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, alignItems: "start" }}>
            <AccountReadOnlyField
              shared={shared}
              label="Default payment method"
              value={defaultPaymentMethod}
              helper="Payment method updates are handled securely in the Stripe Customer Billing Portal."
            />
            <div>
              <AccountLabel shared={shared}>Billing email</AccountLabel>
              <input value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} style={{ ...field }} placeholder="Billing email" />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
            <AccountActionMessage shared={shared} state={actions.updatePaymentMethod.state} message={actions.updatePaymentMethod.message} />
            <button
              type="button"
              onClick={actions.updatePaymentMethod.run}
              disabled={actions.updatePaymentMethod.state === "saving"}
              style={{ ...btnSecondary, opacity: actions.updatePaymentMethod.state === "saving" ? 0.65 : 1 }}
            >
              {actions.updatePaymentMethod.label}
            </button>
          </div>
        </div>
      </AccountCard>

      <AccountCard shared={shared} title="Invoices" subtitle="Recent billing history and invoice statuses for your account.">
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
              gridTemplateColumns: "minmax(0, 1fr) minmax(110px, 0.8fr) minmax(90px, 0.6fr) minmax(100px, 0.7fr)",
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
            <div>Invoice</div>
            <div>Date</div>
            <div>Amount</div>
            <div>Status</div>
          </div>

          {data.billing.invoices.map((invoice, index) => (
            <div
              key={invoice.id}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(110px, 0.8fr) minmax(90px, 0.6fr) minmax(100px, 0.7fr)",
                gap: 10,
                padding: "13px 14px",
                borderTop: index === 0 ? "none" : `1px solid ${THEME.border}`,
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 900, color: THEME.text }}>{invoice.id}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: THEME.textFaint }}>{invoice.dateLabel}</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: THEME.text }}>{invoice.amountLabel}</div>
              <div>
                <AccountStatusPill shared={shared} tone={invoice.status.tone}>
                  {invoice.status.label}
                </AccountStatusPill>
              </div>
            </div>
          ))}
        </div>
      </AccountCard>
    </div>
  );
}
