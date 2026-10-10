import { getAssoc } from "@/lib/data";
import { sanitizePublicText } from "@/lib/publicText";

export type MatchPlayer = {
  id: string;
  name: string;
  href: string;
};

/** Players named on a match through appearance rows. */
export async function playersInMatch(matchId: string): Promise<MatchPlayer[]> {
  const A = await getAssoc();
  const seen = new Set<string>();
  const players: MatchPlayer[] = [];
  for (const triple of A.getcol("match")) {
    if (String(triple.val) !== matchId) continue;
    if (!String(triple.row).startsWith("appearance:")) continue;
    const appearance = A.entityAttrs(triple.row);
    const playerId = String(appearance.player ?? "");
    if (!playerId.startsWith("player:") || seen.has(playerId)) continue;
    const name = sanitizePublicText(String(A.entityAttrs(playerId).name ?? ""));
    if (!name) continue;
    seen.add(playerId);
    players.push({
      id: playerId,
      name,
      href: `/player/${playerId.slice("player:".length)}`,
    });
  }
  players.sort((a, b) => a.name.localeCompare(b.name));
  return players;
}
