import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Preview,
  Row,
  Column,
} from "@react-email/components";

export interface BuyerReceiptProps {
  /** Short display ID shown in the email, e.g. the first 8 chars of the UUID */
  orderId: string;
  buyerName: string;
  itemTitle: string;
  /** Amount paid in dollars (already divided by 100) */
  itemPrice: number;
  shippingCost: number;
  total: number;
  sellerDisplayName: string;
  orderDate: string;          // e.g. "June 12, 2026"
  /** Optional — omit if not yet collected */
  shippingAddress?: string;
}

// ── Style constants (inline — required for email client compatibility) ─────────
const C = {
  bg:      "#FAF6F1",
  card:    "#FFFFFF",
  border:  "#EDE6DE",
  dark:    "#0D0906",
  muted:   "#6B5E52",
  accent:  "#C4440A",
  label:   "#9C8B7E",
};

const body: React.CSSProperties = {
  backgroundColor: C.bg,
  fontFamily: "Arial, Helvetica, sans-serif",
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "0 16px 48px",
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function BuyerReceipt({
  orderId,
  buyerName,
  itemTitle,
  itemPrice,
  shippingCost,
  total,
  sellerDisplayName,
  orderDate,
  shippingAddress,
}: BuyerReceiptProps) {
  const firstName = buyerName.split(" ")[0] || buyerName;

  return (
    <Html lang="en">
      <Head />
      <Preview>Your Veeral receipt for {itemTitle}</Preview>

      <Body style={body}>
        <Container style={container}>

          {/* ── Header ─────────────────────────────────────────── */}
          <Section style={{ padding: "36px 0 24px", textAlign: "center" }}>
            <Heading style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic", fontWeight: 400,
              fontSize: "28px", color: C.dark,
              margin: 0, letterSpacing: "0.04em",
            }}>
              Veeral
            </Heading>
          </Section>

          {/* ── Accent bar ─────────────────────────────────────── */}
          <Section style={{ backgroundColor: C.accent, padding: "3px 0", marginBottom: "32px" }} />

          {/* ── Greeting ───────────────────────────────────────── */}
          <Section style={{ marginBottom: "24px" }}>
            <Heading style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic", fontWeight: 400,
              fontSize: "22px", color: C.dark, margin: "0 0 8px",
            }}>
              Thank you, {firstName}.
            </Heading>
            <Text style={{ color: C.muted, fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
              Your order has been placed and the seller has been notified.
              Here&apos;s your receipt.
            </Text>
          </Section>

          {/* ── Order card ─────────────────────────────────────── */}
          <Section style={{
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            padding: "24px",
            marginBottom: "24px",
          }}>
            {/* Item */}
            <Text style={{ ...capLabel, marginBottom: "6px" }}>Item purchased</Text>
            <Text style={{ color: C.dark, fontSize: "15px", fontWeight: "bold", margin: "0 0 20px" }}>
              {itemTitle}
            </Text>

            <Text style={{ ...capLabel, marginBottom: "6px" }}>Sold by</Text>
            <Text style={{ color: C.dark, fontSize: "14px", margin: "0 0 20px" }}>
              {sellerDisplayName}
            </Text>

            <Text style={{ ...capLabel, marginBottom: "6px" }}>Order date</Text>
            <Text style={{ color: C.dark, fontSize: "14px", margin: "0 0 20px" }}>
              {orderDate}
            </Text>

            <Text style={{ ...capLabel, marginBottom: "6px" }}>Order #</Text>
            <Text style={{ color: C.muted, fontSize: "13px", fontFamily: "monospace", margin: 0 }}>
              {orderId}
            </Text>
          </Section>

          {/* ── Price breakdown ────────────────────────────────── */}
          <Section style={{
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            padding: "24px",
            marginBottom: "24px",
          }}>
            <Text style={{ ...capLabel, marginBottom: "16px" }}>Payment summary</Text>

            <Row style={{ marginBottom: "8px" }}>
              <Column><Text style={lineLabel}>Item price</Text></Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={lineValue}>${itemPrice.toFixed(2)}</Text>
              </Column>
            </Row>

            <Row style={{ marginBottom: "8px" }}>
              <Column><Text style={lineLabel}>Shipping</Text></Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={lineValue}>${shippingCost.toFixed(2)}</Text>
              </Column>
            </Row>

            <Hr style={{ borderColor: C.border, margin: "12px 0" }} />

            <Row>
              <Column>
                <Text style={{ ...lineLabel, color: C.dark, fontWeight: "bold" }}>Total charged</Text>
              </Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={{ ...lineValue, color: C.accent, fontWeight: "bold", fontSize: "16px" }}>
                  ${total.toFixed(2)}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* ── Shipping address (if available) ────────────────── */}
          {shippingAddress && (
            <Section style={{
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              padding: "24px",
              marginBottom: "24px",
            }}>
              <Text style={{ ...capLabel, marginBottom: "8px" }}>Shipping to</Text>
              <Text style={{ color: C.dark, fontSize: "14px", lineHeight: "1.7", margin: 0 }}>
                {shippingAddress}
              </Text>
            </Section>
          )}

          {/* ── Footer ─────────────────────────────────────────── */}
          <Hr style={{ borderColor: C.border, margin: "0 0 24px" }} />

          <Text style={{ color: C.label, fontSize: "12px", lineHeight: "1.6", textAlign: "center", margin: 0 }}>
            Questions about your order? Reply to this email or contact us at{" "}
            <a href="mailto:hello@veeral.com" style={{ color: C.accent, textDecoration: "none" }}>
              hello@veeral.com
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

// ── Shared mini-styles ────────────────────────────────────────────────────────
const capLabel: React.CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif",
  fontWeight: "bold", fontSize: "10px",
  letterSpacing: "0.16em", textTransform: "uppercase",
  color: "#9C8B7E", margin: 0,
};

const lineLabel: React.CSSProperties = {
  color: "#6B5E52", fontSize: "14px", margin: 0,
};

const lineValue: React.CSSProperties = {
  color: "#0D0906", fontSize: "14px", margin: 0,
};
