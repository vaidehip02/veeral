import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAIL = "vaidehip02@gmail.com";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const note = (body.note ?? "").trim() || "Admin cleared freeze";

  const admin = createAdminClient();
  const now   = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("orders")
    .update({
      payout_frozen:        false,
      payout_frozen_reason: null,
      payout_frozen_at:     null,
    })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from("admin_audit_log").insert({
    admin_id:   user.id,
    action:     "unfreeze_payout",
    target_type:"order",
    target_id:  params.id,
    note,
    created_at: now,
  });

  return NextResponse.json({ ok: true });
}
