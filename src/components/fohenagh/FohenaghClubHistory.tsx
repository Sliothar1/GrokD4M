import Link from "next/link";
import { STORY_HREF } from "@/components/fohenagh/Fohenagh1942Story";

type Line = {
  when: string;
  text: string;
  links?: { href: string; label: string }[];
};

const TIMELINE: Line[] = [
  {
    when: "22 Jul 1888",
    text: "Lowville tournament, up to 3,000 people in the rain. From A History of Fohenagh.",
  },
  {
    when: "8 Sep 1888",
    text: "The first GAA social at Kilconnell. From A History of Fohenagh.",
  },
  {
    when: "15 Jul 1890",
    text: "Fohenagh v Gurteen. Fifty minutes, no score. Tim Glynn was captain.",
    links: [
      { href: "/match/fohenagh-gurteen-tournament-1890", label: "The game" },
      { href: "/article/art-book-fohenagh-story-1890-gurteen", label: "The account" },
    ],
  },
  {
    when: "21 Jan 1907",
    text: "Fohenagh re-affiliated. Fr Harney, the parish priest, wrote that the players were respectable men.",
    links: [{ href: "/article/art-book-fohenagh-story-1907-reaffiliation", label: "The account" }],
  },
  {
    when: "16 Sep 1933",
    text: "Connacht Tribune: the North Galway District Board fixture list. Kiltulla v Fohenagh, junior hurling, at Fohenagh, 1 October, referee G. Tyrrell. Fohenagh v Gurteen at Kiltulla on 8 October. Gurteen v Fohenagh at Caltra on 22 October. The same list fixed Woodlawn at Cappataggle on 29 October.",
  },
  {
    when: "7 Mar 1942",
    text: "Connacht Tribune: Cussane v Fohenagh, North Board junior final, fixed for Menlough on 29 March at 4 p.m. The Tribune of 7 March prints “Cussaune”.",
    links: [
      {
        href: "/article/art-ina-ctt-1942-03-07-cussaun-v-fohenagh-north-board-jhc-final-fixture",
        label: "The fixture",
      },
    ],
  },
  {
    when: "29 Mar 1942",
    text: "Played: North Board junior final, Fohenagh beat Cussane at Menlough. Reported on 4 April. A club member’s clipping collection, with the Irish Newspaper Archives copies. The Tuam Herald, 4 April 1942, page 2, prints “Cussaun” and says Fohenagh were “superior most of the hour”. The Connacht Tribune, 4 April 1942, page 9, prints “Cussane”.",
    links: [
      { href: "/match/fohenagh-cussane-north-board-junior-final-1942", label: "The final" },
      { href: STORY_HREF, label: "The 1942 story" },
    ],
  },
  {
    when: "12 May 1942",
    text: "Connacht Sentinel: Claregalway object to the referee for the semi-final against Fohenagh.",
    links: [
      {
        href: "/article/art-ina-csl-1942-05-12-claregalway-objection-referee-snippet",
        label: "The Sentinel",
      },
    ],
  },
  {
    when: "16 May 1942",
    text: "Connacht Tribune: the County Board spends the evening on the referee question. W. Corbett is appointed.",
    links: [
      {
        href: "/article/art-ina-ctt-1942-05-16-claregalway-fohenagh-referee-objection",
        label: "The report",
      },
    ],
  },
  {
    when: "23 May 1942",
    text: "Connacht Tribune, page 10: Fohenagh v Claregalway, the 1941 junior semi-final, Athenry, Sunday 24 May, 4.30 p.m. The winners were to meet Eyrecourt.",
    links: [
      {
        href: "/article/art-ina-ctt-1942-05-23-fohenagh-v-claregalway-1941-jhc-semi-fixture",
        label: "The fixture",
      },
    ],
  },
  {
    when: "24 May 1942",
    text: "Athenry. The 1941 junior semi-final against Claregalway is abandoned. A History of Fohenagh dates it 23 May. The fixture gives the Sunday.",
    links: [
      { href: "/match/fohenagh-claregalway-1941-county-semi", label: "The game" },
      { href: STORY_HREF, label: "The 1942 story" },
    ],
  },
  {
    when: "6 Jun 1942",
    text: "County Board, Royal Hotel, Galway. Both teams suspended for twelve months. Eyrecourt are declared 1941 junior champions. The Connacht Sentinel of 9 June and the Connacht Tribune of 13 June, “Blackguardism at Athenry causes heat at County Board meeting”.",
    links: [
      { href: STORY_HREF, label: "The 1942 story" },
      {
        href: "/article/art-ina-ctt-1942-06-13-claregalway-fohenagh-suspended-1941-jhc-semi",
        label: "The Tribune",
      },
      { href: "/article/art-ina-csl-1942-06-09-suspension-snippet", label: "The Sentinel" },
    ],
  },
  {
    when: "12 Jun 1943",
    text: "Aftermath. The chairman tells the County Board, “Fohenagh is definitely in the North Board.” The same paper fixes Fohenagh v Aughrim Sarsfields at Kilconnell for Sunday 13 June.",
    links: [
      {
        href: "/article/art-ina-ctt-1943-06-12-fohenagh-north-board-boundary",
        label: "The boundary",
      },
      {
        href: "/article/art-ina-ctt-1943-06-12-fohenagh-v-aughrim-north-jhc-fixture",
        label: "The fixture",
      },
    ],
  },
  {
    when: "22 Apr 1944",
    text: "Tuam Herald: Cussane qualify to meet Fohenagh in the North Board semi-final. The Herald prints “Cussaun”.",
    links: [
      { href: "/article/art-ina-tth-1944-04-22-cussaun-to-meet-fohenagh-semi", label: "The note" },
    ],
  },
  {
    when: "29 Apr 1944",
    text: "Connacht Tribune: Ballygar v Fohenagh fixed for Mountbellew.",
    links: [
      {
        href: "/article/art-ina-ctt-1944-04-29-ballygar-v-fohenagh-jhc-fixture",
        label: "The fixture",
      },
    ],
  },
  {
    when: "13 May 1944",
    text: "Ballygar are given a walk-over from Fohenagh.",
    links: [
      { href: "/match/fohenagh-ballygar-1944-ina", label: "The game" },
      {
        href: "/article/art-ina-ctt-1944-05-13-ballygar-walkover-from-fohenagh",
        label: "The report",
      },
    ],
  },
  {
    when: "28 May 1944",
    text: "The 1943 North Board junior final, played at Menlough. Cussane 5-3, Fohenagh 2-4. Reported in the Connacht Tribune, 3 June 1944.",
    links: [
      { href: "/match/fohenagh-cussane-1944-ina", label: "The final" },
      {
        href: "/article/art-ina-ctt-1944-06-03-cussane-fohenagh-1943-final",
        label: "The report",
      },
    ],
  },
  {
    when: "12 Dec 1944",
    text: "Connacht Sentinel: Claregalway had served the twelve months.",
    links: [
      {
        href: "/article/art-ina-csl-1944-12-12-claregalway-suspension-served-snippet",
        label: "The Sentinel",
      },
    ],
  },
  {
    when: "6 Jul 1946",
    text: "Connacht Tribune: Fohenagh v Ballymacward, junior hurling, fixed for Kilconnell.",
    links: [
      {
        href: "/article/art-ina-ctt-1946-07-06-fohenagh-v-ballymacward-jhc-fixture",
        label: "The fixture",
      },
    ],
  },
  {
    when: "13 Oct 1946",
    text: "Camogie. Fohenagh beat Ballinasloe at Duggan Park.",
    links: [
      { href: "/match/fohenagh-ballinasloe-1946-ina", label: "The game" },
      {
        href: "/article/art-ina-ctt-1946-10-19-fohenagh-ballinasloe-camogie",
        label: "The Tribune",
      },
    ],
  },
  {
    when: "27 Oct 1946",
    text: "Camogie semi-final at Caltra. Caltra 1-0, Fohenagh nil.",
    links: [
      { href: "/match/fohenagh-caltra-camogie-semi-final-1946", label: "The game" },
      {
        href: "/article/art-ina-ctt-1946-11-02-caltra-fohenagh-camogie-semi-final",
        label: "The Tribune",
      },
    ],
  },
  {
    when: "16 Nov 1946",
    text: "Tuam Herald: the Fohenagh camogie objection is withdrawn.",
    links: [
      {
        href: "/article/art-ina-tth-1946-11-16-fohenagh-camogie-objection-withdrawn",
        label: "The note",
      },
    ],
  },
  {
    when: "14 Dec 1946",
    text: "Tuam Herald: Fohenagh named among Galway’s best camogie teams.",
    links: [
      { href: "/article/art-ina-tth-1946-12-14-camogie-best-teams-note", label: "The note" },
    ],
  },
  {
    when: "1947",
    text: "County senior camogie. Fohenagh beat Ballymacward, Caltra and Tuam on the way.",
    links: [
      { href: "/match/fohenagh-ballymacward-camogie-1947", label: "Ballymacward" },
      { href: "/match/fohenagh-caltra-camogie-1947", label: "Caltra" },
      { href: "/match/fohenagh-tuam-camogie-1947", label: "Tuam" },
    ],
  },
  {
    when: "9 Aug 1947",
    text: "Tuam Herald: Fohenagh v Ballinasloe Mental Hospital fixed, senior camogie semi-final.",
    links: [
      {
        href: "/article/art-ina-tth-1947-08-09-fohenagh-v-ballinasloe-mh-camogie-fixture",
        label: "The fixture",
      },
    ],
  },
  {
    when: "24 Aug 1947",
    text: "Camogie semi-final at Ballinasloe. Fohenagh 2-3, Ballinasloe Mental Hospital 2-2.",
    links: [
      { href: "/match/fohenagh-ballinasloe-mh-camogie-semi-final-1947", label: "The game" },
      {
        href: "/article/art-ina-ctt-1947-08-30-fohenagh-ballinasloe-camogie-semi-final",
        label: "The Tribune",
      },
    ],
  },
  {
    when: "26 Aug 1947",
    text: "Connacht Sentinel: Fohenagh qualify for the camogie final.",
    links: [
      {
        href: "/article/art-ina-csl-1947-08-26-fohenagh-qualify-camogie-snippet",
        label: "The Sentinel",
      },
    ],
  },
  {
    when: "8 Nov 1947",
    text: "Tuam Herald: county senior camogie final fixed, Fohenagh v Erin’s Hope.",
    links: [
      {
        href: "/article/art-ina-tth-1947-11-08-fohenagh-v-erins-hope-camogie-final-fixture",
        label: "The fixture",
      },
    ],
  },
  {
    when: "15 Nov 1947",
    text: "Connacht Tribune: preview of Fohenagh’s first county camogie final.",
    links: [
      {
        href: "/article/art-ina-ctt-1947-11-15-erins-hope-v-fohenagh-camogie-final-preview",
        label: "The preview",
      },
    ],
  },
  {
    when: "16 Nov 1947",
    text: "County senior camogie final at Galway. Fohenagh 3-1, Erin’s Hopes 3-0. Irish Press, 17 November.",
    links: [
      { href: "/match/fohenagh-erins-hope-camogie-final-1947", label: "The final" },
      {
        href: "/article/art-ina-ipr-1947-11-17-fohenagh-win-galway-senior-camogie-title",
        label: "The Irish Press",
      },
      { href: "/article/art-book-fohenagh-story-turf-lorry-1947", label: "The turf lorry" },
    ],
  },
  {
    when: "21 Feb 1948",
    text: "Tuam Herald: Caltra v Fohenagh, schools league semi-final.",
    links: [
      {
        href: "/article/art-ina-tth-1948-02-21-caltra-v-fohenagh-school-league-fixture",
        label: "The fixture",
      },
    ],
  },
  {
    when: "28 May 1948",
    text: "A Munster Express note on the Fohenagh camogie life ban.",
    links: [
      {
        href: "/article/art-ina-mex-1948-05-28-fohenagh-camogie-life-ban-note",
        label: "The note",
      },
    ],
  },
  {
    when: "28 Aug 1948",
    text: "Tuam Herald: Fohenagh camogie reinstatement refused.",
    links: [
      {
        href: "/article/art-ina-tth-1948-08-28-fohenagh-camogie-reinstatement-refused",
        label: "The note",
      },
    ],
  },
  {
    when: "25 Sep 1949",
    text: "East Board junior hurling final, Duggan Park. Fohenagh 5-8, Lawrencetown 0-3.",
    links: [
      { href: "/match/fohenagh-lawrencetown-1949-ina", label: "The final" },
      {
        href: "/article/art-ina-ctt-1949-10-01-fohenagh-win-east-board-jh-title",
        label: "The Tribune",
      },
    ],
  },
  {
    when: "23 Jun 1951",
    text: "Connacht Tribune: St Michael’s v Fohenagh, Kilconnell tournament.",
    links: [
      {
        href: "/article/art-ina-ctt-1951-06-23-kilconnell-tournament-st-michaels-v-fohenagh",
        label: "The fixture",
      },
    ],
  },
  {
    when: "24 May 1952",
    text: "Connacht Tribune: Gort v Fohenagh fixed, intermediate championship.",
    links: [
      { href: "/article/art-ina-ctt-1952-05-24-gort-v-fohenagh-ihc-fixture", label: "The fixture" },
    ],
  },
  {
    when: "7 Jun 1952",
    text: "Connacht Tribune: Gort v Fohenagh washed out.",
    links: [{ href: "/article/art-ina-ctt-1952-06-07-gort-fohenagh-washed-out", label: "The note" }],
  },
  {
    when: "19 Jul 1952",
    text: "Intermediate championship. Fohenagh 7-5, Gort 0-3. Clare Champion.",
    links: [
      { href: "/match/fohenagh-gort-1952-ina", label: "The game" },
      { href: "/article/art-ina-cch-1952-07-19-fohenagh-gort-ihc", label: "The report" },
    ],
  },
  {
    when: "16 Aug 1952",
    text: "Tuam Herald: intermediate county final, Fohenagh 3-6, Skehana 4-3, a draw.",
    links: [{ href: "/match/fohenagh-skehana-ihc-final-1952-draw", label: "The draw" }],
  },
  {
    when: "24 Aug 1952",
    text: "Intermediate replay at Castleblakeney. Skehana 3-7, Fohenagh 2-1. Tuam Herald, 30 August.",
    links: [
      { href: "/match/fohenagh-skehana-1952-ina", label: "The replay" },
      {
        href: "/article/art-ina-tth-1952-08-30-skehana-fohenagh-ihc-replay",
        label: "The Herald",
      },
    ],
  },
  {
    when: "29 Jun 1953",
    text: "Kilconnell hurling tournament. Fohenagh win. Westmeath Independent, 4 July.",
    links: [
      { href: "/match/fohenagh-cappatagle-no-2-1953-ina", label: "The tournament" },
      {
        href: "/article/art-ina-wmi-1953-07-04-fohenagh-kilconnell-tournament",
        label: "The report",
      },
    ],
  },
  {
    when: "18 Jul 1953",
    text: "Westmeath Independent: preview of Fohenagh v Killimor, intermediate final.",
    links: [
      {
        href: "/article/art-ina-wmi-1953-07-18-fohenagh-killimor-ihc-final-preview",
        label: "The preview",
      },
    ],
  },
  {
    when: "27 Sep 1953",
    text: "Intermediate quarter-final. Fohenagh 4-7, Claregalway 4-6. Connacht Tribune, 3 October.",
    links: [
      { href: "/match/fohenagh-claregalway-1953-ina", label: "The game" },
      { href: "/article/art-ina-ctt-1953-10-03-fohenagh-claregalway-ihc", label: "The Tribune" },
    ],
  },
  {
    when: "17 Oct 1953",
    text: "Connacht Tribune: Maree v Fohenagh, intermediate semi-final preview.",
    links: [
      {
        href: "/article/art-ina-ctt-1953-10-17-maree-v-fohenagh-semi-final-preview",
        label: "The preview",
      },
    ],
  },
  {
    when: "18 Oct 1953",
    text: "Intermediate semi-final at Loughrea. Maree 4-2, Fohenagh 2-3.",
    links: [
      { href: "/match/fohenagh-maree-ihc-semi-final-1953", label: "The game" },
      {
        href: "/article/art-ina-csl-1953-10-20-maree-fohenagh-ihc-semi-final",
        label: "The Sentinel",
      },
    ],
  },
  {
    when: "28 Nov 1953",
    text: "Connacht Tribune: Fohenagh lose the appeal against the Maree result.",
    links: [
      { href: "/article/art-ina-ctt-1953-11-28-fohenagh-lose-appeal-maree", label: "The appeal" },
    ],
  },
  {
    when: "26 Jun 1954",
    text: "Connacht Tribune: Ballymacward v Fohenagh, Kilconnell tournament.",
    links: [
      {
        href: "/article/art-ina-ctt-1954-06-26-kilconnell-tournament-ballymacward-v-fohenagh",
        label: "The fixture",
      },
    ],
  },
  {
    when: "13 Aug 1955",
    text: "Connacht Tribune: Fohenagh v Kilconnell, Kilconnell tournament semi-final.",
    links: [
      {
        href: "/article/art-ina-ctt-1955-08-13-kilconnell-tournament-fohenagh-v-kilconnell",
        label: "The fixture",
      },
    ],
  },
  {
    when: "3 Sep 1955",
    text: "Tuam Herald: Tim Sweeney of Fohenagh in the Galway pen-pictures.",
    links: [
      { href: "/article/art-ina-tth-1955-09-03-tim-sweeney-galway-panel", label: "The note" },
      { href: "/player/tim-sweeney-fohenagh", label: "Tim Sweeney" },
    ],
  },
  {
    when: "8 Oct 1955",
    text: "Connacht Tribune: Fohenagh v Kiltulla, Bullaun tournament.",
    links: [
      {
        href: "/article/art-ina-ctt-1955-10-08-bullaun-tournament-fohenagh-v-kiltulla",
        label: "The fixture",
      },
    ],
  },
  {
    when: "15 Jul 1956",
    text: "A History of Fohenagh dates a Junior A game, Tynagh v Fohenagh, at Kiltormer to this day. The game was called off.",
    links: [{ href: "/match/fohenagh-tynagh-1956-hurls", label: "The game" }],
  },
  {
    when: "6 Oct 1956",
    text: "Tynagh v Fohenagh at Kiltormer. The Herald, 6 October 1956, headline only: “Five men went to hospital after hurling game.”",
    links: [{ href: "/match/fohenagh-tynagh-junior-abandoned-1956", label: "The game" }],
  },
  {
    when: "1957",
    text: "Fohenagh beat Loughrea with a late winner, and beat Maree 3-11 to 2-7.",
    links: [
      { href: "/match/fohenagh-loughrea-c1957", label: "Loughrea" },
      { href: "/match/fohenagh-maree-1957", label: "Maree" },
    ],
  },
  {
    when: "1958",
    text: "First county senior final. Castlegar 5-9, Fohenagh 2-4, Duggan Park.",
    links: [{ href: "/match/fohenagh-historic-1958-galway-shc-final", label: "The final" }],
  },
  {
    when: "30 Aug 1959",
    text: "County senior final, draw, Pearse Stadium. Fohenagh 2-8, Castlegar 1-11.",
    links: [{ href: "/match/fohenagh-historic-1959-galway-shc-final-draw", label: "The draw" }],
  },
  {
    when: "13 Sep 1959",
    text: "Replay at Kenny Park. Fohenagh 3-9, Castlegar 4-5. County senior champions. Another printing gives 3-9 to 2-5. Both scores stay.",
    links: [
      { href: "/match/fohenagh-historic-1959-galway-shc-final-replay", label: "The replay" },
      { href: "/article/art-book-fohenagh-story-1959-comeback", label: "The account" },
    ],
  },
  {
    when: "1959",
    text: "County junior football final. Fohenagh lose to Clonbur.",
    links: [{ href: "/match/fohenagh-clonbur-junior-football-final-1959", label: "The final" }],
  },
  {
    when: "17 Mar 1960",
    text: "Local tournament final at Fohenagh. Fohenagh 5-4, Turloughmore 5-3.",
    links: [
      {
        href: "/match/fohenagh-turloughmore-st-patricks-day-tournament-final-clip",
        label: "The final",
      },
    ],
  },
  {
    when: "1960",
    text: "Senior championship first round against Gort, drawn, then a replay which Fohenagh won.",
    links: [
      { href: "/match/fohenagh-gort-shc-r1-1960", label: "The draw" },
      { href: "/match/fohenagh-gort-shc-r1-replay-1960", label: "The replay" },
    ],
  },
  {
    when: "1960",
    text: "County senior final, Pearse Stadium. The cup retained. Fohenagh 4-9, Castlegar 2-7 in the Galway GAA table and the September papers. A 2021 look-back prints 5-13 to 2-4.",
    links: [{ href: "/match/fohenagh-historic-1960-galway-shc-final", label: "The final" }],
  },
  {
    when: "15 Oct 1960",
    text: "Six Fohenagh men picked for Galway against Tipperary on 30 October: Tony O’Gorman, P.J. Lally, Tim Sweeney, Frank Glynn and Jimmy Moclair. J. Sweeney is the sixth name. Two players fit that initial.",
    links: [
      { href: "/player/tony-ogorman", label: "Tony O’Gorman" },
      { href: "/player/pj-lally-fohenagh", label: "P.J. Lally" },
      { href: "/player/tim-sweeney-fohenagh", label: "Tim Sweeney" },
      { href: "/player/frank-glynn-fohenagh", label: "Frank Glynn" },
      { href: "/player/jim-moclair-fohenagh", label: "Jimmy Moclair" },
      { href: "/article/art-clip-glc-07-galway-team-to-meet-tipperary", label: "The team" },
    ],
  },
  {
    when: "1961",
    text: "County final. The book says the margin was one point. Galway GAA prints two points, Turloughmore 3-6, Fohenagh 3-4.",
    links: [{ href: "/match/fohenagh-historic-1961-galway-shc-final", label: "The final" }],
  },
  {
    when: "11 Mar 1962",
    text: "County senior league, third round, at Fohenagh. Fohenagh 6-7, Ballinasloe 1-3.",
    links: [{ href: "/match/fohenagh-ballinasloe-senior-league-r3-clip", label: "The game" }],
  },
  {
    when: "1963",
    text: "County final, Pearse Stadium. Turloughmore 5-13, Fohenagh 2-4. Connacht Tribune, 17 August.",
    links: [{ href: "/match/fohenagh-historic-1963-galway-shc-final", label: "The final" }],
  },
  {
    when: "1966",
    text: "Reeves Cup final. Athenry 5-2, Fohenagh 3-3.",
    links: [{ href: "/match/galway-reeves-cup-1966-final-athenry-fohenagh", label: "The final" }],
  },
  {
    when: "1967",
    text: "Reeves Cup final, Duggan Park. Athenry 5-2, Fohenagh 3-5.",
    links: [{ href: "/match/galway-reeves-cup-1967-final-athenry-fohenagh", label: "The final" }],
  },
  {
    when: "1971",
    text: "Senior championship first round at Portumna. Athenry 4-13, Fohenagh 3-3.",
    links: [{ href: "/match/galway-shc-1971-r1-athenry-fohenagh", label: "The game" }],
  },
  {
    when: "4 May 1973",
    text: "Connacht Tribune: Tommie Larkins 5-12, Fohenagh 4-4.",
    links: [{ href: "/article/art-ina-ct-1973-05-04-fohenagh-larkins", label: "The report" }],
  },
  {
    when: "26 Aug 1977",
    text: "Under-21 championship. Pearses 4-6, Fohenagh 3-5.",
    links: [{ href: "/article/art-ina-ct-1977-08-26-fohenagh-pearses-u21", label: "The report" }],
  },
  {
    when: "1 Aug 1980",
    text: "Connacht Tribune: Pearses 3-12, Fohenagh 1-8.",
    links: [{ href: "/article/art-ina-ct-1980-08-01-fohenagh-pearses-lohan", label: "The report" }],
  },
  {
    when: "20 Nov 1981",
    text: "County junior hurling final, Duggan Park. Ahascragh 3-9, Fohenagh 3-3.",
    links: [
      { href: "/match/fohenagh-ahascragh-junior-final-1981", label: "The final" },
      { href: "/article/art-ina-ct-1981-11-20-ahascragh-junior-final", label: "The Tribune" },
    ],
  },
  {
    when: "2 Nov 1984",
    text: "Under-12 C final. St Thomas’ 2-1, Fohenagh 1-1.",
    links: [
      {
        href: "/article/art-ina-ct-1984-11-02-fohenagh-u12c-final-st-thomas",
        label: "The report",
      },
    ],
  },
  {
    when: "25 Oct 1985",
    text: "County under-21 C. Ahascragh 3-4, Fohenagh 0-4. The replay of the semi-final is in the Tribune of 15 November: Ahascragh 3-4, Fohenagh 1-4.",
    links: [
      { href: "/article/art-ina-ct-1985-10-25-ahascragh-v-fohenagh-u21c", label: "25 October" },
      {
        href: "/article/art-ina-ct-1985-11-15-ahascragh-v-fohenagh-u21c-semi-replay",
        label: "15 November",
      },
    ],
  },
  {
    when: "27 Oct 1989",
    text: "Under-16 hurling title. Fohenagh 2-12, St Dominic’s 0-6.",
    links: [{ href: "/article/art-ina-ct-1989-10-27-fohenagh-u16-title", label: "The report" }],
  },
  {
    when: "7 Dec 1990",
    text: "Connacht Tribune: Fohenagh under-12 county B champions, and the Minor C champions. A History of Fohenagh has the 1990 underage team photographs.",
    links: [
      { href: "/article/art-ina-ct-1990-12-07-fohenagh-u12-team", label: "Under-12" },
      { href: "/article/art-ina-ct-1990-12-07-fohenagh-minor-c-champs", label: "Minor C" },
      { href: "/article/art-book-fohenagh-p154-1990-underage-a", label: "The book" },
    ],
  },
  {
    when: "13 Sep 1991",
    text: "County junior semi-final. Salthill 2-8, Fohenagh 1-7.",
    links: [{ href: "/article/art-ina-ct-1991-09-13-salthill-v-fohenagh-junior", label: "The report" }],
  },
  {
    when: "24 Sep 1993",
    text: "Junior championship. Fohenagh beat Salthill. Connacht Tribune.",
    links: [
      {
        href: "/article/art-ina-ct-1993-09-24-fohenagh-win-v-salthill-junior",
        label: "The report",
      },
    ],
  },
  {
    when: "29 Oct 1993",
    text: "Galway City Tribune: Fohenagh beat Castlegar by a point in the county junior semi-final at Craughwell.",
    links: [
      {
        href: "/article/art-ina-ctb-1993-10-29-fohenagh-castlegar-junior-semi",
        label: "The report",
      },
    ],
  },
  {
    when: "5 Nov 1993",
    text: "County Junior A final. Athenry 1-8, Fohenagh 0-9.",
    links: [
      {
        href: "/article/art-ina-ct-1993-11-05-athenry-v-fohenagh-junior-a-final",
        label: "The final",
      },
      { href: "/article/art-book-fohenagh-p152-1993-junior-finalists", label: "The team" },
    ],
  },
  {
    when: "1 Sep 1995",
    text: "Connacht Tribune: Fohenagh Junior A beat Ballygar 0-11 to 0-9 at Ahascragh.",
    links: [{ href: "/article/art-ina-ct-1995-09-01-fohenagh-win-ballygar", label: "The report" }],
  },
  {
    when: "21 Jun 1996",
    text: "Connacht Tribune: Fohenagh’s county Junior A win over Ahascragh, 1-9 to 1-7.",
  },
  {
    when: "13 Sep 1996",
    text: "County Minor C final, Duggan Park. Fohenagh 5-15, Cappataggle 0-6. Philip Lohan was captain.",
    links: [
      { href: "/article/art-ina-ct-1996-09-13-fohenagh-minor-c-final", label: "The final" },
      { href: "/article/art-ina-ct-1996-09-13-fohenagh-minor-c-team", label: "The team" },
    ],
  },
  {
    when: "6 Dec 1996",
    text: "County Junior A final. Sarsfields 0-12, Fohenagh 0-6.",
    links: [
      {
        href: "/article/art-ina-ct-1996-12-06-fohenagh-sarsfields-junior-a",
        label: "The final",
      },
    ],
  },
  {
    when: "1998",
    text: "Sadie Kilcommons final. Fohenagh 1-12, Ahascragh 0-9.",
    links: [
      { href: "/match/fohenagh-ahascragh-sadie-kilcommons-final", label: "The final" },
      { href: "/article/art-ct-fohenagh-ahascragh-sadie-kilcommons", label: "The cutting" },
    ],
  },
  {
    when: "1999",
    text: "Underage teams joined with Ahascragh, and won county under-14 B and Minor B titles that year. Tuam Herald, 12 June 1999, notes the under-14 B final win.",
    links: [
      { href: "/article/art-book-fohenagh-story-amalgamation-2002", label: "The account" },
      { href: "/article/art-ina-tth-1999-06-12-af-kilnadeema-u14-final", label: "Under-14 B" },
    ],
  },
  {
    when: "11 Jul 2000",
    text: "Connacht Tribune: Fohenagh v Oranmore-Maree.",
    links: [{ href: "/article/art-ina-fohenagh-2000-oranmore-maree", label: "The report" }],
  },
  {
    when: "21 Jan 2002",
    text: "Both clubs held their meetings and disbanded. Ahascragh/Fohenagh began.",
    links: [
      { href: "/article/art-book-fohenagh-story-amalgamation-2002", label: "The account" },
      { href: "/club/ahascragh-fohenagh", label: "The amalgam" },
    ],
  },
];

export function FohenaghClubHistory() {
  return (
    <div className="space-y-10">
      <div className="max-w-3xl space-y-4 text-base leading-relaxed text-galway-ink/85">
        <p>
          Fohenagh is Fothannán, the village of the thistles, a parish club in east Galway with the
          usual deep roots. People lined out in the parish colours for more than a century, mostly
          on ordinary Sundays, mostly against the clubs next door. The record is fixtures,
          objections, a cup now and then, and a good deal of cycling.
        </p>
        <p>
          The papers catch the club in the 1880s and 1890s. There was a tournament at Lowville in
          the rain, a social at Kilconnell, and a day at Gurteen in 1890 when Tim Glynn’s team and
          Gurteen played fifty minutes and neither side scored. In 1907 the parish priest wrote
          that the players were respectable men, and the club was taken back onto the County Board
          roll. After that it simply kept going.
        </p>
        <p>
          The 1930s, on the page we have, are a fixture list. In September 1933 the North Galway
          District Board put Fohenagh down three times in a month, including Gurteen twice. The
          1940s were a harder stretch of the same life. Fohenagh won the North Board junior final
          against Cussane on 29 March 1942, the step into the county series, and the report was in
          the papers on 4 April. The 1941 junior semi-final at Athenry on 24 May was never finished.
          The County Board suspended both clubs for a year and gave the 1941 title to Eyrecourt. The
          camogie team, at the first attempt, won the county senior championship in 1947.
        </p>
        <p>
          The senior hurling years are short enough in the papers. Fohenagh reached the county final
          in 1958 and lost. They drew with Castlegar in 1959 and won the replay. They kept the cup
          in 1960, and six of the parish were picked for Galway against Tipperary that October.
          There were further finals in 1961 and 1963. Between those days there were intermediate
          matches, tournaments at Kilconnell, and a junior game against Tynagh at Kiltormer in 1956
          which the Herald of 6 October headed in one hard line, and then the parish went on to the
          next season.
        </p>
        <p>
          Underage teams carried the club through the later years: an under-16 title in 1989,
          under-12 and minor C championships in 1990, a minor C final in 1996. With fewer children
          in the school, Fohenagh joined Ahascragh at underage in 1999 and won county titles at that
          grade in the same year. On 21 January 2002 both clubs held their meetings and disbanded,
          and Ahascragh/Fohenagh began. The old club’s games stay here.
        </p>
        <p>
          <Link className="font-semibold text-galway-maroon underline" href={STORY_HREF}>
            1942: From the North Board to Blackguardism at Athenry
          </Link>
        </p>
      </div>

      <div className="space-y-3">
        <h3 id="fohenagh-timeline" className="text-xl font-black text-galway-ink">
          Timeline
        </h3>
        <ol className="space-y-3">
          {TIMELINE.map((item) => (
            <li
              key={`${item.when}|${item.text.slice(0, 24)}`}
              className="grid grid-cols-1 gap-1 text-base leading-relaxed sm:grid-cols-[7.5rem_1fr] sm:gap-3"
            >
              <span className="font-black text-galway-maroon">{item.when}</span>
              <span className="text-galway-ink/85">
                {item.text}
                {item.links?.length ? (
                  <>
                    {" "}
                    {item.links.map((link, index) => (
                      <span key={link.href}>
                        {index > 0 ? " · " : ""}
                        <Link className="font-semibold text-galway-maroon underline" href={link.href}>
                          {link.label}
                        </Link>
                      </span>
                    ))}
                  </>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-galway-ink/55">
          Dates and scores from the seeded games, the Irish Newspaper Archives cuttings, and A
          History of Fohenagh by Tony O’Gorman. Where two scores are printed, both stay.
        </p>
      </div>
    </div>
  );
}
