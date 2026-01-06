import { useState } from "react";
import "./App.css";
import Tile from "./Tile/Tile";
import Form from "./Form/Form";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [letters, setLetters] = useState("");

  const letterTiles = letters
    .split("")
    .map((letter) => <Tile letter={letter.toUpperCase()} />);

  return (
    <>
      <div id="header">
        <h1>Anagrams App</h1>
      </div>

      <div id="main-container">
        {letters === "" && (
          <Form
            inputValue={inputValue}
            setInputValue={setInputValue}
            setLetters={setLetters}
          />
        )}

        {letters !== "" && <div id="canvas">{letterTiles}</div>}
      </div>
    </>
  );
}

export default App;
