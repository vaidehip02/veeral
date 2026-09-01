import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _req: NextRequest,
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

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error: orderErr } = await (admin as any)
    .from("orders")
    .select("id, status")
    .eq("id", params.orderId)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "active") {
    return NextResponse.json(
      { error: `Cannot escalate — status is '${order.status}'` },
      { status: 422 },
    );
  }

  const { error: updateErr } = await admin
    .from("orders")
    .update({ status: "escalated" })
    .eq("id", params.orderId);

  if (updateErr) {
    console.error("[escalate] Update error:", updateErr);
    return NextResponse.json({ error: "Failed to escalate rental" }, { status: 500 });
  }

  void admin.from("admin_audit_log").insert({
    admin_id:    user.id,
    action:      "escalate_rental",
    entity_type: "order",
    entity_id:   params.orderId,
    details:     { reason: "admin manually escalated overdue rental" },
  });

  return NextResponse.json({ ok: true });
}
