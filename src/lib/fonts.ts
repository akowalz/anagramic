export type FontRole = "letters" | "ui"

export type FontOption = {
  name: string
  // Google Fonts axis spec, e.g. "ital,wght@0,400;0,700". Omit for defaults.
  axes?: string
  fallback: string
  note: string
}

const ITAL_400_700 = "ital,wght@0,400;0,700;1,400;1,700"
const ITAL_400_600_700 = "ital,wght@0,400;0,600;0,700;1,400;1,600;1,700"

// Used for the tiles, the logo and the fodder input.
export const LETTER_FONTS: FontOption[] = [
  {
    name: "Space Mono",
    axes: ITAL_400_700,
    fallback: "monospace",
    note: "Quirky geometric mono",
  },
  {
    name: "JetBrains Mono",
    axes: ITAL_400_700,
    fallback: "monospace",
    note: "Clean, tall mono",
  },
  {
    name: "IBM Plex Mono",
    axes: ITAL_400_700,
    fallback: "monospace",
    note: "Typewriter-ish, a bit of character",
  },
  {
    name: "Courier Prime",
    axes: ITAL_400_700,
    fallback: "monospace",
    note: "Classic newsprint typewriter",
  },
  {
    name: "DM Serif Display",
    axes: "ital@0;1",
    fallback: "serif",
    note: "Newspaper-crossword serif",
  },
  {
    name: "Fraunces",
    axes: ITAL_400_700,
    fallback: "serif",
    note: "Soft, bookish serif",
  },
  {
    name: "Rubik",
    axes: ITAL_400_700,
    fallback: "sans-serif",
    note: "Chunky, game-tile feel",
  },
]

// Used for body text, buttons and the tool picker.
export const UI_FONTS: FontOption[] = [
  {
    name: "Inter",
    axes: ITAL_400_600_700,
    fallback: "sans-serif",
    note: "Neutral workhorse",
  },
  {
    name: "DM Sans",
    axes: ITAL_400_600_700,
    fallback: "sans-serif",
    note: "Friendly geometric",
  },
  {
    name: "Space Grotesk",
    axes: "wght@400;600;700",
    fallback: "sans-serif",
    note: "Pairs with Space Mono (no italics)",
  },
  {
    name: "IBM Plex Sans",
    axes: ITAL_400_600_700,
    fallback: "sans-serif",
    note: "Pairs with IBM Plex Mono",
  },
  {
    name: "Work Sans",
    axes: ITAL_400_600_700,
    fallback: "sans-serif",
    note: "Slightly wide, relaxed",
  },
  {
    name: "Nunito",
    axes: ITAL_400_600_700,
    fallback: "sans-serif",
    note: "Rounded, playful",
  },
  {
    name: "Lora",
    axes: ITAL_400_600_700,
    fallback: "serif",
    note: "Literary serif",
  },
]

export function googleFontsUrl(font: FontOption): string {
  const family = font.name.replace(/ /g, "+")
  const axes = font.axes ? `:${font.axes}` : ""
  return `https://fonts.googleapis.com/css2?family=${family}${axes}&display=swap`
}

export function fontStack(font: FontOption): string {
  return `"${font.name}", ${font.fallback}`
}
