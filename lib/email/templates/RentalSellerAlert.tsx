import {
  Html, Head, Body, Container, Section,
  Text, Heading, Hr, Preview, Row, Column,
} from "@react-email/components";

export interface RentalSellerAlertProps {
  orderId: string;
  sellerName: string;
  itemTitle: string;
  buyerDisplayName: string;
  rentalStart: string;
  rentalEnd: string;
  rentalDays: number;
  rentalFee: number;
  depositAmount: number;
  sellerPayout: number;
  shippingAddress?: string;
  orderDate: string;
}

const C = {
  bg: "#FAF6F1", card: "#FFFFFF", border: "#EDE6DE",
  dark: "#0D0906", muted: "#6B5E52", accent: "#C4440A", label: "#9C8B7E",
  green: "#065F46", greenBg: "#D1FAE5",
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
const lineLabel: React.CSSProperties = { color: C.muted, fontSize: "14px", margin: 0 };
const lineValue: React.CSSProperties = { color: C.dark, fontSize: "14px", margin: 0 };

export default function RentalSellerAlert({
  orderId, sellerName, itemTitle, buyerDisplayName,
  rentalStart, rentalEnd, rentalDays,
  rentalFee, depositAmount, sellerPayout, shippingAddress, orderDate,
}: RentalSellerAlertProps) {
  const firstName = sellerName.split(" ")[0] || sellerName;

  return (
    <Html lang="en">
      <Head />
      <Preview>Your item has been rented — {itemTitle}</Preview>
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

          {/* Payout highlight */}
          <Section style={{
            backgroundColor: C.greenBg, border: "1px solid #A7F3D0",
            padding: "20px 24px", marginBottom: "24px", textAlign: "center",
          }}>
            <Text style={{ color: C.green, fontSize: "11px", fontWeight: "bold", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 4px" }}>
              Your rental payout
            </Text>
            <Text style={{ color: C.green, fontSize: "32px", fontWeight: "bold", margin: 0 }}>
              ${sellerPayout.toFixed(2)}
            </Text>
            <Text style={{ color: C.green, fontSize: "12px", margin: "4px 0 0" }}>
              transferred after the renter confirms return
            </Text>
          </Section>

          <Section style={{ marginBottom: "24px" }}>
            <Heading style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic", fontWeight: 400,
              fontSize: "22px", color: C.dark, margin: "0 0 8px",
            }}>
              Your item has been rented, {firstName}!
            </Heading>
            <Text style={{ color: C.muted, fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
              Please ship <strong>{itemTitle}</strong> to the buyer&apos;s address below so it
              arrives before {rentalStart}. The renter will return it by {rentalEnd}.
            </Text>
          </Section>

          {/* Rental dates */}
          <Section style={{
            backgroundColor: C.card, border: `1px solid ${C.border}`,
            padding: "24px", marginBottom: "24px",
          }}>
            <Row>
              <Column>
                <Text style={{ ...capLabel, marginBottom: "4px" }}>Rented by</Text>
                <Text style={{ color: C.dark, fontSize: "14px", margin: "0 0 16px" }}>
                  {buyerDisplayName}
                </Text>
                <Text style={{ ...capLabel, marginBottom: "4px" }}>Rental period</Text>
                <Text style={{ color: C.dark, fontSize: "14px", margin: "0 0 16px" }}>
                  {rentalStart} — {rentalEnd} ({rentalDays} day{rentalDays !== 1 ? "s" : ""})
                </Text>
                <Text style={{ ...capLabel, marginBottom: "4px" }}>Order #</Text>
                <Text style={{ color: C.muted, fontSize: "13px", fontFamily: "monospace", margin: 0 }}>
                  {orderId}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Payout breakdown */}
          <Section style={{
            backgroundColor: C.card, border: `1px solid ${C.border}`,
            padding: "24px", marginBottom: "24px",
          }}>
            <Text style={{ ...capLabel, marginBottom: "16px" }}>Payout breakdown</Text>
            <Row style={{ marginBottom: "8px" }}>
              <Column><Text style={lineLabel}>Rental fee ({rentalDays} days)</Text></Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={lineValue}>${rentalFee.toFixed(2)}</Text>
              </Column>
            </Row>
            <Row style={{ marginBottom: "8px" }}>
              <Column><Text style={lineLabel}>Deposit held (refunded to renter on return)</Text></Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={lineValue}>${depositAmount.toFixed(2)}</Text>
              </Column>
            </Row>
            <Hr style={{ borderColor: C.border, margin: "12px 0" }} />
            <Row>
              <Column>
                <Text style={{ ...lineLabel, color: C.dark, fontWeight: "bold" }}>Your payout (after commission)</Text>
              </Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={{ ...lineValue, color: C.green, fontWeight: "bold", fontSize: "16px" }}>
                  ${sellerPayout.toFixed(2)}
                </Text>
              </Column>
            </Row>
          </Section>

          {shippingAddress && (
            <Section style={{
              backgroundColor: C.card, border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${C.accent}`,
              padding: "24px", marginBottom: "24px",
            }}>
              <Text style={{ ...capLabel, marginBottom: "8px" }}>Ship to</Text>
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
