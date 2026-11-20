import "./App.css"

import { useCallback, useEffect, useRef, useState } from "react"
import { TOOL_BUTTONS, type ToolActions } from "./Types/ToolActions"
import { type Tool } from "./Types/Tool"

import ToolPicker from "./ToolPicker/ToolPicker"
import Keyboard from "./Keyboard/Keyboard"
import { useTypedKeys } from "./hooks/useTypedKeys"

import TilesTool from "./TilesTool/TilesTool"
import LineTool from "./LineTool/LineTool"
import WheelTool from "./WheelTool/WheelTool"
import FloatingTool from "./FloatingTool/FloatingTool"
import ShuffleIcon from "./Icons/ShuffleIcon"
import ResetIcon from "./Icons/ResetIcon"
import KeyboardIcon from "./Icons/KeyboardIcon"
import AboutPage from "./AboutPage/AboutPage"
import {
  createLetter,
  lettersFromString,
  lettersToString,
  pressDelete,
  type Selection,
} from "./lib/letters"

/* Letters from a shared link (?fodder=...) */
function lettersFromUrl(): Selection {
  const params = new URLSearchParams(window.location.search)
  const fodder = params.get("fodder") ?? ""

  const letters = lettersFromString(fodder.replace(/[^a-z]/gi, "").toUpperCase())
  return { letters, selectedId: null }
}

function App() {
  const [showAboutPage, setShowAboutPage] = useState(false)
  // The letters, and the selected one. Together, since the delete key
  // changes both at once.
  const [{ letters, selectedId }, setSelection] =
    useState<Selection>(lettersFromUrl)

  const [keyboardOpen, setKeyboardOpen] = useState(true)
  const [tool, setTool] = useState<Tool>("Tiles")

  const select = useCallback((id: number | null) => {
    setSelection((selection) => ({ ...selection, selectedId: id }))
  }, [])

  // Each tool uses the selection in its own way (in the wheel, tapping
  // another tile swaps with it), so a new tool starts with nothing selected
  function switchTool(newTool: Tool) {
    setTool(newTool)
    select(null)
  }

  const tooltips = {
    Tiles: "Drag to rearrange letters, tap to lock",
    Line: "Drag to move letters, tap to lock",
    Wheel: "Tap to swap or lock letters",
    Floating: "Just let the letters float by",
  }

  const addLetter = useCallback((char: string) => {
    setSelection(({ letters }) => ({
      letters: [...letters, createLetter(char)],
      selectedId: null,
    }))
  }, [])

  const deleteLetter = useCallback(() => {
    setSelection(pressDelete)
  }, [])

  useTypedKeys(!showAboutPage, addLetter, deleteLetter)

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
                letters={letters}
                selectedId={selectedId}
                select={select}
                ref={tilesRef}
              />
            </div>
            <div
              className={`tool-container ${tool === "Line" ? "" : "hidden"}`}
            >
              <LineTool
                letters={letters}
                selectedId={selectedId}
                select={select}
                ref={lineRef}
              />
            </div>
            <div
              className={`tool-container ${tool === "Wheel" ? "" : "hidden"}`}
            >
              <WheelTool
                letters={letters}
                selectedId={selectedId}
                select={select}
                ref={wheelRef}
              />
            </div>
            <div
              className={`tool-container ${tool === "Floating" ? "" : "hidden"}`}
            >
              <FloatingTool
                letters={letters}
                selectedId={selectedId}
                active={tool === "Floating"}
                ref={floatingRef}
              />
            </div>

            {letters.length === 0 && (
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
            onLetter={addLetter}
            onDelete={deleteLetter}
          />
        </>
      )}
    </>
  )
}

export default App
