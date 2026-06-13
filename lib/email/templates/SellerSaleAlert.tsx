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

export interface SellerSaleAlertProps {
  orderId: string;
  sellerName: string;
  itemTitle: string;
  /** Gross sale price in dollars */
  grossAmount: number;
  /** Platform fee in dollars (e.g. 10% commission) */
  platformFee: number;
  /** What the seller actually receives, in dollars */
  sellerPayout: number;
  buyerDisplayName: string;
  orderDate: string;
  /** Optional — shipping address the buyer entered at checkout */
  shippingAddress?: string;
}

const C = {
  bg:     "#FAF6F1",
  card:   "#FFFFFF",
  border: "#EDE6DE",
  dark:   "#0D0906",
  muted:  "#6B5E52",
  accent: "#C4440A",
  label:  "#9C8B7E",
  green:  "#065F46",
  greenBg:"#D1FAE5",
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

const capLabel: React.CSSProperties = {
  fontWeight: "bold", fontSize: "10px",
  letterSpacing: "0.16em", textTransform: "uppercase",
  color: C.label, margin: 0,
};

const lineLabel: React.CSSProperties = { color: C.muted, fontSize: "14px", margin: 0 };
const lineValue: React.CSSProperties = { color: C.dark,  fontSize: "14px", margin: 0 };

export default function SellerSaleAlert({
  orderId,
  sellerName,
  itemTitle,
  grossAmount,
  platformFee,
  sellerPayout,
  buyerDisplayName,
  orderDate,
  shippingAddress,
}: SellerSaleAlertProps) {
  const firstName = sellerName.split(" ")[0] || sellerName;

  return (
    <Html lang="en">
      <Head />
      <Preview>You made a sale on Veeral — {itemTitle}</Preview>

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

          <Section style={{ backgroundColor: C.accent, padding: "3px 0", marginBottom: "32px" }} />

          {/* ── Payout highlight ───────────────────────────────── */}
          <Section style={{
            backgroundColor: C.greenBg,
            border: `1px solid #A7F3D0`,
            padding: "20px 24px",
            marginBottom: "24px",
            textAlign: "center",
          }}>
            <Text style={{ color: C.green, fontSize: "11px", fontWeight: "bold", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 4px" }}>
              Your payout
            </Text>
            <Text style={{ color: C.green, fontSize: "32px", fontWeight: "bold", margin: 0 }}>
              ${sellerPayout.toFixed(2)}
            </Text>
            <Text style={{ color: C.green, fontSize: "12px", margin: "4px 0 0" }}>
              will be transferred to your Stripe account
            </Text>
          </Section>

          {/* ── Greeting ───────────────────────────────────────── */}
          <Section style={{ marginBottom: "24px" }}>
            <Heading style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic", fontWeight: 400,
              fontSize: "22px", color: C.dark, margin: "0 0 8px",
            }}>
              Congratulations, {firstName}!
            </Heading>
            <Text style={{ color: C.muted, fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
              Your item sold on Veeral. Here are the details — please ship
              the item to the buyer&apos;s address below as soon as possible.
            </Text>
          </Section>

          {/* ── Order details ──────────────────────────────────── */}
          <Section style={{
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            padding: "24px",
            marginBottom: "24px",
          }}>
            <Text style={{ ...capLabel, marginBottom: "6px" }}>Item sold</Text>
            <Text style={{ color: C.dark, fontSize: "15px", fontWeight: "bold", margin: "0 0 20px" }}>
              {itemTitle}
            </Text>

            <Text style={{ ...capLabel, marginBottom: "6px" }}>Buyer</Text>
            <Text style={{ color: C.dark, fontSize: "14px", margin: "0 0 20px" }}>
              {buyerDisplayName}
            </Text>

            <Text style={{ ...capLabel, marginBottom: "6px" }}>Sale date</Text>
            <Text style={{ color: C.dark, fontSize: "14px", margin: "0 0 20px" }}>
              {orderDate}
            </Text>

            <Text style={{ ...capLabel, marginBottom: "6px" }}>Order #</Text>
            <Text style={{ color: C.muted, fontSize: "13px", fontFamily: "monospace", margin: 0 }}>
              {orderId}
            </Text>
          </Section>

          {/* ── Payout breakdown ───────────────────────────────── */}
          <Section style={{
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            padding: "24px",
            marginBottom: "24px",
          }}>
            <Text style={{ ...capLabel, marginBottom: "16px" }}>Payout breakdown</Text>

            <Row style={{ marginBottom: "8px" }}>
              <Column><Text style={lineLabel}>Sale price</Text></Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={lineValue}>${grossAmount.toFixed(2)}</Text>
              </Column>
            </Row>

            <Row style={{ marginBottom: "8px" }}>
              <Column><Text style={lineLabel}>Veeral commission (10%)</Text></Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={{ ...lineValue, color: "#991B1B" }}>−${platformFee.toFixed(2)}</Text>
              </Column>
            </Row>

            <Hr style={{ borderColor: C.border, margin: "12px 0" }} />

            <Row>
              <Column>
                <Text style={{ ...lineLabel, color: C.dark, fontWeight: "bold" }}>Your payout</Text>
              </Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={{ ...lineValue, color: C.green, fontWeight: "bold", fontSize: "16px" }}>
                  ${sellerPayout.toFixed(2)}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* ── Ship to ────────────────────────────────────────── */}
          {shippingAddress && (
            <Section style={{
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${C.accent}`,
              padding: "24px",
              marginBottom: "24px",
            }}>
              <Text style={{ ...capLabel, marginBottom: "8px" }}>Ship to</Text>
              <Text style={{ color: C.dark, fontSize: "14px", lineHeight: "1.7", margin: 0 }}>
                {shippingAddress}
              </Text>
            </Section>
          )}

          {/* ── Footer ─────────────────────────────────────────── */}
          <Hr style={{ borderColor: C.border, margin: "0 0 24px" }} />

          <Text style={{ color: C.label, fontSize: "12px", lineHeight: "1.6", textAlign: "center", margin: 0 }}>
            Questions or issues with this order? Contact us at{" "}
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
