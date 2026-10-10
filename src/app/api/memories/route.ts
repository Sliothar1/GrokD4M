import { NextResponse } from "next/server";
import { listApprovedMemories } from "@/lib/corrections/store";
import { normalisePage } from "@/lib/corrections/validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}

/**
 * Public read of approved terrace notes only.
 * Pending queue items are not listed. Names are not in this payload.
 * Submissions are POST /api/corrections with requestKind "memory".
 */
export async function GET(req: Request) {
  const page = normalisePage(new URL(req.url).searchParams.get("page"));
  if (!page || !page.startsWith("/player/")) return json({ notes: [] });
  const notes = await listApprovedMemories(page);
  return json({ notes });
}

export async function POST() {
  return json({ error: "Method not allowed" }, 405);
}
