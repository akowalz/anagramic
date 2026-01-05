import { useState } from "react";
import "./App.css";
import Tile from "./Components/Tile";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [letters, setLetters] = useState("");

  const letterTiles = letters
    .split("")
    .map((letter) => <Tile letter={letter} />);

  return (
    <>
      <div id="header">
        <h1>Anagrams App</h1>
      </div>
      {letters === "" && (
        <div className="form">
          <h2>Enter fodder letters</h2>
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />

          <button onClick={() => setLetters(inputValue)}>Submit</button>
        </div>
      )}
      {letters !== "" && <div id="canvas">{letterTiles}</div>}
    </>
  );
}

export default App;
