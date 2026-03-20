import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #5f6fff, #09111f)",
          borderRadius: 8,
          color: "white",
          fontSize: 16,
          fontWeight: 800,
          fontFamily: "sans-serif"
        }}
      >
        SO
      </div>
    ),
    { ...size }
  );
}
