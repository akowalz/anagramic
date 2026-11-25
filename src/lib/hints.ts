import type { Tool } from "../Types/Tool"

/*
 * A small tutorial. Each tool teaches its own way of moving letters, then how
 * to lock one, one hint at a time, just above the letters. A hint is learned
 * by doing what it says, and then the next one shows. What's been learned is
 * remembered on the device, so the hints don't come back every visit.
 */

export type HintId =
  | "line-move"
  | "wheel-swap"
  | "freeform-move"
  | "lock"
  | "unlock"
  | "try-tools"
  | "floating-watch"

/* Written for touch screens: see hintText for mice */
export const HINT_TEXT: Record<HintId, string> = {
  "line-move": "Tap and drag to move letters",
  "wheel-swap": "Drag a letter onto another to swap them",
  "freeform-move": "Drag letters anywhere",
  // {lock} and {unlock} are drawn as the lock button's icons (see Hint)
  lock: "Tap a letter, then {lock} to keep it in place",
  unlock: "Tap a locked letter, then {unlock} to unlock it",
  "try-tools": "Try another tool to see the letters in a new way",
  "floating-watch": "Just let the letters float by",
}

/* A hint's text, saying "click" rather than "tap" when there's a mouse */
export function hintText(id: HintId, { mouse }: { mouse: boolean }): string {
  const text = HINT_TEXT[id]
  return mouse
    ? text.replace(/\bTap\b/g, "Click").replace(/\btap\b/g, "click")
    : text
}

/*
 * Hints shown just under the tool picker, since that's what they're about.
 * The rest are shown by the tools, near the letters.
 */
export const TOOLBAR_HINTS: ReadonlySet<HintId> = new Set(["try-tools"])

/*
 * Each tool's hints, in the order they're taught. Locking, unlocking and
 * trying another tool are the same everywhere, so they're learned once for
 * all of them.
 */
export const TOOL_HINTS: Record<Tool, HintId[]> = {
  Line: ["line-move", "lock", "unlock", "try-tools"],
  Wheel: ["wheel-swap", "lock", "unlock", "try-tools"],
  Tiles: ["freeform-move", "lock", "unlock", "try-tools"],
  // Floating's letters just drift: nothing to do, so its hint just says so,
  // then fades on its own
  Floating: ["floating-watch"],
}

/* The tool's first hint that hasn't been learned yet, if any */
export function currentHint(
  tool: Tool,
  learned: ReadonlySet<HintId>,
): HintId | null {
  return TOOL_HINTS[tool].find((id) => !learned.has(id)) ?? null
}

export const LEARNED_HINTS_KEY = "anagramic.learnedHints"

/*
 * For working on the tutorial locally: set this to true to forget what's been
 * learned every time the page loads, so the hints always show from the start.
 * Keep it false in commits: e2e/tutorial.spec.ts checks hints stay learned.
 */
export const RESET_HINTS_ON_LOAD = false

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
