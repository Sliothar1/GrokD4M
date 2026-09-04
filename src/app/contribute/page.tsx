import type { Metadata } from "next";
import Link from "next/link";
import { ArticleUploadForm } from "@/components/ArticleUploadForm";
import { EmptyTeach } from "@/components/EntityCard";
import { articleToSummary, readArticleUploads } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Contribute",
};

export const dynamic = "force-dynamic";

export default function ContributePage() {
  const uploads = readArticleUploads();

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-galway-ink">Contribute</h1>
        <p className="text-lg text-galway-ink/75">
          Upload a newspaper or article photo for HurlingWiki trials. Optional caption,
          year, and club tags help search find it.{" "}
          <Link href="/stories" className="font-semibold text-galway-maroon underline">
            Prefer a written story?
          </Link>
        </p>
      </header>

      <ArticleUploadForm />

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-galway-maroon">Your uploads</h2>
        {uploads.length === 0 ? (
          <EmptyTeach
            title="No article photos yet"
            hint="Use the button above. Images land in public/uploads/articles/ and show up in Search."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {uploads.map((u) => {
              const s = articleToSummary(u);
              return (
                <li key={u.id}>
                  <Link
                    href={s.href}
                    className="block overflow-hidden rounded-2xl border-2 border-galway-maroon/15 bg-white shadow-sm transition hover:border-galway-maroon"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u.path}
                      alt={u.caption || "Uploaded article"}
                      className="h-40 w-full object-cover bg-galway-cream"
                    />
                    <div className="p-3">
                      <p className="text-xs font-bold uppercase text-galway-gold">
                        From your upload
                      </p>
                      <h3 className="text-lg font-bold">{s.title}</h3>
                      {s.subtitle && (
                        <p className="text-sm text-galway-ink/65">{s.subtitle}</p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
