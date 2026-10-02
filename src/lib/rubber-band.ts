type Pos = { x: number; y: number }

/* Furthest (px) a locked tile gives way when you try to drag it */
export const MAX_RESISTANCE_OFFSET = 14

/* How quickly the tile stiffens; lower is stiffer */
const GIVE = 0.7

/*
 * How far a locked tile moves when the pointer has been dragged `delta` from
 * where it started. It gives a little at first, then stiffens like a rigid
 * spring (as in iOS rubber banding), never moving more than `max`.
 */
export function rubberBand(delta: Pos, max = MAX_RESISTANCE_OFFSET): Pos {
  const distance = Math.hypot(delta.x, delta.y)
  if (distance === 0) return { x: 0, y: 0 }

  const offset = (1 - 1 / ((distance * GIVE) / max + 1)) * max

  return {
    x: (delta.x / distance) * offset,
    y: (delta.y / distance) * offset,
  }
}
