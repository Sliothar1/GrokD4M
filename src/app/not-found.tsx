import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-4xl font-black text-galway-ink">Page not found</h1>
      <p className="text-lg text-galway-ink">That page is not on HurlingWiki.</p>
      <p>
        <Link href="/" className="font-semibold text-galway-maroon underline underline-offset-4">
          Back to the start
        </Link>
      </p>
    </div>
  );
}
