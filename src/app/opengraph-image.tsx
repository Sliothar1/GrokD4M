import { ImageResponse } from "next/og";

export const alt = "HurlingWiki, the historical record of hurling";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f4f6fb",
          color: "#1a1215",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", width: "100%", height: 14, background: "#1c3a8f" }} />
          <div style={{ display: "flex", width: 180, height: 8, marginTop: 10, background: "#f6e27a" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 84,
              fontWeight: 800,
              letterSpacing: -2,
              color: "#1c3a8f",
            }}
          >
            HurlingWiki
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 36, color: "#1a1215" }}>
            The historical record of hurling
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#3a4560" }}>hurlingwiki.vercel.app</div>
      </div>
    ),
    { ...size }
  );
}
