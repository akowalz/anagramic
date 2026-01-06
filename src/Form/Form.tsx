type FormProps = {
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  setLetters: React.Dispatch<React.SetStateAction<string>>;
};

function Form({ inputValue, setInputValue, setLetters }: FormProps) {
  const submit = () => {
    setLetters(inputValue.toUpperCase());
  };

  return (
    <form className="form" onSubmit={() => submit()}>
      <div className="form-label">Enter fodder letters:</div>
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />

      <button type="submit" onClick={() => submit()}>
        Let's anagram
      </button>
    </form>
  );
}

export default Form;
