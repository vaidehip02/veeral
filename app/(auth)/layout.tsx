// Auth pages nest inside the root layout (which already has the Navbar),
// so this layout only needs to vertically center the form content.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "calc(100vh - 7rem)", // subtract navbar + announcement bar height
      padding: "2rem 1rem",
    }}>
      {children}
    </main>
  );
}
