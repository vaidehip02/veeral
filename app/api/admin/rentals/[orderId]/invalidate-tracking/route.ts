import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { createElement } from "react";

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
    .select("id, status, buyer_id, listing_id, listings(title)")
    .eq("id", params.orderId)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "return_pending") {
    return NextResponse.json(
      { error: `Cannot invalidate — status is '${order.status}'` },
      { status: 422 },
    );
  }

  // Reset to shipped — renter still has the item (or re-shipped without valid tracking)
  // Clearing return_noted_at restarts the late-fee clock from now.
  const { error: updateErr } = await admin
    .from("orders")
    .update({
      status:                 "shipped",
      return_noted_at:        null,
      return_tracking_number: null,
    })
    .eq("id", params.orderId);

  if (updateErr) {
    console.error("[invalidate-tracking] Update error:", updateErr);
    return NextResponse.json({ error: "Failed to reset order" }, { status: 500 });
  }

  // Audit log
  // fire-and-forget audit log (intentionally not awaited)
  void admin.from("admin_audit_log").insert({
    admin_id:    user.id,
    action:      "invalidate_tracking",
    entity_type: "order",
    entity_id:   params.orderId,
    details:     { reason: "admin flagged tracking number as invalid" },
  });

  // Email the renter (fire-and-forget)
  const listing = Array.isArray(order.listings) ? order.listings[0] : order.listings;
  const itemTitle = (listing as { title?: string } | null)?.title ?? "your rental";

  admin.auth.admin.getUserById(order.buyer_id).then(({ data }) => {
    const buyerEmail = data.user?.email;
    if (buyerEmail) {
      const body = [
        `Our team flagged the tracking number you submitted for "${itemTitle}" as invalid.`,
        ``,
        `Please re-ship the item and re-submit your tracking number as soon as possible. ` +
        `The late-fee clock is running until a valid number is on file.`,
        ``,
        `To re-submit: My Rentals → this order → Mark as returned → enter the tracking number from your carrier receipt.`,
        ``,
        `If you believe this is a mistake, please contact us.`,
      ].join("\n");

      sendEmail({
        to: buyerEmail,
        subject: `Action needed — re-submit return tracking for ${itemTitle}`,
        react: createElement(
          "div",
          { style: { fontFamily: "sans-serif", fontSize: "14px", color: "#1a1a1a", lineHeight: "1.6" } },
          createElement("p", { style: { fontWeight: "bold" } }, "Action required: re-submit your return tracking number"),
          ...body.split("\n").map((line, i) =>
            createElement("p", { key: i, style: { margin: "4px 0" } }, line || " "),
          ),
        ),
      }).catch(err => console.error("[invalidate-tracking] Email error:", err));
    }
  });

  return NextResponse.json({ ok: true });
}
