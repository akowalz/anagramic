import { useCallback, useEffect, useState } from "react"
import {
  loadLearned,
  RESET_HINTS_ON_LOAD,
  saveLearned,
  type HintId,
} from "../lib/hints"

function storage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/*
 * Which hints have been learned (see lib/hints), remembered on the device.
 * `learn` never changes, so it can be handed to the tools freely.
 */
export function useHints() {
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

  return { learned, learn }
}

export type Hints = ReturnType<typeof useHints>
