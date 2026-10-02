import { describe, expect, it } from "vitest"
import {
  angleOfPoint,
  angleOfSlot,
  moveOnRing,
  pointOnRing,
  slotAtAngle,
} from "./ring-reorder"

const center = { x: 0, y: 0 }

/* Angle of a (possibly fractional) slot on a ring of `count` slots */
const at = (slot: number, count: number) => angleOfSlot(slot, count)

describe("angleOfPoint", () => {
  it("is 0 at the top and goes clockwise", () => {
    expect(angleOfPoint({ x: 0, y: -100 }, center)).toBeCloseTo(0)
    expect(angleOfPoint({ x: 100, y: 0 }, center)).toBeCloseTo(Math.PI / 2)
    expect(angleOfPoint({ x: -100, y: 0 }, center)).toBeCloseTo(-Math.PI / 2)
  })

  it("is measured around the given center", () => {
    expect(angleOfPoint({ x: 60, y: 50 }, { x: 50, y: 50 })).toBeCloseTo(
      Math.PI / 2,
    )
  })
})

describe("pointOnRing", () => {
  it("projects an angle onto the ring", () => {
    const right = pointOnRing(Math.PI / 2, 100)
    expect(right.x).toBeCloseTo(100)
    expect(right.y).toBeCloseTo(0)

    const bottom = pointOnRing(Math.PI, 50)
    expect(bottom.x).toBeCloseTo(0)
    expect(bottom.y).toBeCloseTo(50)
  })

  it("round-trips with angleOfPoint", () => {
    expect(angleOfPoint(pointOnRing(1, 80), center)).toBeCloseTo(1)
  })
})

describe("slotAtAngle", () => {
  it("finds slot 0 at the top and goes clockwise", () => {
    expect(slotAtAngle(at(0, 4), 4, 2)).toBe(0)
    expect(slotAtAngle(at(1, 4), 4, 0)).toBe(1)
    expect(slotAtAngle(at(2, 4), 4, 0)).toBe(2)
    expect(slotAtAngle(at(3, 4), 4, 0)).toBe(3)
  })

  it("wraps around past the top, either way", () => {
    expect(slotAtAngle(at(7.9, 8), 8, 3)).toBe(0)
    expect(slotAtAngle(at(-0.1, 8), 8, 3)).toBe(0)
    expect(slotAtAngle(at(-3, 8), 8, 0)).toBe(5)
    expect(slotAtAngle(at(10, 8), 8, 0)).toBe(2)
  })

  it("stays on the current slot just past a boundary", () => {
    expect(slotAtAngle(at(2.55, 8), 8, 2)).toBe(2)
    expect(slotAtAngle(at(2.65, 8), 8, 2)).toBe(3)
    expect(slotAtAngle(at(-0.55, 8), 8, 0)).toBe(0)
    expect(slotAtAngle(at(-0.65, 8), 8, 0)).toBe(7)
    expect(slotAtAngle(at(7.45, 8), 8, 0)).toBe(0)
  })
})

describe("moveOnRing", () => {
  const unlocked = () => false
  const lockedIn = (locked: string) => (item: string) => locked.includes(item)
  const move = (
    word: string,
    from: number,
    to: number,
    isLocked: (item: string) => boolean = unlocked,
  ) => moveOnRing(word.split(""), from, to, isLocked).join("")

  it("moves forward, shifting the items in between back", () => {
    expect(move("ABCDEFGH", 1, 3)).toBe("ACDBEFGH")
  })

  it("moves backward, shifting the items in between forward", () => {
    expect(move("ABCDEFGH", 3, 1)).toBe("ADBCEFGH")
  })

  it("goes the shorter way around the ring", () => {
    // 1 -> 7 is two steps backward through 0, not six forward
    expect(move("ABCDEFGH", 1, 7)).toBe("HACDEFGB")
  })

  it("leaves the array alone when not moving", () => {
    const items = ["A", "B"]
    expect(moveOnRing(items, 1, 1, unlocked)).toBe(items)
  })

  it("hops over locked items without moving them", () => {
    expect(move("ABCDE", 0, 3, lockedIn("B"))).toBe("CBDAE")
  })

  it("does nothing when moving onto a locked slot", () => {
    expect(move("ABCDE", 0, 2, lockedIn("C"))).toBe("ABCDE")
  })

  it("does nothing when moving a locked item", () => {
    expect(move("ABCDE", 2, 0, lockedIn("C"))).toBe("ABCDE")
  })

  it("does not mutate the array it is given", () => {
    const items = "ABCD".split("")
    moveOnRing(items, 0, 2, unlocked)
    expect(items.join("")).toBe("ABCD")
  })
})
