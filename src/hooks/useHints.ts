import { useCallback, useEffect, useState } from "react"
import { loadLearned, saveLearned, type HintId } from "../lib/hints"

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
    return store ? loadLearned(store) : new Set()
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
