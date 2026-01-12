import "./App.css";

import { useState, type JSX } from "react";
import TileCanvas from "./TileCanvas/TileCanvas";
import LineTool from "./LineTool/LineTool";
import WheelTool from "./WheelTool/WheelTool";

import Form from "./Form/Form";

type Tool = "Tiles" | "Line" | "Wheel";

function App() {
  const [inputValue, setInputValue] = useState("");
  // const [letters, setLetters] = useState<string[]>([]);
  const [letters, setLetters] = useState<string[]>("ABCDEFGH".split(""));
  // const [tool, setTool] = useState<Tool>("Tiles");
  const [tool, setTool] = useState<Tool>("Wheel");

  const resetLetters = () => {
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
          <TileCanvas letters={letters} resetLetters={resetLetters} />
        </div>
        <div className={`tool-container ${tool === "Line" ? "" : "hidden"}`}>
          <LineTool letters={letters} resetLetters={resetLetters} />
        </div>
        <div className={`tool-container ${tool === "Wheel" ? "" : "hidden"}`}>
          <WheelTool letters={letters} resetLetters={resetLetters} />
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
        <div id="tool-select">
          <button onClick={() => setTool("Tiles")}>Tiles</button>
          <button onClick={() => setTool("Line")}>Line</button>
          <button onClick={() => setTool("Wheel")}>Wheel</button>
        </div>
      )}

      <div id="main-container">{getContainerView()}</div>
    </>
  );
}

export default App;
