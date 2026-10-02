import { describe, expect, it } from "vitest"
import { MAX_RESISTANCE_OFFSET, rubberBand } from "./rubber-band"

const length = ({ x, y }: { x: number; y: number }) => Math.hypot(x, y)

describe("rubberBand", () => {
  it("does not move without a drag", () => {
    expect(rubberBand({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 })
  })

  it("moves less than the pointer", () => {
    expect(length(rubberBand({ x: 10, y: 0 }))).toBeLessThan(10)
  })

  it("never moves past the max, however far you drag", () => {
    expect(length(rubberBand({ x: 5000, y: -5000 }))).toBeLessThan(
      MAX_RESISTANCE_OFFSET,
    )
  })

  it("stiffens the further you drag", () => {
    const first = length(rubberBand({ x: 20, y: 0 }))
    const second = length(rubberBand({ x: 40, y: 0 })) - first

    expect(second).toBeLessThan(first)
  })

  it("moves in the direction of the drag", () => {
    const offset = rubberBand({ x: -30, y: 40 })

    expect(offset.x).toBeLessThan(0)
    expect(offset.y).toBeGreaterThan(0)
    expect(offset.y / offset.x).toBeCloseTo(40 / -30)
  })

  it("respects a custom max", () => {
    expect(length(rubberBand({ x: 1000, y: 0 }, 3))).toBeLessThan(3)
  })
})
