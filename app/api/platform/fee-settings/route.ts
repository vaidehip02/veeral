import { NextResponse } from "next/server";
import { getFeeSettings } from "@/lib/fees";

// GET /api/platform/fee-settings
// Public — returns only the buyer-facing fee percentages so the checkout UI
// can display the same rates the server will charge. No split breakdown exposed.
export async function GET() {
  const settings = await getFeeSettings();
  return NextResponse.json({
    saleFee:   settings.saleFeePct,
    rentalFee: settings.rentalFeePct,
  });
}
