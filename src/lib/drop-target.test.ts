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
})
