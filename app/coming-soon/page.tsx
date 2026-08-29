"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ComingSoonPage() {
  const [code, setCode]       = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/bypass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/");
    } else {
      setError("Incorrect passcode. Try again.");
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F5F0E8",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "2rem",
    }}>
      <p style={{ fontSize: "0.7rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#C95C1A", marginBottom: "1.5rem", fontFamily: "Georgia, serif" }}>
        Coming Soon
      </p>

      <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(3rem, 8vw, 5.5rem)", color: "#2C2417", letterSpacing: "0.04em", margin: "0 0 1.5rem", lineHeight: 1 }}>
        veeral
      </h1>

      <p style={{ fontSize: "0.8rem", letterSpacing: "0.12em", color: "#7A6E62", maxWidth: "320px", lineHeight: 1.8, fontFamily: "Georgia, serif", marginBottom: "2.5rem" }}>
        A marketplace for South Asian fashion.<br />
        Buy, sell &amp; rent lehengas, sarees, sherwanis, and more.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", width: "100%", maxWidth: "280px" }}>
        <input
          type="password"
          value={code}
          onChange={e => { setCode(e.target.value); setError(""); }}
          placeholder="Enter passcode"
          required
          style={{
            width: "100%", padding: "0.75rem 1rem", fontSize: "0.9rem",
            fontFamily: "Georgia, serif", letterSpacing: "0.1em",
            border: error ? "1px solid #C95C1A" : "1px solid #C8BAA8",
            background: "#fff", color: "#2C2417", outline: "none",
            boxSizing: "border-box", textAlign: "center",
          }}
        />
        {error && <p style={{ fontSize: "0.75rem", color: "#C95C1A", margin: 0, fontFamily: "Georgia, serif" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading || !code.trim()}
          style={{
            width: "100%", padding: "0.75rem", fontSize: "0.7rem",
            letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "Georgia, serif",
            background: loading || !code.trim() ? "#C8BAA8" : "#C95C1A",
            color: "#fff", border: "none", cursor: loading || !code.trim() ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}
