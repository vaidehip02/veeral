import { Html, Head, Body, Container, Section, Text, Heading, Hr, Link, Preview } from "@react-email/components";

export interface NewMessageProps {
  senderName: string;
  senderUsername: string;
  listingTitle: string | null;
  preview: string;
  threadUrl: string;
}

const C = { bg:"#FAF6F1", card:"#FFFFFF", border:"#EDE6DE", dark:"#0D0906", muted:"#6B5E52", accent:"#C4440A", label:"#9C8B7E" };

export default function NewMessage({ senderName, senderUsername, listingTitle, preview, threadUrl }: NewMessageProps) {
  return (
    <Html lang="en"><Head />
      <Preview>New message from {senderName} on Veeral</Preview>
      <Body style={{ backgroundColor: C.bg, fontFamily: "Arial, Helvetica, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "0 16px 48px" }}>
          <Section style={{ padding: "36px 0 24px", textAlign: "center" }}>
            <Heading style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: "28px", color: C.dark, margin: 0 }}>Veeral</Heading>
          </Section>
          <Section style={{ backgroundColor: C.accent, padding: "3px 0", marginBottom: "32px" }} />

          <Section style={{ marginBottom: "24px" }}>
            <Heading style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400, fontSize: "22px", color: C.dark, margin: "0 0 8px" }}>
              New message from {senderName}
            </Heading>
            {senderUsername && (
              <Text style={{ color: C.muted, fontSize: "13px", margin: 0 }}>@{senderUsername}</Text>
            )}
          </Section>

          <Section style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, padding: "20px 24px", marginBottom: "24px" }}>
            {listingTitle && (
              <>
                <Text style={{ fontWeight: "bold", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: C.label, margin: "0 0 4px" }}>Re: listing</Text>
                <Text style={{ color: C.dark, fontSize: "14px", margin: "0 0 16px" }}>{listingTitle}</Text>
              </>
            )}
            <Text style={{ fontWeight: "bold", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: C.label, margin: "0 0 4px" }}>Message</Text>
            <Text style={{ color: C.dark, fontSize: "14px", lineHeight: "1.6", margin: 0, fontStyle: "italic" }}>&ldquo;{preview}&rdquo;</Text>
          </Section>

          <Section style={{ textAlign: "center", marginBottom: "24px" }}>
            <Link href={threadUrl} style={{ display: "inline-block", backgroundColor: C.accent, color: "#fff", fontFamily: "Arial, sans-serif", fontWeight: "bold", fontSize: "12px", letterSpacing: "0.16em", textTransform: "uppercase", padding: "12px 28px", textDecoration: "none" }}>
              Reply on Veeral
            </Link>
          </Section>

          <Hr style={{ borderColor: C.border, margin: "0 0 24px" }} />
          <Text style={{ color: C.label, fontSize: "11px", textAlign: "center", margin: 0 }}>
            You received this because you have a message on Veeral. You&apos;ll only receive one email per unread conversation.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
