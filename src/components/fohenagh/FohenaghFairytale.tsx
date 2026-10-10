import Link from "next/link";
import { ZoomableImage } from "@/components/ZoomableImage";
import { SHOW_INA_MEDIA } from "@/lib/ina-media";

const P82 = "/uploads/book/fohenagh-history/feature-ctt-2021-01-29-p82-web.jpg";
const P83 = "/uploads/book/fohenagh-history/feature-ctt-2021-01-29-p83-web.jpg";
const ARCHIVE = "https://irishnewsarchive.com/?a=d&d=CTT20210129.1.82";
const ARTICLE = "/article/art-feature-ctt-2021-01-29-fohenagh-1959";

/** 2021 Connacht Tribune feature. Hidden with the INA media flag. */
export function FohenaghFairytale() {
  if (!SHOW_INA_MEDIA) return null;
  return (
    <section className="space-y-5" aria-labelledby="fohenagh-fairytale">
      <div className="max-w-2xl space-y-3">
        <p className="fohenagh-kicker">Connacht Tribune · 29 January 2021</p>
        <h2 id="fohenagh-fairytale" className="fohenagh-name text-[clamp(2.2rem,6vw,3.6rem)]">
          Fohenagh&apos;s fairytale
        </h2>
        <p className="fohenagh-deck">
          Stephen Glennon on the senior hurlers of 1959 and 1960. Pages 82 and 83.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ZoomableImage
          src={P82}
          alt="Connacht Tribune, 29 January 2021, page 82: Fohenagh's fairytale"
          credit="Connacht Tribune, courtesy of Irish Newspaper Archives"
          creditUrl={ARCHIVE}
        />
        <ZoomableImage
          src={P83}
          alt="Connacht Tribune, 29 January 2021, page 83: Fohenagh's fairytale"
          credit="Connacht Tribune, courtesy of Irish Newspaper Archives"
          creditUrl={ARCHIVE}
        />
      </div>
      <p className="text-sm leading-relaxed text-galway-ink/80">
        <Link href={ARTICLE} className="font-semibold text-galway-maroon underline underline-offset-4">
          Read the original
        </Link>
        {" · "}
        <a
          href={ARCHIVE}
          className="font-semibold text-galway-maroon underline underline-offset-4"
          target="_blank"
          rel="noopener noreferrer"
        >
          Connacht Tribune, courtesy of Irish Newspaper Archives
        </a>
      </p>
    </section>
  );
}
