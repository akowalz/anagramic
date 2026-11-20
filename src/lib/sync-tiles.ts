import type { Letter } from "./letters"

/*
 * Letters are typed at the end, and deleted from anywhere. Every tool keeps
 * its own tiles for those letters, each with the id of its letter, so when
 * the letters change the tools bring their tiles in line: tiles for letters
 * that are still there stay as they are (keeping their position, lock and so
 * on), tiles for deleted letters go, and tiles are created for new letters.
 */

/* For tiles that stay in letter order */
export function syncTilesInLetterOrder<T extends { id: number }>(
  tiles: T[],
  letters: Letter[],
  createTile: (letter: Letter) => T,
): T[] {
  const byId = new Map(tiles.map((tile) => [tile.id, tile]))
  return letters.map((letter) => byId.get(letter.id) ?? createTile(letter))
}

/*
 * For tiles that get rearranged: tiles keep their current order, and new
 * tiles go at the end. `initialPosition` is kept up to date with where each
 * tile's letter is in the letters, so the tiles can be put back in order.
 */
export function syncRearrangedTiles<
  T extends { id: number; initialPosition: number },
>(tiles: T[], letters: Letter[], createTile: (letter: Letter, index: number) => T): T[] {
  const positions = new Map(letters.map((letter, index) => [letter.id, index]))

  const kept = tiles.flatMap((tile) => {
    const position = positions.get(tile.id)
    if (position === undefined) return []
    return position === tile.initialPosition
      ? [tile]
      : [{ ...tile, initialPosition: position }]
  })
  const keptIds = new Set(kept.map((tile) => tile.id))

  const added = letters.flatMap((letter, index) =>
    keptIds.has(letter.id) ? [] : [createTile(letter, index)],
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
