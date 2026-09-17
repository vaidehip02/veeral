import * as React from "react";

interface Props {
  itemTitle: string;
  orderId: string;
  chargedCents: number;
  recipientType: "buyer" | "seller";
}

export default function RentalForcePurchase({
  itemTitle,
  orderId,
  chargedCents,
  recipientType,
}: Props) {
  const isBuyer = recipientType === "buyer";
  const fmt = (c: number) => `$${(c / 100).toFixed(2)}`;

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto", color: "#1a1a1a" }}>
      <div style={{ background: "#FEE2E2", padding: "24px 32px", borderRadius: 8 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: "#991B1B" }}>
          {isBuyer ? "Item not returned — purchase completed" : "Item not returned — payment collected"}
        </h1>
        <p style={{ color: "#666", fontSize: 14, margin: 0 }}>Order #{orderId}</p>
      </div>

      <div style={{ padding: "24px 32px" }}>
        {isBuyer ? (
          <>
            <p style={{ fontSize: 16, lineHeight: 1.6 }}>
              Because <strong>{itemTitle}</strong> was not returned within 14 days of the rental
              end date, your saved payment method has been charged <strong>{fmt(chargedCents)}</strong>{" "}
              (item price minus deposit already paid). You now own the item.
            </p>
            <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>
              If you believe this is an error, please contact us at help@shopveeral.com with your
              order ID and any shipping documentation.
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: 16, lineHeight: 1.6 }}>
              The renter did not return <strong>{itemTitle}</strong> within 14 days of the rental
              end date. We have charged their saved payment method <strong>{fmt(chargedCents)}</strong>.
              Your payout will be processed within 3–5 business days.
            </p>
            <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>
              If you have any questions, contact us at help@shopveeral.com.
            </p>
          </>
        )}

        <a
          href="https://shopveeral.com/account/orders"
          style={{
            display: "inline-block",
            background: "#D97706",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 6,
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 15,
            marginTop: 8,
          }}
        >
          View order →
        </a>
      </div>
    </div>
  );
}
