import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const size = { width: 192, height: 192 };

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f97316",
          borderRadius: 42,
        }}
      >
        <span style={{ fontSize: 100, lineHeight: 1 }}>🛵</span>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
