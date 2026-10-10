"use client";

import { FormEvent, useEffect, useState } from "react";

const field = "w-full rounded-xl border border-galway-ink/15 px-3 py-2 text-base";

export function MemoryForm({ page, pageLabel }: { page: string; pageLabel: string }) {
  const [startedAt, setStartedAt] = useState(0);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => setStartedAt(Date.now()), []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      page,
      requestKind: "memory",
      whatsWrong: fd.get("whatsWrong"),
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
        setMessage("Thank you. An editor will read it. If it is kept, only the memory is shown.");
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
      <p role="status" className="rounded-xl border border-green-700/30 bg-green-50 p-5 text-base font-semibold text-green-900">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="relative space-y-5" noValidate>
      <div>
        <span className="mb-1 block text-sm font-semibold">Page</span>
        <p className="rounded-xl bg-galway-cream/60 px-3 py-2 text-base">
          {pageLabel} <span className="text-galway-ink/60">({page})</span>
        </p>
      </div>

      <div>
        <label htmlFor="mem-what" className="mb-1 block text-sm font-semibold">
          Your memory <span className="text-galway-maroon">*</span>
        </label>
        <textarea
          id="mem-what"
          name="whatsWrong"
          required
          minLength={10}
          maxLength={4000}
          rows={5}
          className={field}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="mem-name" className="mb-1 block text-sm font-semibold">
            Your name <span className="font-normal text-galway-ink/60">(optional)</span>
          </label>
          <input id="mem-name" name="name" autoComplete="name" maxLength={100} className={field} />
        </div>
        <div>
          <label htmlFor="mem-email" className="mb-1 block text-sm font-semibold">
            Email <span className="font-normal text-galway-ink/60">(optional)</span>
          </label>
          <input id="mem-email" name="email" type="email" autoComplete="email" maxLength={200} className={field} />
        </div>
      </div>

      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="mem-website">Website</label>
        <input id="mem-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <p className="text-sm text-galway-ink/70">
        <strong>Privacy:</strong> your name and email, if you leave them, stay in the private queue for the editor.
        They are never shown on the site. If the memory is approved, only the words you wrote can appear.
      </p>

      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded-full border border-galway-ink/20 px-4 py-2 text-sm font-semibold text-galway-ink hover:border-galway-ink disabled:opacity-60"
      >
        {status === "saving" ? "Sending…" : "Send"}
      </button>

      {status === "err" && (
        <p role="alert" className="text-sm font-semibold text-red-800">
          {message}
        </p>
      )}
    </form>
  );
}
