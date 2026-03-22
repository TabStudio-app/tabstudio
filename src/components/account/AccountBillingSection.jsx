import React from "react";
import {
  AccountActionMessage,
  AccountCard,
  AccountReadOnlyField,
  AccountStatusPill,
} from "./AccountSectionPrimitives";

export default function AccountBillingSection({ shared, data, actions }) {
  const { btnSecondary, THEME } = shared;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <AccountCard shared={shared} title="Billing" subtitle="Manage payment methods and invoices in your secure Stripe billing portal.">
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, alignItems: "start" }}>
            <AccountReadOnlyField
              shared={shared}
              label="Default payment method"
              value={data.billing.defaultPaymentMethod || "-"}
              helper="Card changes are handled securely through Stripe Billing Portal."
            />
            <AccountReadOnlyField
              shared={shared}
              label="Billing email"
              value={data.billing.billingEmail || "-"}
              helper="Billing email is locked to your account email."
            />
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

      <AccountCard shared={shared} title="Invoices" subtitle="Live Stripe invoices for your account.">
        {data.billing.invoices.length > 0 ? (
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
                gridTemplateColumns: "minmax(0, 1fr) minmax(110px, 0.8fr) minmax(90px, 0.6fr) minmax(100px, 0.7fr) minmax(120px, 0.7fr)",
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
              <div>Action</div>
            </div>

            {data.billing.invoices.map((invoice, index) => {
              const link = invoice.invoicePdf || invoice.hostedInvoiceUrl || "";
              return (
                <div
                  key={invoice.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) minmax(110px, 0.8fr) minmax(90px, 0.6fr) minmax(100px, 0.7fr) minmax(120px, 0.7fr)",
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
                  <div>
                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: THEME.accent, fontSize: 12, fontWeight: 800, textDecoration: "none" }}
                      >
                        Download
                      </a>
                    ) : (
                      <span style={{ color: THEME.textFaint, fontSize: 12, fontWeight: 700 }}>—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              borderRadius: 12,
              border: `1px solid ${THEME.border}`,
              padding: "12px 14px",
              fontSize: 12,
              lineHeight: 1.55,
              color: THEME.textFaint,
              background: THEME.surface,
            }}
          >
            No invoices found yet for this account.
          </div>
        )}
      </AccountCard>
    </div>
  );
}
