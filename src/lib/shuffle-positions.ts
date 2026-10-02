import { shuffleUnlocked } from "./shuffle"

/*
 * Randomly reassign the tiles' current positions among the tiles, so the
 * letters move but the overall layout stays the same. Locked tiles keep their
 * position.
 */
export function shuffleTilePositions<P, T extends { pos: P }>(
  tiles: T[],
  isLocked: (tile: T) => boolean = () => false,
): T[] {
  const shuffledPositions = shuffleUnlocked(
    tiles.map((tile) => tile.pos),
    (_, index) => isLocked(tiles[index]),
  )

  return tiles.map((tile, index) => ({
    ...tile,
    pos: shuffledPositions[index],
  }))
}
