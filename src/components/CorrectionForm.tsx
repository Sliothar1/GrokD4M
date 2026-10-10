"use client";

import { FormEvent, useEffect, useState } from "react";

const field = "w-full rounded-xl border-2 border-galway-maroon/20 px-3 py-2 text-base";

const REQUEST_OPTIONS = [
  { value: "fix-detail", label: "Fix a detail" },
  { value: "remove-line", label: "Remove a line" },
  { value: "take-down-photo", label: "Take down a photo" },
  { value: "other", label: "Other" },
] as const;

export function CorrectionForm({ page, pageLabel }: { page: string; pageLabel: string }) {
  const [startedAt, setStartedAt] = useState(0);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => setStartedAt(Date.now()), []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      page,
      requestKind: fd.get("requestKind"),
      whatsWrong: fd.get("whatsWrong"),
      sourceUrl: fd.get("sourceUrl"),
      name: fd.get("name"),
      email: fd.get("email"),
      website: fd.get("website"),
      startedAt,
    };
    setStatus("saving");
    setMessage("");
    try {
      const res = await fetch("/api/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setStatus("ok");
        setMessage("Thank you — we've received it. Nothing you sent will be shown on the site.");
      } else {
        setStatus("err");
        setMessage(data.error || "Something went wrong. Please try again later.");
      }
    } catch {
      setStatus("err");
      setMessage("Could not send — please check your connection and try again.");
    }
  }

  if (status === "ok") {
    return (
      <p role="status" className="rounded-2xl border-2 border-green-700/30 bg-green-50 p-5 text-lg font-semibold text-green-900">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="relative space-y-5 rounded-2xl border-2 border-galway-maroon/20 bg-white p-5 shadow-sm" noValidate>
      <div>
        <span className="mb-1 block font-semibold">Page</span>
        <p className="rounded-xl bg-galway-cream/60 px-3 py-2 text-base">
          {pageLabel} <span className="text-galway-ink/60">({page})</span>
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 font-semibold">
          What should we do? <span className="text-galway-maroon">*</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {REQUEST_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 rounded-xl border border-galway-maroon/15 px-3 py-2 text-base"
            >
              <input
                type="radio"
                name="requestKind"
                value={option.value}
                required
                className="h-4 w-4 shrink-0"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="cf-what" className="mb-1 block font-semibold">
          Details <span className="text-galway-maroon">*</span>
        </label>
        <textarea id="cf-what" name="whatsWrong" required minLength={10} maxLength={4000} rows={5} className={field} />
      </div>

      <div>
        <label htmlFor="cf-src" className="mb-1 block font-semibold">
          Source link <span className="font-normal text-galway-ink/60">(optional)</span>
        </label>
        <input id="cf-src" name="sourceUrl" type="url" inputMode="url" maxLength={500} placeholder="https://" className={field} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className="mb-1 block font-semibold">
            Your name <span className="font-normal text-galway-ink/60">(optional — you can leave this blank)</span>
          </label>
          <input id="cf-name" name="name" autoComplete="name" maxLength={100} className={field} />
        </div>
        <div>
          <label htmlFor="cf-email" className="mb-1 block font-semibold">
            Email <span className="font-normal text-galway-ink/60">(optional, only if you want a reply)</span>
          </label>
          <input id="cf-email" name="email" type="email" autoComplete="email" maxLength={200} className={field} />
        </div>
      </div>

      {/* Honeypot: hidden from people and screen readers; bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="cf-website">Website</label>
        <input id="cf-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <p className="text-sm text-galway-ink/70">
        <strong>Privacy:</strong> we keep only what you type here (your name and email only if you give them) so we
        can check and act on your request. It is stored privately, never shown on the site, and only the site&apos;s
        editors can see it. We delete it once your request is resolved.
      </p>

      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded-2xl bg-galway-maroon px-5 py-3 text-lg font-bold text-white hover:bg-galway-maroon-dark disabled:opacity-60"
      >
        {status === "saving" ? "Sending…" : "Send"}
      </button>

      {status === "err" && (
        <p role="alert" className="text-base font-semibold text-red-800">
          {message}
        </p>
      )}
    </form>
  );
}
