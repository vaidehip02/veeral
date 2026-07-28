import { NextResponse } from "next/server";

export function GET() {
  const res = NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL || "https://shopveeral.com"));
  res.cookies.set("veeral_bypass", "veeralbeta2025", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  return res;
}
