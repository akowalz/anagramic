// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react"
import userEvent, { type UserEvent } from "@testing-library/user-event"
import App from "./App"
import type { Tool } from "./Types/Tool"

/*
 * UI tests for navigation and each tool, run in a simulated browser (jsdom).
 * jsdom has no CSS or layout, so tiles all sit at (0, 0) and "hidden" tools
 * are still in the DOM. Tests check which tool container is marked hidden
 * rather than what is actually on screen.
 */

beforeAll(() => {
  // jsdom doesn't implement pointer capture, which Freeform tiles use to drag
  HTMLElement.prototype.setPointerCapture = () => {}
  HTMLElement.prototype.releasePointerCapture = () => {}
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const ALL_TOOLS: Tool[] = ["Tiles", "Line", "Wheel", "Floating"]

const PICKER_LABELS: Record<Tool, string> = {
  Tiles: "Freeform",
  Line: "Line",
  Wheel: "Wheel",
  Floating: "Floating",
}

const TOOLTIPS: Record<Tool, string> = {
  Tiles: "Drag and drop to rearrange letters",
  Line: "Drag to move letters",
  Wheel: "Tap to swap letters",
  Floating: "Just let the letters float by",
}

function renderApp(url = "/"): UserEvent {
  window.history.replaceState(null, "", url)
  const user = userEvent.setup()
  render(<App />)
  return user
}

async function enterFodder(user: UserEvent, text: string) {
  await user.type(screen.getByRole("textbox"), text)
  await user.click(screen.getByRole("button", { name: "Let's anagram" }))
}

async function pickTool(user: UserEvent, tool: Tool) {
  const picker = document.querySelector<HTMLElement>(".tool-picker")!
  await user.click(within(picker).getByText(PICKER_LABELS[tool]))
}

function toolContainer(tool: Tool): HTMLElement {
  const container = document.querySelector<HTMLElement>(`[data-tool="${tool}"]`)
  if (!container) throw new Error(`${tool} tool is not rendered`)
  return container
}

function isShowing(tool: Tool): boolean {
  return !toolContainer(tool).classList.contains("hidden")
}

function tilesIn(tool: Tool): HTMLElement[] {
  // Freeform also renders an invisible copy of the letters to measure layout
  const selector = tool === "Tiles" ? ".tile-canvas .tile" : ".tile"
  return Array.from(toolContainer(tool).querySelectorAll(selector))
}

function lettersIn(tool: Tool): string {
  return tilesIn(tool)
    .map((tile) => tile.textContent)
    .join("")
}

describe("entering fodder", () => {
  it("starts on the form with no tools showing", () => {
    renderApp()

    expect(screen.getByText("Enter letters to anagram:")).toBeTruthy()
    expect(document.querySelector("[data-tool]")).toBeNull()
  })

  it("turns the entered letters into uppercase tiles", async () => {
    const user = renderApp()

    await enterFodder(user, "cat")

    expect(screen.queryByRole("textbox")).toBeNull()
    expect(lettersIn("Tiles")).toBe("CAT")
    expect(window.location.search).toBe("?fodder=cat")
  })

  it("submits with the Enter key", async () => {
    const user = renderApp()

    await user.type(screen.getByRole("textbox"), "cat{Enter}")

    expect(lettersIn("Tiles")).toBe("CAT")
  })

  it("ignores anything that isn't a letter", async () => {
    const user = renderApp()

    await user.type(screen.getByRole("textbox"), "c-a t1!")

    expect(screen.getByRole<HTMLInputElement>("textbox").value).toBe("cat")
  })

  it("does nothing when submitted empty", async () => {
    const user = renderApp()

    await user.click(screen.getByRole("button", { name: "Let's anagram" }))

    expect(screen.getByRole("textbox")).toBeTruthy()
    expect(document.querySelector("[data-tool]")).toBeNull()
  })

  it("skips the form when fodder is in the URL", () => {
    renderApp("/?fodder=dog")

    expect(screen.queryByRole("textbox")).toBeNull()
    expect(lettersIn("Tiles")).toBe("DOG")
  })
})

describe("going back", () => {
  it("returns to an empty form and clears the URL", async () => {
    const user = renderApp()
    await enterFodder(user, "cat")

    await user.click(screen.getByText("Back"))

    expect(screen.getByRole<HTMLInputElement>("textbox").value).toBe("")
    expect(document.querySelector("[data-tool]")).toBeNull()
    expect(window.location.search).toBe("")
  })

  it("replaces the old letters in every tool with new fodder", async () => {
    const user = renderApp()
    await enterFodder(user, "cat")
    await user.click(screen.getByText("Back"))

    await enterFodder(user, "dog")

    for (const tool of ALL_TOOLS) {
      expect(lettersIn(tool)).toBe("DOG")
    }
  })
})

describe("switching tools", () => {
  it("starts on Freeform", async () => {
    const user = renderApp()
    await enterFodder(user, "cat")

    expect(ALL_TOOLS.filter(isShowing)).toEqual(["Tiles"])
    expect(screen.getByText(TOOLTIPS.Tiles)).toBeTruthy()
  })

  it.each(ALL_TOOLS)("shows only %s after picking it", async (tool) => {
    const user = renderApp()
    await enterFodder(user, "cat")
    // Start from a different tool so picking Freeform is a real switch
    await pickTool(user, tool === "Line" ? "Wheel" : "Line")

    await pickTool(user, tool)

    expect(ALL_TOOLS.filter(isShowing)).toEqual([tool])
    expect(screen.getByText(TOOLTIPS[tool])).toBeTruthy()
  })

  it("only offers Reset for tools that support it", async () => {
    const user = renderApp()
    await enterFodder(user, "cat")

    expect(screen.getByRole("button", { name: "Reset" })).toBeTruthy()

    await pickTool(user, "Floating")

    expect(screen.queryByRole("button", { name: "Reset" })).toBeNull()
    expect(screen.getByRole("button", { name: "Shuffle" })).toBeTruthy()
  })
})

describe("tiles render in each tool", () => {
  it.each(ALL_TOOLS)("%s shows one tile per letter", async (tool) => {
    const user = renderApp()
    await enterFodder(user, "anagram")

    await pickTool(user, tool)

    expect(lettersIn(tool)).toBe("ANAGRAM")
  })
})

describe("tool interactions", () => {
  it("Freeform: dragging moves a tile, and Reset puts it back", async () => {
    const user = renderApp()
    await enterFodder(user, "cat")
    const [tile] = tilesIn("Tiles")

    fireEvent.pointerDown(tile, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(tile, { pointerId: 1, clientX: 150, clientY: 80 })
    fireEvent.pointerUp(tile, { pointerId: 1, clientX: 150, clientY: 80 })

    expect(tile.style.transform).toContain("translate(150px, 80px)")

    await user.click(screen.getByRole("button", { name: "Reset" }))

    expect(tile.style.transform).toContain("translate(0px, 0px)")
  })

  it("Line: Shuffle reorders the letters, and Reset restores them", async () => {
    const user = renderApp()
    await enterFodder(user, "abc")
    await pickTool(user, "Line")

    vi.spyOn(Math, "random").mockReturnValue(0)
    await user.click(screen.getByRole("button", { name: "Shuffle" }))
    vi.restoreAllMocks()

    expect(lettersIn("Line")).toBe("BCA")

    await user.click(screen.getByRole("button", { name: "Reset" }))

    expect(lettersIn("Line")).toBe("ABC")
  })

  it("Wheel: tapping two letters swaps them", async () => {
    const user = renderApp()
    await enterFodder(user, "abc")
    await pickTool(user, "Wheel")
    const [a, , c] = tilesIn("Wheel")

    await user.click(a)
    expect(a.classList).toContain("active")

    await user.click(c)
    expect(lettersIn("Wheel")).toBe("CBA")
    expect(tilesIn("Wheel").some((t) => t.classList.contains("active"))).toBe(
      false,
    )
  })

  it("Wheel: tapping the background deselects a letter", async () => {
    const user = renderApp()
    await enterFodder(user, "abc")
    await pickTool(user, "Wheel")
    const [a] = tilesIn("Wheel")

    await user.click(a)
    await user.click(
      toolContainer("Wheel").querySelector<HTMLElement>(
        ".wheel-tool-container",
      )!,
    )

    expect(a.classList).not.toContain("active")
    expect(lettersIn("Wheel")).toBe("ABC")
  })

  it("Floating: Shuffle moves the letters to new spots", async () => {
    const user = renderApp()
    await enterFodder(user, "abc")
    await pickTool(user, "Floating")

    // Random values of 0 send every tile to the same corner
    vi.spyOn(Math, "random").mockReturnValue(0)
    await user.click(screen.getByRole("button", { name: "Shuffle" }))

    const positions = tilesIn("Floating").map((t) => t.style.translate)
    expect(new Set(positions).size).toBe(1)
    expect(positions[0]).toContain("* -1")
  })
})
