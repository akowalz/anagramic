import "./Hint.css"
import { useEffect, useState } from "react"

/* How long a hint takes to fade out, or in */
export const HINT_FADE_MS = 400

type Props = {
  // What to show, or nothing
  text: string | null
  // Move up out of the way, e.g. of the lock button over a selected tile
  lifted?: boolean
  // How long fading out (or in) takes, if not the usual
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
  lifted = false,
  fadeMs = HINT_FADE_MS,
  className,
  style,
}: Props) {
  const [shown, setShown] = useState(text)

  useEffect(() => {
    if (text === shown) return

    const timer = setTimeout(() => setShown(text), fadeMs)
    return () => clearTimeout(timer)
  }, [text, shown, fadeMs])

  const out = text !== shown || shown === null

  return (
    <div
      className={`hint ${out ? "out" : ""} ${lifted ? "lifted" : ""} ${
        className ?? ""
      }`}
      aria-hidden={out}
      style={
        {
          ...style,
          "--hint-fade": `${fadeMs}ms`,
        } as React.CSSProperties
      }
    >
      {shown}
    </div>
  )
}
