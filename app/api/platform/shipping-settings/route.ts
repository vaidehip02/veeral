import { NextResponse } from "next/server";
import { getShippingSettings } from "@/lib/shipping";

// GET /api/platform/shipping-settings
// Public endpoint — returns tier amounts so the checkout page can display
// the correct shipping cost before the PaymentIntent is created.
export async function GET() {
  const settings = await getShippingSettings();
  return NextResponse.json(settings);
}
