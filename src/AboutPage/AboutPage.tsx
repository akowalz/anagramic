import "./AboutPage.css"

export default function AboutPage() {
  return (
    <div className="about-page">
      <h2>About</h2>
      <p>
        Anagramic helps you find anagrams visually. I built it to help solve{" "}
        <a href="https://minutecryptic.com">Minute Cryptic</a> and other{" "}
        <a href="https://en.wikipedia.org/wiki/Cryptic_crossword">
          cryptic crossword
        </a>{" "}
        clues.
      </p>
      <p>
        Often, cryptic crossword clues require finding anagrams from a long set
        of letters. Anagramic helps you find these anagrams visually, so you
        don't have to resort to an anagram solver.
      </p>
      <p>
        Anagramic is and will always be free to use. If you find it useful,
        share it with a fellow solver!
      </p>
    </div>
  )
}
