import type { Letter } from "./letters"

/*
 * For a tool that keeps something of its own for each letter (e.g. where it's
 * drifting), keyed by the letter's id: when letters are typed or deleted, keep
 * what's there for letters that remain, drop it for deleted ones, and create
 * it for new ones. The result is in letter order.
 */
export function syncTilesInLetterOrder<T extends { id: number }>(
  tiles: T[],
  letters: Letter[],
  createTile: (letter: Letter) => T,
): T[] {
  const byId = new Map(tiles.map((tile) => [tile.id, tile]))
  return letters.map((letter) => byId.get(letter.id) ?? createTile(letter))
}
