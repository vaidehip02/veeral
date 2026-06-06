import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const role = searchParams.get("role"); // passed via emailRedirectTo
  const type = searchParams.get("type"); // "recovery" for password reset

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Password reset — send to a reset page (handled by Supabase UI or custom)
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      // Seller signup — prompt onboarding
      const userRole = role || data.user.user_metadata?.role;
      if (userRole === "seller") {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      // Buyer signup or regular login — go home
      return NextResponse.redirect(`${origin}/`);
    }
  }

  // Auth failed
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
