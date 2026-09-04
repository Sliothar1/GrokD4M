import Link from "next/link";
import { EntityCard } from "@/components/EntityCard";
import type { getEntity } from "@/lib/data";

type EntityPayload = NonNullable<ReturnType<typeof getEntity>>;

export function EntityView({ data }: { data: EntityPayload }) {
  const { attrs, summary, related, triples } = data;
  const skip = new Set(["type", "name", "title"]);
  const source = attrs.source ? String(attrs.source) : null;

  return (
    <article className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-bold uppercase tracking-wide text-galway-maroon">
          {summary.kind.replace("_", " ")}
        </p>
        <h1 className="text-4xl font-black text-galway-ink sm:text-5xl">
          {summary.title}
        </h1>
        {summary.subtitle && (
          <p className="text-xl text-galway-ink/70">{summary.subtitle}</p>
        )}
        {summary.confidence && (
          <p className="text-sm text-galway-ink/50">
            Confidence: <strong>{summary.confidence}</strong>
          </p>
        )}
      </header>

      {attrs.notable || attrs.note || attrs.body || attrs.summary ? (
        <p className="text-lg leading-relaxed text-galway-ink">
          {String(attrs.notable ?? attrs.note ?? attrs.body ?? attrs.summary)}
        </p>
      ) : null}

      <section>
        <h2 className="mb-3 text-2xl font-bold text-galway-maroon">Facts</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          {Object.entries(attrs)
            .filter(([k]) => !skip.has(k) && k !== "notable" && k !== "note" && k !== "body" && k !== "summary")
            .map(([k, v]) => (
              <div
                key={k}
                className="rounded-xl border border-galway-maroon/10 bg-white px-4 py-3"
              >
                <dt className="text-xs font-bold uppercase tracking-wide text-galway-ink/50">
                  {k.replace(/_/g, " ")}
                </dt>
                <dd className="mt-1 text-lg font-semibold text-galway-ink break-all">
                  {typeof v === "string" && v.includes(":") ? (
                    <Link
                      href={
                        v.startsWith("player:")
                          ? `/player/${v.slice(7)}`
                          : v.startsWith("team:")
                            ? `/team/${v.slice(5)}`
                            : v.startsWith("club:")
                              ? `/club/${v.slice(5)}`
                              : v.startsWith("match:")
                                ? `/match/${v.slice(6)}`
                                : v.startsWith("win:")
                                  ? `/win/${v.slice(4)}`
                                  : `/search?q=${encodeURIComponent(v)}`
                      }
                      className="text-galway-maroon underline"
                    >
                      {v}
                    </Link>
                  ) : typeof v === "string" && v.startsWith("http") ? (
                    <a
                      href={v}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-galway-maroon underline"
                    >
                      Open source
                    </a>
                  ) : (
                    String(v)
                  )}
                </dd>
              </div>
            ))}
        </dl>
        {source && source.startsWith("http") && (
          <p className="mt-4 text-sm">
            Cite:{" "}
            <a
              href={source}
              className="font-semibold text-galway-maroon underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {source}
            </a>
          </p>
        )}
      </section>

      {related.length > 0 && (
        <section>
          <h2 className="mb-3 text-2xl font-bold text-galway-maroon">Related</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <EntityCard key={r.id} entity={r} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-2xl font-bold text-galway-maroon">
          D4M triples for this row
        </h2>
        <p className="mb-3 text-base text-galway-ink/70">
          Each line is one associative-array edge: <code className="font-mono">row</code>{" "}
          → <code className="font-mono">col</code> = value.
        </p>
        <ul className="space-y-2 font-mono text-sm">
          {triples.map((t) => (
            <li
              key={`${t.row}-${t.col}`}
              className="rounded-lg bg-galway-ink px-3 py-2 text-galway-cream"
            >
              <span className="text-galway-gold">{t.row}</span>
              {" · "}
              <span className="text-white">{t.col}</span>
              {" = "}
              <span className="text-galway-cream">{String(t.val)}</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
