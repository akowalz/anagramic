import { useEffect } from "react"
import { typingAction } from "../lib/typing"

/*
 * Type letters with a physical keyboard: letter keys add a letter, and
 * Backspace or Delete remove the last one.
 */
export function useTypedKeys(
  enabled: boolean,
  onLetter: (letter: string) => void,
  onDelete: () => void,
) {
  useEffect(() => {
    if (!enabled) return

    function onKeyDown(event: KeyboardEvent) {
      const action = typingAction(event)
      if (!action) return

      event.preventDefault()
      if (action.type === "add") {
        onLetter(action.letter)
      } else {
        onDelete()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [enabled, onLetter, onDelete])
}
