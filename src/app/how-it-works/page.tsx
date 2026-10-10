import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why might something be wrong?",
};

function CrossedHurls() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6.2 3.4 14.2 16.2c.7 1.3-.1 2.5-1.5 3" />
      <path d="M17.8 3.4 9.8 16.2c-.7 1.3.1 2.5 1.5 3" />
      <circle cx="16.6" cy="7.2" r="2.15" />
    </svg>
  );
}

export default function HowItWorksPage() {
  return (
    <article className="mx-auto max-w-2xl">
      <div className="rounded-[28px] border border-[#e4d3b5] bg-[#fffaf2] px-6 py-8 shadow-sm sm:px-10 sm:py-10">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2348b8]/10 text-[#2348b8]">
            <CrossedHurls />
          </span>
          <h1 className="hw-serif text-3xl leading-tight text-galway-ink sm:text-4xl">
            Why might something be wrong?
          </h1>
        </div>
        <div className="mt-6 space-y-4 text-lg leading-relaxed text-galway-ink/90">
          <p>
            This site is built with the help of AI. It searches old newspaper archives for reports of Fohenagh games, picks out the names of the players mentioned, and pieces together a profile for each one.
          </p>
          <p>
            To connect it all up, it uses D4M, a data model from MIT. Think of it a bit like a Rubik&apos;s cube: one fact sits in one corner, another in a different corner, and D4M lines them up. That&apos;s how it can tell that &apos;J. Devine&apos; in 1959 and &apos;John Devine&apos; in 1961 might be the same man, even when the papers spelled names differently.
          </p>
          <p>
            The catch is that older papers often said very little. A star like Tim Sweeney made the headlines, but plenty of brilliant players, who lined out in county finals year after year, only ever appear as a name on a team list. When there&apos;s little in print, a profile will be short. That says nothing about how good the player was.
          </p>
          <p>
            The AI is asked to write like a sports journalist and to stick to what&apos;s in the papers. Like any AI, it can sometimes get things wrong or fill a gap it shouldn&apos;t. Every correction teaches it, and it gets better.
          </p>
          <p>
            Spotted a mistake, or have a story, photo or clipping? Please tell us using &apos;Suggest a correction&apos;. We&apos;ll check it and update the page. Apologies for any mistakes, and thank you for helping keep Fohenagh&apos;s history right.
          </p>
        </div>
      </div>
    </article>
  );
}
