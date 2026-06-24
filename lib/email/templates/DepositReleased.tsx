import { Html, Head, Body, Container, Section, Text, Heading, Hr, Preview } from "@react-email/components";

export interface DepositReleasedProps {
  itemTitle: string;
  orderId: string;
  depositAmount: number; // dollars
  reason: string;
}

const C = { bg:"#FAF6F1", card:"#FFFFFF", border:"#EDE6DE", dark:"#0D0906", muted:"#6B5E52", accent:"#C4440A", label:"#9C8B7E", green:"#065F46", greenBg:"#D1FAE5" };

export default function DepositReleased({ itemTitle, orderId, depositAmount, reason }: DepositReleasedProps) {
  return (
    <Html lang="en"><Head />
      <Preview>Your deposit of ${depositAmount.toFixed(2)} has been released — {itemTitle}</Preview>
      <Body style={{ backgroundColor: C.bg, fontFamily: "Arial, Helvetica, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "0 16px 48px" }}>
          <Section style={{ padding: "36px 0 24px", textAlign: "center" }}>
            <Heading style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: "28px", color: C.dark, margin: 0 }}>Veeral</Heading>
          </Section>
          <Section style={{ backgroundColor: C.accent, padding: "3px 0", marginBottom: "32px" }} />
          <Section style={{ backgroundColor: C.greenBg, border: "1px solid #A7F3D0", padding: "20px 24px", marginBottom: "24px", textAlign: "center" }}>
            <Text style={{ color: C.green, fontSize: "11px", fontWeight: "bold", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 4px" }}>Deposit released</Text>
            <Text style={{ color: C.green, fontSize: "32px", fontWeight: "bold", margin: 0 }}>${depositAmount.toFixed(2)}</Text>
            <Text style={{ color: C.green, fontSize: "12px", margin: "4px 0 0" }}>will be returned to your original payment method</Text>
          </Section>
          <Section style={{ marginBottom: "24px" }}>
            <Heading style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: "22px", color: C.dark, margin: "0 0 8px" }}>
              Your deposit is on its way back.
            </Heading>
            <Text style={{ color: C.muted, fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
              {reason}
            </Text>
          </Section>
          <Section style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, padding: "20px 24px", marginBottom: "24px" }}>
            <Text style={{ fontWeight: "bold", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: C.label, margin: "0 0 6px" }}>Order</Text>
            <Text style={{ color: C.dark, fontSize: "14px", margin: "0 0 16px" }}>{itemTitle}</Text>
            <Text style={{ fontWeight: "bold", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: C.label, margin: "0 0 6px" }}>Reference</Text>
            <Text style={{ color: C.muted, fontSize: "13px", fontFamily: "monospace", margin: 0 }}>#{orderId}</Text>
          </Section>
          <Section style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A", padding: "16px 24px", marginBottom: "24px" }}>
            <Text style={{ color: "#92400E", fontSize: "12px", lineHeight: "1.6", margin: 0 }}>
              <strong>Note:</strong> No money has moved yet. The deposit release has been recorded and the Stripe refund will be processed shortly. Allow 5–10 business days for the funds to appear.
            </Text>
          </Section>
          <Hr style={{ borderColor: C.border, margin: "0 0 24px" }} />
          <Text style={{ color: C.label, fontSize: "11px", textAlign: "center", margin: 0 }}>Veeral — South Asian fashion, reimagined.</Text>
        </Container>
      </Body>
    </Html>
  );
}
