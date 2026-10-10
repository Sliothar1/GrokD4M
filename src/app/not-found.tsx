import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <svg className="sliotar mx-auto" viewBox="0 0 64 64" aria-hidden="true">
        <title>The sliotar has gone over the bar</title>
        <circle cx="32" cy="32" r="22" fill="#f4efe6" stroke="#2348b8" strokeWidth="2" />
        <path d="M20 26c6 4 18 4 24 0M18 34h28M22 42c5-3 15-3 20 0" fill="none" stroke="#2348b8" strokeWidth="1.4" />
      </svg>
      <h1 className="mt-6 text-4xl text-galway-ink">Wide</h1>
      <p className="mt-3 text-lg text-galway-ink/75">
        That page is not on the pitch. The sliotar has gone over the bar.
      </p>
      <p className="mt-2 text-sm text-galway-ink/50" title="Puck it back and start again.">
        Puck it back and start again.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-full bg-galway-maroon px-5 py-2 text-sm font-bold text-white"
      >
        Back to Fohenagh
      </Link>
    </div>
  );
}
