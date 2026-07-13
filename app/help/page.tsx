"use client";

import { useState } from "react";
import Link from "next/link";

// ── Shared components (must be defined before data that uses them) ─────────────

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: "var(--font-jost)", fontSize: "1rem", color: "#4A3F3A", lineHeight: 1.9, marginBottom: "0.85rem" }}>
      {children}
    </p>
  );
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: "0 0 0.85rem 0", padding: "0 0 0 1.3rem" }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontFamily: "var(--font-jost)", fontSize: "1rem", color: "#4A3F3A", lineHeight: 1.9, marginBottom: "0.2rem" }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

// ── Content data ──────────────────────────────────────────────────────────────

const FEATURED = [
  { label: "How to ship — US",           section: "shipping" },
  { label: "How do I get paid?",          section: "payments" },
  { label: "I haven't received my order", section: "buying"   },
  { label: "My item is not as described", section: "buying"   },
  { label: "How do I refund a buyer?",    section: "disputes" },
  { label: "Will I have to pay tax?",     section: "payments" },
];

const CATEGORIES = [
  { icon: "🛍", label: "Buying",             section: "buying",    links: ["Finding items", "Making an offer", "Checking out", "Buyer protection", "Fit & alterations"] },
  { icon: "🏷", label: "Selling",            section: "selling",   links: ["Creating a listing", "Sizing guide", "Drafts", "Ratings & reviews", "Fees & taxes"] },
  { icon: "📦", label: "Shipping",           section: "shipping",  links: ["Shipping requirements", "Packaging tips"] },
  { icon: "💳", label: "Payments",           section: "payments",  links: ["Getting paid", "Payout timing", "Pending payments", "Payout issues"] },
  { icon: "👤", label: "Your Account",       section: "account",   links: ["Logging in", "Managing your account", "Technical issues"] },
  { icon: "🤝", label: "Community & Safety", section: "community", links: ["Community guidelines", "Safety tips"] },
];

interface ContentItem { title: string; body: React.ReactNode }
interface ContentSection { id: string; label: string; icon: string; items: ContentItem[] }

const CONTENT_SECTIONS: ContentSection[] = [
  {
    id: "selling", label: "Selling on Veeral", icon: "🏷",
    items: [
      { title: "Sizing", body: <><P>Veeral uses standard US sizing (0–20) across the platform. Sellers must select a US size when creating a listing — this should reflect the best overall fit of the garment, even if it was originally custom-stitched or labeled differently.</P><P>Required measurements to include in your listing description:</P><Ul items={["Bust","Waist","Hips","Garment length","Sleeve length (if applicable)"]} /><P>If the garment has stretch, adjustable ties, elastic, or a margin for alterations, please note this clearly. Detailed measurements are still required regardless.</P></> },
      { title: "Creating a Listing", body: <><P>Clear, detailed listings help buyers feel confident — and help your item sell faster.</P><P><strong>Title</strong> — include the garment type and occasion. Example: <em>&ldquo;Silk Lehenga Set &ndash; Wedding Wear&rdquo;</em></P><P><strong>Condition</strong> — note any wear, fading, discoloration, repairs, or missing pieces (e.g., dupatta or blouse not included).</P><P><strong>Fabric &amp; Details</strong> — include fabric type and embellishments such as silk, chiffon, georgette, zari work, mirror work, or beadwork.</P><P><strong>Photos</strong> — upload clear photos of the front and back, close-ups of fabric and embroidery, and any flaws. Transparency protects both buyers and sellers.</P></> },
      { title: "Saving Drafts", body: <P>You can save a listing as a draft at any time and return to it later. Drafts are accessible across devices as long as you&apos;re logged in to your Veeral account.</P> },
      { title: "Seller Ratings & Reviews", body: <><P>After a transaction is completed and delivery is confirmed, both buyers and sellers are invited to leave a review.</P><Ul items={["Reviews can be left once delivery is confirmed by the platform","Both buyers and sellers may review each other after a transaction","Reviews must be honest, respectful, and based on the actual transaction","If you believe a review violates our content policies, you may report it to Veeral Support"]} /></> },
      { title: "Fees & Taxes", body: <><P>Veeral charges a commission on each completed sale, automatically deducted from your payout. Listing on Veeral is free.</P><Ul items={["Veeral's commission percentage is displayed at the time of listing","Sellers are solely responsible for reporting and paying applicable income taxes","Veeral does not provide tax advice","If your annual earnings exceed $600 (USD), Veeral may be required to issue a 1099 form"]} /></> },
      { title: "Content Policies", body: <P>Listings, messages, reviews, images, and profiles must not include false or misleading information, counterfeit or prohibited items, hate speech, harassment, explicit content, or material that infringes on intellectual property rights. Veeral reserves the right to review, remove, or restrict any content that violates these policies.</P> },
    ],
  },
  {
    id: "shipping", label: "Shipping on Veeral", icon: "📦",
    items: [
      { title: "Shipping Requirements for Sellers", body: <><Ul items={["Ship the item within 7 days of purchase","Use a tracked shipping service (USPS, UPS, or FedEx)","Upload the tracking number once the item is shipped"]} /><P>Tracking allows Veeral to confirm delivery, release payouts, and resolve disputes. Faster shipping improves your seller rating and buyer experience.</P></> },
      { title: "Preparing Your Item for Shipment", body: <><P>Indian garments often include delicate fabrics and detailed handwork. Careful packaging matters.</P><Ul items={["Fold garments gently to protect embroidery or beadwork","Use protective inner wrapping when possible","Remove or cover old shipping labels if reusing packaging","Choose packaging that fits closely to reduce movement and waste","If your listing includes multiple pieces (e.g., blouse + dupatta), ensure all listed items are included"]} /></> },
    ],
  },
  {
    id: "buying", label: "Buying on Veeral", icon: "🛍",
    items: [
      { title: "Finding Items", body: <P>Browse by category, garment type, occasion, size, or fabric using the search and filter tools on the Veeral homepage. You can also save items to your wishlist to revisit later.</P> },
      { title: "Making an Offer", body: <P>Some listings allow buyers to make an offer below the listed price. If a seller accepts your offer, the item will be held for you to complete purchase. Offers expire after 24 hours if not accepted.</P> },
      { title: "Checking Out", body: <><Ul items={["Add the item to your cart","Review item details, measurements, and condition notes","Enter your shipping address","Complete payment via our secure checkout","You will receive a confirmation email with your order details"]} /><P>Once your order is confirmed, the seller will be notified and has 7 days to ship.</P></> },
      { title: "Buyer Protection — What's Covered", body: <><P>You may be eligible for a return if:</P><Ul items={["You received the wrong item","Pieces listed are missing from a set","The size, color, or condition was clearly misrepresented","The item is counterfeit","The item was lost or damaged in transit"]} /></> },
      { title: "Buyer Protection — What's Not Covered", body: <Ul items={["Minor wear consistent with pre-owned or vintage items","Fabric appearance differences due to lighting or photography","Fit issues when accurate measurements were provided","Change-of-mind returns","Items that have been altered or tailored after delivery"]} /> },
      { title: "How to Request a Return", body: <P>Report the issue through Veeral within 7 days of confirmed delivery. Provide photos and details of the discrepancy and follow the instructions from our support team. When returning: use a tracked shipping provider, package the item securely, and return all pieces in their original condition. Refunds are typically issued once the item is received by the seller.</P> },
      { title: "Fit, Tailoring & Alterations", body: <><P>Veeral uses US sizing (0–20), but many Indian garments are designed to be altered. We offer a tailor discovery feature to help buyers find local tailoring services.</P><Ul items={["Veeral does not provide tailoring services directly","Veeral does not guarantee pricing, availability, or quality of third-party tailors","Any tailoring arrangement is between the buyer and the tailor","Items altered or tailored after delivery are not eligible for Buyer Protection"]} /><P>We recommend reviewing measurements carefully before purchasing and consulting a tailor before making permanent alterations.</P></> },
    ],
  },
  {
    id: "disputes", label: "Dispute Resolution", icon: "⚖️",
    items: [
      { title: "How Disputes Work", body: <><Ul items={["Buyer reports the issue within 7 days of confirmed delivery with supporting photos","Veeral Support acknowledges the report within 3 business days","Both parties may be asked to provide additional information","Veeral issues a resolution within 7 business days of the dispute being opened"]} /><P>During an open dispute, the seller&apos;s payout for the affected transaction will be placed on hold until the matter is resolved.</P></> },
      { title: "Possible Outcomes", body: <><Ul items={["Full refund to buyer and return of item to seller","Partial refund issued to buyer","Dispute dismissed and payout released to seller"]} /><P>Veeral&apos;s decision is final for transactions conducted through the platform.</P></> },
    ],
  },
  {
    id: "renting", label: "Renting on Veeral", icon: "👗",
    items: [
      { title: "Rental Listings", body: <P>Sellers (owners) specify the rental price per day or flat event rate, minimum and maximum rental duration, included pieces, care instructions, and availability. Renters specify their requested start date and number of days — the return-by date is then auto-calculated.</P> },
      { title: "Renter Responsibilities", body: <Ul items={["Return the item by the stated return-by date","Use tracked shipping for returns","Follow the provided care instructions","Avoid permanent alterations or tailoring"]} /> },
      { title: "Condition Standards", body: <P>Rental items must be returned in the same condition they were received, aside from normal wear. Damage beyond normal wear includes stains, tears or holes, and missing embellishments or pieces.</P> },
      { title: "Security Deposits & Late Fees", body: <><P>Rental items require a refundable security deposit. Deposits may be partially or fully withheld if the item is returned damaged, pieces are missing, or the item is returned late.</P><P>Late returns may result in additional daily fees. If an item is not returned within 48 hours of the return-by date without communication, the full security deposit will be forfeited. Continued non-return may result in account suspension.</P></> },
    ],
  },
  {
    id: "payments", label: "Payments & Payouts", icon: "💳",
    items: [
      { title: "What Is a Payout?", body: <P>A payout is the money you receive from a completed sale. Funds are sent to your linked bank account after delivery is confirmed. Veeral&apos;s commission is automatically deducted before the payout is issued.</P> },
      { title: "When You'll Receive Your Payout", body: <Ul items={["If tracking is provided, payouts are initiated 2 business days after delivery is confirmed","If tracking is not provided, payouts may be delayed","Bank processing times may vary by financial institution"]} /> },
      { title: "Pending or On-Hold Payments", body: <><P><strong>Pending</strong> — payment is processing and will become available once cleared.</P><P><strong>On hold</strong> — a buyer has raised a dispute, and funds are temporarily held until the issue is resolved.</P></> },
      { title: "Common Payout Issues", body: <P>Payouts may be delayed if bank details are incorrect or missing, account verification is incomplete, or a refund caused a negative balance.</P> },
      { title: "Rental Returns & Deposits", body: <P>Rental items must be shipped back by the listed return-by date using tracked shipping. The security deposit is refunded in full after a clean return. Veeral may assist in resolving disputes related to rental conditions, damage, or timing.</P> },
    ],
  },
  {
    id: "community", label: "Community & Safety", icon: "🤝",
    items: [
      { title: "Community Guidelines", body: <><P>Veeral is built on respect for Indian culture, craftsmanship, and our community. All members are expected to:</P><Ul items={["Communicate respectfully and professionally with other users","List items honestly and accurately","Honor completed transactions","Not list fast-fashion knockoffs as handmade or designer items","Not attempt to conduct transactions outside the Veeral platform"]} /><P>Violations may result in listing removal, account suspension, or permanent ban from the platform.</P></> },
      { title: "Safety Tips", body: <Ul items={["Never share your personal financial information (bank details, passwords) with other users","All payments must be made through Veeral's secure checkout — never pay directly to a seller","If a listing or message seems suspicious, report it to Veeral Support immediately"]} /> },
    ],
  },
  {
    id: "account", label: "Your Account", icon: "👤",
    items: [
      { title: "Logging In", body: <P>Access your Veeral account via the website using your registered email and password. If you&apos;ve forgotten your password, use the &ldquo;Forgot Password&rdquo; link on the login page.</P> },
      { title: "Managing Your Account", body: <P>From your account settings you can update your profile information, linked bank account for payouts, notification preferences, and saved addresses.</P> },
      { title: "Technical Issues", body: <P>If you experience a technical problem, try refreshing the page or clearing your browser cache. If the issue persists, contact Veeral Support through the website.</P> },
    ],
  },
];

// ── Accordion components ───────────────────────────────────────────────────────

function SubAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--warm-tan)" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.1rem 1.75rem", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: "1rem" }}
      >
        <span style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "1rem", color: "#3B2F2A", lineHeight: 1.4 }}>
          {title}
        </span>
        <span style={{ fontSize: "1.2rem", color: "var(--burnt-orange)", flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(45deg)" : "rotate(0deg)", display: "inline-block" }}>
          +
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 1.75rem 1.25rem" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function SectionAccordion({ section }: { section: ContentSection }) {
  const [open, setOpen] = useState(false);
  return (
    <div id={section.id} style={{ scrollMarginTop: "1.5rem", border: "1px solid var(--warm-tan)", marginBottom: "0.75rem", background: "#fff" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.4rem 1.75rem", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: "1rem" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.2rem" }}>{section.icon}</span>
          <span style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.5rem", color: "#3B2F2A" }}>
            {section.label}
          </span>
        </div>
        <span style={{ fontFamily: "var(--font-jost)", fontSize: "1.4rem", color: "var(--burnt-orange)", flexShrink: 0, transition: "transform 0.25s", transform: open ? "rotate(45deg)" : "rotate(0deg)", display: "inline-block" }}>
          +
        </span>
      </button>
      {open && (
        <div style={{ borderTop: "1px solid var(--warm-tan)" }}>
          {section.items.map((item, i) => (
            <SubAccordion key={i} title={item.title}>
              {item.body}
            </SubAccordion>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HelpCenterPage() {
  const [query, setQuery] = useState("");

  const searchResults = query.trim().length > 1
    ? CONTENT_SECTIONS.flatMap(s => s.items.map(item => ({ ...item, sectionLabel: s.label, sectionId: s.id })))
        .filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
    : [];

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>

      {/* ── Hero ── */}
      <div style={{ background: "#EDE6DE", padding: "4.5rem 1.5rem 3.5rem", textAlign: "center", borderBottom: "1px solid var(--warm-tan)" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(2.5rem, 6vw, 3.75rem)", color: "#3B2F2A", lineHeight: 1.05, marginBottom: "0.5rem" }}>
          Hey, how can we help?
        </h1>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "1rem", color: "#7A6A62", maxWidth: "400px", margin: "0 auto 2rem", lineHeight: 1.7 }}>
          A marketplace for Indian clothing, built on trust, transparency, and care.
        </p>

        {/* Search */}
        <div style={{ position: "relative", maxWidth: "540px", margin: "0 auto 1.75rem" }}>
          <span style={{ position: "absolute", left: "1.1rem", top: "50%", transform: "translateY(-50%)", fontSize: "1rem", opacity: 0.4 }}>🔍</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search help articles"
            style={{ width: "100%", padding: "1rem 1.1rem 1rem 2.8rem", fontFamily: "var(--font-jost)", fontSize: "1rem", color: "#3B2F2A", background: "#fff", border: "1px solid var(--warm-tan)", outline: "none", boxSizing: "border-box", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
          />
          {searchResults.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--warm-tan)", borderTop: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", zIndex: 20, textAlign: "left" }}>
              {searchResults.slice(0, 6).map((item, i) => (
                <button key={i}
                  onClick={() => { setQuery(""); scrollTo(item.sectionId); }}
                  style={{ display: "block", width: "100%", padding: "0.9rem 1.25rem", background: "none", border: "none", borderBottom: i < searchResults.length - 1 ? "1px solid var(--warm-tan)" : "none", cursor: "pointer", textAlign: "left" }}
                  onMouseOver={e => (e.currentTarget.style.background = "#FAF7F4")}
                  onMouseOut={e => (e.currentTarget.style.background = "none")}
                >
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.95rem", color: "#3B2F2A", display: "block" }}>{item.title}</span>
                  <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.8rem", color: "#7A6A62" }}>{item.sectionLabel}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Popular chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
          <span style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.82rem", color: "#7A6A62", lineHeight: "2rem" }}>Popular:</span>
          {[
            { label: "Buyer Protection", section: "buying"   },
            { label: "Shipping",         section: "shipping" },
            { label: "Getting paid",     section: "payments" },
            { label: "Renting",          section: "renting"  },
          ].map(chip => (
            <button key={chip.label} onClick={() => scrollTo(chip.section)}
              style={{ fontFamily: "var(--font-jost)", fontSize: "0.88rem", fontWeight: 500, color: "#3B2F2A", background: "#fff", border: "1px solid var(--warm-tan)", padding: "0.3rem 0.85rem", cursor: "pointer", borderRadius: "999px" }}
              onMouseOver={e => (e.currentTarget.style.borderColor = "var(--burnt-orange)")}
              onMouseOut={e => (e.currentTarget.style.borderColor = "var(--warm-tan)")}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto" style={{ padding: "3rem 1.5rem 6rem" }}>

        {/* ── Featured articles ── */}
        <div style={{ marginBottom: "3.5rem" }}>
          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--burnt-orange)", marginBottom: "1.25rem" }}>
            Featured articles
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
            {FEATURED.map(f => (
              <button key={f.label} onClick={() => scrollTo(f.section)}
                style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.95rem", color: "#3B2F2A", background: "#fff", border: "1px solid var(--warm-tan)", padding: "1rem 1.25rem", cursor: "pointer", textAlign: "left", lineHeight: 1.4, transition: "border-color 0.15s, box-shadow 0.15s" }}
                onMouseOver={e => { e.currentTarget.style.borderColor = "var(--burnt-orange)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.06)"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = "var(--warm-tan)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Categories ── */}
        <div style={{ marginBottom: "4rem" }}>
          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--burnt-orange)", marginBottom: "1.25rem" }}>
            Categories
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
            {CATEGORIES.map(cat => (
              <div key={cat.label} style={{ background: "#fff", border: "1px solid var(--warm-tan)", padding: "1.5rem 1.5rem 1.25rem" }}>
                <button onClick={() => scrollTo(cat.section)}
                  style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: "1rem" }}
                >
                  <span style={{ fontSize: "1.1rem" }}>{cat.icon}</span>
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "1.02rem", color: "#3B2F2A" }}>{cat.label}</span>
                </button>
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {cat.links.map(link => (
                    <li key={link}>
                      <button onClick={() => scrollTo(cat.section)}
                        style={{ fontFamily: "var(--font-jost)", fontSize: "0.92rem", color: "#7A6A62", background: "none", border: "none", cursor: "pointer", padding: "0.2rem 0", textAlign: "left", display: "block", lineHeight: 1.6 }}
                        onMouseOver={e => (e.currentTarget.style.color = "var(--burnt-orange)")}
                        onMouseOut={e => (e.currentTarget.style.color = "#7A6A62")}
                      >
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── Accordion sections ── */}
        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--burnt-orange)", marginBottom: "1.25rem" }}>
          All topics
        </p>
        {CONTENT_SECTIONS.map(section => (
          <SectionAccordion key={section.id} section={section} />
        ))}

      </div>
    </div>
  );
}
