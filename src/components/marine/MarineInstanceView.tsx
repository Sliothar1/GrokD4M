import type { ChartPoint } from "@/components/marine/SeriesChart";
import { SeriesChart } from "@/components/marine/SeriesChart";
import { StationMap } from "@/components/marine/StationMap";
import type { MarineInstance, MarineTimeseriesPoint } from "@/lib/marine/types";

function metricLabel(key: string): string {
  return key.replace(/_/g, " ");
}

function seriesFor(
  points: MarineTimeseriesPoint[],
  locationId: string,
  keys: string[]
): ChartPoint[] {
  return points
    .filter((p) => p.location_id === locationId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => {
      const values: Record<string, number> = {};
      for (const k of keys) {
        const v = p[k as keyof MarineTimeseriesPoint];
        if (typeof v === "number") values[k] = v;
      }
      return { date: p.date, values };
    })
    .filter((p) => Object.keys(p.values).length > 0);
}

function HabPoints({ instance }: { instance: MarineInstance }) {
  const rows = instance.timeseries
    .filter(
      (p) =>
        typeof p.hab_cells === "number" || typeof p.hab_exceedance === "number"
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  if (rows.length === 0) return null;
  return (
    <section className="rounded-2xl border-2 border-marine-deep/15 bg-white p-5">
      <h2 className="text-xl font-bold text-marine-deep">HAB observations</h2>
      <p className="mt-1 text-sm text-marine-deep/75">
        Cell counts appear only where a published number exists. Exceedance 0/1
        series that reconstruct a published rate are labelled illustrative.
      </p>
      <div className="mt-3 max-h-96 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-marine-deep/15">
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Station</th>
              <th className="py-2 pr-3">cells/L</th>
              <th className="py-2 pr-3">exceedance</th>
              <th className="py-2">quality</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={`${r.date}-${r.location_id}-${r.hab_cells ?? r.hab_exceedance}`}
                className="border-b border-marine-deep/10"
              >
                <td className="py-2 pr-3 font-mono">{r.date}</td>
                <td className="py-2 pr-3">{r.location_id}</td>
                <td className="py-2 pr-3">
                  {typeof r.hab_cells === "number" ? r.hab_cells : "—"}
                </td>
                <td className="py-2 pr-3">
                  {typeof r.hab_exceedance === "number" ? r.hab_exceedance : "—"}
                </td>
                <td className="py-2">{r.quality.replace("_", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function MarineInstanceView({ instance }: { instance: MarineInstance }) {
  const sstShelf = seriesFor(instance.timeseries, "irish-shelf", [
    "sst",
    "ssta",
    "in_mhw",
  ]);
  const fracShelf = seriesFor(instance.timeseries, "irish-shelf", [
    "frac_mhw",
    "in_mhw",
  ]);
  const mace = seriesFor(instance.timeseries, "mace-head", ["sst", "ssta"]);
  const highlight =
    instance.stations.find((s) => s.id === instance.highlight_station_id) ??
    instance.stations[0];

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm font-bold uppercase tracking-wide text-marine-teal">
          {instance.tab_label} · {instance.date_range.start} to{" "}
          {instance.date_range.end}
        </p>
        <h2 className="text-3xl font-black text-marine-deep">{instance.title}</h2>
        <p className="text-lg text-marine-deep/85">{instance.angle}</p>
        <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-marine-deep/90">
          {instance.narrative.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {Object.entries(instance.key_metrics).map(([key, metric]) => (
          <article
            key={key}
            className="rounded-2xl border-2 border-marine-deep/15 bg-white p-4"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-marine-teal">
              {metricLabel(key)}
            </p>
            <p className="mt-1 text-2xl font-black text-marine-deep">
              {metric.value}
              {metric.unit ? (
                <span className="ml-1 text-base font-semibold">{metric.unit}</span>
              ) : null}
            </p>
            {metric.note ? (
              <p className="mt-1 text-sm text-marine-deep/70">{metric.note}</p>
            ) : null}
            <p className="mt-2 text-xs font-semibold uppercase text-marine-alert">
              {metric.quality === "grounded"
                ? "Grounded open-data metric"
                : "Illustrative context"}
            </p>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-marine-deep">
          Station highlight · {highlight?.name}
        </h2>
        <StationMap
          stations={instance.stations}
          highlightId={instance.highlight_station_id}
        />
      </section>

      {sstShelf.some((p) => p.values.sst != null) ? (
        <SeriesChart
          title="Irish shelf SST / SSTA / in_mhw"
          points={sstShelf}
          series={[
            { key: "sst", label: "SST (°C)", color: "#0b3d4a" },
            { key: "ssta", label: "SSTA (°C, illustrative clim)", color: "#1a7a8c" },
            {
              key: "in_mhw",
              label: "in_mhw (0/1, illustrative placement)",
              color: "#c45c26",
              kind: "area",
            },
          ]}
          caption="Illustrative daily context calibrated to published June mean SST and in_mhw occupancy. Not an OISST grid extract. model_p omitted."
        />
      ) : null}

      {fracShelf.some((p) => p.values.frac_mhw != null) ? (
        <SeriesChart
          title="Irish-bbox frac_mhw"
          points={fracShelf}
          series={[
            { key: "frac_mhw", label: "frac_mhw", color: "#0b3d4a" },
            {
              key: "in_mhw",
              label: "in_mhw (frac ≥ 0.5, illustrative)",
              color: "#c45c26",
              kind: "area",
            },
          ]}
          caption="Daily curve scaled to published CRW means/peaks. Use the key-metric cards as the grounded numbers."
        />
      ) : null}

      {mace.length > 0 ? (
        <SeriesChart
          title="Mace Head temperature (June context)"
          points={mace}
          series={[
            { key: "sst", label: "T (°C)", color: "#0b3d4a" },
            { key: "ssta", label: "vs other Junes (~13.70 °C)", color: "#1a7a8c" },
          ]}
          caption="Illustrative daily values scaled to the published June mean 15.98 °C (+2.28 °C vs other Junes)."
        />
      ) : null}

      {instance.id === "2023-atlantic-mhw" ? (
        <aside className="rounded-2xl border-2 border-dashed border-marine-alert/50 bg-white p-5">
          <h3 className="font-bold text-marine-deep">Lehanagh Pool buoy</h3>
          <p className="mt-1 text-sm text-marine-deep/80">
            No June 2023 series. Near-real-time coverage in this demo starts{" "}
            <strong>2024-05-27</strong>. The pin is shown so the gap is visible,
            not so a placeholder curve can be invented.
          </p>
        </aside>
      ) : null}

      <HabPoints instance={instance} />

      <section className="rounded-2xl bg-marine-deep p-6 text-white">
        <h2 className="text-xl font-bold">Hobday MHW, in plain language</h2>
        <p className="mt-2 text-base leading-relaxed text-marine-foam">
          A marine heatwave (Hobday et al., 2016) is when sea-surface temperature
          stays above the <strong>seasonally varying 90th percentile</strong> for{" "}
          <strong>at least five days</strong>. That is a heat event, not a bloom
          forecast. Phytoplankton still need inoculum, light, nutrients, and
          retention. Instance B is the cautionary tale: category-5 shelf MHW with
          national Dinophysis and closures <em>below</em> climatology.
        </p>
      </section>

      <section className="space-y-2 rounded-2xl border-2 border-marine-deep/15 bg-marine-foam p-5 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-marine-deep">Honesty notes</h2>
        <ul className="list-disc space-y-1 pl-5">
          {instance.data_notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <p className="pt-2 font-semibold text-marine-deep">Sources</p>
        <ul className="list-disc space-y-1 pl-5">
          {instance.sources.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
