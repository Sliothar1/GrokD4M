import type { Metadata } from "next";
import {
  approveMemoryAction,
  loginEditor,
  proposeChangeAction,
  rejectQueueAction,
} from "@/app/editor/actions";
import { listOpenQueue, StoreNotConfiguredError, type OpenQueueRow } from "@/lib/corrections/store";
import { editorPasswordConfigured, editorUnlocked } from "@/lib/editorGate";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editor",
  robots: { index: false, follow: false },
};

const NOTICES: Record<string, string> = {
  denied: "That password was not accepted.",
  approved: "Memory approved. The text is on the page. The name and email were not kept.",
  rejected: "That queue item was deleted.",
  queued: "Proposal queued. data/seed.json was not changed. Apply it in a pull request.",
  store: "The private queue is not connected, so nothing was saved.",
  failed: "That action did not complete.",
  invalid: "Choose a player, game, or clipping, and write a short note.",
};

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; denied?: string }>;
}) {
  const query = await searchParams;
  const noticeKey = query.denied === "1" ? "denied" : query.notice;
  const notice = noticeKey ? NOTICES[noticeKey] : null;

  if (!editorPasswordConfigured()) {
    return (
      <article className="mx-auto max-w-xl space-y-3">
        <h1 className="text-3xl font-black text-galway-ink">Editor</h1>
        <p className="text-lg text-galway-ink/80">This editor is locked.</p>
        <p className="text-sm text-galway-ink/60">
          Set EDITOR_PASSWORD on the server to open it. HurlingWiki is the benchmark method for
          these pages: one template, a private queue, and nothing goes live until it is approved.
        </p>
      </article>
    );
  }

  if (!(await editorUnlocked())) {
    return (
      <article className="mx-auto max-w-xl space-y-4">
        <h1 className="text-3xl font-black text-galway-ink">Editor</h1>
        {notice ? <p className="text-base text-galway-ink/80">{notice}</p> : null}
        <form action={loginEditor} className="space-y-3">
          <label className="block text-sm font-semibold" htmlFor="editor-password">
            Password
          </label>
          <input
            id="editor-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-xl border border-galway-maroon/20 px-3 py-2"
          />
          <button type="submit" className="rounded-full bg-galway-maroon px-4 py-2 text-sm font-bold text-white">
            Open
          </button>
        </form>
      </article>
    );
  }

  let queue: OpenQueueRow[] = [];
  let queueError: string | null = null;
  try {
    queue = await listOpenQueue();
  } catch (error) {
    queueError =
      error instanceof StoreNotConfiguredError
        ? NOTICES.store
        : "The queue could not be read.";
  }

  return (
    <article className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-black text-galway-ink">Editor</h1>
        <p className="text-sm text-galway-ink/65">
          HurlingWiki is the benchmark method for these pages. One tap approves a memory or
          rejects an open item. A player, game, or clipping change is queued for a pull request.
          It does not rewrite the live seed on Vercel.
        </p>
      </header>
      {notice ? <p className="text-base text-galway-ink/80">{notice}</p> : null}

      <section className="space-y-3">
        <h2 className="text-xl font-black">Queue</h2>
        {queueError ? <p className="text-sm text-galway-ink/70">{queueError}</p> : null}
        {queue.length === 0 && !queueError ? (
          <p className="text-sm text-galway-ink/70">The queue is empty.</p>
        ) : null}
        <ul className="space-y-3">
          {queue.map((item) => (
            <li key={item.id} className="rounded-2xl border border-galway-maroon/15 bg-white p-4">
              <p className="text-sm font-semibold text-galway-ink">
                {item.page} · {item.requestKind || item.priority}
              </p>
              <p className="mt-1 text-sm text-galway-ink/75">{item.excerpt}</p>
              <div className="mt-3 flex gap-2">
                {item.memory ? (
                  <form action={approveMemoryAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="rounded-full bg-galway-maroon px-3 py-1 text-xs font-bold text-white">
                      Approve
                    </button>
                  </form>
                ) : null}
                <form action={rejectQueueAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className="rounded-full border border-galway-maroon/30 px-3 py-1 text-xs font-bold text-galway-ink">
                    Reject
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black">Propose a change</h2>
        <form action={proposeChangeAction} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Record
              <select name="entity" className="mt-1 w-full rounded-xl border border-galway-maroon/20 px-3 py-2" defaultValue="player">
                <option value="player">Player</option>
                <option value="game">Game</option>
                <option value="clipping">Clipping</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Change
              <select name="action" className="mt-1 w-full rounded-xl border border-galway-maroon/20 px-3 py-2" defaultValue="update">
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
              </select>
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Id or name
            <input name="target" required minLength={2} maxLength={160} className="mt-1 w-full rounded-xl border border-galway-maroon/20 px-3 py-2" />
          </label>
          <label className="block text-sm font-semibold">
            What should change
            <textarea name="note" required minLength={10} maxLength={4000} rows={4} className="mt-1 w-full rounded-xl border border-galway-maroon/20 px-3 py-2" />
          </label>
          <button type="submit" className="rounded-full bg-galway-maroon px-4 py-2 text-sm font-bold text-white">
            Queue this change
          </button>
        </form>
      </section>
    </article>
  );
}
