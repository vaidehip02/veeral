import * as React from "react";

interface Props {
  itemTitle: string;
  orderId: string;
  rentalEndDate: string;
  daysOverdue: number;
  daysUntilCharge: number;
  recipientType: "buyer" | "seller";
}

export default function RentalReminder({
  itemTitle,
  orderId,
  rentalEndDate,
  daysOverdue,
  daysUntilCharge,
  recipientType,
}: Props) {
  const isBuyer = recipientType === "buyer";
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto", color: "#1a1a1a" }}>
      <div style={{ background: "#F5F0EB", padding: "24px 32px", borderRadius: 8 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          {isBuyer ? "Return reminder" : "Item not yet returned"}
        </h1>
        <p style={{ color: "#666", fontSize: 14, margin: 0 }}>Order #{orderId}</p>
      </div>

      <div style={{ padding: "24px 32px" }}>
        <p style={{ fontSize: 16, lineHeight: 1.6 }}>
          {isBuyer ? (
            <>
              Your rental of <strong>{itemTitle}</strong> was due back on {rentalEndDate} —
              that&apos;s {daysOverdue} day{daysOverdue !== 1 ? "s" : ""} ago. Please ship
              it back as soon as possible and submit your tracking number.
            </>
          ) : (
            <>
              The buyer&apos;s rental of <strong>{itemTitle}</strong> (due {rentalEndDate}) is{" "}
              {daysOverdue} day{daysOverdue !== 1 ? "s" : ""} overdue. We have reminded them
              and will continue to follow up.
            </>
          )}
        </p>

        {isBuyer && (
          <div
            style={{
              background: "#FFF3CD",
              border: "1px solid #FFEEBA",
              borderRadius: 6,
              padding: "16px 20px",
              margin: "20px 0",
            }}
          >
            <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>
              ⚠️ Action required in {daysUntilCharge} day{daysUntilCharge !== 1 ? "s" : ""}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#555" }}>
              If we don&apos;t receive a return tracking number within {daysUntilCharge} day
              {daysUntilCharge !== 1 ? "s" : ""}, your payment method will be charged the full
              item price.
            </p>
          </div>
        )}

        {isBuyer && (
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
            Submit return tracking →
          </a>
        )}

        <p style={{ fontSize: 13, color: "#999", marginTop: 32 }}>
          Questions? Reply to this email or contact us at help@shopveeral.com.
        </p>
      </div>
    </div>
  );
}
