import { useEffect } from "react"
import "./Form.css"

type FormProps = {
  inputValue: string
  setInputValue: React.Dispatch<React.SetStateAction<string>>
  setLetters: React.Dispatch<React.SetStateAction<string[]>>
}

export default function Form({
  inputValue,
  setInputValue,
  setLetters,
}: FormProps) {
  useEffect(() => {
    setTimeout(() => {
      const input = document.getElementById("fodder-input")
      if (!input) return
      input.focus()
    }, 200)
  }, [])

  const submit = () => {
    if (inputValue === "") return

    setLetters(inputValue.toUpperCase().split(""))
  }

  function onInputChange(str: string) {
    setInputValue(str.replace(/[^a-z]/gi, ""))
  }

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      autoComplete="off"
    >
      <div className="form-label">Enter letters to anagram:</div>

      <input
        name="fodder"
        id="fodder-input"
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
      />

      <button type="submit" onClick={() => submit()}>
        Let's anagram
      </button>
    </form>
  )
}
