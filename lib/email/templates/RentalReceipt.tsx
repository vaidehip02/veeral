import {
  Html, Head, Body, Container, Section,
  Text, Heading, Hr, Preview, Row, Column,
} from "@react-email/components";

export interface RentalReceiptProps {
  orderId: string;
  buyerName: string;
  itemTitle: string;
  sellerDisplayName: string;
  rentalStart: string;
  rentalEnd: string;
  rentalDays: number;
  rentalFee: number;
  depositAmount: number;
  total: number;
  shippingCost: number;
  orderDate: string;
  shippingAddress?: string;
}

const C = {
  bg: "#FAF6F1", card: "#FFFFFF", border: "#EDE6DE",
  dark: "#0D0906", muted: "#6B5E52", accent: "#C4440A", label: "#9C8B7E",
  blue: "#1E40AF", blueBg: "#EFF6FF",
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

export default function RentalReceipt({
  orderId, buyerName, itemTitle, sellerDisplayName,
  rentalStart, rentalEnd, rentalDays,
  rentalFee, depositAmount, total, shippingCost, orderDate, shippingAddress,
}: RentalReceiptProps) {
  const firstName = buyerName.split(" ")[0] || buyerName;

  return (
    <Html lang="en">
      <Head />
      <Preview>Rental confirmed — {itemTitle}</Preview>
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
              Your rental is confirmed, {firstName}.
            </Heading>
            <Text style={{ color: C.muted, fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
              {sellerDisplayName} has been notified and will ship your item before the rental
              start date. Please return it by {rentalEnd}.
            </Text>
          </Section>

          {/* Rental period highlight */}
          <Section style={{
            backgroundColor: C.blueBg, border: `1px solid #BFDBFE`,
            padding: "20px 24px", marginBottom: "24px",
          }}>
            <Row>
              <Column style={{ textAlign: "center" }}>
                <Text style={{ color: C.blue, fontSize: "10px", fontWeight: "bold", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 4px" }}>
                  Rental start
                </Text>
                <Text style={{ color: C.blue, fontSize: "18px", fontWeight: "bold", margin: 0 }}>
                  {rentalStart}
                </Text>
              </Column>
              <Column style={{ textAlign: "center", width: "40px" }}>
                <Text style={{ color: C.blue, fontSize: "18px", margin: 0 }}>→</Text>
              </Column>
              <Column style={{ textAlign: "center" }}>
                <Text style={{ color: C.blue, fontSize: "10px", fontWeight: "bold", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 4px" }}>
                  Return by
                </Text>
                <Text style={{ color: C.blue, fontSize: "18px", fontWeight: "bold", margin: 0 }}>
                  {rentalEnd}
                </Text>
              </Column>
            </Row>
            <Text style={{ color: C.blue, fontSize: "12px", textAlign: "center", margin: "12px 0 0" }}>
              {rentalDays} day{rentalDays !== 1 ? "s" : ""} rental
            </Text>
          </Section>

          {/* Order details */}
          <Section style={{
            backgroundColor: C.card, border: `1px solid ${C.border}`,
            padding: "24px", marginBottom: "24px",
          }}>
            <Text style={{ ...capLabel, marginBottom: "6px" }}>Item rented</Text>
            <Text style={{ color: C.dark, fontSize: "15px", fontWeight: "bold", margin: "0 0 20px" }}>
              {itemTitle}
            </Text>
            <Text style={{ ...capLabel, marginBottom: "6px" }}>Rented from</Text>
            <Text style={{ color: C.dark, fontSize: "14px", margin: "0 0 20px" }}>
              {sellerDisplayName}
            </Text>
            <Text style={{ ...capLabel, marginBottom: "6px" }}>Booking date</Text>
            <Text style={{ color: C.dark, fontSize: "14px", margin: "0 0 20px" }}>
              {orderDate}
            </Text>
            <Text style={{ ...capLabel, marginBottom: "6px" }}>Order #</Text>
            <Text style={{ color: C.muted, fontSize: "13px", fontFamily: "monospace", margin: 0 }}>
              {orderId}
            </Text>
          </Section>

          {/* Payment breakdown */}
          <Section style={{
            backgroundColor: C.card, border: `1px solid ${C.border}`,
            padding: "24px", marginBottom: "24px",
          }}>
            <Text style={{ ...capLabel, marginBottom: "16px" }}>Payment summary</Text>

            <Row style={{ marginBottom: "8px" }}>
              <Column><Text style={lineLabel}>Rental fee ({rentalDays} days)</Text></Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={lineValue}>${rentalFee.toFixed(2)}</Text>
              </Column>
            </Row>
            <Row style={{ marginBottom: "8px" }}>
              <Column><Text style={lineLabel}>Shipping</Text></Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={lineValue}>${shippingCost.toFixed(2)}</Text>
              </Column>
            </Row>
            <Row style={{ marginBottom: "8px" }}>
              <Column><Text style={lineLabel}>Refundable deposit</Text></Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={lineValue}>${depositAmount.toFixed(2)}</Text>
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

          {/* Deposit note */}
          <Section style={{
            backgroundColor: "#FFFBEB", border: "1px solid #FDE68A",
            padding: "16px 20px", marginBottom: "24px",
          }}>
            <Text style={{ color: "#92400E", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
              <strong>About your deposit:</strong> The ${depositAmount.toFixed(2)} deposit will be
              refunded in full when you return the item in good condition by {rentalEnd}. Late returns
              may incur a daily fee deducted from your deposit.
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
