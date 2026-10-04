import {
  VERIFICATION_LABEL,
  VERIFICATION_LEGEND,
  VERIFICATION_STATUSES,
  type FactSourceStatus,
} from "@/lib/verification";

const BADGE_CLASS: Record<FactSourceStatus, string> = {
  verified: "bg-green-100 text-green-900",
  "single-source": "bg-amber-100 text-amber-950",
  unverified: "bg-stone-200 text-stone-800",
  "confirmed-by-family":
    "border border-galway-maroon/50 bg-galway-cream text-galway-maroon",
};

/**
 * Text label plus colour. Colour is never the only signal.
 * `fact` is the on-page fact key. Legend samples set `legend` so they
 * are not counted as page facts.
 */
export function VerificationBadge({
  status,
  fact,
  legend = false,
}: {
  status: FactSourceStatus;
  fact?: string;
  legend?: boolean;
}) {
  return (
    <span
      data-verification={status}
      data-fact={legend ? undefined : fact}
      data-legend={legend ? "true" : undefined}
      className={`inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-sm font-bold leading-5 ${BADGE_CLASS[status]}`}
    >
      {VERIFICATION_LABEL[status]}
    </span>
  );
}

/** Sits on the Sources panel. One row per status, label then meaning. */
export function VerificationLegend() {
  return (
    <div className="mb-4 max-w-full">
      <h3 className="mb-2 text-sm font-bold text-galway-ink">Badge legend</h3>
      <ul className="space-y-2">
        {VERIFICATION_STATUSES.map((status) => (
          <li
            key={status}
            className="flex max-w-full flex-wrap items-center gap-x-2 gap-y-1"
          >
            <VerificationBadge status={status} legend />
            <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-galway-ink">
              {VERIFICATION_LEGEND[status]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
