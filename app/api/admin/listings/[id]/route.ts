import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { createElement } from "react";
import NewListing from "@/lib/email/templates/NewListing";

// PATCH /api/admin/listings/[id] — update listing status (admin only)
// When approving to "active", emails followers of the seller
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== "vaidehip02@gmail.com") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status } = await req.json();
  if (!status) return NextResponse.json({ error: "Missing status" }, { status: 400 });

  // Fetch listing before update to check previous status
  const { data: listing } = await supabase
    .from("listings")
    .select("id, title, price, rent_price, type, seller_id, status")
    .eq("id", params.id)
    .single();

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Update status
  const { error } = await supabase
    .from("listings")
    .update({ status })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If transitioning to active, notify followers
  if (status === "active" && listing.status !== "active") {
    try {
      // Get seller profile
      const { data: seller } = await supabase
        .from("seller_profiles")
        .select("id, username, display_name")
        .eq("id", listing.seller_id)
        .single();

      if (seller) {
        // Get followers with their emails
        const { data: follows } = await supabase
          .from("seller_follows")
          .select("follower_id")
          .eq("seller_id", seller.id);

        const followerIds = (follows ?? []).map(f => f.follower_id);

        if (followerIds.length > 0) {
          // Get follower emails and names from auth + seller_profiles
          const { data: followerProfiles } = await supabase
            .from("seller_profiles")
            .select("id, display_name, username")
            .in("id", followerIds);

          // Get emails via admin API — one by one (or batch via service role)
          // We use service role to access auth.users emails
          const { createClient: createAdmin } = await import("@/lib/supabase/server");
          const adminClient = await createAdmin();

          await Promise.allSettled(
            (followerProfiles ?? []).map(async (fp) => {
              // Get email for this user
              const { data: { user: followerUser } } = await adminClient.auth.admin.getUserById(fp.id);
              if (!followerUser?.email) return;

              await sendEmail({
                to: followerUser.email,
                subject: `${seller.display_name} posted a new listing on Veeral`,
                react: createElement(NewListing, {
                  followerName: fp.display_name || fp.username || "there",
                  sellerDisplayName: seller.display_name,
                  sellerUsername: seller.username,
                  listingTitle: listing.title,
                  listingPrice: listing.price / 100,
                  listingId: listing.id,
                }),
              });
            })
          );
        }
      }
    } catch (emailErr) {
      console.error("[follows] Failed to send new listing emails:", emailErr);
    }
  }

  return NextResponse.json({ ok: true });
}
