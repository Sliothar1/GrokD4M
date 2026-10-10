import { siteCredit } from "@/config/siteCredit";

export function SiteFooter() {
  const credit = siteCredit;
  return (
    <footer className="mt-auto border-t border-galway-maroon/20 bg-galway-cream/60">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-xs leading-relaxed text-[color:var(--text-muted)]">
        <p>
          {credit.d4m.before}{" "}
          <a
            className="underline decoration-galway-ink/25 underline-offset-2 hover:text-galway-maroon"
            href={credit.d4m.labHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            {credit.d4m.labLabel}
          </a>
          {" · "}
          <a
            className="underline decoration-galway-ink/25 underline-offset-2 hover:text-galway-maroon"
            href={credit.d4m.siteHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            {credit.d4m.siteLabel}
          </a>
        </p>
        <p className="flex items-start gap-2">
          <span
            role="img"
            title={credit.grok.badgeTitle}
            aria-label={credit.grok.badgeTitle}
            className="mt-0.5 inline-flex h-4 shrink-0 items-center rounded-full bg-galway-maroon/80 px-1.5 text-[9px] font-bold leading-none tracking-wide text-galway-cream"
          >
            {credit.grok.badge}
          </span>
          <span>
            {credit.grok.lead}{" "}
            <a
              href={credit.grok.href}
              className="font-semibold text-galway-ink/70 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {credit.grok.name}
            </a>
            <sup title={credit.grok.supTitle} className="ml-px align-super text-[9px]">
              {credit.grok.sup}
            </sup>
            {credit.grok.tail}
          </span>
        </p>
      </div>
    </footer>
  );
}
