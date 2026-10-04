import { NextResponse } from "next/server";
import { correctionsFormEnabled } from "@/lib/corrections/config";
import { notifyNewSubmission } from "@/lib/corrections/notify";
import { clientKey, rateLimit } from "@/lib/corrections/rateLimit";
import { newSubmission, saveSubmission, StoreNotConfiguredError } from "@/lib/corrections/store";
import { MIN_FILL_MS, validateSubmission } from "@/lib/corrections/validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex", ...headers },
  });
}

/** Submissions are write-only: there is no GET / list endpoint. */
export async function GET() {
  return json({ error: "Method not allowed" }, 405, { Allow: "POST" });
}

export async function POST(req: Request) {
  if (!correctionsFormEnabled()) return json({ error: "This form isn't open yet." }, 404);

  let input: Record<string, unknown>;
  try {
    const ct = req.headers.get("content-type") || "";
    input = ct.includes("application/json")
      ? ((await req.json()) as Record<string, unknown>)
      : Object.fromEntries((await req.formData()).entries());
  } catch {
    return json({ error: "Could not read the form." }, 400);
  }

  // Honeypot + minimum fill time: pretend success, store nothing.
  const startedAt = Number(input.startedAt || 0);
  if (String(input.website || "").trim() !== "" || !startedAt || Date.now() - startedAt < MIN_FILL_MS) {
    return json({ ok: true });
  }

  const rl = rateLimit(clientKey(req));
  if (!rl.ok) {
    return json(
      { error: "Too many submissions from here — please try again later." },
      429,
      { "Retry-After": String(rl.retryAfterS ?? 600) }
    );
  }

  const v = validateSubmission(input);
  if (!v.ok) return json({ error: v.error }, 400);

  const s = newSubmission(v.value);
  try {
    await saveSubmission(s);
  } catch (e) {
    if (e instanceof StoreNotConfiguredError) {
      return json({ error: "The private queue isn't connected yet, so nothing was saved. Please try again later." }, 503);
    }
    console.error("corrections: save failed", e instanceof Error ? e.name : "error");
    return json({ error: "Could not save your request. Please try again later." }, 500);
  }

  const note = await notifyNewSubmission(s);
  // Logs carry status only — never submitter fields (name, email, text, link).
  if (note !== "notified") console.info(`corrections: ${note}`);

  return json({ ok: true, id: s.id, priority: s.priority });
}
