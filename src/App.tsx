import "./App.css"

import { useCallback, useEffect, useMemo, useState } from "react"
import { type ToolActions } from "./Types/ToolActions"
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

type ActionsForTools = {
  [K in Tool]: ToolActions | undefined
}

/* Letters from a shared link (?fodder=...) */
function lettersFromUrl(): string[] {
  const params = new URLSearchParams(window.location.search)
  const fodder = params.get("fodder") ?? ""

  return fodder
    .replace(/[^a-z]/gi, "")
    .toUpperCase()
    .split("")
}

function App() {
  const [toolActions, setToolActions] = useState<ActionsForTools>({
    Tiles: undefined,
    Line: undefined,
    Wheel: undefined,
    Floating: undefined,
  })

  const [showAboutPage, setShowAboutPage] = useState(false)
  const [letters, setLetters] = useState<string[]>(lettersFromUrl)

  const [keyboardOpen, setKeyboardOpen] = useState(true)
  const [tool, setTool] = useState<Tool>("Tiles")

  const tooltips = {
    Tiles: "Drag to rearrange letters, tap to lock",
    Line: "Drag to move letters, tap to lock",
    Wheel: "Tap to swap or lock letters",
    Floating: "Just let the letters float by",
  }

  const addLetter = useCallback((letter: string) => {
    setLetters((letters) => [...letters, letter])
  }, [])

  const deleteLetter = useCallback(() => {
    setLetters((letters) => letters.slice(0, -1))
  }, [])

  useTypedKeys(!showAboutPage, addLetter, deleteLetter)

  // Keep the link in step with the letters so it can be shared
  useEffect(() => {
    const url = new URL(window.location.href)
    if (letters.length > 0) {
      url.searchParams.set("fodder", letters.join(""))
    } else {
      url.searchParams.delete("fodder")
    }
    window.history.replaceState(null, "", url)
  }, [letters])

  function setActionsForTool(tool: Tool, actions: ToolActions) {
    setToolActions((prev) => ({ ...prev, [tool]: actions }))
  }

  const currentToolActions: ToolActions = useMemo(() => {
    return toolActions[tool] || {}
  }, [tool, toolActions])

  function reset(): void {
    if (!currentToolActions.reset) {
      throw "attempted to call non-existant reset function"
    }

    currentToolActions.reset()
  }

  function shuffle(): void {
    if (!currentToolActions.shuffle) {
      throw "attempted to call non-existant shuffle function"
    }

    currentToolActions.shuffle()
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
            <ToolPicker activeTool={tool} setTool={setTool} />
            <div className="tooltip">{tooltips[tool]}</div>
          </div>

          <div id="tool-container">
            <div
              className={`tool-container ${tool === "Tiles" ? "" : "hidden"}`}
            >
              <TilesTool
                letters={letters}
                registerActions={(actions: ToolActions) =>
                  setActionsForTool("Tiles", actions)
                }
              />
            </div>
            <div
              className={`tool-container ${tool === "Line" ? "" : "hidden"}`}
            >
              <LineTool
                letters={letters}
                registerActions={(actions: ToolActions) =>
                  setActionsForTool("Line", actions)
                }
              />
            </div>
            <div
              className={`tool-container ${tool === "Wheel" ? "" : "hidden"}`}
            >
              <WheelTool
                letters={letters}
                registerActions={(actions: ToolActions) =>
                  setActionsForTool("Wheel", actions)
                }
              />
            </div>
            <div
              className={`tool-container ${tool === "Floating" ? "" : "hidden"}`}
            >
              <FloatingTool
                letters={letters}
                active={tool === "Floating"}
                registerActions={(actions: ToolActions) =>
                  setActionsForTool("Floating", actions)
                }
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

            {currentToolActions.reset && (
              <button onClick={reset}>
                <ResetIcon />
                Reset
              </button>
            )}

            {currentToolActions.shuffle && (
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
