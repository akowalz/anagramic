import { describe, expect, it } from "vitest"
import { fontStack, googleFontsUrl, LETTER_FONTS, UI_FONTS } from "./fonts"

describe("googleFontsUrl", () => {
  it("encodes spaces and appends axes", () => {
    expect(
      googleFontsUrl({
        name: "Space Mono",
        axes: "wght@400;700",
        fallback: "monospace",
        note: "",
      }),
    ).toBe(
      "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap",
    )
  })

  it("omits axes when not given", () => {
    expect(
      googleFontsUrl({ name: "Inter", fallback: "sans-serif", note: "" }),
    ).toBe("https://fonts.googleapis.com/css2?family=Inter&display=swap")
  })
})

describe("fontStack", () => {
  it("quotes the family and adds the fallback", () => {
    expect(
      fontStack({ name: "DM Sans", fallback: "sans-serif", note: "" }),
    ).toBe('"DM Sans", sans-serif')
  })
})

describe("font lists", () => {
  it("have unique names", () => {
    const names = [...LETTER_FONTS, ...UI_FONTS].map((f) => f.name)
    expect(new Set(names).size).toBe(names.length)
  })
})
