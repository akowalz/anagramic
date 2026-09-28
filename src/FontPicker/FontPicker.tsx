import "./FontPicker.css"

import { useEffect, useState } from "react"
import {
  fontStack,
  googleFontsUrl,
  LETTER_FONTS,
  UI_FONTS,
  type FontOption,
  type FontRole,
} from "../lib/fonts"

// Dev-only overlay for trying out fonts. Overrides the --font-* CSS variables
// defined in index.css; picking "Current" restores the defaults.

const STORAGE_KEY = "anagramic-font-picker"

type Selection = Record<FontRole, string | null>

function loadSelection(): Selection {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {
    // ignore
  }
  return { letters: null, ui: null }
}

function ensureFontLoaded(font: FontOption) {
  const id = `font-picker-${font.name.replace(/ /g, "-")}`
  if (document.getElementById(id)) return

  const link = document.createElement("link")
  link.id = id
  link.rel = "stylesheet"
  link.href = googleFontsUrl(font)
  document.head.appendChild(link)
}

function findFont(fonts: FontOption[], name: string | null) {
  return fonts.find((f) => f.name === name)
}

function FontPicker() {
  const [open, setOpen] = useState(true)
  const [selection, setSelection] = useState<Selection>(loadSelection)

  // Load every option while the panel is open so the labels preview properly.
  useEffect(() => {
    if (open) [...LETTER_FONTS, ...UI_FONTS].forEach(ensureFontLoaded)
  }, [open])

  useEffect(() => {
    const root = document.documentElement
    const letters = findFont(LETTER_FONTS, selection.letters)
    const ui = findFont(UI_FONTS, selection.ui)

    if (letters) {
      ensureFontLoaded(letters)
      root.style.setProperty("--font-letters", fontStack(letters))
    } else {
      root.style.removeProperty("--font-letters")
    }

    if (ui) {
      ensureFontLoaded(ui)
      root.style.setProperty("--font-ui", fontStack(ui))
      root.style.setProperty("--font-tool-picker", fontStack(ui))
      root.dataset.fontPickerUi = ""
    } else {
      root.style.removeProperty("--font-ui")
      root.style.removeProperty("--font-tool-picker")
      delete root.dataset.fontPickerUi
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selection))
    } catch {
      // ignore
    }
  }, [selection])

  function select(role: FontRole, name: string | null) {
    setSelection((prev) => ({ ...prev, [role]: name }))
  }

  if (!open) {
    return (
      <button
        className="font-picker-toggle"
        onClick={() => setOpen(true)}
        aria-label="Show font picker"
      >
        Aa
      </button>
    )
  }

  return (
    <div className="font-picker" role="dialog" aria-label="Font picker">
      <div className="font-picker-header">
        <strong>Fonts</strong>
        <button onClick={() => setOpen(false)}>Hide</button>
      </div>

      <FontGroup
        title="Letters"
        sample="ANAGRAM"
        fonts={LETTER_FONTS}
        selected={selection.letters}
        onSelect={(name) => select("letters", name)}
      />
      <FontGroup
        title="Interface"
        sample="Drag to move letters"
        fonts={UI_FONTS}
        selected={selection.ui}
        onSelect={(name) => select("ui", name)}
      />
    </div>
  )
}

type FontGroupProps = {
  title: string
  sample: string
  fonts: FontOption[]
  selected: string | null
  onSelect: (name: string | null) => void
}

function FontGroup({ title, sample, fonts, selected, onSelect }: FontGroupProps) {
  return (
    <fieldset className="font-picker-group">
      <legend>{title}</legend>

      <label className={selected === null ? "selected" : ""}>
        <input
          type="radio"
          checked={selected === null}
          onChange={() => onSelect(null)}
        />
        <span className="font-picker-name">Current</span>
      </label>

      {fonts.map((font) => (
        <label
          key={font.name}
          className={selected === font.name ? "selected" : ""}
        >
          <input
            type="radio"
            checked={selected === font.name}
            onChange={() => onSelect(font.name)}
          />
          <span className="font-picker-name">
            {font.name}
            <small>{font.note}</small>
          </span>
          <span
            className="font-picker-sample"
            style={{ fontFamily: fontStack(font) }}
          >
            {sample}
          </span>
        </label>
      ))}
    </fieldset>
  )
}

export default FontPicker
