/**
 * Short match reports for the historic Fohenagh games.
 * Every sentence is taken from a cutting excerpt or a sourced seed note.
 * Games with no narrative on file stay "soon".
 */

export type FohenaghReport = {
  paragraphs: string[];
  cite: string | null;
};

const SOON: FohenaghReport = { paragraphs: [], cite: null };

export const FOHENAGH_GAME_REPORTS: Record<string, FohenaghReport> = {
  "match:fohenagh-ahascragh-sadie-kilcommons-final": {
    paragraphs: [
      "The Connacht Tribune of 21 August 1998 reported that Fohenagh recaptured the Sadie Kilcommons trophy, beating Ahascragh 1-12 to 0-9.",
      "The paper said Fohenagh were best served by Seamus Mockler, Padraic Leonard, Garry Lohan, John Devine, Alan Madden, Ollie Deeley and Tony Kirwan.",
      "Ahascragh were best served by Noel Fitzgerald, Sean Morrissey, David Costello, Kevin Gavin, Oliver Hennelly and Patrick Hartigan.",
    ],
    cite: "Connacht Tribune · 21 Aug 1998 · p.9",
  },
  "match:galway-shc-1971-r1-athenry-fohenagh": SOON,
  "match:galway-reeves-cup-1967-final-athenry-fohenagh": SOON,
  "match:galway-reeves-cup-1966-final-athenry-fohenagh": SOON,
  "match:fohenagh-historic-1963-galway-shc-final": {
    paragraphs: [
      "Turloughmore beat Fohenagh in the Galway senior hurling final, 5-13 to 2-4. The Galway GAA finals table places the game at Pearse Stadium.",
      "A Connacht Tribune photograph from 17 August 1963 shows Packie Burke, Turloughmore’s full-back, covering Bobby Madden, with Jim Sweeney, Fohenagh’s full-forward, in close attendance.",
      "The same day’s action photographs also name Tim Sweeney, Frank Madden and Mick Moylette.",
    ],
    cite: "Galway GAA finals table · Connacht Tribune, 17 Aug 1963",
  },
  "match:fohenagh-historic-1961-galway-shc-final": {
    paragraphs: [
      "Turloughmore beat defending champions Fohenagh in the Galway senior hurling final, 3-6 to 3-4. The Galway GAA finals table, Wikipedia and Turloughmore GAA agree the score.",
      "The ground is left off this page, because those sources do not agree it.",
      "The Connacht Tribune of 16 September 1961 printed final photographs naming Tim Sweeney, John Sweeney, Jim Sweeney, Frank Madden, Abie Glynn, Tom Killilea and Michael Cullinane.",
      "The catalogued headline on that issue is “Turloughmore dethroned Fohenagh in a dream finish”. The report text itself is not on file.",
    ],
    cite: "Galway GAA finals table · Connacht Tribune, 16 Sep 1961",
  },
  "match:fohenagh-historic-1960-galway-shc-final": {
    paragraphs: [
      "Fohenagh beat Castlegar in the Galway senior hurling final, 4-9 to 2-7, at Pearse Stadium, in the Galway GAA finals table.",
      "A captain roll names Tony O’Gorman as Fohenagh’s captain that year.",
      "On 10 September 1999 the Connacht Tribune printed the 1960 team photograph, when the club honoured the 1959 and 1960 champions.",
      "The match report from the week of the final is not on this page.",
    ],
    cite: "Galway GAA finals table · Connacht Tribune, 10 Sep 1999",
  },
  "match:fohenagh-historic-1959-galway-shc-final-replay": {
    paragraphs: [
      "Fohenagh defeated Castlegar in the Galway senior hurling final replay at Athenry.",
      "The Connacht Tribune of 19 September 1959 printed the score Fohenagh 3-9, Castlegar 4-5, and described Fohenagh’s first senior title as a one-point win after a second-half rally.",
      "Tim Sweeney scored 1-4. The paper printed both fifteens.",
      "The report names Tim Sweeney, Frank Madden, J. Moclair, P.J. Killalea, T. Moylett, M. Coen and M. Glynn.",
    ],
    cite: "Connacht Tribune · 19 Sep 1959",
  },
  "match:fohenagh-historic-1959-galway-shc-final-draw": {
    paragraphs: [
      "The Connacht Tribune of 5 September 1959 headed its report “Draw Was Fitting Result To Thriller”, and “Fohenagh and Castlegar must try again.”",
      "The printed scores were Fohenagh 2-8, Castlegar 1-11, at Pearse Stadium, so the sides had to meet again.",
      "Named on the paper: Tim Sweeney, Pat Joe Lally, Paddy Egan, Jer Sweeney and Tony O’Gorman.",
    ],
    cite: "Connacht Tribune · 5 Sep 1959 · p.12",
  },
  "match:fohenagh-historic-1958-galway-shc-final": SOON,
  "match:fohenagh-loughrea-c1957": {
    paragraphs: [
      "A local paper cutting says Fohenagh came from behind against Loughrea, and that a late goal left Fohenagh winners.",
      "It gives half-time as Loughrea 2-3, Fohenagh 1-2, and mentions Fohenagh 3-5.",
      "The full final score is not clear on the cutting, so it is not stated as the result.",
    ],
    cite: "Local paper cutting · c.1957",
  },
  "match:fohenagh-maree-1957": {
    paragraphs: [
      "A local paper cutting says Fohenagh advanced past Maree by 3-11 to 2-7.",
      "Fohenagh had trailed at half-time, when the score was Maree 2-6, Fohenagh 1-3.",
    ],
    cite: "Local paper cutting · 1957",
  },
  "match:fohenagh-tynagh-junior-abandoned-1956": {
    paragraphs: [
      "The Tuam Herald of 6 October 1956 reported that the junior hurling game between Fohenagh and Tynagh at Kiltormer was abandoned after a row.",
      "Mr N. Farragher represented Fohenagh, and Tim Sweeney was named in the discussion.",
      "A full score is not printed on the cutting we have.",
    ],
    cite: "Tuam Herald · 6 Oct 1956 · p.5",
  },
  "match:fohenagh-skehana-ihc-final-1952-draw": {
    paragraphs: [
      "The Tuam Herald of 16 August 1952 reported a drawn intermediate county final, Fohenagh 3-6, Skehana 4-3.",
      "Fohenagh rallied late, and Martin Glynn scored from a 21-yard free to earn a replay.",
      "Joe Rushe and M. Barrett stood out in the backs, with the Glynns prominent forward.",
    ],
    cite: "Tuam Herald · 16 Aug 1952 · p.1",
  },
  "match:fohenagh-cussane-north-board-junior-final-1942": {
    paragraphs: [
      "The Tuam Herald of 4 April 1942 reported that Fohenagh emerged winners of the North Board junior final after an hour’s hard hurling with Cussaun.",
      "Fohenagh were superior for most of the hour, but great back play and a splendid goalkeeper kept the Cussaun goal intact.",
      "The final score is not legible on the cutting, so it is not given here.",
    ],
    cite: "Tuam Herald · 4 Apr 1942 · p.2",
  },
};

export function fohenaghGameReport(id: string): FohenaghReport | null {
  return FOHENAGH_GAME_REPORTS[id] ?? null;
}
