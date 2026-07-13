import { Html, Head, Body, Container, Section, Text, Heading, Hr, Preview } from "@react-email/components";

export interface ShipWarningProps {
  sellerName: string;
  itemTitle: string;
  orderId: string;
  daysLeft: number;      // days remaining before auto-cancel (deadline - warning)
  deadlineDate: string;  // human-readable deadline, e.g. "July 18, 2026"
  buyerDisplayName: string;
}

const C = { bg:"#FAF6F1", card:"#FFFFFF", border:"#EDE6DE", dark:"#0D0906", muted:"#6B5E52", accent:"#C4440A", label:"#9C8B7E", warn:"#92400E", warnBg:"#FFFBEB", warnBorder:"#FDE68A" };

export default function ShipWarning({ sellerName, itemTitle, orderId, daysLeft, deadlineDate, buyerDisplayName }: ShipWarningProps) {
  const firstName = sellerName.split(" ")[0] || sellerName;
  return (
    <Html lang="en"><Head />
      <Preview>{`Action required: ship ${itemTitle} within ${daysLeft} day${daysLeft !== 1 ? "s" : ""} to avoid cancellation`}</Preview>
      <Body style={{ backgroundColor: C.bg, fontFamily: "Arial, Helvetica, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "0 16px 48px" }}>
          <Section style={{ padding: "36px 0 24px", textAlign: "center" }}>
            <Heading style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: "28px", color: C.dark, margin: 0 }}>Veeral</Heading>
          </Section>
          <Section style={{ backgroundColor: C.accent, padding: "3px 0", marginBottom: "32px" }} />

          <Section style={{ backgroundColor: C.warnBg, border: `1px solid ${C.warnBorder}`, padding: "20px 24px", marginBottom: "24px" }}>
            <Text style={{ color: C.warn, fontSize: "11px", fontWeight: "bold", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 6px" }}>
              Ship by {deadlineDate}
            </Text>
            <Text style={{ color: C.warn, fontSize: "15px", fontWeight: "bold", margin: 0, lineHeight: "1.4" }}>
              You have {daysLeft} day{daysLeft !== 1 ? "s" : ""} left to ship this order before it is automatically cancelled and the buyer is refunded.
            </Text>
          </Section>

          <Section style={{ marginBottom: "24px" }}>
            <Heading style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: "22px", color: C.dark, margin: "0 0 8px" }}>
              Hi {firstName} — your item needs to ship soon.
            </Heading>
            <Text style={{ color: C.muted, fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
              {buyerDisplayName} is waiting for <strong>{itemTitle}</strong>. Veeral requires sellers to ship within 7 calendar days of purchase. If no tracking number has been uploaded by <strong>{deadlineDate}</strong>, this order will be automatically cancelled and the buyer will receive a full refund.
            </Text>
          </Section>

          <Section style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, padding: "20px 24px", marginBottom: "24px" }}>
            <Text style={{ fontWeight: "bold", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: C.label, margin: "0 0 6px" }}>Item</Text>
            <Text style={{ color: C.dark, fontSize: "14px", margin: "0 0 16px" }}>{itemTitle}</Text>
            <Text style={{ fontWeight: "bold", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: C.label, margin: "0 0 6px" }}>Order #</Text>
            <Text style={{ color: C.muted, fontSize: "13px", fontFamily: "monospace", margin: 0 }}>#{orderId}</Text>
          </Section>

          <Section style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.accent}`, padding: "20px 24px", marginBottom: "24px" }}>
            <Text style={{ fontWeight: "bold", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: C.label, margin: "0 0 8px" }}>How to ship</Text>
            <Text style={{ color: C.dark, fontSize: "14px", lineHeight: "1.7", margin: "0 0 6px" }}>1. Purchase a label from USPS, UPS, or FedEx.</Text>
            <Text style={{ color: C.dark, fontSize: "14px", lineHeight: "1.7", margin: "0 0 6px" }}>2. Drop off the item with the carrier.</Text>
            <Text style={{ color: C.dark, fontSize: "14px", lineHeight: "1.7", margin: 0 }}>3. Go to your Seller Dashboard → Orders → mark as shipped and enter the tracking number.</Text>
          </Section>

          <Hr style={{ borderColor: C.border, margin: "0 0 24px" }} />
          <Text style={{ color: C.label, fontSize: "11px", textAlign: "center", margin: 0 }}>Veeral — South Asian fashion, reimagined.</Text>
        </Container>
      </Body>
    </Html>
  );
}
