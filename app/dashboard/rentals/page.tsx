"use client";

import { useState } from "react";

interface MockRental {
  id: string;
  item: string;
  renter: string;
  rentalStart: string;
  rentalEnd: string;
  dailyRate: number;
  totalDays: number;
  deposit: number;
  returnByDate: Date;
  color: string;
  lateFeePerDay: number; // daily late fee once overdue
}

const TODAY = new Date("2026-06-09");

const MOCK_RENTALS: MockRental[] = [
  {
    id: "R201",
    item: "Mirror-work Lehenga (Bridal)",
    renter: "sana.rents",
    rentalStart: "Jun 6, 2026",
    rentalEnd: "Jun 14, 2026",
    dailyRate: 400,
    totalDays: 8,
    deposit: 1000,
    returnByDate: new Date("2026-06-14"),
    color: "#D4C5B5",
    lateFeePerDay: 60,
  },
  {
    id: "R198",
    item: "Sequin Lehenga — Midnight Blue",
    renter: "kavitha_m",
    rentalStart: "Jun 5, 2026",
    rentalEnd: "Jun 11, 2026",
    dailyRate: 320,
    totalDays: 6,
    deposit: 800,
    returnByDate: new Date("2026-06-11"),
    color: "#B8BFCC",
    lateFeePerDay: 50,
  },
  {
    id: "R195",
    item: "Banarasi Silk Lehenga",
    renter: "riya.wears",
    rentalStart: "May 30, 2026",
    rentalEnd: "Jun 7, 2026",
    dailyRate: 250,
    totalDays: 8,
    deposit: 600,
    returnByDate: new Date("2026-06-07"),
    color: "#E8DDD3",
    lateFeePerDay: 40,
  },
];

type ReturnCondition = "good" | "damaged" | null;

interface ReturnDrawerState {
  rentalId: string;
  item: string;
  deposit: number;
  condition: ReturnCondition;
  deduction: string;
  photoAdded: boolean;
}

function getDaysUntilReturn(returnDate: Date): number {
  const diff = returnDate.getTime() - TODAY.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getReturnColor(days: number): { bg: string; text: string; label: string } {
  if (days < 0) return { bg: "#FDECEA", text: "#C62828", label: `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} overdue` };
  if (days <= 3) return { bg: "#FFF8E1", text: "#E65100", label: `Due in ${days} day${days !== 1 ? "s" : ""}` };
  return { bg: "#E8F5E9", text: "#2D6A4F", label: `Due in ${days} days` };
}

export default function RentalsPage() {
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [drawer, setDrawer] = useState<ReturnDrawerState | null>(null);

  const activeRentals = MOCK_RENTALS.filter(r => !confirmed.has(r.id));

  const submitReturn = () => {
    if (!drawer) return;
    setConfirmed(prev => new Set(Array.from(prev).concat(drawer.rentalId)));
    setDrawer(null);
  };

  return (
    <div style={{ maxWidth: "900px" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400,
          fontSize: "2rem", color: "#1A1A18", marginBottom: "0.25rem"
        }}>
          Rentals
        </h1>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.65 }}>
          {activeRentals.length} active rental{activeRentals.length !== 1 ? "s" : ""}
        </p>
      </div>

      {activeRentals.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "4rem 2rem",
          fontFamily: "var(--font-jost)", color: "var(--muted)", opacity: 0.5,
          fontSize: "0.85rem", letterSpacing: "0.04em"
        }}>
          No active rentals right now.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {activeRentals.map((rental) => {
            const daysLeft = getDaysUntilReturn(rental.returnByDate);
            const returnColor = getReturnColor(daysLeft);

            return (
              <div
                key={rental.id}
                style={{
                  background: "#fff",
                  border: "1px solid var(--warm-tan)",
                  borderLeft: `3px solid ${returnColor.text}`,
                  padding: "1.25rem 1.5rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
                  {/* Thumbnail */}
                  <div style={{
                    width: "56px", height: "56px", borderRadius: "2px",
                    background: rental.color, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                      <p style={{
                        fontFamily: "var(--font-jost)", fontWeight: 600,
                        fontSize: "0.88rem", color: "#1A1A18"
                      }}>
                        {rental.item}
                      </p>
                      <span style={{
                        padding: "0.18rem 0.6rem",
                        background: returnColor.bg, color: returnColor.text,
                        fontFamily: "var(--font-jost)", fontWeight: 600,
                        fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase",
                        borderRadius: "2px", whiteSpace: "nowrap",
                      }}>
                        {returnColor.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1" style={{ marginBottom: daysLeft < 0 ? "0.5rem" : "0.75rem" }}>
                      {[
                        { k: "Renter", v: `@${rental.renter}` },
                        { k: "Period", v: `${rental.rentalStart} – ${rental.rentalEnd}` },
                        { k: "Daily rate", v: `$${rental.dailyRate.toLocaleString()}/day` },
                        { k: "Deposit held", v: `$${rental.deposit.toLocaleString()}` },
                      ].map(({ k, v }) => (
                        <div key={k}>
                          <p style={{
                            fontFamily: "var(--font-jost)", fontWeight: 600,
                            fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase",
                            color: "var(--muted)", opacity: 0.55, marginBottom: "0.15rem"
                          }}>
                            {k}
                          </p>
                          <p style={{
                            fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "#1A1A18"
                          }}>
                            {v}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Late fee line — only shown when overdue */}
                    {daysLeft < 0 && (
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        background: "#FDECEA", padding: "0.35rem 0.75rem",
                        marginBottom: "0.75rem",
                      }}>
                        <span style={{
                          fontFamily: "var(--font-jost)", fontWeight: 700,
                          fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase",
                          color: "#C62828",
                        }}>
                          Late fee accruing
                        </span>
                        <span style={{
                          fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "#C62828",
                        }}>
                          ${rental.lateFeePerDay}/day · <strong>${(Math.abs(daysLeft) * rental.lateFeePerDay).toLocaleString()} total so far</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setDrawer({
                      rentalId: rental.id,
                      item: rental.item,
                      deposit: rental.deposit,
                      condition: null,
                      deduction: "",
                      photoAdded: false,
                    })}
                    style={{
                      fontFamily: "var(--font-jost)", fontWeight: 600,
                      fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase",
                      padding: "0.55rem 1.1rem", flexShrink: 0,
                      background: "transparent", color: "var(--muted)",
                      border: "1px solid var(--warm-tan)", cursor: "pointer",
                      transition: "border-color 0.15s, color 0.15s",
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = "var(--muted)"; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = "var(--warm-tan)"; }}
                  >
                    Confirm return
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Return drawer */}
      {drawer && (
        <>
          <div
            onClick={() => setDrawer(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 60 }}
          />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            background: "var(--cream)", zIndex: 70,
            padding: "2rem",
            borderTop: "1px solid var(--warm-tan)",
            maxWidth: "520px", margin: "0 auto",
            maxHeight: "85vh", overflowY: "auto",
          }}>
            <h2 style={{
              fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400,
              fontSize: "1.5rem", color: "#1A1A18", marginBottom: "0.4rem"
            }}>
              Confirm return
            </h2>
            <p style={{
              fontFamily: "var(--font-jost)", fontSize: "0.78rem",
              color: "var(--muted)", opacity: 0.7, marginBottom: "1.75rem"
            }}>
              {drawer.item} · Deposit: ${drawer.deposit.toLocaleString()}
            </p>

            {/* Condition */}
            <p style={{
              fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem",
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: "var(--muted)", marginBottom: "0.75rem"
            }}>
              Condition on return
            </p>
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {(["good", "damaged"] as ReturnCondition[]).map((c) => (
                <button
                  key={c!}
                  onClick={() => setDrawer({ ...drawer, condition: c })}
                  style={{
                    flex: 1, padding: "0.65rem",
                    fontFamily: "var(--font-jost)", fontWeight: 600,
                    fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase",
                    border: "1px solid",
                    borderColor: drawer.condition === c ? (c === "good" ? "#2D6A4F" : "#C62828") : "var(--warm-tan)",
                    background: drawer.condition === c
                      ? (c === "good" ? "#E8F5E9" : "#FDECEA")
                      : "transparent",
                    color: drawer.condition === c
                      ? (c === "good" ? "#2D6A4F" : "#C62828")
                      : "var(--muted)",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {c === "good" ? "✓ Good" : "⚠ Damaged"}
                </button>
              ))}
            </div>

            {/* Damaged fields */}
            {drawer.condition === "damaged" && (
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ marginBottom: "1rem" }}>
                  <p style={{
                    fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem",
                    letterSpacing: "0.18em", textTransform: "uppercase",
                    color: "var(--muted)", marginBottom: "0.5rem"
                  }}>
                    Deduction amount ($)
                  </p>
                  <input
                    type="number"
                    placeholder="e.g. 2000"
                    value={drawer.deduction}
                    onChange={e => setDrawer({ ...drawer, deduction: e.target.value })}
                    style={{
                      width: "100%", padding: "0.65rem 0.85rem",
                      border: "1px solid var(--warm-tan)", background: "#fff",
                      fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "#1A1A18",
                      outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <p style={{
                    fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem",
                    letterSpacing: "0.18em", textTransform: "uppercase",
                    color: "var(--muted)", marginBottom: "0.5rem"
                  }}>
                    Evidence photo
                  </p>
                  <button
                    onClick={() => setDrawer({ ...drawer, photoAdded: !drawer.photoAdded })}
                    style={{
                      width: "100%", padding: "1.5rem",
                      border: `1px dashed ${drawer.photoAdded ? "var(--burnt-orange)" : "var(--warm-tan)"}`,
                      background: drawer.photoAdded ? "rgba(201,92,26,0.05)" : "transparent",
                      fontFamily: "var(--font-jost)", fontSize: "0.78rem",
                      color: drawer.photoAdded ? "var(--burnt-orange)" : "var(--muted)",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {drawer.photoAdded ? "✓ Photo attached" : "+ Upload photo"}
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {drawer.condition && (
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {drawer.condition === "damaged" ? (
                  <>
                    <button
                      onClick={submitReturn}
                      style={{
                        flex: 1, padding: "0.7rem",
                        fontFamily: "var(--font-jost)", fontWeight: 600,
                        fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase",
                        background: "#C62828", color: "#fff",
                        border: "none", cursor: "pointer",
                      }}
                    >
                      Submit claim
                    </button>
                    <button
                      onClick={submitReturn}
                      style={{
                        flex: 1, padding: "0.7rem",
                        fontFamily: "var(--font-jost)", fontWeight: 600,
                        fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase",
                        background: "transparent", color: "var(--muted)",
                        border: "1px solid var(--warm-tan)", cursor: "pointer",
                      }}
                    >
                      Release deposit
                    </button>
                  </>
                ) : (
                  <button
                    onClick={submitReturn}
                    style={{
                      flex: 1, padding: "0.7rem",
                      fontFamily: "var(--font-jost)", fontWeight: 600,
                      fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase",
                      background: "var(--burnt-orange)", color: "var(--cream)",
                      border: "none", cursor: "pointer",
                    }}
                  >
                    Release deposit & confirm return
                  </button>
                )}
                <button
                  onClick={() => setDrawer(null)}
                  style={{
                    padding: "0.7rem 1rem",
                    fontFamily: "var(--font-jost)", fontWeight: 600,
                    fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase",
                    background: "transparent", color: "var(--muted)",
                    border: "1px solid var(--warm-tan)", cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
