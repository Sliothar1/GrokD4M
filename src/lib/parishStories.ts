/**
 * Printed parish stories. Garry's oral notes say which episodes to look up;
 * only sentences that are already in a held clipping or book page are used.
 * Nobody is named as injured, and nobody is named as the person who struck them.
 */

export type StoryRef = {
  title: string;
  href: string;
};

export type ParishStory = {
  slug: string;
  title: string;
  year: string;
  /** Game page, when this episode is a match. */
  matchHref: string | null;
  matchLabel: string | null;
  sentences: Array<{ text: string; cite: number }>;
  references: StoryRef[];
};

export const PARISH_STORIES: ParishStory[] = [
  {
    slug: "fohenagh-gurteen-1890",
    title: "Fifty minutes, no score",
    year: "1890",
    matchHref: "/match/fohenagh-gurteen-tournament-1890",
    matchLabel: "Fohenagh v Gurteen, 1890",
    sentences: [
      {
        text: "On 15 July 1890 Fohenagh, captained by Tim Glynn, played Gurteen at a Gaelic tournament in a field lent by the Cormican family.",
        cite: 1,
      },
      {
        text: "After fifty minutes of spirited stopping and blocking the teams were called off, and the score was nothing all.",
        cite: 1,
      },
    ],
    references: [
      {
        title: "A History of Fohenagh (Tony O'Gorman), chapter 17, p.139",
        href: "/article/art-book-fohenagh-story-1890-gurteen",
      },
    ],
  },
  {
    slug: "fohenagh-1907-reaffiliation",
    title: "Back in, with a note from the priest",
    year: "1907",
    matchHref: null,
    matchLabel: null,
    sentences: [
      {
        text: "In 1907 the club elected its parish priest, Fr Harney, as president, and on 21 January 1907 Fohenagh was re-affiliated to the County Board.",
        cite: 1,
      },
      {
        text: "Fr Harney wrote that the Fohenagh players were respectable men, guilty of no dishonourable conduct.",
        cite: 1,
      },
    ],
    references: [
      {
        title: "A History of Fohenagh (Tony O'Gorman), chapter 17, pp.140–141",
        href: "/article/art-book-fohenagh-story-1907-reaffiliation",
      },
    ],
  },
  {
    slug: "fohenagh-1941-county-semi",
    title: "Panzer divisions",
    year: "1942",
    matchHref: "/match/fohenagh-claregalway-1941-county-semi",
    matchLabel: "Athenry, 24 May 1942",
    sentences: [
      {
        text: "Fohenagh met Claregalway in the 1941 county junior semi-final at Athenry, played on Sunday 24 May 1942, and the game was abandoned.",
        cite: 2,
      },
      {
        text: "A History of Fohenagh dates the day 23 May.",
        cite: 1,
      },
      {
        text: "The Connacht Tribune of 23 May 1942, page 10, gives the game for that Sunday at 4.30 p.m., and says the winners would meet Eyrecourt in the final.",
        cite: 2,
      },
      {
        text: "The referee's report says the game began as hard hurling, spectators came onto the pitch, some Fohenagh players were hurt, and the match was called off.",
        cite: 3,
      },
      {
        text: "After a heated discussion of over two hours the County Board, meeting at the Royal Hotel, suspended Claregalway and Fohenagh for a year.",
        cite: 3,
      },
      {
        text: "The County Board met on Saturday 6 June 1942.",
        cite: 4,
      },
      {
        text: "The Connacht Tribune of Saturday 13 June 1942 headed its report Blackguardism at Athenry causes heat at County Board meeting.",
        cite: 3,
      },
      {
        text: "Eyrecourt, who had won the other semi-final, were declared 1941 junior champions by the chairman, Mr T. O'Connor.",
        cite: 3,
      },
      {
        text: "The chairman, Mr T. O'Connor, was of Claregalway.",
        cite: 3,
      },
      {
        text: "In a section headed Serious Charges, the chairman said Fohenagh were not playing a legal team that day.",
        cite: 3,
      },
      {
        text: "Mr M. Silver of Ardrahan spoke of powerful panzer divisions behind some teams.",
        cite: 3,
      },
    ],
    references: [
      {
        title: "A History of Fohenagh (Tony O'Gorman), chapter 17, pp.144–145",
        href: "/article/art-book-fohenagh-story-battle-of-athenry",
      },
      {
        title: "Connacht Tribune, 23 May 1942, p.10",
        href: "/article/art-ina-ctt-1942-05-23-fohenagh-v-claregalway-1941-jhc-semi-fixture",
      },
      {
        title: "Connacht Tribune, 13 June 1942, p.11",
        href: "/article/art-ina-ctt-1942-06-13-claregalway-fohenagh-suspended-1941-jhc-semi",
      },
      {
        title: "Connacht Sentinel, 9 June 1942, p.3",
        href: "/article/art-ina-csl-1942-06-09-suspension-snippet",
      },
    ],
  },
  {
    slug: "fohenagh-1942-referee",
    title: "The referee question",
    year: "1942",
    matchHref: "/match/fohenagh-claregalway-1941-county-semi",
    matchLabel: "1941 county junior semi-final",
    sentences: [
      {
        text: "Claregalway objected to the referee appointed for the county junior semi-final against Fohenagh.",
        cite: 1,
      },
      {
        text: "T. Murphy told the County Board that if another referee were appointed, Fohenagh could come along the next week and object again.",
        cite: 1,
      },
      {
        text: "P. Ruane of Claregalway said that if the referee was not changed they would give the match to Fohenagh and withdraw from the championship.",
        cite: 1,
      },
      {
        text: "The chairman ruled that the match be played the next Sunday with M. Cullen as referee.",
        cite: 1,
      },
    ],
    references: [
      {
        title: "Connacht Tribune, 16 May 1942, p.9",
        href: "/article/art-ina-ctt-1942-05-16-claregalway-fohenagh-referee-objection",
      },
    ],
  },
  {
    slug: "fohenagh-1943-north-board",
    title: "Definitely in the North Board",
    year: "1943",
    matchHref: null,
    matchLabel: null,
    sentences: [
      {
        text: "At a boundaries debate the chairman said he did not know what boundaries had been laid down, but that Fohenagh was definitely in the North Board.",
        cite: 1,
      },
    ],
    references: [
      {
        title: "Connacht Tribune, 12 June 1943, p.14",
        href: "/article/art-ina-ctt-1943-06-12-fohenagh-north-board-boundary",
      },
    ],
  },
  {
    slug: "fohenagh-1944-final-waited",
    title: "The final that waited a year",
    year: "1944",
    matchHref: "/match/fohenagh-cussane-1944-ina",
    matchLabel: "1943 North final, played 1944",
    sentences: [
      {
        text: "At Menlough, Cussane defeated Fohenagh in the 1943 final by 5-3 to 2-4.",
        cite: 1,
      },
      {
        text: "The paper named the Barretts, Naughton and Glynn as Fohenagh's best, and Mr E. Bruen presented the cup on the field.",
        cite: 1,
      },
    ],
    references: [
      {
        title: "Connacht Tribune, 3 June 1944, p.10",
        href: "/article/art-ina-ctt-1944-06-03-cussane-fohenagh-1943-final",
      },
    ],
  },
  {
    slug: "fohenagh-turf-lorry-1947",
    title: "The turf lorry and the Athenry Arch",
    year: "1947",
    matchHref: "/match/fohenagh-erins-hope-camogie-final-1947",
    matchLabel: "1947 county camogie final",
    sentences: [
      {
        text: "How do you get a camogie crowd 35 miles to Galway in 1947? In Kevin Doherty's (Woodlawn) turf lorry, suitably insulated.",
        cite: 1,
      },
      {
        text: "The trip home after the county final win is local folklore: the celebrations started early in Foster Street, the driver was in no state to drive, and John Joe Kirwan took the wheel.",
        cite: 1,
      },
      {
        text: "Then the lorry got wedged in Athenry's medieval Arch. After plenty of advice, the top tier of the creel was taken off, and the lorry and its relieved passengers got home with only one stop, in Menlough.",
        cite: 1,
      },
    ],
    references: [
      {
        title: "A History of Fohenagh (Tony O'Gorman), chapter 17, p.146",
        href: "/article/art-book-fohenagh-story-turf-lorry-1947",
      },
    ],
  },
  {
    slug: "fohenagh-1956-hospital",
    title: "Five men went to hospital",
    year: "1956",
    matchHref: "/match/fohenagh-tynagh-junior-abandoned-1956",
    matchLabel: "Fohenagh v Tynagh, 1956",
    sentences: [
      {
        text: "The Tuam Herald of 6 October 1956 headlined this game Five men went to hospital.",
        cite: 1,
      },
      {
        text: "The report says it was abandoned after about 25 minutes, with Fohenagh leading by 7 points at the stoppage.",
        cite: 1,
      },
      {
        text: "The scoreline is otherwise not fully printed.",
        cite: 1,
      },
    ],
    references: [
      {
        title: "Tuam Herald, 6 October 1956, p.5",
        href: "/article/art-ina-fohenagh-1956-10-06-tuam-herald",
      },
    ],
  },
  {
    slug: "fohenagh-1956-hurls",
    title: "The burning of the hurls",
    year: "1956",
    matchHref: "/match/fohenagh-tynagh-1956-hurls",
    matchLabel: "Fohenagh v Tynagh at Kiltormer, 1956",
    sentences: [
      {
        text: "A History of Fohenagh records a Junior A game at Kiltormer on 15 July 1956 in which Fohenagh led Tynagh by seven points to nil when the game was called off.",
        cite: 1,
      },
      {
        text: "Both teams were suspended for twelve months.",
        cite: 1,
      },
      {
        text: "The Tuam Herald of 6 October 1956, page 5, is the printed report of Fohenagh against Tynagh at Kiltormer.",
        cite: 2,
      },
    ],
    references: [
      {
        title: "A History of Fohenagh (Tony O'Gorman), chapter 17, p.148",
        href: "/article/art-book-fohenagh-story-tynagh-1956",
      },
      {
        title: "Tuam Herald, 6 October 1956, p.5",
        href: "/article/art-ina-fohenagh-1956-10-06-tuam-herald",
      },
    ],
  },
  {
    slug: "fohenagh-1959-replay",
    title: "Ten points down, then the cup",
    year: "1959",
    matchHref: "/match/fohenagh-historic-1959-galway-shc-final-replay",
    matchLabel: "1959 Galway senior final replay",
    sentences: [
      {
        text: "Fohenagh drew the 1959 county final with Castlegar.",
        cite: 1,
      },
      {
        text: "Castlegar led by ten points at half-time in the replay.",
        cite: 1,
      },
      {
        text: "Fohenagh won 3-9 to 4-5, and Marty Glynn lifted the County Senior Cup.",
        cite: 1,
      },
    ],
    references: [
      {
        title: "A History of Fohenagh (Tony O'Gorman), chapter 17, pp.149–151",
        href: "/article/art-book-fohenagh-story-1959-comeback",
      },
    ],
  },
];

const ORAL_ONLY =
  /blackcoats|fifteen yards|belt from|moustache|bonfire|burnt the hurls|gardaí came|i'm barrett/i;

export function parishStory(slug: string): ParishStory | null {
  return PARISH_STORIES.find((story) => story.slug === slug) ?? null;
}

export function storiesForMatch(matchHref: string): ParishStory[] {
  return PARISH_STORIES.filter((story) => story.matchHref === matchHref);
}

export function storyText(story: ParishStory): string {
  return story.sentences
    .map((sentence) => {
      const body = sentence.text.replace(/[.!?]$/, "");
      return `${body}[${sentence.cite}].`;
    })
    .join(" ");
}

export function assertStoriesArePrintOnly(): string | null {
  for (const story of PARISH_STORIES) {
    const blob = `${story.title}\n${story.sentences.map((sentence) => sentence.text).join(" ")}`;
    if (ORAL_ONLY.test(blob)) return story.slug;
    for (const sentence of story.sentences) {
      if (sentence.cite < 1 || sentence.cite > story.references.length) return story.slug;
    }
  }
  return null;
}
