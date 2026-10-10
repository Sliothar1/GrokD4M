import Link from "next/link";

/**
 * Original flat marks for the Fohenagh poster.
 * Hurler, hurleys and sliotar only — no borrowed trademarks.
 */

export function HurlerSilhouette({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="-8 -6 230 272"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="78" cy="36" r="18" />
      <path d="M62 54 L108 60 L100 122 L70 118 Z" />
      <path d="M70 78 L36 42 L28 56 L64 90 Z" />
      <path d="M38 52 L6 -2 L-4 12 L28 62 Z" />
      <path d="M6 0 L-6 30 L10 48 L32 18 Z" />
      <path d="M98 74 L150 98 L140 116 L90 90 Z" />
      <path d="M68 118 L28 176 L12 242 L40 248 L60 186 L86 128 Z" />
      <path d="M102 122 L148 176 L178 236 L200 226 L164 166 L120 122 Z" />
    </svg>
  );
}

export function HurlsSilhouette({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 160"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <g transform="rotate(-26 60 88)">
        <path d="M52 4h14v92h20c8 10 6 24-6 32H40c-12-8-10-24 2-32h10V4z" />
      </g>
      <g transform="rotate(26 60 88)">
        <path d="M52 4h14v92h20c8 10 6 24-6 32H40c-12-8-10-24 2-32h10V4z" />
      </g>
    </svg>
  );
}

export function SliotarSilhouette({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="40" cy="40" r="30" fill="currentColor" />
      <path
        d="M40 12v56M14 40h52M22 22c10 6 26 6 36 0M22 58c10-6 26-6 36 0"
        fill="none"
        stroke="var(--fohenagh-paper, #f3efe6)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Club-page mark. Crossed hurls only — no figure, no ball. */
export function FohenaghMarks() {
  return (
    <div className="fohenagh-marks">
      <figure className="fohenagh-mark" tabIndex={0}>
        <HurlsSilhouette className="fohenagh-hurls" />
        <figcaption>Crossed at the gate.</figcaption>
      </figure>
    </div>
  );
}

/** Slim band on a player page for someone who wore the Fohenagh jersey. */
export function FohenaghPlayerBand() {
  return (
    <div className="fohenagh-player-band">
      <p>
        <Link href="/club/fohenagh-historic">Fohenagh</Link>
      </p>
    </div>
  );
}
