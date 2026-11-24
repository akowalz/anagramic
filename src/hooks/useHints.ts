import { useCallback, useEffect, useState } from "react"
import {
  currentHint,
  hintText,
  loadLearned,
  RESET_HINTS_ON_LOAD,
  saveLearned,
  TOOLBAR_HINTS,
  type HintId,
} from "../lib/hints"
import type { Tool } from "../Types/Tool"

function storage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/* Whether the main way of pointing is a mouse, so hints should say "click" */
function hasMouse(): boolean {
  return window.matchMedia?.("(hover: hover) and (pointer: fine)").matches
}

/*
 * Which hints have been learned (see lib/hints), remembered on the device.
 * `learn` never changes, so it can be handed to the tools freely.
 */
export function useHints() {
  const [mouse] = useState(hasMouse)

  const [learned, setLearned] = useState<ReadonlySet<HintId>>(() => {
    const store = storage()
    // Temporary: see RESET_HINTS_ON_LOAD
    if (RESET_HINTS_ON_LOAD || !store) return new Set()
    return loadLearned(store)
  })

  const learn = useCallback((id: HintId) => {
    setLearned((learned) => {
      if (learned.has(id)) return learned

      return new Set(learned).add(id)
    })
  }, [])

  useEffect(() => {
    const store = storage()
    if (store) saveLearned(store, learned)
  }, [learned])

  /*
   * The text of the tool's next hint to show near its letters, if any. Hints
   * for the tool picker are shown there instead (see toolbarHint).
   */
  function nearLetters(tool: Tool): string | null {
    const hint = currentHint(tool, learned)
    return hint && !TOOLBAR_HINTS.has(hint) ? hintText(hint, { mouse }) : null
  }

  /* The text of the tool's next hint to show under the tool picker, if any */
  function underToolbar(tool: Tool): string | null {
    const hint = currentHint(tool, learned)
    return hint && TOOLBAR_HINTS.has(hint) ? hintText(hint, { mouse }) : null
  }

  return { learned, learn, nearLetters, underToolbar }
}

export type Hints = ReturnType<typeof useHints>
