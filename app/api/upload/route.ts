import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") ?? "";

    let base64: string;
    let folder = `veeral/listings/${user.id}`;

    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      // FormData payload (used by listing image uploader)
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
    } else {
      // Base64 JSON payload (used by damage claim uploader and others)
      const body = await req.json();
      if (!body.image) return NextResponse.json({ error: "No image provided" }, { status: 400 });
      base64 = body.image;
      if (body.folder) folder = body.folder;
    }

    const url = await uploadImage(base64, folder);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
