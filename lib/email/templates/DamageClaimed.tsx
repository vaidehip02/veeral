import { Html, Head, Body, Container, Section, Text, Heading, Hr, Preview } from "@react-email/components";

export interface DamageClaimedProps {
  itemTitle: string;
  orderId: string;
  retainAmountDollars: number;
  depositAmountDollars: number;
  description: string;
  recipientRole: "buyer" | "admin";
}

const C = { bg:"#FAF6F1", card:"#FFFFFF", border:"#EDE6DE", dark:"#0D0906", muted:"#6B5E52", accent:"#C4440A", label:"#9C8B7E", red:"#991B1B", redBg:"#FEF2F2" };

export default function DamageClaimed({ itemTitle, orderId, retainAmountDollars, depositAmountDollars, description, recipientRole }: DamageClaimedProps) {
  const isBuyer = recipientRole === "buyer";
  return (
    <Html lang="en"><Head />
      <Preview>Damage claim filed — {itemTitle}</Preview>
      <Body style={{ backgroundColor: C.bg, fontFamily: "Arial, Helvetica, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "0 16px 48px" }}>
          <Section style={{ padding: "36px 0 24px", textAlign: "center" }}>
            <Heading style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: "28px", color: C.dark, margin: 0 }}>Veeral</Heading>
          </Section>
          <Section style={{ backgroundColor: C.accent, padding: "3px 0", marginBottom: "32px" }} />
          <Section style={{ backgroundColor: C.redBg, border: "1px solid #FECACA", padding: "16px 24px", marginBottom: "24px" }}>
            <Text style={{ color: C.red, fontSize: "11px", fontWeight: "bold", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 4px" }}>Damage claim filed</Text>
            <Text style={{ color: C.red, fontSize: "13px", margin: 0 }}>
              {isBuyer
                ? "The seller has filed a damage claim on your rental. Veeral admin will review and contact you."
                : `A seller has filed a damage claim. Review photos and description in the admin dashboard.`}
            </Text>
          </Section>
          <Section style={{ marginBottom: "24px" }}>
            <Heading style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: "22px", color: C.dark, margin: "0 0 8px" }}>
              {itemTitle}
            </Heading>
          </Section>
          <Section style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, padding: "20px 24px", marginBottom: "24px" }}>
            <Text style={{ fontWeight: "bold", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: C.label, margin: "0 0 6px" }}>Order reference</Text>
            <Text style={{ color: C.muted, fontSize: "13px", fontFamily: "monospace", margin: "0 0 16px" }}>#{orderId}</Text>

            <Text style={{ fontWeight: "bold", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: C.label, margin: "0 0 6px" }}>Seller description</Text>
            <Text style={{ color: C.dark, fontSize: "14px", lineHeight: "1.6", margin: "0 0 16px" }}>{description}</Text>

            <Text style={{ fontWeight: "bold", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: C.label, margin: "0 0 6px" }}>Amount requested to retain</Text>
            <Text style={{ color: C.dark, fontSize: "16px", fontWeight: "bold", margin: "0 0 4px" }}>${retainAmountDollars.toFixed(2)}</Text>
            <Text style={{ color: C.muted, fontSize: "12px", margin: 0 }}>out of ${depositAmountDollars.toFixed(2)} total deposit</Text>
          </Section>
          <Section style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A", padding: "16px 24px", marginBottom: "24px" }}>
            <Text style={{ color: "#92400E", fontSize: "12px", lineHeight: "1.6", margin: 0 }}>
              <strong>Note:</strong> No money has moved yet. The outcome will be set by a Veeral admin after reviewing the claim. You will receive another email once a decision is made.
            </Text>
          </Section>
          <Hr style={{ borderColor: C.border, margin: "0 0 24px" }} />
          <Text style={{ color: C.label, fontSize: "11px", textAlign: "center", margin: 0 }}>Veeral — South Asian fashion, reimagined.</Text>
        </Container>
      </Body>
    </Html>
  );
}
