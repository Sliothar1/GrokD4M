/**
 * Warm lead for a Fohenagh player who has no seed `notable`.
 * Every sentence is taken from a match-day cutting or the player's archive note.
 * The 1999 honour feature and the 2009 golden-era article are not used as proof
 * that someone lined out in a year those pieces only look back on.
 * Alias rows are omitted: the page follows same_as to the canonical player.
 */

const MINOR_C =
  "Named on Fohenagh’s minor C hurling champions panel in 1996, in the Galway GAA roll of honour.";

const INTROS: Record<string, string> = {
  "player:frank-madden":
    "Lined out for Fohenagh in the 1959 county final replay against Castlegar, and was named in the Connacht Tribune account of the 1960 final defence. He also appears in the paper’s photographs from the 1961 and 1963 county finals.",
  "player:pj-killalea-fohenagh":
    "Named on Fohenagh’s fifteen for the 1959 county final replay against Castlegar, in the Connacht Tribune team panel. A different man from Tim Killalea, who scored the winning point.",
  "player:tom-moylette-fohenagh":
    "Lined out for Fohenagh in the 1959 county final replay against Castlegar, named as T. Moylett on the Connacht Tribune team panel, and started the 1963 county final.",
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
    "Named as a Fohenagh substitute in the 1963 county final.",
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

/** Cited paragraph for a thin profile. Null when the seed already has a notable. */
export function fohenaghCitedIntro(
  playerId: string,
  notable: string | null
): string | null {
  if (notable?.trim()) return null;
  return INTROS[playerId] ?? null;
}
