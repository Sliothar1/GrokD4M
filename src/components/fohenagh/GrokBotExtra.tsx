/**
 * Discreet placeholder. Nothing here takes a payment.
 */
export function GrokBotExtra({ hint = "€1 for another archive scan" }: { hint?: string }) {
  return (
    <p className="text-xs text-galway-ink/40">
      <button
        type="button"
        disabled
        className="cursor-not-allowed border-0 bg-transparent p-0 text-xs text-galway-ink/40 underline decoration-galway-ink/20 underline-offset-4"
        title="Placeholder only. No payment is taken."
      >
        Pay Grok Bot · {hint}
      </button>
    </p>
  );
}
