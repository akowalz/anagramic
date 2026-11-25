import "./Hint.css"
import { useEffect, useState } from "react"
import LockIcon from "../Icons/LockIcon"
import UnlockIcon from "../Icons/UnlockIcon"

/* How long a hint takes to fade out, or in */
export const HINT_FADE_MS = 400

type Props = {
  // What to show, or nothing
  text: string | null
  // How long fading out takes, if not the usual (fading in is always quick)
  fadeMs?: number
  className?: string
  style?: React.CSSProperties
}

/*
 * A hint above the letters. When the text changes, the old hint fades out
 * before the new one fades in, so one never just replaces the other.
 */
export default function Hint({
  text,
  fadeMs = HINT_FADE_MS,
  className,
  style,
}: Props) {
  const [shown, setShown] = useState(text)

  useEffect(() => {
    if (text === shown) return

    // Wait for the old hint to fade out; with nothing showing, no need
    const timer = setTimeout(() => setShown(text), shown === null ? 0 : fadeMs)
    return () => clearTimeout(timer)
  }, [text, shown, fadeMs])

  const out = text !== shown || shown === null

  return (
    <div
      className={`hint ${out ? "out" : ""} ${className ?? ""}`}
      aria-hidden={out}
      style={
        {
          ...style,
          "--hint-fade": `${fadeMs}ms`,
        } as React.CSSProperties
      }
    >
      {shown && withIcons(shown)}
    </div>
  )
}

/*
 * Draw {lock} and {unlock} in a hint as the lock button's icons, so the hint
 * shows exactly what to look for. Each also has its name, for screen readers.
 */
function withIcons(text: string) {
  return text.split(/(\{lock\}|\{unlock\})/).map((part, index) => {
    if (part === "{lock}" || part === "{unlock}") {
      const unlock = part === "{unlock}"
      return (
        <span key={index} className="hint-icon">
          {unlock ? <UnlockIcon /> : <LockIcon />}
          <span className="visually-hidden">{unlock ? "unlock" : "lock"}</span>
        </span>
      )
    }
    return part
  })
}
