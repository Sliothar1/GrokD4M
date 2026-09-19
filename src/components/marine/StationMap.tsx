import type { MarineStation } from "@/lib/marine/types";

const VIEW_W = 640;
const VIEW_H = 360;

/** Simple equirectangular pin map of Galway Bay / Connemara. */
export function StationMap({
  stations,
  highlightId,
}: {
  stations: MarineStation[];
  highlightId: string;
}) {
  const lon0 = -10.55;
  const lon1 = -9.35;
  const lat0 = 53.12;
  const lat1 = 53.58;

  const xOf = (lon: number) => ((lon - lon0) / (lon1 - lon0)) * VIEW_W;
  const yOf = (lat: number) => ((lat1 - lat) / (lat1 - lat0)) * VIEW_H;

  return (
    <figure className="overflow-hidden rounded-2xl border-2 border-marine-deep/15 bg-marine-foam">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label="Approximate map of highlighted marine stations around Galway Bay and Connemara"
        className="h-auto w-full"
      >
        <rect width={VIEW_W} height={VIEW_H} fill="#cfe7ee" />
        <path
          d="M40 40 C 80 90, 70 140, 90 180 S 70 250, 110 300 S 200 330, 280 310 S 400 280, 520 250 S 600 180, 610 90 L 610 20 L 40 20 Z"
          fill="#e8f4f6"
          stroke="#1a7a8c"
          strokeWidth="2"
        />
        <path
          d="M 90 200 C 140 210, 180 190, 230 200 S 320 230, 390 210"
          fill="none"
          stroke="#7eb8c4"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <text x="24" y="28" fill="#0b3d4a" fontSize="14" fontWeight="700">
          Galway Bay / Connemara — station highlight (placeholder map)
        </text>
        <text x="24" y={VIEW_H - 16} fill="#0b3d4a" fontSize="11">
          Pins are approximate. Not a hydrographic chart. Leaflet is not in this repo.
        </text>
        {stations.map((st) => {
          const x = xOf(st.lon);
          const y = yOf(st.lat);
          const active = st.id === highlightId;
          return (
            <g key={st.id}>
              <circle
                cx={x}
                cy={y}
                r={active ? 10 : 6}
                fill={active ? "#c45c26" : "#0b3d4a"}
                stroke="#fff"
                strokeWidth="2"
              />
              <text
                x={x + 12}
                y={y - 8}
                fill="#0b3d4a"
                fontSize={active ? 13 : 11}
                fontWeight={active ? 700 : 500}
              >
                {st.name}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="space-y-1 px-4 py-3 text-sm text-marine-deep/80">
        {stations.map((st) => (
          <p key={st.id}>
            <span className="font-semibold">{st.name}</span>
            {st.id === highlightId ? " · highlighted this instance" : ""}
            {st.note ? ` — ${st.note}` : ""}
          </p>
        ))}
      </figcaption>
    </figure>
  );
}
