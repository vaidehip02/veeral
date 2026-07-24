import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import path from "path";

export const runtime = "nodejs";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const font = readFileSync(
    path.join(process.cwd(), "public/cormorant-italic-500.ttf")
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "#C95C1A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "Cormorant",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 22,
            color: "#F5F0E8",
            marginTop: 2,
            marginLeft: 1,
          }}
        >
          v
        </span>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Cormorant",
          data: font,
          style: "italic",
          weight: 500,
        },
      ],
    }
  );
}
