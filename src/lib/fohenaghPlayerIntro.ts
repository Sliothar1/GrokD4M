/**
 * Warm lead for a Fohenagh player who has no seed `notable`.
 * Every sentence is taken from a match-day cutting or the player's archive note.
 * The 1999 honour feature and the 2009 golden-era article are not used as proof
 * that someone lined out in a year those pieces only look back on.
 * Alias rows are omitted: the page follows same_as to the canonical player.
 */

const MINOR_C = "Wore the Fohenagh jersey in 1996.";

const INTROS: Record<string, string> = {
  "player:frank-madden":
    "Lined out for Fohenagh in the 1959 county final replay against Castlegar, and was named in the Connacht Tribune account of the 1960 final defence. He also appears in the paper’s photographs from the 1961 and 1963 county finals.",
  "player:pj-killalea-fohenagh":
    "Named on Fohenagh’s fifteen for the 1959 county final replay against Castlegar. A different man from Tim Killalea, who scored the winning point.",
  "player:tom-moylette-fohenagh":
    "Lined out for Fohenagh in the 1959 county final replay against Castlegar, named as T. Moylett in the Connacht Tribune, and started the 1963 county final.",
  "player:martin-glynn-fohenagh":
    "Scored from a 21-yard free for Fohenagh in the 1952 intermediate county final against Skehana, earning a replay, the Tuam Herald reported. He was named on the 1959 county final replay fifteen against Castlegar.",
  "player:pj-lally-fohenagh":
    "Named for Fohenagh in the drawn 1959 county final against Castlegar — the Connacht Tribune printed Pat Joe Lally — and on the replay fifteen that won the county title.",
  "player:tony-ogorman":
    "Scored a goal for Fohenagh in the 1959 county final replay against Castlegar, the Connacht Tribune reported, and was named in the drawn-final portraits a fortnight earlier.",
  "player:liam-manning-fohenagh":
    "On the scoresheet in the drawn 1959 county final against Castlegar, with a goal noted in the report, and named on Fohenagh’s replay fifteen.",
  "player:tommy-glynn-fohenagh":
    "Lined out for Fohenagh in the 1959 county final replay against Castlegar, and started the 1963 county final.",
  "player:jim-sweeney":
    "Lined out for Fohenagh in the 1959 county final replay against Castlegar, and was a goalscorer in the 1960 county final, the Tuam Herald reported. The Connacht Tribune named him as Fohenagh’s full-forward in the 1963 final photographs, and he appears in the 1961 final pictures too.",
  "player:frank-bleahan-fohenagh":
    "Named on the Fohenagh fifteen that won the 1959 county final replay against Castlegar, the club’s first senior title.",
  "player:frank-glynn-fohenagh":
    "Named on Fohenagh’s 1959 county final replay fifteen against Castlegar, and scored a goal in the 1963 county final.",
  "player:tim-killalea":
    "Lined out for Fohenagh in the 1959 county final replay against Castlegar and scored the winning point.",
  "player:aidan-murray-fohenagh":
    "On the scoresheet for Fohenagh in the drawn 1959 county final against Castlegar, including a goal.",
  "player:albie-glynn-fohenagh":
    "Named in the Connacht Tribune photographs from the 1961 county final, and started and scored for Fohenagh in the 1963 county final.",
  "player:bobby-madden-fohenagh":
    "Named in the Connacht Tribune action photographs of the 1963 county final at Pearse Stadium.",
  "player:michael-cullinane-fohenagh":
    "Named in the Connacht Tribune photographs from the 1961 county final week.",
  "player:john-sweeney-fohenagh":
    "Named in the Connacht Tribune photographs from the 1961 county final week.",
  "player:tom-killilea-fohenagh":
    "Named in the Connacht Tribune photographs from the 1961 county final week.",
  "player:paddy-egan-fohenagh":
    "Named in the Connacht Tribune portraits of the drawn 1959 county final against Castlegar.",
  "player:paddy-fitzgerald-fohenagh":
    "Named as P. Fitzgerald on Fohenagh’s team for the 1957 championship game against Maree.",
  "player:paddy-killilea-fohenagh":
    "Started for Fohenagh in the 1963 county final.",
  "player:nicholas-murray":
    "Named at midfield for Fohenagh in the 1960 county final.",
  "player:n-farragher-fohenagh":
    "Represented Fohenagh after the junior game against Tynagh at Kiltormer was abandoned, the Tuam Herald reported on 6 October 1956.",
  "player:mick-moylette-fohenagh":
    "Started for Fohenagh in the 1963 county final, and was named in the Connacht Tribune action photographs that day. The 1973 championship report printed M. Moylett on the Fohenagh fifteen.",
  "player:james-murray-fohenagh":
    "Played at midfield for Fohenagh in the 1963 county final and scored a point.",
  "player:jimmy-corry-fohenagh":
    "Started for Fohenagh in the 1963 county final and was among the scorers.",
  "player:liam-murray-fohenagh":
    "Started for Fohenagh in the 1963 county final.",
  "player:sean-carrig-fohenagh":
    "Wore the Fohenagh jersey in the 1963 county final.",
  "player:johnny-molloy":
    "Named in the Tuam Herald report of Fohenagh’s 1959 county final replay.",
  "player:padraic-nolan":
    "Named in the Connacht Tribune report of the drawn 1959 county final.",
  "player:gerry-sweeney-fohenagh":
    "Named as Jer Sweeney in the Connacht Tribune portraits of the drawn 1959 county final. He started the 1963 county final and scored a point in the first half, and G. Sweeney is on the printed fifteen for the 1973 championship game against Tommie Larkins.",
  "player:joe-rushe-fohenagh":
    "Stood out in the backs for Fohenagh in the 1952 intermediate county final against Skehana, the Tuam Herald reported.",
  "player:marty-glynn-fohenagh":
    "Named as Marty Glynn, or M. Glynn, in the 1959 county final reports against Castlegar, and on the team list for the championship game against Maree.",
  "player:packie-burke-fohenagh":
    "Named in the Connacht Tribune photographs of the 1963 county final as Turloughmore’s full-back, covering Bobby Madden.",
  "player:mike-coen-fohenagh":
    "Lined out for Fohenagh in the 1996 county junior championship. The Connacht Tribune named Mike Coen in the win over Ahascragh on 21 June 1996, and in the back row of the side that lost the county final to Sarsfields that December.",
  "player:alan-malloy-fohenagh":
    "A Fohenagh player. No cutting that names a game is on file yet.",
  "player:jonathan-malloy-fohenagh":
    "A Fohenagh player. No cutting that names a game is on file yet.",
  "player:joe-madden-fohenagh":
    "A Fohenagh hurler. No newspaper clipping is on file yet.",
  "player:albie-deeley-fohenagh": MINOR_C,
  "player:keith-murphy-fohenagh": MINOR_C,
  "player:kieran-molloy-fohenagh": MINOR_C,
  "player:martin-curley-fohenagh": MINOR_C,
  "player:paddy-kennedy-fohenagh": MINOR_C,
  "player:paul-kelly-fohenagh": MINOR_C,
  "player:peter-lally-fohenagh": MINOR_C,
};

/**
 * Priority profiles. Plain honours, no praise words, and a real jersey line.
 * Galway call-ups stay in the first sentence when the papers record one.
 */
const POLISH: Record<string, string> = {
  "player:jason-lohan":
    "All-Ireland intermediate hurling champion with Galway, 2002. Wore the Fohenagh jersey, scored in a county under-21 quarter-final, and was called to a Galway under-14 trial in 1997.",
  "player:cathal-lohan":
    "All-Ireland under-14 hurling medallist with Galway, and an All-Ireland under-16 medallist with Galway in 1996. Wore the Fohenagh jersey in the 1996 minor C county final, and was called to Galway under-16 and minor trials.",
  "player:philip-lohan":
    "Captained Fohenagh to the 1996 Galway minor C title. Wore the Fohenagh jersey in the 1990s, and was called to a Galway minor trial.",
  "player:trevor-lohan":
    "Wore the Fohenagh jersey in 1999 and 2000, including an under-14 final and an under-15 game against Mullagh.",
  "player:padraic-leonard":
    "Connacht under-16 hurling champion with Fohenagh in 1989. Wore the Fohenagh jersey in the 1993 county junior final against Athenry.",
  "player:niall-leonard":
    "Wore the Fohenagh jersey as a minor C champion in 1990, and in the 1995 junior championship win over Ballygar.",
  "player:sean-moclair":
    "Connacht under-16 hurling champion with Fohenagh in 1989. Wore the Fohenagh jersey that afternoon at Ballyforan, and scored a point.",
  "player:seamus-moclair":
    "All-Ireland vocational schools senior hurling medallist with Galway in 1993. Wore the Fohenagh jersey in the 1990s, including the 1998 Sadie Kilcommons final.",
  "player:alan-moclair-ahascragh-fohenagh":
    "Wore the Fohenagh jersey in the 1996 minor C county final. Called to a Galway minor trial.",
  "player:tony-kirwan-fohenagh":
    "Scored 0-4 for Galway in the 1993 All-Ireland under-21 semi-final against Cork. Wore the Fohenagh jersey in the 1993 and 1996 county junior finals, and in the 1998 Sadie Kilcommons final.",
  "player:tony-kirwan":
    "Scored 0-4 for Galway in the 1993 All-Ireland under-21 semi-final against Cork. Wore the Fohenagh jersey through the 1990s.",
  "player:eric-lally-fohenagh":
    "Captained Fohenagh in the 1989 Connacht under-16 final at Ballyforan, and scored 0-5. Wore the Fohenagh jersey that day.",
};

/** Years printed on a profile’s own cuttings, appearances, and notes. */
export function citedPlayerYears(parts: Array<string | null | undefined>): number[] {
  const years = new Set<number>();
  for (const part of parts) {
    if (!part) continue;
    for (const match of part.matchAll(/\b((?:19|20)\d{2})\b/g)) {
      const year = Number(match[1]);
      if (year >= 1930 && year <= 2005) years.add(year);
    }
  }
  return [...years].sort((a, b) => a - b);
}

/** One true line. A single year stays a year. A spread becomes a decade. */
export function woreTheJersey(years: number[]): string {
  if (years.length === 0) return "Wore the Fohenagh jersey.";
  if (years.length === 1) return `Wore the Fohenagh jersey in ${years[0]}.`;
  const decades = [...new Set(years.map((year) => Math.floor(year / 10) * 10))];
  if (decades.length === 1) return `Wore the Fohenagh jersey in the ${decades[0]}s.`;
  const first = years[0];
  const last = years[years.length - 1];
  if (last - first <= 15) return `Wore the Fohenagh jersey from ${first} to ${last}.`;
  return `Wore the Fohenagh jersey in the ${decades[0]}s and the ${decades[decades.length - 1]}s.`;
}

/** Editorial sentences for this player, used when a cutting does not print a year. */
export function editorialPlayerText(playerId: string): string | null {
  return POLISH[playerId] ?? INTROS[playerId] ?? null;
}

/** Cited paragraph for a thin profile. Null when the seed already has a notable. */
export function fohenaghCitedIntro(
  playerId: string,
  notable: string | null
): string | null {
  if (POLISH[playerId]) return null;
  if (notable?.trim()) return null;
  return INTROS[playerId] ?? null;
}

/** Polished lead, else the seed notable, else the thin intro, else the jersey line. */
export function fohenaghAbout(
  playerId: string,
  notable: string | null,
  wore: string | null
): string | null {
  if (POLISH[playerId]) return POLISH[playerId];
  if (notable?.trim()) return notable.trim();
  const intro = INTROS[playerId];
  if (intro) return intro;
  return wore;
}
