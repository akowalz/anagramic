import { describe, expect, it } from "vitest"
import { coordToPosition, positionToStyle } from "./coordinate-plane"

describe("coordToPosition", () => {
  it("maps the origin to the center", () => {
    expect(coordToPosition({ x: 0, y: 0 })).toEqual({ left: 0.5, top: 0.5 })
  })

  it("maps positive y upward and negative y downward", () => {
    expect(coordToPosition({ x: 1, y: 1 })).toEqual({ left: 1, top: 0 })
    expect(coordToPosition({ x: -1, y: -1 })).toEqual({ left: 0, top: 1 })
  })

  it("rejects coordinates outside the unit square", () => {
    expect(() => coordToPosition({ x: 1.5, y: 0 })).toThrow("x out of range")
    expect(() => coordToPosition({ x: 0, y: -2 })).toThrow("y out of range")
  })
})

describe("positionToStyle", () => {
  it("converts fractions to CSS percentages", () => {
    expect(positionToStyle({ top: 0.25, left: 0.5 })).toEqual({
      top: "25%",
      left: "50%",
    })
  })
})
