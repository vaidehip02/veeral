export default function ComingSoonPage() {
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
      fontFamily: "Georgia, serif",
    }}>
      <p style={{
        fontSize: "0.7rem",
        letterSpacing: "0.3em",
        textTransform: "uppercase",
        color: "#C95C1A",
        marginBottom: "1.5rem",
      }}>
        Coming Soon
      </p>

      <h1 style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontStyle: "italic",
        fontWeight: 400,
        fontSize: "clamp(3rem, 8vw, 5.5rem)",
        color: "#2C2417",
        letterSpacing: "0.04em",
        margin: "0 0 1.5rem",
        lineHeight: 1,
      }}>
        veeral
      </h1>

      <p style={{
        fontSize: "0.8rem",
        letterSpacing: "0.12em",
        color: "#7A6E62",
        maxWidth: "320px",
        lineHeight: 1.8,
      }}>
        A marketplace for South Asian fashion.<br />
        Buy, sell &amp; rent lehengas, sarees, sherwanis, and more.
      </p>
    </div>
  );
}
