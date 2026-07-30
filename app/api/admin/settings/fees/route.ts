import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("platform_settings")
    .select("sale_fee_pct, buyer_fee_pct, rental_fee_pct, deposit_multiplier, deposit_min_cents, deposit_max_cents")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return NextResponse.json({ sale_fee_pct: 10, buyer_fee_pct: 0, rental_fee_pct: 10, deposit_multiplier: 5, deposit_min_cents: 5000, deposit_max_cents: 200000 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("seller_profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as {
    sale_fee_pct?: number;
    buyer_fee_pct?: number;
    rental_fee_pct?: number;
    deposit_multiplier?: number;
    deposit_min_cents?: number;
    deposit_max_cents?: number;
  };

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("platform_settings")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
