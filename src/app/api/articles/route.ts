import { NextResponse } from "next/server";
import {
  readArticleUploads,
  saveArticleUpload,
} from "@/lib/articles";
import { invalidateAssocCache } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ articles: readArticleUploads() });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("image");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Please choose an article photo to upload." },
        { status: 400 }
      );
    }

    const caption = String(form.get("caption") ?? "").trim();
    const year = String(form.get("year") ?? "").trim();
    const tagsRaw = String(form.get("tags") ?? "").trim();
    const clubTagsRaw = String(form.get("clubTags") ?? "").trim();

    const tags = tagsRaw
      ? tagsRaw.split(/[,#]+/).map((t) => t.trim()).filter(Boolean)
      : [];
    const clubTags = clubTagsRaw
      ? clubTagsRaw.split(/[,]+/).map((t) => t.trim()).filter(Boolean)
      : [];

    const buffer = Buffer.from(await file.arrayBuffer());
    const article = await saveArticleUpload({
      buffer,
      mimeType: file.type || "image/jpeg",
      originalName: file.name || "article.jpg",
      caption: caption || undefined,
      year: year || undefined,
      tags,
      clubTags,
    });

    invalidateAssocCache();

    return NextResponse.json({ ok: true, article });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not save article image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
