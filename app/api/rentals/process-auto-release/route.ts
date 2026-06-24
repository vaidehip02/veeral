import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { releaseDeposit } from "@/lib/rentals/releaseDeposit";
import { reviewWindowLapsed } from "@/lib/rentals/businessDays";
import { sendEmail } from "@/lib/email/send";
import { createElement } from "react";
import DepositReleased from "@/lib/email/templates/DepositReleased";

/**
 * GET /api/rentals/process-auto-release
 *
 * Finds all rentals in return_pending status whose 5-business-day review
 * window has lapsed and releases the full deposit automatically.
 *
 * Safe to call repeatedly — only processes orders still in return_pending.
 *
 * TODO: schedule this as a daily cron job (e.g. via Vercel Cron or an
 * external scheduler). Until then, it can be triggered manually or called
 * from a test script.
 *
 * Protected by a shared secret so it can only be called by the scheduler
 * (or you manually). Set CRON_SECRET in your environment variables.
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now   = new Date();

  // Fetch all return_pending rentals
  const { data: orders, error } = await admin
    .from("orders")
    .select("id, buyer_id, deposit_amount, return_noted_at, listing:listings(title)")
    .eq("type", "rent")
    .eq("status", "return_pending");

  if (error) {
    console.error("[auto-release] Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }

  const lapsed = (orders ?? []).filter(o => {
    if (!o.return_noted_at) return false;
    return reviewWindowLapsed(new Date(o.return_noted_at), now);
  });

  let released = 0;
  const errors: string[] = [];

  for (const order of lapsed) {
    const depositCents = order.deposit_amount ?? 0;
    const result = await releaseDeposit(
      order.id,
      depositCents,
      "auto-released: review window lapsed",
    );

    if (!result.ok) {
      errors.push(`${order.id}: ${result.error}`);
      continue;
    }

    await admin
      .from("orders")
      .update({ status: "deposit_released" })
      .eq("id", order.id);

    released++;

    // Email buyer (fire-and-forget)
    admin.auth.admin.getUserById(order.buyer_id).then(({ data }) => {
      const buyerEmail = data.user?.email;
      const listing = Array.isArray(order.listing) ? order.listing[0] : order.listing;
      const itemTitle = (listing as { title?: string } | null)?.title ?? "your rental";
      if (buyerEmail) {
        sendEmail({
          to: buyerEmail,
          subject: `Deposit automatically released — ${itemTitle}`,
          react: createElement(DepositReleased, {
            itemTitle,
            depositAmount: depositCents / 100,
            reason:
              "The seller's 5-day review window lapsed without action, so your deposit was automatically released.",
            orderId: order.id.slice(0, 8).toUpperCase(),
          }),
        }).catch(err => console.error("[auto-release] Email error:", err));
      }
    });
  }

  return NextResponse.json({
    checked: orders?.length ?? 0,
    released,
    errors: errors.length > 0 ? errors : undefined,
  });
}
