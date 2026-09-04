"use client";

import { FormEvent, useState } from "react";

export function StoryForm() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [linkedEntity, setLinkedEntity] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setMessage("");
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, body, linkedEntity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setStatus("ok");
      setMessage(
        "Thanks! Your story is in the pending queue — not mixed into official stats."
      );
      setTitle("");
      setAuthor("");
      setBody("");
      setLinkedEntity("");
    } catch (err) {
      setStatus("err");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border-2 border-galway-maroon/20 bg-white p-5 shadow-sm"
    >
      <h2 className="text-2xl font-bold text-galway-maroon">Share a story</h2>
      <p className="text-base text-galway-ink/70">
        Family memories welcome. Pending stories stay separate from the official seed
        facts.
      </p>
      <div>
        <label className="mb-1 block font-semibold" htmlFor="story-title">
          Title
        </label>
        <input
          id="story-title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border-2 border-galway-maroon/20 px-3 py-2 text-lg"
        />
      </div>
      <div>
        <label className="mb-1 block font-semibold" htmlFor="story-author">
          Your name
        </label>
        <input
          id="story-author"
          required
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="w-full rounded-xl border-2 border-galway-maroon/20 px-3 py-2 text-lg"
        />
      </div>
      <div>
        <label className="mb-1 block font-semibold" htmlFor="story-body">
          Story
        </label>
        <textarea
          id="story-body"
          required
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-xl border-2 border-galway-maroon/20 px-3 py-2 text-lg"
          placeholder="What do you remember?"
        />
      </div>
      <div>
        <label className="mb-1 block font-semibold" htmlFor="story-link">
          Link to an entity (optional)
        </label>
        <input
          id="story-link"
          value={linkedEntity}
          onChange={(e) => setLinkedEntity(e.target.value)}
          placeholder="e.g. player:joe-canning or club:ahascragh-fohenagh"
          className="w-full rounded-xl border-2 border-galway-maroon/20 px-3 py-2 text-lg"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="self-center text-sm text-galway-ink/60">Quick link:</span>
          {[
            { label: "Fohenagh", id: "club:ahascragh-fohenagh" },
            { label: "Cathal Mannion", id: "player:cathal-mannion" },
            { label: "Pádraic Mannion", id: "player:padraic-mannion" },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setLinkedEntity(chip.id)}
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
        {status === "saving" ? "Saving…" : "Submit story"}
      </button>
      {message && (
        <p
          className={`text-base font-semibold ${
            status === "ok" ? "text-green-800" : "text-red-700"
          }`}
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  );
}
