import { Html, Head, Body, Container, Section, Text, Heading, Hr, Preview } from "@react-email/components";

export interface OrderCancelledBuyerProps {
  buyerName: string;
  itemTitle: string;
  orderId: string;
  refundAmount: number; // dollars — full amount charged
}

const C = { bg:"#FAF6F1", card:"#FFFFFF", border:"#EDE6DE", dark:"#0D0906", muted:"#6B5E52", accent:"#C4440A", label:"#9C8B7E", green:"#065F46", greenBg:"#D1FAE5" };

export default function OrderCancelledBuyer({ buyerName, itemTitle, orderId, refundAmount }: OrderCancelledBuyerProps) {
  const firstName = buyerName.split(" ")[0] || buyerName;
  return (
    <Html lang="en"><Head />
      <Preview>Your order for {itemTitle} has been cancelled — full refund issued</Preview>
      <Body style={{ backgroundColor: C.bg, fontFamily: "Arial, Helvetica, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "0 16px 48px" }}>
          <Section style={{ padding: "36px 0 24px", textAlign: "center" }}>
            <Heading style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: "28px", color: C.dark, margin: 0 }}>Veeral</Heading>
          </Section>
          <Section style={{ backgroundColor: C.accent, padding: "3px 0", marginBottom: "32px" }} />

          <Section style={{ backgroundColor: C.greenBg, border: "1px solid #A7F3D0", padding: "20px 24px", marginBottom: "24px", textAlign: "center" }}>
            <Text style={{ color: C.green, fontSize: "11px", fontWeight: "bold", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 4px" }}>Full refund issued</Text>
            <Text style={{ color: C.green, fontSize: "32px", fontWeight: "bold", margin: 0 }}>${refundAmount.toFixed(2)}</Text>
            <Text style={{ color: C.green, fontSize: "12px", margin: "4px 0 0" }}>will be returned to your original payment method</Text>
          </Section>

          <Section style={{ marginBottom: "24px" }}>
            <Heading style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: "22px", color: C.dark, margin: "0 0 8px" }}>
              Sorry, {firstName} — your order was cancelled.
            </Heading>
            <Text style={{ color: C.muted, fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
              The seller did not ship <strong>{itemTitle}</strong> within Veeral&apos;s 7-day shipping window. Your order has been automatically cancelled and a full refund of <strong>${refundAmount.toFixed(2)}</strong> has been issued, including the item price, shipping, and any fees you paid. Allow 5–10 business days for the funds to appear.
            </Text>
          </Section>

          <Section style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, padding: "20px 24px", marginBottom: "24px" }}>
            <Text style={{ fontWeight: "bold", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: C.label, margin: "0 0 6px" }}>Cancelled order</Text>
            <Text style={{ color: C.dark, fontSize: "14px", margin: "0 0 16px" }}>{itemTitle}</Text>
            <Text style={{ fontWeight: "bold", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: C.label, margin: "0 0 6px" }}>Reference</Text>
            <Text style={{ color: C.muted, fontSize: "13px", fontFamily: "monospace", margin: 0 }}>#{orderId}</Text>
          </Section>

          <Hr style={{ borderColor: C.border, margin: "0 0 24px" }} />
          <Text style={{ color: C.label, fontSize: "12px", lineHeight: "1.6", textAlign: "center", margin: 0 }}>
            Questions? Contact us at{" "}
            <a href="mailto:help@shopveeral.com" style={{ color: C.accent, textDecoration: "none" }}>help@shopveeral.com</a>
          </Text>
          <Text style={{ color: C.label, fontSize: "11px", textAlign: "center", marginTop: "12px" }}>Veeral — South Asian fashion, reimagined.</Text>
        </Container>
      </Body>
    </Html>
  );
}
