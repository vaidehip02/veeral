import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("seller_profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { outcome, retainAmount, reason } = body as {
    outcome: "release_all" | "retain_partial" | "retain_all";
    retainAmount?: number;
    reason: string;
  };

  if (!["release_all", "retain_partial", "retain_all"].includes(outcome)) {
    return NextResponse.json({ error: "Invalid outcome" }, { status: 400 });
  }
  if (!reason?.trim()) {
    return NextResponse.json({ error: "Reason is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error: orderErr } = await (admin as any)
    .from("orders")
    .select("id, status, deposit, seller_id, buyer_id")
    .eq("id", params.orderId)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "damage_claimed") {
    return NextResponse.json(
      { error: `Cannot resolve — status is '${order.status}'` },
      { status: 422 },
    );
  }

  const { error: updateErr } = await admin
    .from("orders")
    .update({
      status: "deposit_resolved",
      damage_resolution: { outcome, retainAmount: retainAmount ?? 0, reason, resolved_by: user.id, resolved_at: new Date().toISOString() },
    })
    .eq("id", params.orderId);

  if (updateErr) {
    console.error("[resolve-damage] Update error:", updateErr);
    return NextResponse.json({ error: "Failed to resolve damage claim" }, { status: 500 });
  }

  void admin.from("admin_audit_log").insert({
    admin_id:    user.id,
    action:      "resolve_damage",
    entity_type: "order",
    entity_id:   params.orderId,
    details:     { outcome, retainAmount, reason },
  });

  return NextResponse.json({ ok: true });
}
