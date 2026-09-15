import {
  Html, Head, Body, Container, Section, Text, Heading, Hr, Preview, Button,
} from "@react-email/components";

export interface NewListingProps {
  followerName: string;
  sellerDisplayName: string;
  sellerUsername: string;
  listingTitle: string;
  listingPrice: number;   // dollars
  listingId: string;
  listingImageUrl?: string | null;
}

const C = {
  bg: "#FAF6F1", card: "#FFFFFF", border: "#EDE6DE",
  dark: "#0D0906", muted: "#6B5E52", accent: "#C4440A", label: "#9C8B7E",
};

export default function NewListing({
  followerName, sellerDisplayName, sellerUsername,
  listingTitle, listingPrice, listingId,
}: NewListingProps) {
  const listingUrl = `https://www.shopveeral.com/listings/${listingId}`;
  const profileUrl = `https://www.shopveeral.com/sellers/${sellerUsername}`;

  return (
    <Html>
      <Head />
      <Preview>{sellerDisplayName} just posted a new listing on Veeral</Preview>
      <Body style={{ background: C.bg, margin: 0, padding: 0, fontFamily: "Georgia, serif" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 20px" }}>

          {/* Header */}
          <Section style={{ textAlign: "center", marginBottom: "32px" }}>
            <Heading style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: "28px", color: C.accent, margin: 0, letterSpacing: "-0.02em" }}>
              veeral
            </Heading>
          </Section>

          <Hr style={{ borderColor: C.border, margin: "0 0 32px" }} />

          <Section style={{ background: C.card, border: `1px solid ${C.border}`, padding: "32px" }}>
            <Text style={{ fontFamily: "Arial, sans-serif", fontSize: "13px", color: C.muted, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 8px" }}>
              New listing from someone you follow
            </Text>
            <Heading style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: "26px", color: C.dark, margin: "0 0 24px", lineHeight: 1.2 }}>
              {sellerDisplayName} posted a new item
            </Heading>

            <Text style={{ fontFamily: "Arial, sans-serif", fontSize: "14px", color: C.muted, lineHeight: 1.7, margin: "0 0 24px" }}>
              Hi {followerName}, a seller you follow just added something new to their shop.
            </Text>

            {/* Listing card */}
            <Section style={{ background: C.bg, border: `1px solid ${C.border}`, padding: "20px", marginBottom: "24px" }}>
              <Text style={{ fontFamily: "Arial, sans-serif", fontWeight: 600, fontSize: "15px", color: C.dark, margin: "0 0 6px", lineHeight: 1.4 }}>
                {listingTitle}
              </Text>
              <Text style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "18px", color: C.accent, margin: 0 }}>
                ${listingPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </Section>

            <Button href={listingUrl} style={{ background: C.accent, color: "#FAF6F1", fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", padding: "14px 28px", display: "inline-block", textDecoration: "none" }}>
              View Listing →
            </Button>
          </Section>

          <Hr style={{ borderColor: C.border, margin: "32px 0 24px" }} />

          <Text style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", color: C.label, textAlign: "center", lineHeight: 1.6 }}>
            You&apos;re receiving this because you follow{" "}
            <a href={profileUrl} style={{ color: C.accent, textDecoration: "none" }}>@{sellerUsername}</a> on Veeral.
            <br />
            To stop these emails, unfollow them from their profile.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
