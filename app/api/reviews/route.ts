import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { order_id, rating, comment, reviewer_role } = body as {
    order_id:      string;
    rating:        number;
    comment:       string;
    reviewer_role: "buyer" | "renter" | "owner";
  };

  if (!order_id || !rating || !comment?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
  }
  if (!["buyer", "renter", "owner"].includes(reviewer_role)) {
    return NextResponse.json({ error: "Invalid reviewer_role" }, { status: 400 });
  }

  // ── Validate order eligibility ────────────────────────────────────────────────

  const admin = createAdminClient();

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id, buyer_id, seller_id, rental_start, status")
    .eq("id", order_id)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const isBuyer  = order.buyer_id  === user.id;
  const isSeller = order.seller_id === user.id;
  const isRental = order.rental_start !== null;

  // Determine reviewee + expected roles based on who is reviewing
  let reviewee_id:   string;
  let reviewee_role: "seller" | "owner" | "renter";
  let transaction_type: "sale" | "rental";

  if (!isRental) {
    // Sales: only buyer can review, as buyer → seller
    if (!isBuyer) {
      return NextResponse.json({ error: "Only the buyer can review a sale order" }, { status: 403 });
    }
    if (!["delivered", "completed"].includes(order.status)) {
      return NextResponse.json({ error: "Order must be delivered before reviewing" }, { status: 403 });
    }
    reviewee_id       = order.seller_id;
    reviewee_role     = "seller";
    transaction_type  = "sale";
  } else {
    // Rentals: renter (buyer) → owner, or owner (seller) → renter
    if (!["deposit_released", "deposit_resolved"].includes(order.status)) {
      return NextResponse.json({ error: "Rental must be completed before reviewing" }, { status: 403 });
    }
    if (reviewer_role === "renter" && isBuyer) {
      reviewee_id   = order.seller_id;
      reviewee_role = "owner";
    } else if (reviewer_role === "owner" && isSeller) {
      reviewee_id   = order.buyer_id;
      reviewee_role = "renter";
    } else {
      return NextResponse.json({ error: "Reviewer role does not match your role in this order" }, { status: 403 });
    }
    transaction_type = "rental";
  }

  // ── Read review window from platform_settings ─────────────────────────────────

  const { data: settings } = await admin
    .from("platform_settings")
    .select("review_window_days")
    .eq("id", 1)
    .single();

  const windowDays: number = settings?.review_window_days ?? 14;

  // Sales: immediately visible. Rentals: visible after window unless counterpart also submits.
  const saleVisibleAt = new Date().toISOString();
  const rentalDefaultVisibleAt = new Date(Date.now() + windowDays * 24 * 60 * 60 * 1000).toISOString();
  const visible_at = !isRental ? saleVisibleAt : rentalDefaultVisibleAt;

  // ── Insert review ─────────────────────────────────────────────────────────────

  const { error: insertErr } = await admin.from("reviews").insert({
    reviewer_id:      user.id,
    seller_id:        reviewee_id, // keep seller_id populated for backwards compat
    reviewee_id,
    order_id,
    rating,
    comment:          comment.trim(),
    reviewer_role,
    reviewee_role,
    transaction_type,
    visible_at,
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      return NextResponse.json({ error: "You have already reviewed this order" }, { status: 409 });
    }
    console.error("[reviews] Insert error:", insertErr);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }

  // ── Blind reveal: if the counterpart already submitted, reveal both now ────────

  if (isRental) {
    const counterpartRole = reviewer_role === "renter" ? "owner" : "renter";
    const { data: counterpart } = await admin
      .from("reviews")
      .select("id")
      .eq("order_id", order_id)
      .eq("reviewer_role", counterpartRole)
      .eq("is_removed", false)
      .maybeSingle();

    if (counterpart) {
      const now = new Date().toISOString();
      // Reveal both reviews for this order immediately
      await admin
        .from("reviews")
        .update({ visible_at: now })
        .eq("order_id", order_id)
        .in("reviewer_role", ["renter", "owner"]);
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
