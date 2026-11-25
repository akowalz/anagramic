import { describe, expect, it } from "vitest"
import {
  currentHint,
  hintText,
  LEARNED_HINTS_KEY,
  loadLearned,
  saveLearned,
  type HintId,
} from "./hints"

function memoryStorage(initial?: string) {
  const items = new Map<string, string>()
  if (initial !== undefined) items.set(LEARNED_HINTS_KEY, initial)
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  }
}

describe("currentHint", () => {
  it("starts each tool with how to move its letters", () => {
    const none = new Set<HintId>()

    expect(currentHint("Line", none)).toBe("line-move")
    expect(currentHint("Wheel", none)).toBe("wheel-swap")
    expect(currentHint("Tiles", none)).toBe("freeform-move")
  })

  it("moves on to locking once moving is learned", () => {
    expect(currentHint("Line", new Set(["line-move"]))).toBe("lock")
  })

  it("teaches unlocking after locking, then suggests trying another tool", () => {
    expect(currentHint("Line", new Set(["line-move", "lock"]))).toBe("unlock")
    expect(currentHint("Line", new Set(["line-move", "lock", "unlock"]))).toBe(
      "try-tools",
    )
    expect(
      currentHint(
        "Line",
        new Set(["line-move", "lock", "unlock", "try-tools"]),
      ),
    ).toBeNull()
  })

  it("teaches locking once, for every tool", () => {
    const learned = new Set<HintId>(["lock"])

    expect(currentHint("Wheel", learned)).toBe("wheel-swap")
    expect(
      currentHint(
        "Wheel",
        new Set(["wheel-swap", "lock", "unlock", "try-tools"]),
      ),
    ).toBeNull()
  })

  it("has just the one hint in Floating", () => {
    expect(currentHint("Floating", new Set())).toBe("floating-watch")
    expect(currentHint("Floating", new Set(["floating-watch"]))).toBeNull()
  })
})

describe("hintText", () => {
  it("says tap on touch screens", () => {
    expect(hintText("lock", { mouse: false })).toBe(
      "Tap a letter, then {lock} to keep it in place",
    )
  })

  it("says click with a mouse", () => {
    expect(hintText("lock", { mouse: true })).toBe(
      "Click a letter, then {lock} to keep it in place",
    )
    expect(hintText("line-move", { mouse: true })).toBe(
      "Click and drag to move letters",
    )
  })

  it("leaves hints without tapping alone", () => {
    expect(hintText("try-tools", { mouse: true })).toBe(
      "Try another tool to see the letters in a new way",
    )
  })
})

describe("learned hints in storage", () => {
  it("saves and loads what's been learned", () => {
    const storage = memoryStorage()

    saveLearned(storage, new Set(["line-move", "lock"]))

    expect(loadLearned(storage)).toEqual(new Set(["line-move", "lock"]))
  })

  it("starts with nothing learned", () => {
    expect(loadLearned(memoryStorage())).toEqual(new Set())
  })

  it("ignores anything it can't read", () => {
    expect(loadLearned(memoryStorage("not json"))).toEqual(new Set())
    expect(loadLearned(memoryStorage('{"a":1}'))).toEqual(new Set())
    expect(loadLearned(memoryStorage('["lock","nonsense"]'))).toEqual(
      new Set(["lock"]),
    )
  })

  it("carries on if storage can't be written", () => {
    const broken = {
      setItem: () => {
        throw new Error("quota")
      },
    }

    expect(() => saveLearned(broken, new Set(["lock"]))).not.toThrow()
  })
})
