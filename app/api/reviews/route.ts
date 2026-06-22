import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { order_id, rating, comment } = body as {
    order_id: string;
    rating: number;
    comment: string;
  };

  if (!order_id || !rating || !comment?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
  }

  // Verify the order exists, belongs to this buyer, and is completed/delivered
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, seller_id, status")
    .eq("id", order_id)
    .eq("buyer_id", user.id)
    .in("status", ["delivered", "completed"])
    .single();

  if (orderErr || !order) {
    return NextResponse.json(
      { error: "Order not found or not eligible for review" },
      { status: 403 }
    );
  }

  const { error: insertErr } = await supabase.from("reviews").insert({
    reviewer_id: user.id,
    seller_id:   order.seller_id,
    order_id,
    rating,
    comment: comment.trim(),
  });

  if (insertErr) {
    // Unique constraint violation = already reviewed
    if (insertErr.code === "23505") {
      return NextResponse.json({ error: "You have already reviewed this order" }, { status: 409 });
    }
    console.error("[reviews] Insert error:", insertErr);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
