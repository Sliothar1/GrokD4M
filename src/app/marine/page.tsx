import type { Metadata } from "next";
import Link from "next/link";
import { MarineInstanceView } from "@/components/marine/MarineInstanceView";
import { MarineQueryPlayground } from "@/components/marine/MarineQueryPlayground";
import {
  getMarineInstance,
  listMarineInstances,
  marineDemoBundle,
} from "@/lib/marine/loadMarine";

export const metadata: Metadata = {
  title: "PA-Marine — D4M for Irish HAB, from Galway Bay",
  description:
    "Cork Ocean Hackathon demo: one D4M engine, marine HAB + MHW storytelling from Galway Bay. Honest open-data framing.",
};

export default async function MarinePage({
  searchParams,
}: {
  searchParams: Promise<{ instance?: string }>;
}) {
  const { instance: instanceId } = await searchParams;
  const instance = getMarineInstance(instanceId);
  const bundle = marineDemoBundle();
  const tabs = listMarineInstances();

  return (
    <div className="space-y-10">
      <header className="space-y-4 rounded-3xl bg-marine-deep px-6 py-8 text-white sm:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-marine-foam/80">
          Cork Ocean Hackathon · PA-Marine
        </p>
        <h1 className="text-3xl font-black leading-tight sm:text-5xl">
          PA-Marine — D4M for Irish HAB, from Galway Bay
        </h1>
        <p className="max-w-3xl text-lg text-marine-foam">
          One associative-array engine, two domains. HurlingWiki stays on{" "}
          <Link href="/" className="underline">
            /
          </Link>
          . This route only tells marine heatwave + harmful algal bloom stories
          as sparse <strong>row / col / val</strong> triples.
        </p>
        <p className="max-w-3xl text-sm text-marine-foam/85">
          Judge skill line: {bundle.engine.skill_line}. {bundle.engine.skill_lift_note}
        </p>
        <p className="text-sm text-marine-foam/70">
          {bundle.nnz} marine triples · row pattern{" "}
          <code className="rounded bg-white/10 px-1">{bundle.engine.row_pattern}</code>
        </p>
      </header>

      <nav
        aria-label="MHW instances"
        className="flex flex-wrap gap-2 rounded-2xl bg-marine-foam p-2"
      >
        {tabs.map((tab) => {
          const active = tab.id === instance.id;
          return (
            <Link
              key={tab.id}
              href={`/marine?instance=${tab.id}`}
              className={`rounded-xl px-4 py-3 text-sm font-bold sm:text-base ${
                active
                  ? "bg-marine-deep text-white"
                  : "bg-white text-marine-deep hover:bg-white/70"
              }`}
            >
              {tab.tab_label}
              <span className="mt-0.5 block text-xs font-semibold opacity-80">
                {tab.date_range.start.slice(0, 7)}
              </span>
            </Link>
          );
        })}
      </nav>

      <MarineInstanceView instance={instance} />
      <MarineQueryPlayground />
    </div>
  );
}
