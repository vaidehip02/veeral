"use client";

import { useState } from "react";
import Image from "next/image";

interface PhotoGalleryProps {
  images: string[];
  title: string;
}

// Placeholder colours for when no real images exist yet
const PLACEHOLDER_COLORS = [
  "#E8DDD3", "#DDD0C5", "#D5C9BE", "#CABDB1",
  "#C3B5A8", "#DDE3D8", "#D8DDE0", "#E3D8DD",
];

export default function PhotoGallery({ images, title }: PhotoGalleryProps) {
  const [active, setActive] = useState(0);
  const photos = images.length > 0 ? images : [];
  const count = Math.max(photos.length, 1);
  const slots = Array.from({ length: Math.min(count, 8) });

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        style={{
          position: "relative",
          aspectRatio: "3/4",
          background: PLACEHOLDER_COLORS[active % PLACEHOLDER_COLORS.length],
          overflow: "hidden",
        }}
      >
        {photos[active] ? (
          <Image src={photos[active]} alt={title} fill style={{ objectFit: "cover" }} />
        ) : (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              fontFamily: "var(--font-jost)", fontSize: "0.55rem",
              letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", opacity: 0.5
            }}>
              Photo {active + 1}
            </span>
          </div>
        )}

        {/* Arrow nav for mobile */}
        {slots.length > 1 && (
          <>
            <button
              onClick={() => setActive((active - 1 + slots.length) % slots.length)}
              style={{
                position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)",
                width: "32px", height: "32px", borderRadius: "50%", border: "none",
                background: "rgba(250,246,241,0.85)", cursor: "pointer", fontSize: "1rem",
                color: "var(--dark)", display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >‹</button>
            <button
              onClick={() => setActive((active + 1) % slots.length)}
              style={{
                position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
                width: "32px", height: "32px", borderRadius: "50%", border: "none",
                background: "rgba(250,246,241,0.85)", cursor: "pointer", fontSize: "1rem",
                color: "var(--dark)", display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >›</button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {slots.length > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto" }}>
          {slots.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                flexShrink: 0, width: "64px", height: "80px", border: "none",
                background: PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length],
                cursor: "pointer", position: "relative", overflow: "hidden",
                outline: active === i ? "2px solid var(--burnt-orange)" : "2px solid transparent",
                outlineOffset: "2px", transition: "outline 0.15s",
              }}
            >
              {photos[i] && (
                <Image src={photos[i]} alt={`${title} ${i + 1}`} fill style={{ objectFit: "cover" }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
