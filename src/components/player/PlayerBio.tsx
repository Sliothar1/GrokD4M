export function PlayerBio({ text }: { text: string }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border-2 border-galway-gold/45 bg-gradient-to-br from-white via-galway-cream to-galway-gold/20 px-6 py-7 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-galway-maroon/70">
        Notable
      </p>
      <p className="mt-2 text-xl font-medium leading-relaxed text-galway-ink sm:text-2xl">
        {text}
      </p>
    </section>
  );
}
