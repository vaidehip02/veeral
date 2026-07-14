import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ── POST /api/listings/draft ─────────────────────────────────────────────────
// Upsert a draft listing. If body.id is provided, updates that row (seller
// must own it). If no id, creates a new draft and returns the new id.
// All fields are optional — drafts are saved partially.
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    id,
    title, description, category, condition,
    price, rent_price, rent_duration_days, type,
    size, color, brand, images,
    shipping_tier, shipping_cents,
    draft_data,
  } = body as {
    id?:                 string;
    title?:              string;
    description?:        string;
    category?:           string;
    condition?:          string;
    price?:              number | null;
    rent_price?:         number | null;
    rent_duration_days?: number | null;
    type?:               string;
    size?:               string;
    color?:              string;
    brand?:              string | null;
    images?:             string[];
    shipping_tier?:      string | null;
    shipping_cents?:     number | null;
    draft_data?:         Record<string, unknown>;
  };

  const payload = {
    title:             title              ?? null,
    description:       description        ?? null,
    category:          category           ?? null,
    condition:         condition          ?? null,
    price:             price              ?? null,
    rent_price:        rent_price         ?? null,
    rent_duration_days: rent_duration_days ?? null,
    type:              type               ?? null,
    size:              size               ?? null,
    color:             color              ?? null,
    brand:             brand              ?? null,
    images:            images             ?? [],
    shipping_tier:     shipping_tier      ?? null,
    shipping_cents:    shipping_cents     ?? null,
    draft_data:        draft_data         ?? null,
    status:            "draft" as const,
    updated_at:        new Date().toISOString(),
  };

  if (id) {
    // Update: verify seller owns this draft
    const { data: existing } = await supabase
      .from("listings")
      .select("id, seller_id, status")
      .eq("id", id)
      .eq("seller_id", user.id)
      .eq("status", "draft")
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("listings")
      .update(payload)
      .eq("id", id);

    if (error) {
      console.error("[draft] Update error:", error);
      return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
    }

    return NextResponse.json({ id });
  } else {
    // Create new draft
    const { data, error } = await supabase
      .from("listings")
      .insert({ ...payload, seller_id: user.id })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[draft] Insert error:", error);
      return NextResponse.json({ error: "Failed to create draft" }, { status: 500 });
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  }
}

// ── GET /api/listings/draft?id=<uuid> ────────────────────────────────────────
// Load a draft owned by the current seller.
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data, error } = await supabase
    .from("listings")
    .select(
      "id, title, description, category, condition, price, rent_price, " +
      "rent_duration_days, type, size, color, brand, images, " +
      "shipping_tier, shipping_cents, draft_data, status"
    )
    .eq("id", id)
    .eq("seller_id", user.id)
    .in("status", ["draft", "active"])
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
