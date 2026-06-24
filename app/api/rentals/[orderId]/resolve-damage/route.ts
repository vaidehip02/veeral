import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { releaseDeposit } from "@/lib/rentals/releaseDeposit";
import { sendEmail } from "@/lib/email/send";
import DepositReleased from "@/lib/email/templates/DepositReleased";

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Admin check
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { outcome, retainAmount, reason } = body as {
    outcome: "release_all" | "retain_part" | "retain_all";
    retainAmount?: number; // cents — required when outcome === "retain_part"
    reason: string;
  };

  if (!reason?.trim()) {
    return NextResponse.json({ error: "Reason is required" }, { status: 400 });
  }
  if (!["release_all", "retain_part", "retain_all"].includes(outcome)) {
    return NextResponse.json({ error: "Invalid outcome" }, { status: 400 });
  }
  if (outcome === "retain_part" && (typeof retainAmount !== "number" || retainAmount <= 0)) {
    return NextResponse.json({ error: "retainAmount required for retain_part" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id, status, deposit_amount, buyer_id, listing_id, listings(title, seller_id)")
    .eq("id", params.orderId)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status !== "damage_claimed") {
    return NextResponse.json(
      { error: `Cannot resolve — status is '${order.status}'` },
      { status: 422 }
    );
  }

  const depositAmount = order.deposit_amount ?? 0;

  let releaseAmountCents: number;
  let adminRetainAmount: number;

  if (outcome === "release_all") {
    releaseAmountCents = depositAmount;
    adminRetainAmount = 0;
  } else if (outcome === "retain_all") {
    releaseAmountCents = 0;
    adminRetainAmount = depositAmount;
  } else {
    // retain_part
    const retain = retainAmount!;
    if (retain > depositAmount) {
      return NextResponse.json(
        { error: "Retain amount exceeds deposit" },
        { status: 422 }
      );
    }
    adminRetainAmount = retain;
    releaseAmountCents = depositAmount - retain;
  }

  // Release deposit (stub — never moves real money)
  if (releaseAmountCents > 0) {
    const result = await releaseDeposit(params.orderId, releaseAmountCents, reason.trim());
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } else {
    // retain_all — just update status + amounts, no release
    const { error: updateErr } = await admin
      .from("orders")
      .update({
        status: "deposit_resolved",
        deposit_release_amount: 0,
        deposit_release_reason: reason.trim(),
        deposit_released_at: new Date().toISOString(),
        deposit_refund_processed: false,
      })
      .eq("id", params.orderId);
    if (updateErr) {
      console.error("resolve-damage retain_all error:", updateErr);
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }
  }

  // Log admin action
  await admin.from("admin_audit_log").insert({
    admin_id: user.id,
    action: "resolve_damage_claim",
    entity_type: "order",
    entity_id: params.orderId,
    details: {
      outcome,
      deposit_amount: depositAmount,
      release_amount: releaseAmountCents,
      retain_amount: adminRetainAmount,
      reason: reason.trim(),
    },
  });

  // Notify buyer
  const listing = Array.isArray(order.listings) ? order.listings[0] : (order.listings as { title: string; seller_id: string } | null);
  const buyerProfile = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", order.buyer_id)
    .single();

  const buyerEmail = buyerProfile.data?.email;
  if (buyerEmail && releaseAmountCents > 0) {
    sendEmail({
      to: buyerEmail,
      subject: `Deposit resolution — ${listing?.title ?? "your rental"}`,
      react: DepositReleased({
        itemTitle: listing?.title ?? "your rental",
        orderId: params.orderId,
        depositAmount: releaseAmountCents / 100,
        reason: reason.trim(),
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, releaseAmountCents, adminRetainAmount });
}
