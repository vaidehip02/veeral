import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { releaseDeposit } from "@/lib/rentals/releaseDeposit";
import { getLateFeeSettings, computeLateFee, computeDaysOverdue } from "@/lib/rentals/lateFee";
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
    .from("seller_profiles")
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

  // ── Fetch order (includes listing for late-fee calculation) ───────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawOrder, error: orderErr } = await (admin as any)
    .from("orders")
    .select(`
      id, status, seller_id, deposit_amount, buyer_id, listing_id,
      rental_end, return_noted_at,
      listings(title, rent_price)
    `)
    .eq("id", params.orderId)
    .single();

  if (orderErr || !rawOrder) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const order = rawOrder as {
    id: string;
    status: string;
    seller_id: string;
    deposit_amount: number | null;
    buyer_id: string;
    rental_end: string | null;
    return_noted_at: string | null;
    listings: { title: string; rent_price: number } | { title: string; rent_price: number }[] | null;
  };

  if (order.status !== "damage_claimed") {
    return NextResponse.json(
      { error: `Cannot resolve — status is '${order.status}'` },
      { status: 422 }
    );
  }

  const depositAmount = order.deposit_amount ?? 0;
  const listing       = Array.isArray(order.listings) ? order.listings[0] : order.listings;
  const itemTitle     = (listing as { title?: string } | null)?.title ?? "your rental";
  const rentPricePerDay = (listing as { rent_price?: number } | null)?.rent_price ?? 0;

  // ── Late-fee calculation ──────────────────────────────────────────
  const lfSettings  = await getLateFeeSettings();
  const overdueDays = computeDaysOverdue(order.rental_end, order.return_noted_at, lfSettings.gracePeriodDays);
  const rawLateFee  = computeLateFee(rentPricePerDay, overdueDays, lfSettings);
  // Late fee is capped so it never pushes the renter below $0.
  // Combined damage + late fee is also capped at the deposit.
  const damageRetain = outcome === "retain_part" ? retainAmount! : outcome === "retain_all" ? depositAmount : 0;
  const lateFee      = Math.min(rawLateFee, Math.max(0, depositAmount - damageRetain));

  const renterRefund = Math.max(0, depositAmount - damageRetain - lateFee);
  const sellerAmount = depositAmount - renterRefund; // reconciles to the penny

  // Shortfall check: log if the seller was owed more than the deposit holds.
  const shortfallCents = (damageRetain + rawLateFee) - depositAmount;

  // ── Seller's Stripe Connect account ──────────────────────────────
  const { data: sellerProfile } = await admin
    .from("seller_profiles")
    .select("stripe_account_id")
    .eq("id", order.seller_id)
    .single();

  const connectedAccountId = (sellerProfile as { stripe_account_id?: string } | null)?.stripe_account_id ?? null;

  // ── Release / transfer ────────────────────────────────────────────
  const releaseReason = [
    outcome === "release_all"  ? "damage claim resolved — no damage found" :
    outcome === "retain_part"  ? `damage claim resolved — $${(damageRetain / 100).toFixed(2)} retained` :
                                 "damage claim resolved — full deposit retained",
    overdueDays > 0 ? `${overdueDays} day${overdueDays !== 1 ? "s" : ""} late` : "",
    reason.trim(),
  ].filter(Boolean).join("; ");

  const result = await releaseDeposit({
    orderId:           params.orderId,
    renterRefundCents: renterRefund,
    reason:            releaseReason,
    sellerTransfer: connectedAccountId && sellerAmount > 0
      ? { amountCents: sellerAmount, connectedAccountId }
      : undefined,
    tracking: {
      lateFeeAmountCents: lateFee,
      daysOverdue:        overdueDays,
      damageRetainCents:  damageRetain,
    },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  if (result.warning) {
    console.warn("[resolve-damage] releaseDeposit warning:", result.warning);
  }

  // ── Update status to deposit_resolved ─────────────────────────────
  // (releaseDeposit only writes the deposit columns — status is the caller's job)
  await admin
    .from("orders")
    .update({ status: "deposit_resolved" })
    .eq("id", params.orderId);

  // ── Audit log ─────────────────────────────────────────────────────
  await admin.from("admin_audit_log").insert({
    admin_id:    user.id,
    action:      "resolve_damage_claim",
    entity_type: "order",
    entity_id:   params.orderId,
    details: {
      outcome,
      deposit_amount:    depositAmount,
      damage_retain:     damageRetain,
      late_fee:          lateFee,
      late_fee_days:     overdueDays,
      renter_refund:     renterRefund,
      seller_amount:     sellerAmount,
      shortfall:         shortfallCents > 0 ? shortfallCents : 0,
      reason:            reason.trim(),
      connected_account: connectedAccountId ?? "none",
      warning:           result.warning ?? null,
    },
  });

  // ── Shortfall flag to console (manual follow-up) ──────────────────
  if (shortfallCents > 0) {
    console.warn(
      `[resolve-damage] Shortfall on order ${params.orderId}: ` +
      `seller was owed $${((damageRetain + rawLateFee) / 100).toFixed(2)} but deposit was only ` +
      `$${(depositAmount / 100).toFixed(2)}. ` +
      `Shortfall of $${(shortfallCents / 100).toFixed(2)} requires manual follow-up.`
    );
  }

  // ── Email buyer ───────────────────────────────────────────────────
  const buyerProfile = await admin
    .from("profiles")
    .select("email")
    .eq("id", order.buyer_id)
    .single();

  const buyerEmail = (buyerProfile.data as { email?: string } | null)?.email;
  if (buyerEmail && renterRefund > 0) {
    const emailReason = [
      outcome === "release_all"  ? "No damage was found." :
      outcome === "retain_part"  ? `$${(damageRetain / 100).toFixed(2)} was retained for damage.` :
                                   "The full deposit was retained for damage.",
      overdueDays > 0 ? `A late fee of $${(lateFee / 100).toFixed(2)} was also applied for ${overdueDays} day${overdueDays !== 1 ? "s" : ""} late return.` : "",
      `You will receive $${(renterRefund / 100).toFixed(2)} back.`,
    ].filter(Boolean).join(" ");

    sendEmail({
      to: buyerEmail,
      subject: `Deposit resolution — ${itemTitle}`,
      react: DepositReleased({
        itemTitle,
        orderId:       params.orderId,
        depositAmount: renterRefund / 100,
        reason:        emailReason,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({
    ok:                true,
    renterRefundCents: renterRefund,
    sellerAmount,
    lateFee,
    overdueDays,
    shortfall:         shortfallCents > 0 ? shortfallCents : 0,
    warning:           result.warning,
  });
}
