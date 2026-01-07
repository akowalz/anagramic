import { useEffect } from "react";
import "./Form.css";

type FormProps = {
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  setLetters: React.Dispatch<React.SetStateAction<string[]>>;
};

export default function Form({
  inputValue,
  setInputValue,
  setLetters,
}: FormProps) {
  useEffect(() => {
    const input = document.getElementById("fodder-input");
    if (!input) return;
    input.focus();
  }, []);

  const submit = () => {
    if (inputValue === "") return;

    setLetters(inputValue.toUpperCase().split(""));
  };

  return (
    <form className="form" onSubmit={() => submit()}>
      <div className="form-label">Enter letters to anagram:</div>
      <input
        name="fodder"
        id="fodder-input"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />

      <button type="submit" onClick={() => submit()}>
        Let's anagram
      </button>
    </form>
  );
}
