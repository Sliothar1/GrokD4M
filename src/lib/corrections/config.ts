/**
 * S3 correction / removal form — runtime switches (server only).
 *
 * Go-live gate: the form and its page links are ON for local dev and Vercel
 * Preview, and OFF in Production unless CORRECTIONS_FORM_ENABLED=1 is set
 * (Garry's OK on the preview first).
 *
 * Private store: a *private* Vercel Blob store connected with the env prefix
 * CORRECTIONS (→ CORRECTIONS_READ_WRITE_TOKEN), or CORRECTIONS_BLOB_READ_WRITE_TOKEN.
 * Never the public cuttings store.
 */
export function correctionsFormEnabled(): boolean {
  if (process.env.CORRECTIONS_FORM_ENABLED === "1") return true;
  if (process.env.CORRECTIONS_FORM_ENABLED === "0") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  return true; // preview + local dev
}

export function correctionsStoreToken(): string | undefined {
  return (
    process.env.CORRECTIONS_BLOB_READ_WRITE_TOKEN ||
    process.env.CORRECTIONS_READ_WRITE_TOKEN ||
    undefined
  );
}

/**
 * Store id of the PRIVATE corrections store. Always passed explicitly: the Blob
 * SDK ignores `token` when a Vercel OIDC token plus BLOB_STORE_ID are present,
 * and BLOB_STORE_ID points at the PUBLIC cuttings store on this project.
 */
export function correctionsStoreId(): string | undefined {
  const explicit =
    process.env.CORRECTIONS_STORE_ID || process.env.CORRECTIONS_BLOB_STORE_ID;
  if (explicit) return explicit;
  const m = /^vercel_blob_rw_([A-Za-z0-9]+)_/.exec(correctionsStoreToken() || "");
  return m ? `store_${m[1]}` : undefined;
}

/** Private Blob URLs live on *.private.blob.vercel-storage.com. */
export function isPrivateBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".private.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export const CORRECTIONS_PREFIX = "corrections/open/";

/** Approved memory text only. Never holds a submitter name or email. */
export const APPROVED_PREFIX = "corrections/approved/";

/** Notification (off by default). Only "resend" is implemented. */
export function correctionsNotifyConfig():
  | { kind: "resend"; apiKey: string; from: string; to: string }
  | { kind: "none"; reason: string } {
  const kind = (process.env.CORRECTIONS_NOTIFY || "none").toLowerCase();
  if (kind !== "resend") return { kind: "none", reason: "CORRECTIONS_NOTIFY not set" };
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CORRECTIONS_NOTIFY_FROM;
  const to = process.env.CORRECTIONS_NOTIFY_TO || "garrylohan@gmail.com";
  if (!apiKey || !from) {
    return { kind: "none", reason: "RESEND_API_KEY / CORRECTIONS_NOTIFY_FROM missing" };
  }
  return { kind: "resend", apiKey, from, to };
}
