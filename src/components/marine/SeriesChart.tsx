export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  kind?: "line" | "area";
}

export interface ChartPoint {
  date: string;
  values: Record<string, number>;
}

function extent(nums: number[]): [number, number] {
  if (nums.length === 0) return [0, 1];
  let min = Math.min(...nums);
  let max = Math.max(...nums);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.08;
  return [min - pad, max + pad];
}

function xAt(i: number, n: number, left: number, width: number): number {
  if (n <= 1) return left + width / 2;
  return left + (i / (n - 1)) * width;
}

function yAt(v: number, min: number, max: number, top: number, height: number): number {
  const t = (v - min) / (max - min);
  return top + (1 - t) * height;
}

export function SeriesChart({
  title,
  points,
  series,
  caption,
}: {
  title: string;
  points: ChartPoint[];
  series: ChartSeries[];
  caption?: string;
}) {
  const W = 720;
  const H = 280;
  const left = 48;
  const right = 16;
  const top = 28;
  const bottom = 36;
  const width = W - left - right;
  const height = H - top - bottom;

  const nums = series.flatMap((s) =>
    points
      .map((p) => p.values[s.key])
      .filter((v): v is number => typeof v === "number")
  );
  const [min, max] = extent(nums);

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => {
    const v = min + ((max - min) * i) / ticks;
    return v;
  });

  return (
    <figure className="rounded-2xl border-2 border-marine-deep/15 bg-white p-4">
      <p className="text-sm font-bold uppercase tracking-wide text-marine-teal">
        {title}
      </p>
      {points.length === 0 ? (
        <p className="mt-3 text-sm text-marine-deep/70">No series for this panel.</p>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mt-2 h-auto w-full"
          role="img"
          aria-label={title}
        >
          {yTicks.map((v, tickIdx) => {
            const y = yAt(v, min, max, top, height);
            return (
              <g key={tickIdx}>
                <line
                  x1={left}
                  x2={left + width}
                  y1={y}
                  y2={y}
                  stroke="#d5e6ea"
                />
                <text
                  x={left - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#0b3d4a"
                >
                  {v.toFixed(2)}
                </text>
              </g>
            );
          })}
          {series.map((s) => {
            const pts = points
              .map((p, i) => {
                const v = p.values[s.key];
                if (typeof v !== "number") return null;
                return {
                  x: xAt(i, points.length, left, width),
                  y: yAt(v, min, max, top, height),
                };
              })
              .filter((p): p is { x: number; y: number } => p !== null);
            if (pts.length === 0) return null;
            const d = pts
              .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
              .join(" ");
            if (s.kind === "area") {
              const base = top + height;
              const area =
                d +
                ` L ${pts[pts.length - 1].x.toFixed(1)} ${base} L ${pts[0].x.toFixed(1)} ${base} Z`;
              return (
                <path
                  key={s.key}
                  d={area}
                  fill={s.color}
                  fillOpacity={0.25}
                  stroke={s.color}
                  strokeWidth="1.5"
                />
              );
            }
            return (
              <path
                key={s.key}
                d={d}
                fill="none"
                stroke={s.color}
                strokeWidth="2.2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            );
          })}
          <text
            x={left}
            y={H - 10}
            fontSize="11"
            fill="#0b3d4a"
          >
            {points[0]?.date} → {points[points.length - 1]?.date}
          </text>
        </svg>
      )}
      <ul className="mt-2 flex flex-wrap gap-3 text-sm">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-6 rounded-full"
              style={{ background: s.color }}
            />
            {s.label}
          </li>
        ))}
      </ul>
      {caption ? (
        <figcaption className="mt-2 text-sm text-marine-deep/75">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
