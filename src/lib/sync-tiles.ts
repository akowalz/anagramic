/*
 * Letters are typed one at a time and only ever added or deleted at the end.
 * Every tool keeps its own tiles for those letters, so when the letters change
 * the tools bring their tiles in line: tiles for letters that are still there
 * stay as they are (keeping their position, lock and so on), tiles for deleted
 * letters go, and tiles are created for new letters.
 */

/*
 * For tiles that stay in letter order, so the tile at an index is the tile for
 * the letter at that index.
 */
export function syncTilesByPosition<T extends { letter: string }>(
  tiles: T[],
  letters: string[],
  createTile: (letter: string, index: number) => T,
): T[] {
  return letters.map((letter, index) =>
    tiles[index]?.letter === letter ? tiles[index] : createTile(letter, index),
  )
}

/*
 * For tiles that get rearranged: each one remembers which letter it is for
 * with `initialPosition`. Tiles keep their current order, and new tiles go at
 * the end.
 */
export function syncRearrangedTiles<
  T extends { letter: string; initialPosition: number },
>(
  tiles: T[],
  letters: string[],
  createTile: (letter: string, index: number) => T,
): T[] {
  const kept = tiles.filter(
    (tile) => letters[tile.initialPosition] === tile.letter,
  )
  const keptIndices = new Set(kept.map((tile) => tile.initialPosition))

  const added = letters.flatMap((letter, index) =>
    keptIndices.has(index) ? [] : [createTile(letter, index)],
  )

  return [...kept, ...added]
}

/*
 * Freeform lays tiles out in flexbox "slots", one per tile. When tiles are
 * added or removed, the tiles that remain keep their order within the layout
 * and new tiles take the last slots.
 *
 * `oldSlots` is the slot of each of `oldTiles`. Returns the slot of each of
 * `newTiles`, where the tiles that remain are the same objects as before.
 */
export function syncSlots<T>(
  oldTiles: T[],
  oldSlots: number[],
  newTiles: T[],
): number[] {
  const keptSlots = newTiles.flatMap((tile) => {
    const oldIndex = oldTiles.indexOf(tile)
    return oldIndex === -1 ? [] : [oldSlots[oldIndex]]
  })
  const orderedSlots = [...keptSlots].sort((a, b) => a - b)

  let nextSlot = keptSlots.length
  return newTiles.map((tile) => {
    const oldIndex = oldTiles.indexOf(tile)
    return oldIndex === -1
      ? nextSlot++
      : orderedSlots.indexOf(oldSlots[oldIndex])
  })
}
