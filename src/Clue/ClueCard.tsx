import "./ClueCard.css"
import { Fragment, useState } from "react"
import { answerLength, parseClue } from "../lib/clue"

type Props = {
  clue: string
  editing: boolean
  // How many letters there are, to compare with the answer's length
  letterCount: number
  // Whether a word (by its position in the clue) has added its letters
  isWordUsed: (index: number) => boolean
  onToggleWord: (index: number, letters: string) => void
  onSave: (clue: string) => void
  onEdit: () => void
  onRemove: () => void
}

/*
 * A clue entered for reference. While editing it's a text box; otherwise its
 * words can be tapped to add their letters, and tapped again to take them out.
 */
export default function ClueCard({
  clue,
  editing,
  letterCount,
  isWordUsed,
  onToggleWord,
  onSave,
  onEdit,
  onRemove,
}: Props) {
  if (editing) return <ClueEditor clue={clue} onSave={onSave} />

  const tokens = parseClue(clue)
  const length = answerLength(tokens)

  return (
    <div className="clue-card">
      <p className="clue-text">
        {tokens.map((token, index) => (
          // Real spaces between words, so the clue reads (and copies) properly
          <Fragment key={index}>
            {index > 0 && " "}
            {token.kind === "word" ? (
              <button
                className={`clue-word ${isWordUsed(index) ? "used" : ""}`}
                aria-pressed={isWordUsed(index)}
                onClick={() => onToggleWord(index, token.letters)}
              >
                {token.text}
              </button>
            ) : (
              <span
                className={
                  token.kind === "enumeration" ? "clue-enumeration" : undefined
                }
              >
                {token.text}
              </span>
            )}
          </Fragment>
        ))}
      </p>

      {/* Down here, so the words can use the card's full width */}
      <div className="clue-meta">
        <span>Tap words to use their letters</span>
        <span className="clue-meta-end">
          {length === null ? (
            `${letterCount} ${letterCount === 1 ? "letter" : "letters"}`
          ) : (
            // Against the answer's length: yellow when it matches, red when
            // there are too many
            <span
              className={`clue-count ${
                letterCount === length
                  ? "exact"
                  : letterCount > length
                    ? "over"
                    : ""
              }`}
              aria-label={`${letterCount} of ${length} letters`}
            >
              {letterCount}/{length}
            </span>
          )}
          <span className="clue-card-actions">
            <button aria-label="Edit clue" onClick={onEdit}>
              ✎
            </button>
            <button aria-label="Remove clue" onClick={onRemove}>
              ✕
            </button>
          </span>
        </span>
      </div>
    </div>
  )
}

function ClueEditor({
  clue,
  onSave,
}: {
  clue: string
  onSave: (clue: string) => void
}) {
  const [text, setText] = useState(clue)

  return (
    <form
      className="clue-card"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(text)
      }}
    >
      <textarea
        className="clue-input"
        aria-label="Clue"
        placeholder="Paste or type the clue"
        value={text}
        autoFocus
        rows={2}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          // Enter finishes; the clue is one line
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            onSave(text)
          }
        }}
      />
      <div className="clue-meta">
        <span>Include the length, e.g. (8), to count letters</span>
        <button type="submit" className="clue-done">
          Done
        </button>
      </div>
    </form>
  )
}
