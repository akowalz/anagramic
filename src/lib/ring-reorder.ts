type Point = { x: number; y: number }

/*
 * How far (as a fraction of the gap between slots) a tile must go past the
 * halfway point to a neighbouring slot before it counts as being over it.
 * Stops tiles flickering back and forth when a tile sits on a boundary.
 */
const HYSTERESIS = 0.1

const TWO_PI = Math.PI * 2

/*
 * Angle (radians) of `point` around `center`, clockwise from the top, as in
 * the Wheel tool where slot 0 is at the top. Screen y points down.
 */
export function angleOfPoint(point: Point, center: Point): number {
  return Math.atan2(point.x - center.x, center.y - point.y)
}

/* Angle of a slot on a ring of `count` slots */
export function angleOfSlot(slot: number, count: number): number {
  return (TWO_PI / count) * slot
}

/* Offset from the ring's center of the point at `angle` on the ring */
export function pointOnRing(angle: number, radius: number): Point {
  return { x: Math.sin(angle) * radius, y: -Math.cos(angle) * radius }
}

/*
 * The slot on a ring of `count` slots that a tile at `angle` is over. Stays
 * on `currentSlot` until the tile is clearly over another slot.
 */
export function slotAtAngle(
  angle: number,
  count: number,
  currentSlot: number,
): number {
  const step = TWO_PI / count

  const nearest = ((Math.round(angle / step) % count) + count) % count
  if (nearest === currentSlot) return currentSlot

  // Angular distance from the tile to the current slot, around the ring
  const fromCurrent = Math.abs(
    ((((angle - currentSlot * step + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI) -
      Math.PI,
  )
  if (fromCurrent < step * (0.5 + HYSTERESIS)) return currentSlot

  return nearest
}

/*
 * Move the item at `from` to `to` on a ring, shifting the unlocked items in
 * between along by one, the shorter way around. Locked items never move: the
 * moving item hops over them. Moving onto a locked slot does nothing.
 */
export function moveOnRing<T>(
  items: T[],
  from: number,
  to: number,
  isLocked: (item: T) => boolean,
): T[] {
  if (from === to || isLocked(items[from]) || isLocked(items[to])) return items

  const unlocked = items.flatMap((item, index) =>
    isLocked(item) ? [] : [index],
  )
  const count = unlocked.length
  const a = unlocked.indexOf(from)
  const b = unlocked.indexOf(to)

  const forward = (b - a + count) % count
  const direction = forward <= count - forward ? 1 : -1

  const result = [...items]
  for (let i = a; i !== b; i = (i + direction + count) % count) {
    const here = unlocked[i]
    const next = unlocked[(i + direction + count) % count]
    ;[result[here], result[next]] = [result[next], result[here]]
  }

  return result
}
