import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { isBlobStorageEnabled, saveHeldSuggestion } from "@/lib/articles";
import { appendPendingStory } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PAGE = /^\/(player|club|match)\/[a-z0-9-]+$/;
const PRIVATE_DIR = path.join(process.cwd(), "data", "private", "suggestions");

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}

function pageEntity(page: string): string | undefined {
  const match = page.match(/^\/(player|club|match)\/([a-z0-9-]+)$/);
  if (!match) return undefined;
  return `${match[1]}:${match[2]}`;
}

/** Suggestions wait in the Stories pending queue. They are not published. */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Could not read the form." }, 400);
  }

  if (String(form.get("website") ?? "").trim()) return json({ ok: true });

  const page = String(form.get("page") ?? "").trim();
  const intent = String(form.get("intent") ?? "correction");
  const name = String(form.get("name") ?? "").trim().slice(0, 100);
  let message = String(form.get("message") ?? "").trim().slice(0, 4000);
  const file = form.get("file");
  const upload = file instanceof File && file.size > 0 ? file : null;

  if (!PAGE.test(page)) return json({ error: "Open this form from a player, club or game page." }, 400);
  if (intent === "clipping") {
    if (!message && !upload) return json({ error: "Add a note or a file." }, 400);
    if (!message) message = "Clipping or photo sent for an editor to review.";
  } else if (message.length < 10) {
    return json({ error: "Please write a little more, so an editor can see what to check." }, 400);
  }

  if (upload) {
    const mime = (upload.type || "").toLowerCase();
    const pdf = mime === "application/pdf" || upload.name.toLowerCase().endsWith(".pdf");
    const image = mime.startsWith("image/");
    if (!pdf && !image) return json({ error: "Please attach a JPG, PNG, WebP, GIF, or PDF." }, 400);
    if (upload.size > 12 * 1024 * 1024) return json({ error: "File must be under 12 MB." }, 400);
  }

  const title =
    intent === "clipping" ? `Clipping for ${page}` : `Correction for ${page}`;
  const attachmentName = upload ? upload.name.slice(0, 120) : undefined;
  const story = {
    title,
    author: name || "Anonymous",
    body: message,
    linkedEntity: pageEntity(page),
    page,
    attachmentName,
  };

  const buffer = upload ? Buffer.from(await upload.arrayBuffer()) : null;

  try {
    if (buffer && upload && !process.env.VERCEL) {
      mkdirSync(PRIVATE_DIR, { recursive: true });
      const safe = upload.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 80) || "file";
      writeFileSync(path.join(PRIVATE_DIR, `${Date.now()}-${safe}`), buffer);
    }
    appendPendingStory(story);
    return json({ ok: true });
  } catch {
    if (!isBlobStorageEnabled() && !process.env.VERCEL) {
      return json({ error: "Could not save that for the editor. Please try again." }, 500);
    }
    try {
      await saveHeldSuggestion({
        message,
        name: name || undefined,
        page,
        file:
          buffer && upload
            ? { buffer, mimeType: upload.type || "application/octet-stream", originalName: upload.name }
            : null,
      });
      return json({ ok: true });
    } catch (err) {
      const text = err instanceof Error ? err.message : "Could not save that for the editor.";
      return json({ error: text }, 500);
    }
  }
}
