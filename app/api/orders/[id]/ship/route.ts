import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const tracking = (body.tracking ?? "").trim();
  if (!tracking) return NextResponse.json({ error: "Tracking number is required" }, { status: 400 });

  const admin = createAdminClient() as any;

  // Fetch the order and verify the authenticated user is the seller
  const { data: order } = await admin
    .from("orders")
    .select("id, status, seller_id")
    .eq("id", params.id)
    .single();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.seller_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (order.status !== "paid") return NextResponse.json({ error: "Order cannot be marked as shipped in its current status" }, { status: 409 });

  const { error } = await admin
    .from("orders")
    .update({ status: "shipped", return_tracking_number: tracking })
    .eq("id", params.id)
    .eq("status", "paid"); // idempotency guard

  if (error) return NextResponse.json({ error: "Failed to update order" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
