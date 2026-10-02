import { describe, expect, it } from "vitest"
import { moveOnRing, slotAtPoint } from "./ring-reorder"

const center = { x: 0, y: 0 }

/* A point on the ring at `slot` (fractional slots allowed), screen y down */
function pointAt(slot: number, count: number, radius = 100) {
  const angle = ((Math.PI * 2) / count) * slot
  return { x: Math.sin(angle) * radius, y: -Math.cos(angle) * radius }
}

describe("slotAtPoint", () => {
  it("finds slot 0 at the top and goes clockwise", () => {
    expect(slotAtPoint({ x: 0, y: -100 }, center, 4, 2)).toBe(0)
    expect(slotAtPoint({ x: 100, y: 0 }, center, 4, 0)).toBe(1)
    expect(slotAtPoint({ x: 0, y: 100 }, center, 4, 0)).toBe(2)
    expect(slotAtPoint({ x: -100, y: 0 }, center, 4, 0)).toBe(3)
  })

  it("wraps around past the top", () => {
    expect(slotAtPoint(pointAt(7.9, 8), center, 8, 3)).toBe(0)
    expect(slotAtPoint(pointAt(-0.1, 8), center, 8, 3)).toBe(0)
  })

  it("stays on the current slot just past a boundary", () => {
    expect(slotAtPoint(pointAt(2.55, 8), center, 8, 2)).toBe(2)
    expect(slotAtPoint(pointAt(2.65, 8), center, 8, 2)).toBe(3)
    expect(slotAtPoint(pointAt(-0.55, 8), center, 8, 0)).toBe(0)
    expect(slotAtPoint(pointAt(-0.65, 8), center, 8, 0)).toBe(7)
  })

  it("stays on the current slot within the dead zone", () => {
    expect(slotAtPoint(pointAt(4, 8, 5), center, 8, 1, 10)).toBe(1)
    expect(slotAtPoint(pointAt(4, 8, 50), center, 8, 1, 10)).toBe(4)
  })

  it("ignores how far the pointer is from the center", () => {
    expect(slotAtPoint(pointAt(3, 6, 1000), center, 6, 0)).toBe(3)
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
