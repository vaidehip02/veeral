import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import DamageClaimed from "@/lib/email/templates/DamageClaimed";

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { photos, description, retainAmount } = body as {
    photos: string[];
    description: string;
    retainAmount: number; // in cents
  };

  if (!description?.trim()) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }
  if (!Array.isArray(photos) || photos.length === 0) {
    return NextResponse.json({ error: "At least one photo is required" }, { status: 400 });
  }
  if (typeof retainAmount !== "number" || retainAmount <= 0) {
    return NextResponse.json({ error: "Retain amount must be positive" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch the order and listing to validate seller + amounts
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id, status, deposit_amount, buyer_id, listing_id")
    .eq("id", params.orderId)
    .single();

  if (orderErr || !order) {
    console.error("claim-damage order fetch error:", orderErr, "orderId:", params.orderId);
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { data: listing, error: listingErr } = await admin
    .from("listings")
    .select("id, title, seller_id")
    .eq("id", order.listing_id)
    .single();

  if (listingErr || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Ensure the requester is the seller
  if (listing.seller_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.status !== "return_pending") {
    return NextResponse.json(
      { error: `Cannot file a damage claim when status is '${order.status}'` },
      { status: 422 }
    );
  }

  const depositAmount = order.deposit_amount ?? 0;
  if (retainAmount > depositAmount) {
    return NextResponse.json(
      { error: `Retain amount ($${(retainAmount / 100).toFixed(2)}) cannot exceed deposit ($${(depositAmount / 100).toFixed(2)})` },
      { status: 422 }
    );
  }

  const { error: updateErr } = await admin
    .from("orders")
    .update({
      status: "damage_claimed",
      damage_claim_photos: photos,
      damage_claim_description: description.trim(),
      damage_claim_retain_amount: retainAmount,
    })
    .eq("id", params.orderId);

  if (updateErr) {
    console.error("claim-damage update error:", updateErr);
    return NextResponse.json({ error: "Failed to file claim" }, { status: 500 });
  }

  // Notify buyer
  const buyerProfile = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", order.buyer_id)
    .single();

  const buyerEmail = buyerProfile.data?.email;
  if (buyerEmail) {
    sendEmail({
      to: buyerEmail,
      subject: `Damage claim filed — ${listing.title}`,
      react: DamageClaimed({
        itemTitle: listing.title,
        orderId: params.orderId,
        retainAmountDollars: retainAmount / 100,
        depositAmountDollars: depositAmount / 100,
        description: description.trim(),
        recipientRole: "buyer",
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
