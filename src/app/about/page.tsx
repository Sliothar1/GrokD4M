import type { Metadata } from "next";
import Link from "next/link";
import { siteCredit } from "@/config/siteCredit";
import { readArticleUploads } from "@/lib/articles";
import { demoStats } from "@/lib/data";
import { withPageMeta } from "@/lib/site";

export const metadata: Metadata = withPageMeta({ title: "About", path: "/about" });

async function citedMentions(): Promise<number> {
  const uploads = await readArticleUploads();
  return uploads.filter((upload) =>
    /irish newspaper archives|irishnewsarchive/i.test(
      `${upload.credit ?? ""} ${upload.creditUrl ?? ""} ${upload.sourceUrl ?? ""} ${upload.citeChip ?? ""}`
    )
  ).length;
}

export default async function AboutPage() {
  const [stats, mentions] = await Promise.all([demoStats(), citedMentions()]);

  return (
    <div className="prose-like max-w-3xl space-y-6">
      <h1 className="text-4xl font-black text-galway-ink sm:text-5xl">About HurlingWiki</h1>
      <p className="text-xl leading-relaxed text-galway-ink/85">
        HurlingWiki is a Hurling Knowledge Site that shows how MIT&apos;s D4M associative
        arrays can hold sports facts as sparse triples. The club page is the same for every
        club. Fohenagh is the club on the site today.
      </p>

      <section className="space-y-3 rounded-2xl border-2 border-galway-maroon/15 bg-white p-6">
        <h2 className="text-2xl font-bold text-galway-maroon">What is D4M?</h2>
        <p className="text-lg leading-relaxed">
          <strong>D4M</strong> means <em>Dynamic Distributed Dimensional Data Model</em>. It
          was developed at{" "}
          <a
            href="https://www.ll.mit.edu/"
            className="font-bold text-galway-maroon hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            MIT Lincoln Laboratory
          </a>
          , with foundational work by{" "}
          <a
            href="https://www.ll.mit.edu/biographies/jeremy-kepner"
            className="font-bold text-galway-maroon hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Jeremy Kepner
          </a>{" "}
          and collaborators. Associative arrays let you store and query sparse multi-dimensional
          data using simple algebra-like operations — perfect for linking players, clubs, and
          matches without a heavy schema.
        </p>
        <p className="text-lg">
          Official site:{" "}
          <a
            href="https://d4m.mit.edu/"
            className="font-bold text-galway-maroon underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://d4m.mit.edu/
          </a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-galway-maroon">How it works</h2>
        <ul className="list-disc space-y-2 pl-6 text-lg">
          <li>
            Seed facts live in <code className="rounded bg-galway-cream px-1">data/seed.json</code>{" "}
            as <code className="rounded bg-galway-cream px-1">(row, col, val)</code> triples.
          </li>
          <li>
            <code className="rounded bg-galway-cream px-1">AssocArray</code> supports{" "}
            <code className="rounded bg-galway-cream px-1">getrow</code>,{" "}
            <code className="rounded bg-galway-cream px-1">getcol</code>, and simple{" "}
            <code className="rounded bg-galway-cream px-1">search</code>.
          </li>
          <li>
            Right now the board holds <strong>{stats.nnz}</strong> triples across{" "}
            <strong>{stats.rows}</strong> rows.
          </li>
          <li>
            Community stories you submit go to{" "}
            <code className="rounded bg-galway-cream px-1">data/pending-stories.json</code> and
            never mix into official stats.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-galway-maroon">What this site draws on</h2>
        <ul className="list-disc space-y-2 pl-6 text-lg leading-relaxed">
          <li>
            Newspaper archives, credited to Irish Newspaper Archives. {mentions.toLocaleString("en-IE")} cited
            mentions are on the site now.
          </li>
          <li>A History of Fohenagh, by Tony O&apos;Gorman.</li>
          <li>Club photos, and clipping collections kept by members.</li>
          <li>
            Visitor uploads. The editor approves each one before it goes up, which is how the site keeps growing.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-galway-maroon">Coming next</h2>
        <ul className="list-disc space-y-2 pl-6 text-lg leading-relaxed">
          <li>Ask a question about the club</li>
          <li>More camogie and football history</li>
          <li>Team photos</li>
          <li>The Ahascragh and Ahascragh-Fohenagh pages</li>
          <li>More clubs</li>
        </ul>
      </section>

      <section className="space-y-4 border-t border-galway-maroon/15 pt-6 text-base leading-relaxed text-galway-ink">
        <p>
          <span
            title={siteCredit.grok.badgeTitle}
            className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-galway-maroon text-[11px] font-black text-white"
          >
            {siteCredit.grok.badge}
          </span>
          {siteCredit.grok.lead}{" "}
          <a className="font-semibold text-galway-maroon underline" href={siteCredit.grok.href}>
            {siteCredit.grok.name}
          </a>
          <sup title={siteCredit.grok.supTitle}>{siteCredit.grok.sup}</sup>
          {siteCredit.grok.tail} Grok Bot is an AI assistant for research and coding. It does not
          decide which fact goes on a page. A printed source does.
        </p>
        <p>
          {siteCredit.builtBy.replace(/Garry Lohan$/, "")}
          <Link href="/player/garry-lohan" className="font-semibold text-galway-maroon underline">
            Garry Lohan
          </Link>
          {" · "}
          <a className="font-semibold text-galway-maroon underline" href={siteCredit.scholar.href}>
            {siteCredit.scholar.label}
          </a>
          {" · "}
          <a className="font-semibold text-galway-maroon underline" href={siteCredit.linkedin.href}>
            {siteCredit.linkedin.label}
          </a>
        </p>
        <p>
          {siteCredit.d4m.before}{" "}
          <a className="font-semibold text-galway-maroon underline" href={siteCredit.d4m.labHref}>
            {siteCredit.d4m.labLabel}
          </a>
          {" ("}
          <a className="font-semibold text-galway-maroon underline" href={siteCredit.d4m.siteHref}>
            {siteCredit.d4m.siteLabel}
          </a>
          ).
        </p>
      </section>
    </div>
  );
}
