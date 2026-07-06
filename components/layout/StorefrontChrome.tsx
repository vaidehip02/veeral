"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

/**
 * Renders Navbar + <main> wrapper + Footer for every route EXCEPT /admin.
 * Admin routes handle their own full-page layout entirely.
 */
export default function StorefrontChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin     = pathname.startsWith("/admin");
  const isDashboard = pathname.startsWith("/dashboard");

  if (isAdmin || isDashboard) return <>{children}</>;

  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
