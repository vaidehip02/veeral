"use client";

import Link from "next/link";

const STEPS = [
  {
    number: "01",
    title: "Create your account",
    body: "Sign up at shopveeral.com — it's free. Choose \"I want to sell\" during signup so your seller dashboard is ready from day one. You'll be able to list immediately after confirming your email.",
    tip: null,
  },
  {
    number: "02",
    title: "Photograph your item",
    body: "Good photos sell items. Use natural light, a clean background, and shoot the full garment flat or on a hanger. Include close-ups of embellishments, the blouse, and any flaws. Aim for at least 4–6 photos.",
    tip: null,
  },
  {
    number: "03",
    title: "Create your listing",
    body: "Go to Sell → Create listing. Fill in the garment type, condition, size, colour, and designer. Write an honest description — include exact measurements (bust, waist, length) so buyers can gauge fit without guessing. Upload your photos.",
    tip: null,
  },
  {
    number: "04",
    title: "Set your price",
    body: "Enter your sale price (what you want to receive). Veeral adds a 10% buyer fee on top, so if you list at $300, the buyer pays $330 — you receive $300 minus Stripe's payment processing fee (~2.9% + 30¢). You can also set a rental price per day if you're open to renting.",
    tip: "Tip: Search Veeral for your item before setting a price — just type \"yellow saree\" or \"red lehenga\" in the search bar to see what similar pieces are listing for. It's the fastest way to gauge demand and price competitively.",
  },
  {
    number: "05",
    title: "Choose a shipping tier",
    body: "Select the shipping tier that matches your item's weight and size: Small ($8) for accessories and dupattas, Medium ($14) for sarees and salwar kameez, Large ($24) for lehengas and heavy bridal sets. The buyer pays this on top of their order. You'll purchase the shipping label through any carrier — USPS, UPS, or FedEx — after a sale.",
    tip: null,
  },
  {
    number: "06",
    title: "Go live",
    body: "Click Publish. Your listing enters a brief review before going live on the marketplace. You'll be notified by email once it's approved and visible to buyers.",
    tip: null,
  },
  {
    number: "07",
    title: "Ship within 3 days of a sale",
    body: "When your item sells, you'll get an email notification. Package it carefully — wrap in tissue, use a poly mailer or box — and ship within 3 business days. Enter the tracking number in your dashboard so the buyer can follow along.",
    tip: "Tip: Save your packaging supplies. Clean presentation makes a huge difference to a buyer's first impression.",
  },
  {
    number: "08",
    title: "Get paid",
    body: "Your payout is released after the buyer confirms delivery (or automatically after a short hold window). Connect your bank account via the Earnings page to receive payouts directly — this is required before your first payout is sent.",
    tip: null,
  },
];

const FAQS = [
  {
    q: "Is listing free?",
    a: "Yes — listing on Veeral is completely free. Veeral earns a small commission (added as a buyer fee) only when your item sells or is rented.",
  },
  {
    q: "What if my item doesn't sell?",
    a: "You can edit your listing at any time — update the price, improve photos, or adjust the description. If you want to remove it, you can archive or delete it from your dashboard.",
  },
  {
    q: "Can I sell items that aren't South Asian?",
    a: "Yes — Veeral welcomes all clothing and accessories from South Asian brands, including dresses, skirts, and western-inspired styles. Many South Asian designers are creating beautiful fusion and contemporary pieces, and we want to be a home for all of it. The key is that the brand or designer should be South Asian. Items with no connection to a South Asian brand or maker may be removed.",
  },
  {
    q: "What condition items can I sell?",
    a: "We accept new with tags, like new, good condition, and fair condition. Be honest — misrepresenting condition leads to disputes and can get your account suspended.",
  },
  {
    q: "What about returns?",
    a: "Sales on Veeral are final unless the item is significantly not as described. Encourage buyers to read your description carefully, and always photograph any flaws before listing.",
  },
];

export default function SellerGuidePage() {
  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>

      {/* Hero */}
      <div style={{ borderBottom: "1px solid var(--warm-tan)", padding: "4rem 1.5rem 3rem", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--burnt-orange)", marginBottom: "1rem" }}>
          ✦ Seller guide
        </p>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(2.2rem, 5vw, 3.5rem)", color: "#1A1A18", marginBottom: "1.2rem", lineHeight: 1.1 }}>
          Turn your wardrobe<br />into earnings
        </h1>
        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.9rem", color: "var(--muted)", maxWidth: "480px", margin: "0 auto 2rem", lineHeight: 1.8 }}>
          List your pre-loved South Asian pieces in minutes. Here&apos;s everything you need to know to sell confidently on Veeral.
        </p>
        <Link
          href="/dashboard/listings/new"
          style={{
            fontFamily: "var(--font-jost)", fontWeight: 700,
            fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase",
            padding: "0.9rem 2rem", background: "var(--burnt-orange)", color: "#fff",
            textDecoration: "none", display: "inline-block",
          }}
        >
          Start selling →
        </Link>
      </div>

      {/* Steps */}
      <div className="max-w-3xl mx-auto px-6 lg:px-10 py-16">
        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--burnt-orange)", marginBottom: "3rem" }}>
          How it works
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {STEPS.map((step, i) => (
            <div key={step.number} style={{ display: "flex", gap: "2rem", paddingBottom: "2.5rem", borderLeft: i < STEPS.length - 1 ? "1px solid var(--warm-tan)" : "none", marginLeft: "1.5rem", paddingLeft: "2rem", position: "relative" }}>
              {/* Number bubble */}
              <div style={{ position: "absolute", left: "-1.5rem", top: 0, width: "3rem", height: "3rem", background: "var(--cream)", border: "1px solid var(--warm-tan)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1rem", fontWeight: 500, color: "var(--burnt-orange)" }}>{step.number}</span>
              </div>
              <div style={{ paddingTop: "0.4rem", flex: 1 }}>
                <h2 style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.04em", color: "#1A1A18", marginBottom: "0.6rem" }}>
                  {step.title}
                </h2>
                <p style={{ fontFamily: "var(--font-jost)", fontWeight: 400, fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.8, marginBottom: step.tip ? "0.75rem" : 0 }}>
                  {step.body}
                </p>
                {step.tip && (
                  <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.8rem", color: "var(--burnt-orange)", lineHeight: 1.7, background: "rgba(201,92,26,0.06)", padding: "0.6rem 0.9rem", borderLeft: "2px solid var(--burnt-orange)" }}>
                    {step.tip}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What you earn */}
      <div style={{ borderTop: "1px solid var(--warm-tan)", borderBottom: "1px solid var(--warm-tan)", background: "#FAF6F1" }}>
        <div className="max-w-3xl mx-auto px-6 lg:px-10 py-12">
          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--burnt-orange)", marginBottom: "1.5rem" }}>
            What you earn
          </p>
          <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "2rem", color: "#1A1A18", marginBottom: "1rem" }}>
            Simple, transparent pricing
          </h2>
          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.8, marginBottom: "1.5rem" }}>
            Listing on Veeral is <strong>free</strong>. When your item sells, Veeral adds a 10% buyer fee on top of your listed price — you receive your full listed price minus only Stripe&apos;s standard payment processing fee.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
            {[
              { label: "You list at", value: "$300" },
              { label: "Buyer pays", value: "$330" },
              { label: "You receive", value: "~$291" },
            ].map(card => (
              <div key={card.label} style={{ border: "1px solid var(--warm-tan)", padding: "1.2rem", background: "var(--cream)", textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.5rem" }}>{card.label}</p>
                <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "2rem", color: card.label === "You receive" ? "#2D6A4F" : "#1A1A18" }}>{card.value}</p>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.75rem", opacity: 0.7 }}>
            * &ldquo;You receive&rdquo; reflects $300 minus Stripe&apos;s fee (~2.9% + $0.30). Shipping is paid separately by the buyer.
          </p>
        </div>
      </div>

      {/* FAQs */}
      <div className="max-w-3xl mx-auto px-6 lg:px-10 py-16">
        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--burnt-orange)", marginBottom: "2rem" }}>
          Common questions
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: "1px solid var(--warm-tan)", padding: "1.4rem 0" }}>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.88rem", color: "#1A1A18", marginBottom: "0.5rem" }}>{faq.q}</p>
              <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.8 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ borderTop: "1px solid var(--warm-tan)", padding: "4rem 1.5rem", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "2rem", color: "#1A1A18", marginBottom: "1rem" }}>
          Ready to list your first item?
        </h2>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", marginBottom: "2rem" }}>
          It takes less than 10 minutes. Your wardrobe is waiting.
        </p>
        <Link
          href="/dashboard/listings/new"
          style={{
            fontFamily: "var(--font-jost)", fontWeight: 700,
            fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase",
            padding: "0.9rem 2rem", background: "var(--burnt-orange)", color: "#fff",
            textDecoration: "none", display: "inline-block",
          }}
        >
          Create your first listing →
        </Link>
      </div>

    </div>
  );
}
