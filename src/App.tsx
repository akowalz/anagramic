import "./App.css";

import { useMemo, useState, type JSX } from "react";
import { type ToolActions } from "./Types/ToolActions";

import TileCanvas from "./TileCanvas/TileCanvas";
import LineTool from "./LineTool/LineTool";
import WheelTool from "./WheelTool/WheelTool";
import Form from "./Form/Form";

type Tool = "Tiles" | "Line" | "Wheel";

type ActionsForTools = {
  [K in Tool]: ToolActions | undefined;
};

function App() {
  const [toolActions, setToolActions] = useState<ActionsForTools>({
    Tiles: undefined,
    Line: undefined,
    Wheel: undefined,
  });

  const [inputValue, setInputValue] = useState("");

  const [letters, setLetters] = useState<string[]>([]);
  const [tool, setTool] = useState<Tool>("Tiles");

  const tooltips = {
    Tiles: "Drag and drop to rearrange letters",
    Line: "Tap to swap positions of letters",
    Wheel: "Tap to swap positions of letters",
  };

  function setActionsForTool(tool: Tool, actions: ToolActions) {
    setToolActions((prev) => ({ ...prev, [tool]: actions }));
  }

  const currentToolActions: ToolActions = useMemo(() => {
    return toolActions[tool] || {};
  }, [tool, toolActions]);

  function reset(): void {
    if (!currentToolActions.reset) {
      throw "attempted to call non-existed reset function";
    }

    currentToolActions.reset();
  }

  function shuffle(): void {
    if (!currentToolActions.shuffle) {
      throw "attempted to call non-existed shuffle function";
    }

    currentToolActions.shuffle();
  }

  const newLetters = () => {
    setInputValue("");
    setLetters([]);
  };

  function getContainerView(): JSX.Element {
    if (letters.length === 0) {
      return (
        <Form
          inputValue={inputValue}
          setInputValue={setInputValue}
          setLetters={setLetters}
        />
      );
    }

    return (
      <>
        <div className={`tool-container ${tool === "Tiles" ? "" : "hidden"}`}>
          <TileCanvas
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
      </>
    );
  }

  return (
    <>
      <div id="header">
        <h1>anagram thing</h1>
      </div>

      {letters.length !== 0 && (
        <div id="main-navigation">
          <div id="tool-select">
            <button onClick={() => setTool("Tiles")}>Tiles</button>
            <button onClick={() => setTool("Line")}>Line</button>
            <button onClick={() => setTool("Wheel")}>Wheel</button>
          </div>
          <div className="tooltip">{tooltips[tool]}</div>
        </div>
      )}

      <div id="tool-container">{getContainerView()}</div>

      {letters.length !== 0 && (
        <div className="tool-footer">
          {currentToolActions.reset && <button onClick={reset}>Reset</button>}
          {currentToolActions.shuffle && (
            <button onClick={shuffle}>Shuffle</button>
          )}
          <button onClick={() => newLetters()}>New Letters</button>
        </div>
      )}
    </>
  );
}

export default App;
