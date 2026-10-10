/**
 * Archive credit plus one link back to the permalink.
 * Rendered for every article kind that carries these fields.
 */
import { publicSourceCredit } from "@/lib/publicText";

export function ArticleCredit({
  credit,
  creditUrl,
  sourceUrl,
}: {
  credit?: string;
  creditUrl?: string;
  sourceUrl?: string;
}) {
  const creditText = publicSourceCredit(credit ?? "").trim();
  const creditHref = creditUrl?.trim();
  const original = sourceUrl?.trim();
  if (!creditText && !original) return null;

  return (
    <div className="rounded-2xl border-2 border-galway-maroon/15 bg-white p-5 shadow-sm">
      {creditText ? (
        <p className="text-base font-semibold text-galway-ink">
          {creditHref ? (
            <a
              href={creditHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-galway-maroon underline"
            >
              {creditText}
            </a>
          ) : (
            creditText
          )}
        </p>
      ) : null}
      {original ? (
        <p className={creditText ? "mt-2" : undefined}>
          <a
            href={original}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-galway-maroon underline"
          >
            Read the original
          </a>
        </p>
      ) : null}
    </div>
  );
}
