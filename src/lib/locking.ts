/* Flip the locked state of the tile with the given id */
export function toggleLocked<T extends { id: unknown; locked: boolean }>(
  tiles: T[],
  id: T["id"],
): T[] {
  return tiles.map((tile) =>
    tile.id === id ? { ...tile, locked: !tile.locked } : tile,
  )
}
