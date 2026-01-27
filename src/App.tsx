import "./App.css"

import { useMemo, useState, type JSX } from "react"
import { type ToolActions } from "./Types/ToolActions"
import { type Tool } from "./Types/Tool"

import Form from "./Form/Form"
import ToolPicker from "./ToolPicker/ToolPicker"

import TilesTool from "./TilesTool/TilesTool"
import LineTool from "./LineTool/LineTool"
import WheelTool from "./WheelTool/WheelTool"
import FloatingTool from "./FloatingTool/FloatingTool"
import ShuffleIcon from "./Icons/ShuffleIcon"
import BackIcon from "./Icons/BackIcon"
import ResetIcon from "./Icons/ResetIcon"

type ActionsForTools = {
  [K in Tool]: ToolActions | undefined
}

function App() {
  const [toolActions, setToolActions] = useState<ActionsForTools>({
    Tiles: undefined,
    Line: undefined,
    Wheel: undefined,
    Floating: undefined,
  })

  const [inputValue, setInputValue] = useState("")

  const [letters, setLetters] = useState<string[]>([])
  const [tool, setTool] = useState<Tool>("Tiles")

  const tooltips = {
    Tiles: "Drag and drop to rearrange letters",
    Line: "Drag to move letters, tap to swap letters",
    Wheel: "Tap to swap letters",
    Floating: "Just let the letters wash over you, see if it pops out",
  }

  function setActionsForTool(tool: Tool, actions: ToolActions) {
    setToolActions((prev) => ({ ...prev, [tool]: actions }))
  }

  const currentToolActions: ToolActions = useMemo(() => {
    return toolActions[tool] || {}
  }, [tool, toolActions])

  function reset(): void {
    if (!currentToolActions.reset) {
      throw "attempted to call non-existed reset function"
    }

    currentToolActions.reset()
  }

  function shuffle(): void {
    if (!currentToolActions.shuffle) {
      throw "attempted to call non-existed shuffle function"
    }

    currentToolActions.shuffle()
  }

  const newLetters = () => {
    setInputValue("")
    setLetters([])
  }

  function getContainerView(): JSX.Element {
    if (letters.length === 0) {
      return (
        <Form
          inputValue={inputValue}
          setInputValue={setInputValue}
          setLetters={setLetters}
        />
      )
    }

    return (
      <>
        <div className={`tool-container ${tool === "Tiles" ? "" : "hidden"}`}>
          <TilesTool
            letters={letters}
            registerActions={(actions: ToolActions) =>
              setActionsForTool("Tiles", actions)
            }
          />
        </div>
        <div className={`tool-container ${tool === "Line" ? "" : "hidden"}`}>
          <LineTool
            letters={letters}
            registerActions={(actions: ToolActions) =>
              setActionsForTool("Line", actions)
            }
          />
        </div>
        <div className={`tool-container ${tool === "Wheel" ? "" : "hidden"}`}>
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
          <FloatingTool letters={letters} active={tool === "Floating"} />
        </div>
      </>
    )
  }

  return (
    <>
      <div id="header">
        <h1>assistagram</h1>
        <span className="back-button" onClick={() => newLetters()}>
          <BackIcon />
          Back
        </span>
      </div>

      {letters.length !== 0 && (
        <div id="main-navigation">
          <ToolPicker activeTool={tool} setTool={setTool} />
          <div className="tooltip">{tooltips[tool]}</div>
        </div>
      )}

      <div id="tool-container">{getContainerView()}</div>

      {letters.length !== 0 && (
        <div className="tool-footer">
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
      )}
    </>
  )
}

export default App
