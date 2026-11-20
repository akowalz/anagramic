export type TypingAction = { type: "add"; letter: string } | { type: "delete" }

type KeyPress = Pick<
  KeyboardEvent,
  "key" | "metaKey" | "ctrlKey" | "altKey" | "repeat"
>

/*
 * What a key press does to the letters, if anything: letter keys add that
 * letter, and Backspace or Delete remove the last one. Shortcuts like Cmd+R
 * are left alone, and holding a letter down doesn't type it over and over,
 * but holding delete keeps deleting.
 */
export function typingAction(event: KeyPress): TypingAction | null {
  if (event.metaKey || event.ctrlKey || event.altKey) return null

  if (event.key === "Backspace" || event.key === "Delete") {
    return { type: "delete" }
  }

  if (event.repeat) return null

  if (/^[a-z]$/i.test(event.key)) {
    return { type: "add", letter: event.key.toUpperCase() }
  }

  return null
}
