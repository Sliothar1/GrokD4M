import { correctionsNotifyConfig } from "./config";
import type { CorrectionSubmission } from "./types";

/** The ONLY text a notification may carry: request type, page path and queue id. */
export function notificationLine(s: Pick<CorrectionSubmission, "priority" | "page" | "id">): string {
  const type = s.priority === "removal" ? "removal" : "correction";
  return `New ${type} request: ${s.page}, id ${s.id}`;
}

/**
 * Pluggable notification to Garry. OFF by default (CORRECTIONS_NOTIFY unset).
 * "resend": POST https://api.resend.com/emails via fetch (no extra dependency).
 * Subject and body are both notificationLine() — no submitter name, email,
 * message text or source link. Everything else is read from the private queue.
 * Failures never block the submission (it is already in the private queue).
 */
export async function notifyNewSubmission(s: CorrectionSubmission): Promise<string> {
  const cfg = correctionsNotifyConfig();
  if (cfg.kind === "none") return `notify skipped: ${cfg.reason}`;
  const line = notificationLine(s);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: cfg.from, to: [cfg.to], subject: line, text: line }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok ? "notified" : `notify failed: HTTP ${res.status}`;
  } catch (e) {
    // Error name only (e.g. TimeoutError) — never messages that could echo request data.
    return `notify failed: ${e instanceof Error ? e.name : "error"}`;
  }
}
