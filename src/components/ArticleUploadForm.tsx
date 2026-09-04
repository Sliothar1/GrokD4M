"use client";

import { FormEvent, DragEvent, useRef, useState } from "react";

const CLUB_CHIPS = [
  { label: "Fohenagh", id: "club:ahascragh-fohenagh" },
  { label: "Portumna", id: "club:portumna" },
  { label: "St Thomas'", id: "club:st-thomas" },
  { label: "Castlegar", id: "club:castlegar" },
];

export function ArticleUploadForm() {
  const [caption, setCaption] = useState("");
  const [year, setYear] = useState("");
  const [tags, setTags] = useState("");
  const [clubTags, setClubTags] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");
  const [viewHref, setViewHref] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function onFileChange(file: File | null) {
    if (!file) {
      setFileName("");
      setPreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setStatus("err");
      setMessage("Please pick an image file (photo of a newspaper or article).");
      return;
    }
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
    setStatus("idle");
    setMessage("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setStatus("err");
      setMessage("Add an article photo first — tap the drop zone or Choose image.");
      return;
    }
    setStatus("saving");
    setMessage("");
    setViewHref("");
    try {
      const body = new FormData();
      body.append("image", file);
      body.append("caption", caption);
      body.append("year", year);
      body.append("tags", tags);
      body.append("clubTags", clubTags);
      const res = await fetch("/api/articles", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not upload");
      setStatus("ok");
      setMessage(
        data.article?.ocrText
          ? "Saved! We read some text from the photo. Search by caption or club to find it."
          : "Saved! Photo is in the queue — add a caption so search can find it easily."
      );
      setViewHref(`/article/${data.article.id}`);
      setCaption("");
      setYear("");
      setTags("");
      setClubTags("");
      setFileName("");
      setPreview(null);
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
      <h2 className="text-2xl font-bold text-galway-maroon">Upload an article photo</h2>
      <p className="text-base text-galway-ink/70">
        Snap or scan a newspaper cutting. We store the image for trials — we never invent
        scores from blurry text.
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
        ) : (
          <>
            <span className="text-4xl" aria-hidden>
              📷
            </span>
            <p className="text-lg font-bold text-galway-maroon">
              Drop article image here
            </p>
            <p className="text-sm text-galway-ink/60">or tap to choose JPG / PNG / WebP</p>
          </>
        )}
        {fileName && (
          <p className="text-sm font-semibold text-galway-ink/70">{fileName}</p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
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
          Club tags (optional)
        </label>
        <input
          id="art-clubs"
          value={clubTags}
          onChange={(e) => setClubTags(e.target.value)}
          placeholder="club:ahascragh-fohenagh"
          className="w-full rounded-xl border-2 border-galway-maroon/20 px-3 py-2 text-lg"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="self-center text-sm text-galway-ink/60">Quick club:</span>
          {CLUB_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() =>
                setClubTags((prev) =>
                  prev.includes(chip.id)
                    ? prev
                    : prev
                      ? `${prev}, ${chip.id}`
                      : chip.id
                )
              }
              className="rounded-full border-2 border-galway-maroon/30 bg-galway-cream/50 px-3 py-1 text-sm font-semibold text-galway-maroon hover:border-galway-maroon"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded-2xl bg-galway-maroon px-5 py-3 text-lg font-bold text-white hover:bg-galway-maroon-dark disabled:opacity-60"
      >
        {status === "saving" ? "Uploading…" : "Upload article image"}
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
              View image
            </a>
          )}
        </p>
      )}
    </form>
  );
}
