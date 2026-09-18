import {
  Html, Head, Body, Container, Section,
  Text, Heading, Hr, Preview,
} from "@react-email/components";

export interface ReturnSubmittedProps {
  orderId: string;
  buyerName: string;
  itemTitle: string;
  trackingNumber: string;
  /** If there was a late fee, pass the cents amount */
  lateFee?: number;
  daysOverdue?: number;
  depositAmount: number;
  depositRefund: number;
}

const C = {
  bg: "#FAF6F1", card: "#FFFFFF", border: "#EDE6DE",
  dark: "#0D0906", muted: "#6B5E52", accent: "#C4440A", label: "#9C8B7E",
};

const body: React.CSSProperties = {
  backgroundColor: C.bg, fontFamily: "Arial, Helvetica, sans-serif", margin: 0, padding: 0,
};
const container: React.CSSProperties = {
  maxWidth: "560px", margin: "0 auto", padding: "0 16px 48px",
};
const capLabel: React.CSSProperties = {
  fontWeight: "bold", fontSize: "10px", letterSpacing: "0.16em",
  textTransform: "uppercase", color: C.label, margin: 0,
};

export default function ReturnSubmitted({
  orderId, buyerName, itemTitle, trackingNumber,
  lateFee = 0, daysOverdue = 0, depositAmount, depositRefund,
}: ReturnSubmittedProps) {
  const firstName = buyerName.split(" ")[0] || buyerName;
  const isLate = lateFee > 0;

  return (
    <Html lang="en">
      <Head />
      <Preview>Return tracking submitted — {itemTitle}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={{ padding: "36px 0 24px", textAlign: "center" }}>
            <Heading style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic", fontWeight: 400,
              fontSize: "28px", color: C.dark, margin: 0, letterSpacing: "0.04em",
            }}>
              Veeral
            </Heading>
          </Section>
          <Section style={{ backgroundColor: C.accent, padding: "3px 0", marginBottom: "32px" }} />

          <Section style={{ marginBottom: "24px" }}>
            <Heading style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic", fontWeight: 400,
              fontSize: "22px", color: C.dark, margin: "0 0 8px",
            }}>
              Return submitted, {firstName}.
            </Heading>
            <Text style={{ color: C.muted, fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
              We&apos;ve received your return tracking number for <strong>{itemTitle}</strong>.
              The seller will confirm the item&apos;s condition once it arrives.
            </Text>
          </Section>

          <Section style={{
            backgroundColor: C.card, border: `1px solid ${C.border}`,
            padding: "24px", marginBottom: "24px",
          }}>
            <Text style={{ ...capLabel, marginBottom: "6px" }}>Item</Text>
            <Text style={{ color: C.dark, fontSize: "15px", fontWeight: "bold", margin: "0 0 20px" }}>
              {itemTitle}
            </Text>
            <Text style={{ ...capLabel, marginBottom: "6px" }}>Tracking number</Text>
            <Text style={{
              color: C.accent, fontSize: "16px", fontFamily: "monospace",
              fontWeight: "bold", letterSpacing: "0.05em", margin: "0 0 20px",
            }}>
              {trackingNumber}
            </Text>
            <Text style={{ ...capLabel, marginBottom: "6px" }}>Order #</Text>
            <Text style={{ color: C.muted, fontSize: "13px", fontFamily: "monospace", margin: 0 }}>
              {orderId}
            </Text>
          </Section>

          {/* Deposit status */}
          <Section style={{
            backgroundColor: isLate ? "#FEF9C3" : "#F0FDF4",
            border: `1px solid ${isLate ? "#FEF08A" : "#BBF7D0"}`,
            padding: "20px 24px", marginBottom: "24px",
          }}>
            <Text style={{
              color: isLate ? "#92400E" : "#065F46",
              fontSize: "13px", lineHeight: "1.6", margin: 0,
            }}>
              {isLate ? (
                <>
                  <strong>Late return — {daysOverdue} day{daysOverdue !== 1 ? "s" : ""} overdue.</strong>{" "}
                  A late fee of <strong>${(lateFee / 100).toFixed(2)}</strong> has been deducted
                  from your ${(depositAmount / 100).toFixed(2)} deposit. You will receive{" "}
                  <strong>${(depositRefund / 100).toFixed(2)}</strong> back once the seller
                  confirms the item is in good condition.
                </>
              ) : (
                <>
                  <strong>On-time return.</strong> Your full deposit of{" "}
                  <strong>${(depositAmount / 100).toFixed(2)}</strong> will be refunded once
                  the seller confirms the item arrived in good condition.
                </>
              )}
            </Text>
          </Section>

          <Hr style={{ borderColor: C.border, margin: "0 0 24px" }} />
          <Text style={{ color: C.label, fontSize: "12px", lineHeight: "1.6", textAlign: "center", margin: 0 }}>
            Questions? Reply to this email or contact{" "}
            <a href="mailto:help@shopveeral.com" style={{ color: C.accent, textDecoration: "none" }}>
              help@shopveeral.com
            </a>
          </Text>
          <Text style={{ color: C.label, fontSize: "11px", textAlign: "center", marginTop: "12px" }}>
            Veeral — South Asian fashion, reimagined.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
