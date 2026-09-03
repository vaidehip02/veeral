"use client";

import Link from "next/link";

const RENTER_STEPS = [
  {
    number: "01",
    title: "Browse & find your piece",
    body: "Go to Browse and filter by Listing Type → For Rent. You can filter by garment type, size, colour, and price range. Each listing shows the daily rental rate and whether it's available to rent.",
    tip: "Tip: Don't overthink the filters — just type what you have in mind, like \"yellow saree\" or \"pink lehenga\", directly into the search bar. It's often the fastest way to discover what's available before narrowing things down.",
  },
  {
    number: "02",
    title: "Check the listing details",
    body: "Read the description carefully — look for the measurements (bust, waist, length), condition notes, and any flaws. The listing shows the security deposit amount (40% of the item's value, fully refundable) and the return deadline.",
    tip: "Tip: Message the seller before booking if you have sizing questions. Use the Message Seller button on any listing.",
  },
  {
    number: "03",
    title: "Select your rental dates",
    body: "Click Rent. Choose your start date (when you need it) and the number of days. The system automatically calculates your return-by date, giving you time to ship it back before the deadline.",
    tip: "Tip: Add 2–3 extra buffer days to account for shipping time on both ends — especially for events where you need the item a few days before.",
  },
  {
    number: "04",
    title: "Check out securely",
    body: "Enter your shipping address. Your total is broken into two charges: (1) the rental fee + Veeral fee + shipping, and (2) the refundable security deposit. Both are processed securely through Stripe.",
    tip: null,
  },
  {
    number: "05",
    title: "Receive & enjoy your rental",
    body: "The seller ships your item within 3 business days. You'll get a tracking number in your order dashboard. Wear and enjoy — just treat it with the same care you'd want for your own pieces.",
    tip: null,
  },
  {
    number: "06",
    title: "Return on time",
    body: "Ship the item back by the return-by date shown in your order. Purchase a shipping label at USPS, UPS, or FedEx and upload the tracking number to your order page — this is how \"on time\" is measured. Late returns incur a late fee (daily rate × days overdue × 1.5, capped at the deposit).",
    tip: "Tip: Ship at least 1–2 days before your return deadline to account for any carrier delays.",
  },
  {
    number: "07",
    title: "Get your deposit back",
    body: "After the seller confirms the item was returned in good condition, your security deposit is refunded — typically within 3–5 business days. If there's no damage and no late return, you receive the full deposit back. No questions asked.",
    tip: null,
  },
];

const OWNER_STEPS = [
  {
    number: "01",
    title: "Enable renting on your listing",
    body: "When creating or editing a listing, set a rental price per day. You can offer sale only, rent only, or both. Most sellers set a daily rate at 3–8% of the item's sale price.",
    tip: "Example: A lehenga listed at $800 might rent for $30–60/day.",
  },
  {
    number: "02",
    title: "A renter books your item",
    body: "When someone rents your item, you receive a notification. Pack it carefully — clean, pressed, in a garment bag if possible — and ship within 3 business days. Enter the tracking number in your dashboard.",
    tip: null,
  },
  {
    number: "03",
    title: "The renter returns it",
    body: "Once the renter ships it back, you'll see the tracking info. Inspect the item when it arrives. If everything is in good condition, confirm the return in your dashboard so the renter's deposit is released and your rental earnings are paid out.",
    tip: null,
  },
  {
    number: "04",
    title: "Report damage if needed",
    body: "If the item comes back damaged, report it through your dashboard before confirming the return. Veeral reviews the case and can retain part or all of the security deposit to cover repair or cleaning costs.",
    tip: null,
  },
];

const FAQS = [
  {
    q: "Is the security deposit always refunded?",
    a: "Yes, as long as the item is returned on time and in the same condition it was sent. Damage or late returns may result in partial or full retention of the deposit.",
  },
  {
    q: "What if the item doesn't fit?",
    a: "Rentals are non-refundable for fit issues — this is why we encourage renters to check measurements carefully and message sellers with questions before booking. Always request exact measurements before renting bridal or fitted pieces.",
  },
  {
    q: "What if the item arrives damaged or not as described?",
    a: "Contact Veeral support immediately. If the item is significantly not as described, you may be eligible for a full refund including your deposit. Document everything with photos.",
  },
  {
    q: "Can I extend my rental?",
    a: "Currently rentals cannot be extended after booking. If you need more time, message the seller — they can choose to accommodate. Otherwise, you must return by the original deadline to avoid late fees.",
  },
  {
    q: "How does the seller get paid for rentals?",
    a: "Rental earnings are released after the return is confirmed and the review window closes. The seller receives the rental fee minus Veeral's commission and Stripe's payment processing fee.",
  },
];

export default function RentGuidePage() {
  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>

      {/* Hero */}
      <div style={{ borderBottom: "1px solid var(--warm-tan)", padding: "4rem 1.5rem 3rem", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--burnt-orange)", marginBottom: "1rem" }}>
          ✦ Renting guide
        </p>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(2.2rem, 5vw, 3.5rem)", color: "#1A1A18", marginBottom: "1.2rem", lineHeight: 1.1 }}>
          Wear it once,<br />beautifully
        </h1>
        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.9rem", color: "var(--muted)", maxWidth: "480px", margin: "0 auto 2rem", lineHeight: 1.8 }}>
          Rent stunning South Asian fashion for weddings, festivals, and special occasions — at a fraction of the cost of buying. Here&apos;s everything you need to know.
        </p>
        <Link
          href="/listings?type=rent"
          style={{
            fontFamily: "var(--font-jost)", fontWeight: 700,
            fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase",
            padding: "0.9rem 2rem", background: "var(--burnt-orange)", color: "#fff",
            textDecoration: "none", display: "inline-block",
          }}
        >
          Browse rentals →
        </Link>
      </div>

      {/* Renter steps */}
      <div className="max-w-3xl mx-auto px-6 lg:px-10 py-16">
        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--burnt-orange)", marginBottom: "0.5rem" }}>
          Renting an item
        </p>
        <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.8rem", color: "#1A1A18", marginBottom: "2.5rem" }}>
          How to rent on Veeral
        </h2>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {RENTER_STEPS.map((step, i) => (
            <div key={step.number} style={{ display: "flex", gap: "2rem", paddingBottom: "2.5rem", borderLeft: i < RENTER_STEPS.length - 1 ? "1px solid var(--warm-tan)" : "none", marginLeft: "1.5rem", paddingLeft: "2rem", position: "relative" }}>
              <div style={{ position: "absolute", left: "-1.5rem", top: 0, width: "3rem", height: "3rem", background: "var(--cream)", border: "1px solid var(--warm-tan)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1rem", fontWeight: 500, color: "var(--burnt-orange)" }}>{step.number}</span>
              </div>
              <div style={{ paddingTop: "0.4rem", flex: 1 }}>
                <h3 style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.04em", color: "#1A1A18", marginBottom: "0.6rem" }}>
                  {step.title}
                </h3>
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

      {/* Deposit explainer */}
      <div style={{ borderTop: "1px solid var(--warm-tan)", borderBottom: "1px solid var(--warm-tan)", background: "#FAF6F1" }}>
        <div className="max-w-3xl mx-auto px-6 lg:px-10 py-12">
          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--burnt-orange)", marginBottom: "1.5rem" }}>
            About the security deposit
          </p>
          <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.8rem", color: "#1A1A18", marginBottom: "1rem" }}>
            Fully refundable. Always.
          </h2>
          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.8, marginBottom: "1.5rem" }}>
            Every rental includes a security deposit of 40% of the item&apos;s listed value. It&apos;s charged at checkout as a separate payment and held safely by Veeral — not the seller — until the return is confirmed.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
            {[
              { label: "Item value", value: "$500" },
              { label: "Deposit held", value: "$200" },
              { label: "Refunded after return", value: "$200" },
            ].map(card => (
              <div key={card.label} style={{ border: "1px solid var(--warm-tan)", padding: "1.2rem", background: "var(--cream)", textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.5rem" }}>{card.label}</p>
                <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "2rem", color: card.label === "Refunded after return" ? "#2D6A4F" : "#1A1A18" }}>{card.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* List your own item for rent */}
      <div className="max-w-3xl mx-auto px-6 lg:px-10 py-16">
        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--burnt-orange)", marginBottom: "0.5rem" }}>
          Own something beautiful?
        </p>
        <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.8rem", color: "#1A1A18", marginBottom: "2.5rem" }}>
          List your item for rent
        </h2>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {OWNER_STEPS.map((step, i) => (
            <div key={step.number} style={{ display: "flex", gap: "2rem", paddingBottom: "2.5rem", borderLeft: i < OWNER_STEPS.length - 1 ? "1px solid var(--warm-tan)" : "none", marginLeft: "1.5rem", paddingLeft: "2rem", position: "relative" }}>
              <div style={{ position: "absolute", left: "-1.5rem", top: 0, width: "3rem", height: "3rem", background: "var(--cream)", border: "1px solid var(--warm-tan)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1rem", fontWeight: 500, color: "var(--burnt-orange)" }}>{step.number}</span>
              </div>
              <div style={{ paddingTop: "0.4rem", flex: 1 }}>
                <h3 style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.04em", color: "#1A1A18", marginBottom: "0.6rem" }}>
                  {step.title}
                </h3>
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

      {/* FAQs */}
      <div style={{ borderTop: "1px solid var(--warm-tan)", background: "#FAF6F1" }}>
        <div className="max-w-3xl mx-auto px-6 lg:px-10 py-16">
          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--burnt-orange)", marginBottom: "2rem" }}>
            Common questions
          </p>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ borderBottom: "1px solid var(--warm-tan)", padding: "1.4rem 0" }}>
                <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.88rem", color: "#1A1A18", marginBottom: "0.5rem" }}>{faq.q}</p>
                <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.8 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "2rem", color: "#1A1A18", marginBottom: "1rem" }}>
          Find your next look
        </h2>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", marginBottom: "2rem" }}>
          Browse hundreds of rentals from South Asian sellers across the US.
        </p>
        <Link
          href="/listings?type=rent"
          style={{
            fontFamily: "var(--font-jost)", fontWeight: 700,
            fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase",
            padding: "0.9rem 2rem", background: "var(--burnt-orange)", color: "#fff",
            textDecoration: "none", display: "inline-block",
          }}
        >
          Browse rentals →
        </Link>
      </div>

    </div>
  );
}
