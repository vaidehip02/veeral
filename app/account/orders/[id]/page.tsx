import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound, redirect } from "next/navigation";
import OrderDetailClient from "./OrderDetailClient";

interface OrderRow {
  id: string;
  type: "sale" | "rent";
  status: string;
  amount: number;
  platform_fee: number;
  seller_payout: number;
  deposit_amount: number | null;
  deposit_held: boolean;
  deposit_release_amount: number | null;
  deposit_release_reason: string | null;
  deposit_released_at: string | null;
  rental_start: string | null;
  rental_end: string | null;
  return_tracking_number: string | null;
  return_noted_at: string | null;
  paid_at: string | null;
  created_at: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
}

interface ListingRow {
  id: string;
  title: string;
  images: string[];
  size: string | null;
  category: string;
  brand: string | null;
}

interface SellerRow {
  id: string;
  display_name: string | null;
  username: string;
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: order, error: _orderError } = await db
    .from("orders")
    .select(
      "id, type, status, amount, platform_fee, seller_payout, deposit_amount, " +
      "deposit_held, deposit_release_amount, deposit_release_reason, deposit_released_at, " +
      "rental_start, rental_end, return_tracking_number, return_noted_at, " +
      "paid_at, created_at, listing_id, seller_id, buyer_id"
    )
    .eq("id", params.id)
    .single() as { data: OrderRow | null; error: unknown };

  if (!order || (order as OrderRow).buyer_id !== user.id) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const [{ data: listing }, { data: seller }] = await Promise.all([
    admin
      .from("listings")
      .select("id, title, images, size, category, brand")
      .eq("id", order.listing_id)
      .single() as Promise<{ data: ListingRow | null }>,
    admin
      .from("seller_profiles")
      .select("id, display_name, username")
      .eq("id", order.seller_id)
      .single() as Promise<{ data: SellerRow | null }>,
  ]);

  return (
    <OrderDetailClient
      order={order}
      listing={listing}
      seller={seller}
    />
  );
}
