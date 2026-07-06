import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** GET — load current late-fee settings (used by admin UI on mount). */
export async function GET() {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("platform_settings")
    .select("late_fee_type, late_fee_multiplier")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return NextResponse.json({ late_fee_type: "multiplier", late_fee_multiplier: 1.5 });
  }
  return NextResponse.json(data);
}

/** POST — save late-fee settings (admin only). */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { lateFeeMultiplier } = body as { lateFeeMultiplier: number };

  if (
    typeof lateFeeMultiplier !== "number" ||
    lateFeeMultiplier <= 0 ||
    lateFeeMultiplier > 20
  ) {
    return NextResponse.json(
      { error: "lateFeeMultiplier must be a number between 0 and 20" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("platform_settings")
    .update({
      late_fee_type:       "multiplier",
      late_fee_multiplier: lateFeeMultiplier,
      updated_at:          new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    console.error("[admin/settings/late-fee] Save error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
