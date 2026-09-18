import {
  Html, Head, Body, Container, Section,
  Text, Heading, Hr, Preview, Row, Column,
} from "@react-email/components";

export interface ItemShippedProps {
  orderId: string;
  buyerName: string;
  itemTitle: string;
  trackingNumber: string;
  sellerDisplayName: string;
  shippingAddress?: string;
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

export default function ItemShipped({
  orderId, buyerName, itemTitle, trackingNumber, sellerDisplayName, shippingAddress,
}: ItemShippedProps) {
  const firstName = buyerName.split(" ")[0] || buyerName;

  return (
    <Html lang="en">
      <Head />
      <Preview>Your order has shipped — {itemTitle}</Preview>
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
              Your order is on its way, {firstName}.
            </Heading>
            <Text style={{ color: C.muted, fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
              {sellerDisplayName} has shipped your item. Use the tracking number below to
              follow your package.
            </Text>
          </Section>

          <Section style={{
            backgroundColor: C.card, border: `1px solid ${C.border}`,
            borderLeft: `3px solid ${C.accent}`, padding: "24px", marginBottom: "24px",
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

          {shippingAddress && (
            <Section style={{
              backgroundColor: C.card, border: `1px solid ${C.border}`,
              padding: "24px", marginBottom: "24px",
            }}>
              <Text style={{ ...capLabel, marginBottom: "8px" }}>Shipping to</Text>
              <Text style={{ color: C.dark, fontSize: "14px", lineHeight: "1.7", margin: 0 }}>
                {shippingAddress}
              </Text>
            </Section>
          )}

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
