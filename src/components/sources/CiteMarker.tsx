import {
  sourceMarkerLabel,
  type ResolvedSource,
} from "@/lib/sources";

/** Superscript cite, e.g. [1], linking to `#source-1`. */
export function CiteMarker({ n, label }: { n: number; label: string }) {
  return (
    <a
      href={`#source-${n}`}
      aria-label={label}
      className="mx-px inline-flex min-h-8 min-w-8 shrink-0 -translate-y-0.5 items-center justify-center rounded px-0.5 align-super text-[0.8rem] font-bold leading-none text-galway-maroon underline decoration-galway-maroon/50 underline-offset-2 hover:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-galway-gold"
    >
      [{n}]
    </a>
  );
}

/** Renders nothing when the fact has no sources. */
export function CiteMarkers({
  numbers,
  sources,
}: {
  numbers: readonly number[];
  sources: readonly ResolvedSource[];
}) {
  if (numbers.length === 0) return null;
  const byNumber = new Map(sources.map((source) => [source.number, source]));
  const markers = numbers.flatMap((n) => {
    const source = byNumber.get(n);
    if (!source) return [];
    return (
      <CiteMarker key={n} n={n} label={sourceMarkerLabel(source)} />
    );
  });
  if (markers.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap items-center align-baseline">
      {markers}
    </span>
  );
}
