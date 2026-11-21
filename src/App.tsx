import "./App.css"

import { useEffect, useRef, useState } from "react"
import { TOOL_BUTTONS, type ToolActions } from "./Types/ToolActions"
import { type Tool } from "./Types/Tool"

import ToolPicker from "./ToolPicker/ToolPicker"
import Keyboard from "./Keyboard/Keyboard"
import { useTypedKeys } from "./hooks/useTypedKeys"
import { useBoard } from "./hooks/useBoard"

import TilesTool from "./TilesTool/TilesTool"
import LineTool from "./LineTool/LineTool"
import WheelTool from "./WheelTool/WheelTool"
import FloatingTool from "./FloatingTool/FloatingTool"
import ShuffleIcon from "./Icons/ShuffleIcon"
import ResetIcon from "./Icons/ResetIcon"
import KeyboardIcon from "./Icons/KeyboardIcon"
import AboutPage from "./AboutPage/AboutPage"
import { lettersToString } from "./lib/letters"
import { boardFromString, type Board } from "./lib/board"

/* Letters from a shared link (?fodder=...) */
function boardFromUrl(): Board {
  const params = new URLSearchParams(window.location.search)
  const fodder = params.get("fodder") ?? ""

  return boardFromString(fodder.replace(/[^a-z]/gi, "").toUpperCase())
}

function App() {
  const [showAboutPage, setShowAboutPage] = useState(false)
  // The letters, their arrangement, locks and selection, shared by the tools
  const [board, actions] = useBoard(boardFromUrl)
  const { letters } = board

  const [keyboardOpen, setKeyboardOpen] = useState(true)
  const [tool, setTool] = useState<Tool>("Line")

  // Each tool uses the selection in its own way (in the wheel, tapping
  // another tile swaps with it), so a new tool starts with nothing selected
  function switchTool(newTool: Tool) {
    setTool(newTool)
    actions.select(null)
  }

  const tooltips = {
    Tiles: "Drag to rearrange letters, tap to lock",
    Line: "Drag to move letters, tap to lock",
    Wheel: "Tap to swap or lock letters",
    Floating: "Just let the letters float by",
  }

  useTypedKeys(!showAboutPage, actions.typeLetter, actions.pressDelete)

  // Keep the link in step with the letters so it can be shared
  useEffect(() => {
    const url = new URL(window.location.href)
    if (letters.length > 0) {
      url.searchParams.set("fodder", lettersToString(letters))
    } else {
      url.searchParams.delete("fodder")
    }
    window.history.replaceState(null, "", url)
  }, [letters])

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
      </div>

      {showAboutPage ? (
        <AboutPage />
      ) : (
        <>
          <div id="main-navigation">
            <ToolPicker activeTool={tool} setTool={switchTool} />
            <div className="tooltip">{tooltips[tool]}</div>
          </div>

          <div id="tool-container">
            <div
              className={`tool-container ${tool === "Tiles" ? "" : "hidden"}`}
            >
              <TilesTool
                board={board}
                actions={actions}
                ref={tilesRef}
              />
            </div>
            <div
              className={`tool-container ${tool === "Line" ? "" : "hidden"}`}
            >
              <LineTool
                board={board}
                actions={actions}
                ref={lineRef}
              />
            </div>
            <div
              className={`tool-container ${tool === "Wheel" ? "" : "hidden"}`}
            >
              <WheelTool
                board={board}
                actions={actions}
                ref={wheelRef}
              />
            </div>
            <div
              className={`tool-container ${tool === "Floating" ? "" : "hidden"}`}
            >
              <FloatingTool
                board={board}
                actions={actions}
                active={tool === "Floating"}
                ref={floatingRef}
              />
            </div>

            {/* Line shows its own prompt, on its empty shelf */}
            {letters.length === 0 && tool !== "Line" && (
              <div className="empty-prompt">Type to add letters</div>
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
            onDelete={actions.pressDelete}
          />
        </>
      )}
    </>
  )
}

export default App
