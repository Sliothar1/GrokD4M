import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "hw_editor";

/** True when EDITOR_PASSWORD is set. The value is never returned. */
export function editorPasswordConfigured(): boolean {
  return Boolean(process.env.EDITOR_PASSWORD);
}

function sessionToken(password: string): string {
  return createHmac("sha256", password).update("hurlingwiki-editor-v1").digest("hex");
}

function sameSecret(attempt: string, password: string): boolean {
  const left = createHmac("sha256", "hurlingwiki-editor-check").update(attempt).digest();
  const right = createHmac("sha256", "hurlingwiki-editor-check").update(password).digest();
  return timingSafeEqual(left, right);
}

export async function editorUnlocked(): Promise<boolean> {
  const password = process.env.EDITOR_PASSWORD;
  if (!password) return false;
  const got = (await cookies()).get(COOKIE)?.value ?? "";
  const expected = sessionToken(password);
  if (got.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

export async function unlockEditor(attempt: string): Promise<boolean> {
  const password = process.env.EDITOR_PASSWORD;
  if (!password || !attempt) return false;
  if (!sameSecret(attempt, password)) return false;
  (await cookies()).set(COOKIE, sessionToken(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/editor",
    maxAge: 60 * 60 * 12,
  });
  return true;
}
