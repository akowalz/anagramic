type Point = { x: number; y: number }

/*
 * How far (as a fraction of the gap between slots) the pointer must go past
 * the halfway point to a neighbouring slot before it counts as being over it.
 * Stops tiles flickering back and forth when the pointer sits on a boundary.
 */
const HYSTERESIS = 0.1

/*
 * The slot on a ring of `count` slots that the pointer is over. Slot 0 is at
 * the top and slots go clockwise, as in the Wheel tool. Only the angle around
 * `center` matters, not the distance. Stays on `currentSlot` until the pointer
 * is clearly over another slot, or while it's within `deadZone` of the center,
 * where the angle jumps about.
 */
export function slotAtPoint(
  point: Point,
  center: Point,
  count: number,
  currentSlot: number,
  deadZone = 0,
): number {
  const dx = point.x - center.x
  const dy = point.y - center.y
  if (Math.hypot(dx, dy) <= deadZone) return currentSlot

  const step = (Math.PI * 2) / count
  // Clockwise from the top; screen y points down
  const angle = Math.atan2(dx, -dy)

  const nearest = ((Math.round(angle / step) % count) + count) % count
  if (nearest === currentSlot) return currentSlot

  // Angular distance from the pointer to the current slot, around the ring
  const fromCurrent = Math.abs(
    ((angle - currentSlot * step + Math.PI * 3) % (Math.PI * 2)) - Math.PI,
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
