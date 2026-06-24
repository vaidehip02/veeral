import { Html, Head, Body, Container, Section, Text, Heading, Hr, Preview } from "@react-email/components";

export interface ReturnReceivedProps {
  itemTitle: string;
  orderId: string;
  trackingNumber?: string;
}

const C = { bg:"#FAF6F1", card:"#FFFFFF", border:"#EDE6DE", dark:"#0D0906", muted:"#6B5E52", accent:"#C4440A", label:"#9C8B7E" };

export default function ReturnReceived({ itemTitle, orderId, trackingNumber }: ReturnReceivedProps) {
  return (
    <Html lang="en"><Head />
      <Preview>Return marked — {itemTitle}</Preview>
      <Body style={{ backgroundColor: C.bg, fontFamily: "Arial, Helvetica, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "0 16px 48px" }}>
          <Section style={{ padding: "36px 0 24px", textAlign: "center" }}>
            <Heading style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: "28px", color: C.dark, margin: 0 }}>Veeral</Heading>
          </Section>
          <Section style={{ backgroundColor: C.accent, padding: "3px 0", marginBottom: "32px" }} />
          <Section style={{ marginBottom: "24px" }}>
            <Heading style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: "22px", color: C.dark, margin: "0 0 8px" }}>
              Return marked by renter
            </Heading>
            <Text style={{ color: C.muted, fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
              The renter has marked <strong>{itemTitle}</strong> (Order #{orderId}) as returned.
              You have 5 business days to inspect the item and confirm the return. If you take no action,
              the deposit will be automatically released to the renter.
            </Text>
          </Section>
          {trackingNumber && (
            <Section style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, padding: "20px 24px", marginBottom: "24px" }}>
              <Text style={{ fontWeight: "bold", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: C.label, margin: "0 0 6px" }}>Tracking number</Text>
              <Text style={{ color: C.dark, fontSize: "14px", fontFamily: "monospace", margin: 0 }}>{trackingNumber}</Text>
            </Section>
          )}
          <Hr style={{ borderColor: C.border, margin: "0 0 24px" }} />
          <Text style={{ color: C.label, fontSize: "11px", textAlign: "center", margin: 0 }}>
            Veeral — South Asian fashion, reimagined.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
