import { shuffle } from "./shuffle"

/*
 * Randomly reassign the tiles' current positions among the tiles, so the
 * letters move but the overall layout stays the same.
 */
export function shuffleTilePositions<P, T extends { pos: P }>(tiles: T[]): T[] {
  const shuffledPositions = shuffle(tiles.map((tile) => tile.pos))

  return tiles.map((tile, index) => ({
    ...tile,
    pos: shuffledPositions[index],
  }))
}
