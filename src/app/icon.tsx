import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const contentType = "image/png";

// Renders both 192 and 512 depending on ?size= param
export default async function Icon({ searchParams }: { searchParams: Promise<{ size?: string }> }) {
  const { size } = await searchParams;
  const px = size === "512" ? 512 : 192;
  const radius = Math.round(px * 0.22);
  const fontSize = Math.round(px * 0.52);

  return new ImageResponse(
    (
      <div
        style={{
          width: px,
          height: px,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f97316",
          borderRadius: radius,
        }}
      >
        <span style={{ fontSize, lineHeight: 1 }}>🛵</span>
      </div>
    ),
    { width: px, height: px }
  );
}
