import { NextResponse } from "next/server";
import { appendPendingStory, readPendingStories } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ pending: readPendingStories() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const author = String(body.author ?? "").trim();
    const text = String(body.body ?? "").trim();
    const linkedEntity = String(body.linkedEntity ?? "").trim();

    if (!title || !author || !text) {
      return NextResponse.json(
        { error: "Title, name, and story are required." },
        { status: 400 }
      );
    }
    if (title.length > 200 || author.length > 120 || text.length > 5000) {
      return NextResponse.json({ error: "That looks a bit long." }, { status: 400 });
    }

    const story = appendPendingStory({
      title,
      author,
      body: text,
      linkedEntity: linkedEntity || undefined,
    });

    return NextResponse.json({ ok: true, story });
  } catch {
    return NextResponse.json({ error: "Could not save story." }, { status: 500 });
  }
}
