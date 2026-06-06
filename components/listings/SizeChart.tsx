"use client";

type GarmentType = "lehenga" | "saree" | "salwar_kameez" | "sherwani" | "other";

interface SizeChartProps {
  garmentType: GarmentType;
  onClose: () => void;
}

// US numeric women's sizes 0–16, men's 36–46 (sherwani)
const WOMENS_SIZES = ["0", "2", "4", "6", "8", "10", "12", "14", "16"];
const MENS_SIZES   = ["36", "38", "40", "42", "44", "46"];

// All measurements in inches
const CHARTS: Record<GarmentType, { columns: string[]; rows: (string | number)[][] }> = {
  lehenga: {
    columns: ["US Size", "Bust", "Around Waist", "Around Hips", "Blouse Length", "Bottom Length"],
    rows: [
      ["0",  "31–32", "23–24", "33–34", "13",    "38–40"],
      ["2",  "32–33", "24–25", "34–35", "13–14", "40–41"],
      ["4",  "33–34", "25–26", "35–36", "14",    "41–42"],
      ["6",  "34–35", "26–27", "36–37", "14",    "41–43"],
      ["8",  "35–36", "27–28", "37–38", "14–15", "42–43"],
      ["10", "36–37", "28–30", "38–40", "15",    "42–44"],
      ["12", "38–39", "30–32", "40–42", "15–16", "43–44"],
      ["14", "40–41", "32–34", "42–44", "16",    "43–45"],
      ["16", "42–44", "34–36", "44–46", "16–17", "44–45"],
    ],
  },
  saree: {
    columns: ["US Size", "Bust", "Waist", "Hips", "Blouse Length"],
    rows: [
      ["0",  "31–32", "23–24", "33–34", "13"],
      ["2",  "32–33", "24–25", "34–35", "13–14"],
      ["4",  "33–34", "25–26", "35–36", "14"],
      ["6",  "34–35", "26–27", "36–37", "14"],
      ["8",  "35–36", "27–28", "37–38", "14–15"],
      ["10", "36–37", "28–30", "38–40", "15"],
      ["12", "38–39", "30–32", "40–42", "15–16"],
      ["14", "40–41", "32–34", "42–44", "16"],
      ["16", "42–44", "34–36", "44–46", "16–17"],
    ],
  },
  salwar_kameez: {
    columns: ["US Size", "Bust", "Waist", "Hips", "Kurta Length", "Inseam"],
    rows: [
      ["0",  "31–32", "23–24", "33–34", "36–38", "26–27"],
      ["2",  "32–33", "24–25", "34–35", "37–39", "26–27"],
      ["4",  "33–34", "25–26", "35–36", "38–40", "27–28"],
      ["6",  "34–35", "26–27", "36–37", "39–41", "27–28"],
      ["8",  "35–36", "27–28", "37–38", "40–42", "28–29"],
      ["10", "36–37", "28–30", "38–40", "40–42", "28–29"],
      ["12", "38–39", "30–32", "40–42", "41–43", "29–30"],
      ["14", "40–41", "32–34", "42–44", "42–44", "29–30"],
      ["16", "42–44", "34–36", "44–46", "43–45", "30–31"],
    ],
  },
  sherwani: {
    columns: ["US Size", "Chest", "Waist", "Hips", "Length", "Sleeve"],
    rows: [
      ["36", "35–36", "29–30", "35–36", "42–44", "23–24"],
      ["38", "37–38", "31–32", "37–38", "43–45", "24–25"],
      ["40", "39–40", "33–34", "39–40", "44–46", "24–25"],
      ["42", "41–42", "35–36", "41–42", "45–47", "25–26"],
      ["44", "43–44", "37–38", "43–44", "46–48", "25–26"],
      ["46", "45–46", "39–40", "45–46", "47–49", "26–27"],
    ],
  },
  other: {
    columns: ["US Size", "Bust / Chest", "Waist", "Hips", "Length"],
    rows: [
      ["0",  "31–32", "23–24", "33–34", "36–38"],
      ["2",  "32–33", "24–25", "34–35", "37–39"],
      ["4",  "33–34", "25–26", "35–36", "38–40"],
      ["6",  "34–35", "26–27", "36–37", "39–41"],
      ["8",  "35–36", "27–28", "37–38", "40–42"],
      ["10", "36–37", "28–30", "38–40", "40–42"],
      ["12", "38–39", "30–32", "40–42", "41–43"],
      ["14", "40–41", "32–34", "42–44", "42–44"],
      ["16", "42–44", "34–36", "44–46", "43–45"],
    ],
  },
};

const GARMENT_LABELS: Record<GarmentType, string> = {
  lehenga:      "Lehenga",
  saree:        "Saree",
  salwar_kameez:"Salwar Kameez / Suit",
  sherwani:     "Sherwani",
  other:        "General",
};

const thStyle: React.CSSProperties = {
  fontFamily: "var(--font-jost)",
  fontWeight: 600,
  fontSize: "0.55rem",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--muted)",
  padding: "0.6rem 0.8rem",
  textAlign: "left",
  borderBottom: "2px solid var(--warm-tan)",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  fontFamily: "var(--font-jost)",
  fontWeight: 300,
  fontSize: "0.72rem",
  letterSpacing: "0.04em",
  color: "var(--dark)",
  padding: "0.6rem 0.8rem",
  borderBottom: "1px solid var(--warm-tan)",
  whiteSpace: "nowrap",
};

const tdSizeStyle: React.CSSProperties = {
  ...tdStyle,
  fontWeight: 600,
  color: "#C4440A",
  letterSpacing: "0.1em",
};

export default function SizeChart({ garmentType, onClose }: SizeChartProps) {
  const chart = CHARTS[garmentType] ?? CHARTS.other;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(26,20,16,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--cream)", width: "100%", maxWidth: "660px",
          maxHeight: "85vh", display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "1.5rem 1.8rem", borderBottom: "1px solid var(--warm-tan)",
          flexShrink: 0,
        }}>
          <div>
            <h3 style={{
              fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 300,
              fontSize: "1.5rem", color: "var(--dark)", marginBottom: "0.15rem"
            }}>
              Size chart
            </h3>
            <p style={{
              fontFamily: "var(--font-jost)", fontWeight: 300,
              fontSize: "0.58rem", letterSpacing: "0.15em", color: "var(--muted)"
            }}>
              {GARMENT_LABELS[garmentType]} · US sizing
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "1.1rem", color: "var(--muted)", padding: "0.25rem"
            }}
          >
            ✕
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowY: "auto", overflowX: "auto", flex: 1, padding: "1rem 1.8rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {chart.columns.map(col => (
                  <th key={col} style={thStyle}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart.rows.map((row, ri) => (
                <tr
                  key={ri}
                  style={{ background: ri % 2 === 0 ? "transparent" : "rgba(232,221,211,0.25)" }}
                >
                  {row.map((cell, ci) => (
                    <td key={ci} style={ci === 0 ? tdSizeStyle : tdStyle}>
                      {ci === 0 ? `US ${cell}` : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          padding: "1rem 1.8rem", borderTop: "1px solid var(--warm-tan)", flexShrink: 0,
        }}>
          <p style={{
            fontFamily: "var(--font-jost)", fontWeight: 300,
            fontSize: "0.62rem", letterSpacing: "0.06em", color: "var(--muted)", lineHeight: 1.7
          }}>
            Measurements are in inches. When between sizes, size up.
          </p>
        </div>
      </div>
    </div>
  );
}

export { WOMENS_SIZES, MENS_SIZES };
export type { GarmentType };
