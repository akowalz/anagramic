import "./App.css"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { TOOL_BUTTONS, type ToolActions } from "./Types/ToolActions"
import { type Tool } from "./Types/Tool"

import ToolPicker from "./ToolPicker/ToolPicker"
import ToolDropdown from "./ToolPicker/ToolDropdown"
import ClueCard from "./Clue/ClueCard"
import Keyboard from "./Keyboard/Keyboard"
import { useTypedKeys } from "./hooks/useTypedKeys"
import { useBoard, type BoardActions } from "./hooks/useBoard"
import { useHints } from "./hooks/useHints"
import Hint from "./Hint/Hint"

import TilesTool from "./TilesTool/TilesTool"
import LineTool from "./LineTool/LineTool"
import WheelTool from "./WheelTool/WheelTool"
import FloatingTool from "./FloatingTool/FloatingTool"
import ShuffleIcon from "./Icons/ShuffleIcon"
import ResetIcon from "./Icons/ResetIcon"
import KeyboardIcon from "./Icons/KeyboardIcon"
import AboutPage from "./AboutPage/AboutPage"
import { createLetter, lettersToString } from "./lib/letters"
import { boardFromString, type Board } from "./lib/board"

/* Letters from a shared link (?fodder=...) */
function boardFromUrl(): Board {
  const params = new URLSearchParams(window.location.search)
  const fodder = params.get("fodder") ?? ""

  return boardFromString(fodder.replace(/[^a-z]/gi, "").toUpperCase())
}

/* A clue from a shared link (?clue=...) */
function clueFromUrl(): string | null {
  const clue = new URLSearchParams(window.location.search).get("clue")
  return clue?.trim() || null
}

/* The "try another tool" hint fades out slowly, then "Add a clue" fades in */
const TOOLBAR_HINT_FADE_MS = 1200

function App() {
  const [showAboutPage, setShowAboutPage] = useState(false)
  // The letters, their arrangement, locks and selection, shared by the tools
  const [board, actions] = useBoard(boardFromUrl)
  const { letters } = board

  const [keyboardOpen, setKeyboardOpen] = useState(true)
  const [tool, setTool] = useState<Tool>("Line")

  // The tutorial: hints above the letters, learned by doing what they say
  const hints = useHints()
  const { learn } = hints

  // "Add a clue" takes the "try another tool" hint's place once that's
  // learned. If that happens now, it waits for the hint to fade out first;
  // if it was learned on an earlier visit, it's just there.
  const [toolsKnownAtStart] = useState(() => hints.learned.has("try-tools"))

  // Each tool uses the selection in its own way (in the wheel, tapping
  // another tile swaps with it), so a new tool starts with nothing selected
  function switchTool(newTool: Tool) {
    if (newTool !== tool) learn("try-tools")
    setTool(newTool)
    actions.select(null)
  }

  // The board's actions, plus learning the hints they teach
  const { locked } = board
  const toolActions: BoardActions = useMemo(
    () => ({
      ...actions,
      toggleLock(id: number) {
        learn(locked.has(id) ? "unlock" : "lock")
        actions.toggleLock(id)
      },
      swap(idA: number, idB: number) {
        learn("wheel-swap")
        actions.swap(idA, idB)
      },
    }),
    [actions, learn, locked],
  )

  // In Line and Wheel, delete works back through the letters as they're laid
  // out (e.g. right to left along the line). Elsewhere there's no one order to
  // see, so it goes back through the order they were typed.
  const pressDelete = useCallback(() => {
    actions.pressDelete(
      tool === "Line" || tool === "Wheel" ? "arranged" : "typed",
    )
  }, [actions, tool])

  // A clue entered for reference (null for none). Its words can be tapped to
  // add their letters: `clueWordLetters` keeps the ids of the letters each
  // tapped word added, by the word's position in the clue.
  const [clue, setClue] = useState(clueFromUrl)
  const [editingClue, setEditingClue] = useState(false)
  const [clueWordLetters, setClueWordLetters] = useState<
    Record<number, number[]>
  >({})
  const clueMode = clue !== null || editingClue

  const letterIds = new Set(letters.map((letter) => letter.id))
  // A word counts as used while any of its letters are still there
  const isWordUsed = (index: number) =>
    (clueWordLetters[index] ?? []).some((id) => letterIds.has(id))

  function toggleClueWord(index: number, wordLetters: string) {
    if (isWordUsed(index)) {
      actions.removeLetters(clueWordLetters[index])
      setClueWordLetters((words) => {
        const rest = { ...words }
        delete rest[index]
        return rest
      })
      return
    }

    const added = [...wordLetters].map(createLetter)
    actions.addLetters(added)
    setClueWordLetters((words) => ({
      ...words,
      [index]: added.map((letter) => letter.id),
    }))
  }

  function saveClue(text: string) {
    const trimmed = text.trim()
    setEditingClue(false)
    // An emptied clue is no clue. The letters it added stay either way.
    if (trimmed !== clue) setClueWordLetters({})
    setClue(trimmed || null)
  }

  function removeClue() {
    setEditingClue(false)
    setClue(null)
    setClueWordLetters({})
  }

  // The letter keys type into the clue while it's being edited
  useTypedKeys(!showAboutPage && !editingClue, actions.typeLetter, pressDelete)

  // Keep the link in step with the letters and clue, so it can be shared
  // and survives a reload
  useEffect(() => {
    const url = new URL(window.location.href)
    if (letters.length > 0) {
      url.searchParams.set("fodder", lettersToString(letters))
    } else {
      url.searchParams.delete("fodder")
    }
    if (clue !== null) {
      url.searchParams.set("clue", clue)
    } else {
      url.searchParams.delete("clue")
    }
    window.history.replaceState(null, "", url)
  }, [letters, clue])

  // Each tool hands the app its actions through one of these
  const tilesRef = useRef<ToolActions>(null)
  const lineRef = useRef<ToolActions>(null)
  const wheelRef = useRef<ToolActions>(null)
  const floatingRef = useRef<ToolActions>(null)

  function currentToolActions(): ToolActions | null {
    const refs = {
      Tiles: tilesRef,
      Line: lineRef,
      Wheel: wheelRef,
      Floating: floatingRef,
    }
    return refs[tool].current
  }

  const buttons = TOOL_BUTTONS[tool]

  function reset(): void {
    currentToolActions()?.reset?.()
  }

  function shuffle(): void {
    currentToolActions()?.shuffle?.()
  }

  return (
    <>
      <div id="header">
        <h1 onClick={() => setShowAboutPage(!showAboutPage)}>anagramic</h1>
        {/* The clue takes the tool picker's place, so it moves up here */}
        {!showAboutPage && clueMode && (
          <ToolDropdown activeTool={tool} setTool={switchTool} />
        )}
      </div>

      {showAboutPage ? (
        <AboutPage />
      ) : (
        <>
          <div id="main-navigation">
            {clueMode ? (
              <ClueCard
                clue={clue ?? ""}
                editing={editingClue}
                letterCount={letters.length}
                isWordUsed={isWordUsed}
                onToggleWord={toggleClueWord}
                onSave={saveClue}
                onEdit={() => setEditingClue(true)}
                onRemove={removeClue}
              />
            ) : (
              <ToolPicker activeTool={tool} setTool={switchTool} />
            )}
            {/* A quieter way in than the empty prompt, once there are letters.
                Only after the tutorial's last hint (trying another tool) is
                done, so new users learn the basics first; it then takes that
                hint's place under the tool picker for good. */}
            {!clueMode &&
              letters.length > 0 &&
              hints.learned.has("try-tools") && (
                <button
                  className={`add-clue-link ${
                    toolsKnownAtStart ? "" : "after-hint"
                  }`}
                  style={
                    {
                      "--hint-gone": `${TOOLBAR_HINT_FADE_MS}ms`,
                    } as React.CSSProperties
                  }
                  onClick={() => setEditingClue(true)}
                >
                  <span aria-hidden>✎</span> Add a clue
                </button>
              )}
            {/* Hints about the tool picker, just under it (with a clue, the
                picker is the dropdown in the header) */}
            {!clueMode && letters.length > 0 && (
              <Hint
                className="toolbar-hint"
                text={hints.underToolbar(tool)}
                fadeMs={TOOLBAR_HINT_FADE_MS}
              />
            )}
          </div>

          <div id="tool-container">
            <div
              className={`tool-container ${tool === "Tiles" ? "" : "hidden"}`}
            >
              <TilesTool
                board={board}
                actions={toolActions}
                hints={hints}
                ref={tilesRef}
              />
            </div>
            <div
              className={`tool-container ${tool === "Line" ? "" : "hidden"}`}
            >
              <LineTool
                board={board}
                actions={toolActions}
                hints={hints}
                ref={lineRef}
              />
            </div>
            <div
              className={`tool-container ${tool === "Wheel" ? "" : "hidden"}`}
            >
              <WheelTool
                board={board}
                actions={toolActions}
                hints={hints}
                ref={wheelRef}
              />
            </div>
            <div
              className={`tool-container ${tool === "Floating" ? "" : "hidden"}`}
            >
              <FloatingTool
                board={board}
                actions={toolActions}
                hints={hints}
                active={tool === "Floating"}
                ref={floatingRef}
              />
            </div>

            {letters.length === 0 && (
              <div className="empty-prompt">
                {clueMode
                  ? "Tap words in the clue, or type"
                  : "Type to add letters"}
                {!clueMode && (
                  <button
                    className="empty-prompt-clue"
                    onClick={() => setEditingClue(true)}
                  >
                    <span aria-hidden>✎</span> or add a clue
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="tool-footer">
            {!keyboardOpen && (
              <button onClick={() => setKeyboardOpen(true)}>
                <KeyboardIcon />
                Keyboard
              </button>
            )}

            {buttons.reset && (
              <button onClick={reset}>
                <ResetIcon />
                Reset
              </button>
            )}

            {buttons.shuffle && (
              <button onClick={shuffle}>
                <ShuffleIcon />
                Shuffle
              </button>
            )}
          </div>

          <Keyboard
            open={keyboardOpen}
            onHide={() => setKeyboardOpen(false)}
            onLetter={actions.typeLetter}
            onDelete={pressDelete}
          />
        </>
      )}
    </>
  )
}

export default App
