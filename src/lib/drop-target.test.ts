import { describe, expect, it } from "vitest"
import { findDropTarget } from "./drop-target"

const tiles = [
  { id: 1, center: { x: 0, y: 0 } },
  { id: 2, center: { x: 100, y: 0 } },
  { id: 3, center: { x: 130, y: 0 } },
]

describe("findDropTarget", () => {
  it("finds the tile whose drop zone the point is in", () => {
    expect(findDropTarget({ x: 10, y: 10 }, tiles, 30)).toBe(1)
  })

  it("finds nothing outside every drop zone", () => {
    expect(findDropTarget({ x: 50, y: 0 }, tiles, 30)).toBeNull()
  })

  it("picks the nearest when drop zones overlap", () => {
    expect(findDropTarget({ x: 118, y: 0 }, tiles, 30)).toBe(3)
    expect(findDropTarget({ x: 112, y: 0 }, tiles, 30)).toBe(2)
  })

  it("counts the edge of a drop zone as inside", () => {
    expect(findDropTarget({ x: 30, y: 0 }, tiles, 30)).toBe(1)
  })

  it("finds nothing with no tiles", () => {
    expect(findDropTarget({ x: 0, y: 0 }, [], 30)).toBeNull()
  })

  describe("once a tile is the target", () => {
    const current = { id: 1, keepRadius: 45 }

    it("keeps it a little way past its drop zone", () => {
      // 40 away: outside the zone (30), inside the keep radius (45)
      expect(findDropTarget({ x: 40, y: 0 }, tiles, 30, current)).toBe(1)
    })

    it("lets it go once well away", () => {
      expect(findDropTarget({ x: 50, y: 0 }, tiles, 30, current)).toBeNull()
    })

    it("switches to another tile once in its zone and nearer to it", () => {
      const onTwo = { id: 2, keepRadius: 45 }

      // 112 is in 2's zone and 3's; still nearer 2, so it stays
      expect(findDropTarget({ x: 112, y: 0 }, tiles, 30, onTwo)).toBe(2)
      // 120 is nearer 3, inside its zone
      expect(findDropTarget({ x: 120, y: 0 }, tiles, 30, onTwo)).toBe(3)
    })
  })
})
