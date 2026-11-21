import type { Tool } from "../Types/Tool"

/*
 * A small tutorial. Each tool teaches its own way of moving letters, then how
 * to lock one, one hint at a time, just above the letters. A hint is learned
 * by doing what it says, and then the next one shows. What's been learned is
 * remembered on the device, so the hints don't come back every visit.
 */

export type HintId = "line-move" | "wheel-swap" | "freeform-move" | "lock"

export const HINT_TEXT: Record<HintId, string> = {
  "line-move": "Tap and drag to move letters",
  "wheel-swap": "Tap two letters to swap them",
  "freeform-move": "Drag letters anywhere",
  lock: "Tap a letter to lock it in place",
}

/* Each tool's hints, in the order they're taught. Locking is the same everywhere. */
export const TOOL_HINTS: Record<Tool, HintId[]> = {
  Line: ["line-move", "lock"],
  Wheel: ["wheel-swap", "lock"],
  Tiles: ["freeform-move", "lock"],
  // Floating's letters just drift: there's nothing to teach
  Floating: [],
}

/* The tool's first hint that hasn't been learned yet, if any */
export function currentHint(
  tool: Tool,
  learned: ReadonlySet<HintId>,
): HintId | null {
  return TOOL_HINTS[tool].find((id) => !learned.has(id)) ?? null
}

export const LEARNED_HINTS_KEY = "anagramic.learnedHints"

const ALL_HINTS = new Set(Object.keys(HINT_TEXT))

/* What's been learned, from storage. Anything unreadable counts as nothing. */
export function loadLearned(storage: Pick<Storage, "getItem">): Set<HintId> {
  try {
    const stored: unknown = JSON.parse(
      storage.getItem(LEARNED_HINTS_KEY) ?? "[]",
    )
    if (!Array.isArray(stored)) return new Set()

    return new Set(
      stored.filter((id): id is HintId => ALL_HINTS.has(String(id))),
    )
  } catch {
    return new Set()
  }
}

export function saveLearned(
  storage: Pick<Storage, "setItem">,
  learned: ReadonlySet<HintId>,
) {
  try {
    storage.setItem(LEARNED_HINTS_KEY, JSON.stringify([...learned]))
  } catch {
    // Storage can be full or turned off (e.g. some private modes): the hints
    // will just show again next time
  }
}
