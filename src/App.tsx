import "./App.css";

import { useState, type JSX } from "react";
import TileCanvas from "./TileCanvas/TileCanvas";

import Form from "./Form/Form";

type Tool = "Tiles" | "Line";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [letters, setLetters] = useState<string[]>([]);
  const [tool, setTool] = useState<Tool>("Tiles");

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

    switch (tool) {
      case "Tiles":
        return <TileCanvas letters={letters} resetLetters={resetLetters} />;

      case "Line":
        return <div>Line tool</div>;

      default:
        throw `unknown tool ${tool}`;
    }
  }

  return (
    <>
      <div id="header">
        <h1>annagram thing</h1>
      </div>

      <div id="main-container">{getContainerView()}</div>
    </>
  );
}

export default App;
