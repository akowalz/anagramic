import "./App.css";

import { useState } from "react";
import TileCanvas from "./TileCanvas/TileCanvas";

import Form from "./Form/Form";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [letters, setLetters] = useState<string[]>([]);

  return (
    <>
      <div id="header">
        <h1>Anagrams App</h1>
      </div>

      <div id="main-container">
        {letters.length === 0 && (
          <Form
            inputValue={inputValue}
            setInputValue={setInputValue}
            setLetters={setLetters}
          />
        )}

        {letters.length > 0 && <TileCanvas letters={letters} />}
      </div>
    </>
  );
}

export default App;
