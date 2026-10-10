"use client";

import { useRouter } from "next/navigation";

export function PlayerGamesSelect({
  games,
}: {
  games: { label: string; matchHref?: string }[];
}) {
  const router = useRouter();
  const playable = games.filter((game) => game.matchHref);
  const seen = new Set<string>();
  const options = playable.filter((game) => {
    const key = game.matchHref ?? game.label;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (options.length === 0) return null;

  return (
    <label className="block max-w-xl text-sm font-semibold text-galway-ink/70">
      Games
      <select
        className="mt-1 w-full rounded-xl border border-galway-maroon/25 bg-white px-3 py-2 text-base font-semibold text-galway-ink"
        defaultValue=""
        onChange={(event) => {
          if (event.target.value) router.push(event.target.value);
        }}
      >
        <option value="">Choose a game</option>
        {options.map((game) => (
          <option key={game.matchHref} value={game.matchHref}>
            {game.label}
          </option>
        ))}
      </select>
    </label>
  );
}
