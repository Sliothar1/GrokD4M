"use client";

import { useEffect, useState } from "react";

type Note = { id: string; text: string };

/**
 * Approved memories only. Renders nothing until an editor has approved one.
 * The payload is id + text; submitter names are not requested and not shown.
 */
export function TerraceNotes({ page }: { page: string }) {
  const [notes, setNotes] = useState<Note[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/memories?page=${encodeURIComponent(page)}`)
      .then((res) => (res.ok ? res.json() : { notes: [] }))
      .then((data: { notes?: Note[] }) => {
        if (cancelled) return;
        const list = Array.isArray(data.notes) ? data.notes : [];
        setNotes(
          list
            .filter((n) => n && typeof n.id === "string" && typeof n.text === "string")
            .map((n) => ({ id: n.id, text: n.text }))
        );
      })
      .catch(() => {
        if (!cancelled) setNotes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  if (!notes || notes.length === 0) return null;

  return (
    <details className="max-w-xl text-sm text-galway-ink/70">
      <summary className="cursor-pointer font-semibold text-galway-ink/55 underline decoration-galway-ink/20 underline-offset-4">
        From the terraces
      </summary>
      <div className="mt-3 space-y-3 border-l border-galway-ink/15 pl-3">
        {notes.map((note) => (
          <p key={note.id} className="leading-relaxed">
            {note.text}
          </p>
        ))}
      </div>
    </details>
  );
}
