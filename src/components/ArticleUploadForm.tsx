"use client";

import { FormEvent, DragEvent, useRef, useState } from "react";

const CLUB_CHIPS = [
  { label: "Fohenagh", token: "Fohenagh" },
  { label: "Ahascragh", token: "Ahascragh historic" },
  { label: "Ahascragh-Fohenagh", token: "Ahascragh-Fohenagh" },
  { label: "Portumna", token: "Portumna" },
  { label: "Castlegar", token: "Castlegar" },
];

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf";

function isAllowedFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  if (file.type === "application/pdf") return true;
  if (file.name.toLowerCase().endsWith(".pdf")) return true;
  return false;
}

export function ArticleUploadForm({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [caption, setCaption] = useState("");
  const [year, setYear] = useState("");
  const [tags, setTags] = useState("");
  const [clubTags, setClubTags] = useState("");
  const [playerTags, setPlayerTags] = useState("");
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">(
    "idle"
  );
  const [message, setMessage] = useState("");
  const [viewHref, setViewHref] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function onFileChange(file: File | null) {
    if (!file) {
      setFileName("");
      setPreview(null);
      setIsPdf(false);
      return;
    }
    if (!isAllowedFile(file)) {
      setStatus("err");
      setMessage("Please pick an image (JPG/PNG/WebP/GIF) or a PDF.");
      return;
    }
    const pdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    setIsPdf(pdf);
    setFileName(file.name);
    if (pdf) {
      setPreview(null);
    } else {
      setPreview(URL.createObjectURL(file));
    }
    setStatus("idle");
    setMessage("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    const hasFile = Boolean(file && file.size > 0);
    const hasUrl = Boolean(url.trim());
    if (!hasFile && !hasUrl) {
      setStatus("err");
      setMessage(
        "Add a cutting first — drop an image/PDF, or paste a newspaper URL."
      );
      return;
    }
    setStatus("saving");
    setMessage("");
    setViewHref("");
    try {
      const body = new FormData();
      if (hasFile && file) body.append("file", file);
      if (hasUrl) body.append("url", url.trim());
      body.append("caption", caption);
      body.append("year", year);
      body.append("tags", tags);
      body.append("clubTags", clubTags);
      body.append("playerTags", playerTags);
      const res = await fetch("/api/articles", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not upload");
      setStatus("ok");
      const kind = data.article?.kind as string | undefined;
      setMessage(
        kind === "url"
          ? "Saved. An editor will read this link before it is published."
          : "Saved. An editor will read this cutting before it is published."
      );
      setViewHref(`/article/${data.article.id}`);
      setCaption("");
      setYear("");
      setTags("");
      setClubTags("");
      setPlayerTags("");
      setUrl("");
      setFileName("");
      setPreview(null);
      setIsPdf(false);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setStatus("err");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !fileRef.current) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    fileRef.current.files = dt.files;
    onFileChange(file);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border-2 border-galway-maroon/20 bg-white p-5 shadow-sm"
    >
      <h2 className="text-2xl font-bold text-galway-maroon">
        {compact ? "Upload a cutting" : "Upload image, PDF, or URL"}
      </h2>
      <p className="text-base text-galway-ink/70">
        Drop a newspaper scan, attach a PDF, or paste a link to the paper. An
        editor reads it before anything is published.
      </p>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-galway-maroon/40 bg-galway-cream/60 px-4 py-8 text-center transition hover:border-galway-maroon hover:bg-galway-cream"
        onClick={() => fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
        }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Preview of article to upload"
            className="max-h-56 rounded-xl object-contain shadow"
          />
        ) : isPdf && fileName ? (
          <>
            <span className="text-4xl" aria-hidden>
              📄
            </span>
            <p className="text-lg font-bold text-galway-maroon">PDF ready</p>
          </>
        ) : (
          <>
            <span className="text-4xl" aria-hidden>
              📷
            </span>
            <p className="text-lg font-bold text-galway-maroon">
              Drop image or PDF here
            </p>
            <p className="text-sm text-galway-ink/60">
              JPG / PNG / WebP / GIF / PDF — or tap to choose
            </p>
          </>
        )}
        {fileName && (
          <p className="text-sm font-semibold text-galway-ink/70">{fileName}</p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
      </div>

      <div>
        <label className="mb-1 block font-semibold" htmlFor="art-url">
          Or paste a URL
        </label>
        <input
          id="art-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://… newspaper or archive page"
          className="w-full rounded-xl border-2 border-galway-maroon/20 px-3 py-2 text-lg"
        />
        <p className="mt-1 text-sm text-galway-ink/55">
          We fetch title/excerpt when possible and store the URL as the source —
          we never invent scores from the page.
        </p>
      </div>

      <div>
        <label className="mb-1 block font-semibold" htmlFor="art-caption">
          Caption (optional)
        </label>
        <input
          id="art-caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="e.g. Fohenagh win Galway SHC 1960"
          className="w-full rounded-xl border-2 border-galway-maroon/20 px-3 py-2 text-lg"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-semibold" htmlFor="art-year">
            Year (optional)
          </label>
          <input
            id="art-year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="1960"
            inputMode="numeric"
            maxLength={4}
            className="w-full rounded-xl border-2 border-galway-maroon/20 px-3 py-2 text-lg"
          />
        </div>
        <div>
          <label className="mb-1 block font-semibold" htmlFor="art-tags">
            Tags (optional)
          </label>
          <input
            id="art-tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="final, SHC, newspaper"
            className="w-full rounded-xl border-2 border-galway-maroon/20 px-3 py-2 text-lg"
          />
        </div>
      </div>

      <div>
          <label className="mb-1 block font-semibold" htmlFor="art-clubs">
          Clubs (optional)
        </label>
        <input
          id="art-clubs"
          value={clubTags}
          onChange={(e) => setClubTags(e.target.value)}
          placeholder="Fohenagh, Castlegar"
          className="w-full rounded-xl border-2 border-galway-maroon/20 px-3 py-2 text-lg"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="self-center text-sm text-galway-ink/60">
            Quick club:
          </span>
          {CLUB_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() =>
                setClubTags((prev) =>
                  prev.toLowerCase().includes(chip.token.toLowerCase())
                    ? prev
                    : prev
                      ? `${prev}, ${chip.token}`
                      : chip.token
                )
              }
              className="rounded-full border-2 border-galway-maroon/30 bg-galway-cream/50 px-3 py-1 text-sm font-semibold text-galway-maroon hover:border-galway-maroon"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div>
          <label className="mb-1 block font-semibold" htmlFor="art-players">
          Players (optional)
        </label>
        <input
          id="art-players"
          value={playerTags}
          onChange={(e) => setPlayerTags(e.target.value)}
          placeholder="Tim Sweeney, Jimmy Moclair"
          className="w-full rounded-xl border-2 border-galway-maroon/20 px-3 py-2 text-lg"
        />
        <p className="mt-1 text-sm text-galway-ink/55">
          Type the names as they appear in the paper.
        </p>
      </div>

      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded-2xl bg-galway-maroon px-5 py-3 text-lg font-bold text-white hover:bg-galway-maroon-dark disabled:opacity-60"
      >
        {status === "saving" ? "Sending…" : "Send the cutting"}
      </button>

      {message && (
        <p
          className={`text-base font-semibold ${
            status === "ok" ? "text-green-800" : "text-red-700"
          }`}
          role="status"
        >
          {message}{" "}
          {viewHref && (
            <a href={viewHref} className="underline">
              View cutting
            </a>
          )}
        </p>
      )}
    </form>
  );
}
