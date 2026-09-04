import { NextResponse } from "next/server";
import {
  readArticleUploads,
  saveArticleUpload,
  saveUrlUpload,
  toPublicArticle,
} from "@/lib/articles";
import { invalidateAssocCache } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const articles = await readArticleUploads();
  return NextResponse.json({
    articles: articles.map(toPublicArticle),
  });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const caption = String(form.get("caption") ?? "").trim();
    const year = String(form.get("year") ?? "").trim();
    const tagsRaw = String(form.get("tags") ?? "").trim();
    const clubTagsRaw = String(form.get("clubTags") ?? "").trim();
    const urlRaw = String(form.get("url") ?? "").trim();

    const tags = tagsRaw
      ? tagsRaw.split(/[,#]+/).map((t) => t.trim()).filter(Boolean)
      : [];
    const clubTags = clubTagsRaw
      ? clubTagsRaw.split(/[,]+/).map((t) => t.trim()).filter(Boolean)
      : [];

    const file =
      form.get("file") instanceof File
        ? (form.get("file") as File)
        : form.get("image") instanceof File
          ? (form.get("image") as File)
          : null;

    let article;
    if (urlRaw && (!file || file.size === 0)) {
      article = await saveUrlUpload({
        url: urlRaw,
        caption: caption || undefined,
        year: year || undefined,
        tags,
        clubTags,
      });
    } else if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      article = await saveArticleUpload({
        buffer,
        mimeType: file.type || "application/octet-stream",
        originalName: file.name || "article.bin",
        caption: caption || undefined,
        year: year || undefined,
        tags,
        clubTags,
      });
    } else {
      return NextResponse.json(
        {
          error:
            "Add an image, PDF, or paste a URL — drop a cutting or link a paper page.",
        },
        { status: 400 }
      );
    }

    invalidateAssocCache();

    return NextResponse.json({
      ok: true,
      article: toPublicArticle(article),
    });
  } catch (err) {
    let message =
      err instanceof Error ? err.message : "Could not save article upload.";
    const lower = message.toLowerCase();
    if (
      lower.includes("erofs") ||
      lower.includes("read-only file system") ||
      (process.env.VERCEL &&
        !process.env.BLOB_READ_WRITE_TOKEN &&
        !process.env.BLOB_STORE_ID)
    ) {
      message =
        "Uploads need Vercel Blob — connect Blob store to this project.";
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
