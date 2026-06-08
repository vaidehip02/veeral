import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  try {
    const { garmentType, condition, fabric, embellishments, brand } = await req.json();

    if (!garmentType || !condition) {
      return NextResponse.json({ error: "garmentType and condition are required" }, { status: 400 });
    }

    const details = [
      `Garment type: ${garmentType}`,
      `Condition: ${condition}`,
      fabric ? `Fabric: ${fabric}` : null,
      embellishments?.length ? `Embellishments: ${embellishments.join(", ")}` : null,
      brand ? `Designer/Brand: ${brand}` : null,
    ].filter(Boolean).join("\n");

    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 400,
      system: `You are a pricing expert for a South Asian fashion resale marketplace called Veeral,
operating in the US market. You give realistic secondhand pricing guidance in USD based on garment
type, condition, fabric, and embellishments. Always respond in valid JSON only.`,
      messages: [
        {
          role: "user",
          content: `Based on these listing details, suggest a resale price range and rental price for Veeral.
Return ONLY a JSON object with this exact structure:
{
  "saleLow": number (USD, no decimals),
  "saleHigh": number (USD, no decimals),
  "rentLow": number (USD per day, no decimals),
  "rentHigh": number (USD per day, no decimals),
  "explanation": one sentence e.g. "Silk lehengas in like-new condition typically sell for $280–$450 on South Asian resale markets."
}

Listing details:
${details}`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const clean = text.replace(/```json\n?|```/g, "").trim();
    const data = JSON.parse(clean);

    return NextResponse.json(data);
  } catch (err) {
    console.error("Pricing error:", err);
    return NextResponse.json({ error: "Failed to get pricing suggestion" }, { status: 500 });
  }
}
