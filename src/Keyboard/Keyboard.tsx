import "./Keyboard.css"

import { type CSSProperties } from "react"
import DeleteIcon from "../Icons/DeleteIcon"
import KeyboardIcon from "../Icons/KeyboardIcon"

type Props = {
  open: boolean
  onHide: () => void
  onLetter: (letter: string) => void
  onDelete: () => void
}

/*
 * Each row is twenty columns wide, so a key is two columns. `offset` is how
 * many columns a row is indented by, which lines the keys up like a standard
 * keyboard: half a key in for the second row. The third row is filled out by
 * the hide button on the left and delete on the right, each a key and a half.
 */
const ROWS = [
  { letters: "QWERTYUIOP", offset: 0, hasDelete: false },
  { letters: "ASDFGHJKL", offset: 1, hasDelete: false },
  { letters: "ZXCVBNM", offset: 0, hasDelete: true },
]

// Keys shouldn't take focus when pressed: a focused key would be pressed again
// by the space bar or enter key
function keepFocus(e: React.MouseEvent) {
  e.preventDefault()
}

export default function Keyboard({ open, onHide, onLetter, onDelete }: Props) {
  // Bottom left, mirroring delete. Showing the keyboard again is up to the
  // app, which puts that button next to the other tool buttons.
  const hideButton = (
    <button
      className="keyboard-toggle"
      onClick={onHide}
      aria-label="Hide keyboard"
    >
      <KeyboardIcon hide />
    </button>
  )

  return (
    <div className={`keyboard ${open ? "open" : ""}`}>
      <div className="keyboard-keys-wrapper" id="keyboard-keys" inert={!open}>
        <div className="keyboard-keys">
          <div className="keyboard-rows">
            {ROWS.map(({ letters, offset, hasDelete }) => (
              <div
                className="keyboard-row"
                key={letters}
                style={{ "--offset": offset } as CSSProperties}
              >
                {hasDelete && hideButton}

                {letters.split("").map((letter) => (
                  <button
                    className="keyboard-key"
                    key={letter}
                    onMouseDown={keepFocus}
                    onClick={() => onLetter(letter)}
                  >
                    {letter}
                  </button>
                ))}

                {hasDelete && (
                  <button
                    className="keyboard-key keyboard-key-delete"
                    aria-label="Delete"
                    onMouseDown={keepFocus}
                    onClick={onDelete}
                  >
                    <DeleteIcon />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
