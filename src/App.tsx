import "./App.css";

import { useState, type JSX } from "react";
import TileCanvas from "./TileCanvas/TileCanvas";
import LineTool from "./LineTool/LineTool";

import Form from "./Form/Form";

type Tool = "Tiles" | "Line";

function App() {
  const [inputValue, setInputValue] = useState("LETTERS");
  const [letters, setLetters] = useState<string[]>("LETTERS".split(""));
  const [tool, setTool] = useState<Tool>("Line");

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
        <div style={{ display: tool === "Tiles" ? "" : "none" }}>
          <TileCanvas letters={letters} resetLetters={resetLetters} />
        </div>
        <div style={{ display: tool === "Line" ? "" : "none" }}>
          <LineTool letters={letters} resetLetters={resetLetters} />
        </div>
      </>
    );
  }

  return (
    <>
      <div id="header">
        <h1>annagram thing</h1>
      </div>

      {letters.length !== 0 && (
        <div id="tool-select">
          <button onClick={() => setTool("Tiles")}>Tiles</button>
          <button onClick={() => setTool("Line")}>Line</button>
        </div>
      )}

      <div id="main-container">{getContainerView()}</div>
    </>
  );
}

export default App;
