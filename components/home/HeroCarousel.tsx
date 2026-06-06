"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const SLIDES = [
  {
    id: 1,
    label: "Wedding Season",
    heading: "Dress for\nEvery Occasion",
    sub: "Lehengas, sarees & sherwanis — new and pre-loved.",
    cta: "Shop Now",
    href: "/listings?category=lehenga",
    // Swap these src values with real Cloudinary URLs once you have images
    bg: "#EDE8E2",
    accent: "var(--burnt-orange)",
  },
  {
    id: 2,
    label: "New Arrivals",
    heading: "Fresh Finds\nEvery Day",
    sub: "Discover one-of-a-kind South Asian fashion from sellers near you.",
    cta: "Browse Listings",
    href: "/listings",
    bg: "#EDE8E2",
    accent: "var(--burnt-orange)",
  },
  {
    id: 3,
    label: "Rent & Discover",
    heading: "Rent for\nOne Night",
    sub: "Why buy when you can rent? Stunning outfits for any event.",
    cta: "Browse Rentals",
    href: "/listings?type=rent",
    bg: "#EDE8E2",
    accent: "var(--burnt-orange)",
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const go = useCallback((idx: number) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setAnimating(false);
    }, 300);
  }, [animating]);

  const prev = () => go((current - 1 + SLIDES.length) % SLIDES.length);
  const next = () => go((current + 1) % SLIDES.length);

  // Auto-advance every 5 seconds
  useEffect(() => {
    const t = setInterval(() => go((current + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, [current, go]);

  const slide = SLIDES[current];

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: "clamp(320px, 55vh, 520px)", background: slide.bg, transition: "background 0.5s ease" }}
    >
      {/* Slide content */}
      <div
        className="h-full flex items-center max-w-7xl mx-auto px-6 lg:px-16"
        style={{ opacity: animating ? 0 : 1, transition: "opacity 0.3s ease" }}
      >
        {/* Left: text */}
        <div className="flex-1 pr-8">
          <p style={{
            fontFamily: "var(--font-jost)", fontWeight: 300,
            fontSize: "0.58rem", letterSpacing: "0.25em", textTransform: "uppercase",
            color: "var(--burnt-orange)", marginBottom: "1rem"
          }}>
            ✦ {slide.label}
          </p>
          <h2 style={{
            fontFamily: "var(--font-cormorant)", fontWeight: 300,
            fontSize: "clamp(2.2rem, 5vw, 3.8rem)", lineHeight: 1.1,
            letterSpacing: "-0.01em", color: "var(--dark)",
            marginBottom: "1rem", whiteSpace: "pre-line"
          }}>
            {slide.heading}
          </h2>
          <p style={{
            fontFamily: "var(--font-jost)", fontWeight: 200,
            fontSize: "clamp(0.8rem, 1.4vw, 0.9rem)", letterSpacing: "0.06em",
            lineHeight: 1.7, color: "var(--muted)", marginBottom: "2rem",
            maxWidth: "340px"
          }}>
            {slide.sub}
          </p>
          <Link
            href={slide.href}
            style={{
              fontFamily: "var(--font-jost)", fontWeight: 400,
              fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase",
              color: "var(--cream)", background: "var(--burnt-orange)",
              padding: "0.8rem 2rem", display: "inline-block", transition: "opacity 0.2s"
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = "0.8")}
            onMouseOut={e => (e.currentTarget.style.opacity = "1")}
          >
            {slide.cta} →
          </Link>
        </div>

        {/* Right: image placeholder — replace src with real images */}
        <div
          className="hidden sm:block flex-shrink-0"
          style={{
            width: "clamp(200px, 35%, 380px)",
            height: "clamp(260px, 48vh, 460px)",
            background: "var(--warm-tan)",
            opacity: 0.6,
            position: "relative",
          }}
        >
          {/* Swap this div for an <Image> once you have photos */}
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center"
          }}>
            <span style={{
              fontFamily: "var(--font-jost)", fontSize: "0.55rem",
              letterSpacing: "0.2em", textTransform: "uppercase",
              color: "var(--muted)", opacity: 0.7
            }}>
              Add photo
            </span>
          </div>
        </div>
      </div>

      {/* Arrow buttons */}
      {["prev", "next"].map((dir) => (
        <button
          key={dir}
          onClick={dir === "prev" ? prev : next}
          aria-label={dir === "prev" ? "Previous" : "Next"}
          style={{
            position: "absolute", top: "50%", transform: "translateY(-50%)",
            [dir === "prev" ? "left" : "right"]: "1.2rem",
            width: "36px", height: "36px", borderRadius: "50%",
            background: "var(--cream)", border: "1px solid var(--warm-tan)",
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "0.9rem", color: "var(--dark)",
            transition: "background 0.2s", zIndex: 10
          }}
          onMouseOver={e => (e.currentTarget.style.background = "var(--warm-tan)")}
          onMouseOut={e => (e.currentTarget.style.background = "var(--cream)")}
        >
          {dir === "prev" ? "‹" : "›"}
        </button>
      ))}

      {/* Dot indicators */}
      <div style={{
        position: "absolute", bottom: "1.2rem", left: "50%",
        transform: "translateX(-50%)", display: "flex", gap: "0.5rem"
      }}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            aria-label={`Slide ${i + 1}`}
            style={{
              width: i === current ? "20px" : "6px",
              height: "6px",
              borderRadius: "3px",
              background: i === current ? "var(--burnt-orange)" : "var(--warm-tan)",
              border: "none", cursor: "pointer",
              transition: "all 0.3s ease"
            }}
          />
        ))}
      </div>
    </div>
  );
}
