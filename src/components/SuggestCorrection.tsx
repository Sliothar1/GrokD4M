"use client";

import { FormEvent, useId, useState } from "react";
import { WhyWrongLink } from "@/components/WhyWrongLink";

const field = "w-full rounded-xl border border-galway-maroon/20 px-3 py-2 text-base";

/**
 * Suggestion for an editor. Nothing sent here is published on its own.
 * `clipping` is the game-page upload. `correction` is the quiet page-end link.
 */
export function SuggestCorrection({
  page,
  pageLabel,
  variant = "correction",
  prompt: promptOverride,
  placement = "end",
}: {
  page: string;
  pageLabel: string;
  variant?: "correction" | "clipping";
  /** Replaces the default link sentence. */
  prompt?: string;
  /** `corner` sits at the top of a profile, without the end-of-page rule. */
  placement?: "end" | "corner";
}) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");
  const clipping = variant === "clipping";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = new FormData(form);
    body.set("page", page);
    body.set("intent", variant);
    setStatus("saving");
    setMessage("");
    try {
      const res = await fetch("/api/suggestions", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setStatus("ok");
        setMessage("Thank you. An editor will read this. Nothing is published until then.");
        form.reset();
      } else {
        setStatus("err");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("err");
      setMessage("Could not send. Please try again.");
    }
  }

  if (status === "ok") {
    return (
      <p role="status" className="text-sm font-semibold text-green-900">
        {message}
      </p>
    );
  }

  const prompt =
    promptOverride ??
    (clipping
      ? "Add a clipping or photo for this game"
      : "Spotted a mistake or have a story? Suggest a correction");
  const corner = placement === "corner";

  return (
    <div
      className={
        clipping || corner
          ? corner && !open
            ? "flex justify-end"
            : ""
          : "mt-10 border-t border-galway-maroon/15 pt-4"
      }
    >
      {!open ? (
        <div className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 ${corner ? "justify-end" : ""}`}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-left text-sm font-semibold text-galway-maroon underline underline-offset-2 hover:text-galway-maroon-dark"
          >
            {prompt}
          </button>
          {clipping ? null : (
            <span className="text-sm text-galway-ink/70">
              Updates are reviewed and published weekly.
            </span>
          )}
          {clipping ? null : <WhyWrongLink />}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="max-w-xl space-y-3" noValidate>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-sm font-semibold text-galway-ink">{prompt}</p>
            {clipping ? null : (
              <span className="text-sm text-galway-ink/70">
                Updates are reviewed and published weekly.
              </span>
            )}
            {clipping ? null : <WhyWrongLink />}
          </div>
          <p className="text-sm text-galway-ink/60">
            About {pageLabel}. An editor reads it first.
          </p>
          <div>
            <label htmlFor={`${uid}-name`} className="mb-1 block text-sm font-semibold">
              Your name <span className="font-normal text-galway-ink/55">(optional)</span>
            </label>
            <input id={`${uid}-name`} name="name" autoComplete="name" maxLength={100} className={field} />
          </div>
          <div>
            <label htmlFor={`${uid}-message`} className="mb-1 block text-sm font-semibold">
              Message{" "}
              {clipping ? (
                <span className="font-normal text-galway-ink/55">(optional if you attach a file)</span>
              ) : (
                <span className="text-galway-maroon">*</span>
              )}
            </label>
            <textarea
              id={`${uid}-message`}
              name="message"
              required={!clipping}
              minLength={clipping ? undefined : 10}
              maxLength={4000}
              rows={4}
              className={field}
            />
          </div>
          <div>
            <label htmlFor={`${uid}-file`} className="mb-1 block text-sm font-semibold">
              Upload <span className="font-normal text-galway-ink/55">(optional)</span>
            </label>
            <input
              id={`${uid}-file`}
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf"
              className="block w-full text-sm"
            />
          </div>
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label htmlFor={`${uid}-website`}>Website</label>
            <input id={`${uid}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={status === "saving"}
              className="rounded-full bg-galway-maroon px-4 py-2 text-sm font-bold text-white hover:bg-galway-maroon-dark disabled:opacity-60"
            >
              {status === "saving" ? "Sending…" : "Send to the editor"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm font-semibold text-galway-ink/60 underline"
            >
              Close
            </button>
          </div>
          {status === "err" ? (
            <p role="alert" className="text-sm font-semibold text-red-800">
              {message}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
