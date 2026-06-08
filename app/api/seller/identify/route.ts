import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mediaType = (file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp") || "image/jpeg";

    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 800,
      system: `You are an expert in South Asian fashion with deep knowledge of Indian, Pakistani, and
South Asian garments. You identify garments from photos and provide structured information to help
sellers on Veeral, a South Asian fashion marketplace. Always respond in valid JSON only — no prose,
no markdown, just the raw JSON object.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `Analyze this South Asian garment photo and return ONLY a JSON object with this exact structure:
{
  "confident": true or false,
  "garmentType": one of: "lehenga" | "saree" | "salwar_kameez" | "sherwani" | "indo_western" | "jewellery" | "other",
  "garmentLabel": human-readable name e.g. "Bridal Lehenga Set",
  "fabric": single most likely fabric e.g. "Silk" or "Georgette",
  "embellishments": array of up to 3 from: ["Zari / Zardozi", "Sequins", "Mirror work", "Thread embroidery", "Beading", "Stone work", "Block print", "Bandhani", "Ikkat", "Plain"],
  "designerStyle": brief style note e.g. "Heavy bridal, Sabyasachi-inspired" or null if unclear,
  "retailValueUSD": { "low": number, "high": number } estimated original retail in USD,
  "summary": one sentence describing what you see e.g. "This appears to be a heavily embroidered red silk lehenga set with gold zari work, likely bridal."
}

If you cannot identify the item with reasonable confidence, set "confident" to false and still fill the other fields with your best guess, noting uncertainty in "summary".`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON — strip any accidental markdown fences
    const clean = text.replace(/```json\n?|```/g, "").trim();
    const data = JSON.parse(clean);

    return NextResponse.json(data);
  } catch (err) {
    console.error("Identify error:", err);
    return NextResponse.json({ error: "Failed to identify item" }, { status: 500 });
  }
}
