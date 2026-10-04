import { correctionsNotifyConfig } from "./config";
import type { CorrectionSubmission } from "./types";

/**
 * Pluggable notification to Garry. OFF by default (CORRECTIONS_NOTIFY unset).
 * "resend": POST https://api.resend.com/emails via fetch (no extra dependency).
 * The email carries no submitter name/email — only whether contact was given.
 * Failures never block the submission (it is already in the private queue).
 */
export async function notifyNewSubmission(s: CorrectionSubmission, siteUrl: string): Promise<string> {
  const cfg = correctionsNotifyConfig();
  if (cfg.kind === "none") return `notify skipped: ${cfg.reason}`;
  const subject = `${s.priority === "removal" ? "[PRIORITY] Removal request" : "Correction"}: ${s.page}`;
  const text = [
    `New ${s.priority === "removal" ? "REMOVAL REQUEST (priority)" : "correction"} on HurlingWiki.`,
    `Page: ${siteUrl}${s.page}`,
    `Queue id: ${s.id} (received ${s.receivedAt})`,
    `What's wrong (first 300 chars): ${s.whatsWrong.slice(0, 300)}`,
    s.sourceUrl ? `Source link: ${s.sourceUrl}` : "Source link: none",
    `Contact details given: ${s.email || s.name ? "yes (see private queue)" : "no"}`,
    "",
    "Open the private queue with: node --env-file=.env.local scripts/corrections-queue.mjs list",
  ].join("\n");
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: cfg.from, to: [cfg.to], subject, text }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok ? "notified" : `notify failed: HTTP ${res.status}`;
  } catch (e) {
    return `notify failed: ${e instanceof Error ? e.message : "error"}`;
  }
}
