export type CorrectionSubmission = {
  id: string;
  receivedAt: string; // ISO UTC
  priority: "removal" | "correction";
  page: string; // e.g. /player/jason-lohan
  whatsWrong: string;
  sourceUrl?: string;
  removalRequest: boolean;
  name?: string;
  email?: string;
  status: "open";
};
