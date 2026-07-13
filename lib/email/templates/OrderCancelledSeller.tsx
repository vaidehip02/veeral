import { Html, Head, Body, Container, Section, Text, Heading, Hr, Preview } from "@react-email/components";

export interface OrderCancelledSellerProps {
  sellerName: string;
  itemTitle: string;
  orderId: string;
  isFlagged: boolean; // true if this is their 2nd+ failure
}

const C = { bg:"#FAF6F1", card:"#FFFFFF", border:"#EDE6DE", dark:"#0D0906", muted:"#6B5E52", accent:"#C4440A", label:"#9C8B7E", warn:"#92400E", warnBg:"#FFFBEB", warnBorder:"#FDE68A" };

export default function OrderCancelledSeller({ sellerName, itemTitle, orderId, isFlagged }: OrderCancelledSellerProps) {
  const firstName = sellerName.split(" ")[0] || sellerName;
  return (
    <Html lang="en"><Head />
      <Preview>Your order for {itemTitle} was automatically cancelled</Preview>
      <Body style={{ backgroundColor: C.bg, fontFamily: "Arial, Helvetica, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "0 16px 48px" }}>
          <Section style={{ padding: "36px 0 24px", textAlign: "center" }}>
            <Heading style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: "28px", color: C.dark, margin: 0 }}>Veeral</Heading>
          </Section>
          <Section style={{ backgroundColor: C.accent, padding: "3px 0", marginBottom: "32px" }} />

          <Section style={{ marginBottom: "24px" }}>
            <Heading style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: "22px", color: C.dark, margin: "0 0 8px" }}>
              {firstName}, your order was cancelled.
            </Heading>
            <Text style={{ color: C.muted, fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
              <strong>{itemTitle}</strong> was not shipped within Veeral&apos;s 7-day window. The order has been automatically cancelled, the buyer has been refunded in full, and your listing has been returned to active so it can sell again.
            </Text>
          </Section>

          <Section style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, padding: "20px 24px", marginBottom: "24px" }}>
            <Text style={{ fontWeight: "bold", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: C.label, margin: "0 0 6px" }}>Cancelled order</Text>
            <Text style={{ color: C.dark, fontSize: "14px", margin: "0 0 16px" }}>{itemTitle}</Text>
            <Text style={{ fontWeight: "bold", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: C.label, margin: "0 0 6px" }}>Reference</Text>
            <Text style={{ color: C.muted, fontSize: "13px", fontFamily: "monospace", margin: 0 }}>#{orderId}</Text>
          </Section>

          {isFlagged && (
            <Section style={{ backgroundColor: C.warnBg, border: `1px solid ${C.warnBorder}`, padding: "16px 24px", marginBottom: "24px" }}>
              <Text style={{ color: C.warn, fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                <strong>Please note:</strong> This is not your first unshipped cancellation. Repeated failures to ship may affect your ability to sell on Veeral. If you&apos;re having trouble fulfilling orders, contact us at{" "}
                <a href="mailto:help@shopveeral.com" style={{ color: C.accent }}>help@shopveeral.com</a> before the deadline.
              </Text>
            </Section>
          )}

          <Section style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.accent}`, padding: "20px 24px", marginBottom: "24px" }}>
            <Text style={{ fontWeight: "bold", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: C.label, margin: "0 0 8px" }}>What you should know</Text>
            <Text style={{ color: C.dark, fontSize: "13px", lineHeight: "1.7", margin: "0 0 6px" }}>• Your listing is back on sale and can receive a new order.</Text>
            <Text style={{ color: C.dark, fontSize: "13px", lineHeight: "1.7", margin: "0 0 6px" }}>• The buyer received a full refund including shipping and fees.</Text>
            <Text style={{ color: C.dark, fontSize: "13px", lineHeight: "1.7", margin: 0 }}>• If you needed more time and the item is still available, it will now show as active again.</Text>
          </Section>

          <Hr style={{ borderColor: C.border, margin: "0 0 24px" }} />
          <Text style={{ color: C.label, fontSize: "11px", textAlign: "center", margin: 0 }}>Veeral — South Asian fashion, reimagined.</Text>
        </Container>
      </Body>
    </Html>
  );
}
