import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ── DELETE /api/listings/draft/[id] ─────────────────────────────────────────
// Permanently delete a draft listing. Only the owning seller can delete their
// own drafts. Active/sold/rented listings are not deletable via this route.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("id", params.id)
    .eq("seller_id", user.id)
    .eq("status", "draft");

  if (error) {
    console.error("[draft] Delete error:", error);
    return NextResponse.json({ error: "Failed to delete draft" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
