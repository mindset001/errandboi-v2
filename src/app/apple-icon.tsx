import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const contentType = "image/png";
export const size = { width: 180, height: 180 };

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f97316",
          borderRadius: 40,
        }}
      >
        <span style={{ fontSize: 100, lineHeight: 1 }}>🛵</span>
      </div>
    ),
    { width: 180, height: 180 }
  );
}
