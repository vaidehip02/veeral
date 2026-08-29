import { NextRequest, NextResponse } from "next/server";

const PASSCODE = process.env.SITE_PASSCODE || "veeral79423";

// POST — validate passcode and set 30-day bypass cookie, then redirect
export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (code !== PASSCODE) {
    return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shopveeral.com";
  const res = NextResponse.redirect(new URL("/", siteUrl));
  res.cookies.set("veeral_bypass", "veeralbeta2025", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}

// GET — kept for backward compat (old bypass link still works for you)
export async function GET() {
  const res = NextResponse.redirect(
    new URL("/", process.env.NEXT_PUBLIC_SITE_URL || "https://shopveeral.com")
  );
  res.cookies.set("veeral_bypass", "veeralbeta2025", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
