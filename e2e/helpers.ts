import { expect, type Locator, type Page } from "@playwright/test"

/*
 * Helpers for the UI tests. They find things by the class names the app
 * already uses for styling (e.g. `.active` for the selected tile, `.locked`
 * for locked ones), so the app needs nothing extra just for testing.
 */

export const TOOLS = {
  Freeform: ".tile-canvas .draggable-tile",
  Line: ".line-tool-tile",
  Wheel: ".wheel-tool-tile",
  Floating: ".floating-tool-tile",
} as const

export type ToolName = keyof typeof TOOLS

/*
 * Make every run the same: seed Math.random so shuffles are repeatable, and
 * turn off CSS transitions and animations so tiles are where they're going as
 * soon as they move, rather than part way there.
 */
export async function prepare(page: Page) {
  await page.addInitScript(() => {
    let seed = 20261120
    Math.random = () => {
      // mulberry32
      seed = (seed + 0x6d2b79f5) | 0
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }

    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style")
      style.textContent = `*, *::before, *::after {
        transition: none !important;
        animation: none !important;
      }`
      document.head.append(style)
    })
  })
}

/* Open the app, optionally with letters from a shared link */
export async function open(page: Page, fodder = "") {
  await page.goto(fodder ? `/?fodder=${fodder}` : "/")
  await expect(tiles(page, "Freeform")).toHaveCount(fodder.length)
}

export async function pickTool(page: Page, tool: ToolName) {
  await page.locator(".tool-picker-tool", { hasText: tool }).click()
}

export function tiles(page: Page, tool: ToolName): Locator {
  return page.locator(TOOLS[tool])
}

/* The tool's tiles' letters, in the order they are in the page */
export async function lettersIn(page: Page, tool: ToolName): Promise<string> {
  const texts = await tiles(page, tool).allTextContents()
  return texts.map((text) => text.trim()).join("")
}

export function selectedTile(page: Page, tool: ToolName): Locator {
  return page.locator(`${TOOLS[tool]}.active`)
}

export function lockedTiles(page: Page, tool: ToolName): Locator {
  return page.locator(`${TOOLS[tool]}.locked`)
}

/* Lock the selected tile with the button that pops up above it */
export async function lockSelected(page: Page, tool: ToolName) {
  await page.locator(`${TOOLS[tool]} .tile-lock-button`).click()
}

/* Type on the on-screen keyboard */
export async function typeOnKeyboard(page: Page, word: string) {
  for (const letter of word.toUpperCase()) {
    await page
      .locator(".keyboard-key", { hasText: new RegExp(`^${letter}$`) })
      .click()
  }
}

export async function pressDelete(page: Page) {
  await page.getByRole("button", { name: "Delete" }).click()
}

export function footerButton(page: Page, name: "Shuffle" | "Reset" | "Keyboard") {
  return page.locator(".tool-footer").getByRole("button", { name })
}

export type Box = { x: number; y: number; width: number; height: number }

export async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox()
  if (!box) throw new Error("element has no box (is it hidden?)")
  return box
}

export function centerOf(box: Box) {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

/* Every tile's letter and box, keyed by its index in the page */
export async function boxesIn(page: Page, tool: ToolName) {
  const all = await tiles(page, tool).all()
  return Promise.all(
    all.map(async (tile) => ({
      letter: ((await tile.textContent()) ?? "").trim(),
      box: await boxOf(tile),
    })),
  )
}

/* Freeform tiles' letters read like text: row by row, left to right */
export async function freeformReadingOrder(page: Page): Promise<string> {
  const boxes = await boxesIn(page, "Freeform")
  return boxes
    .sort(
      (a, b) =>
        Math.round(a.box.y / 10) - Math.round(b.box.y / 10) ||
        a.box.x - b.box.x,
    )
    .map((tile) => tile.letter)
    .join("")
}

/* Whether any two boxes overlap (touching edges doesn't count) */
export function anyOverlap(boxes: Box[]): boolean {
  return boxes.some((a, i) =>
    boxes.slice(i + 1).some(
      (b) =>
        a.x < b.x + b.width - 1 &&
        b.x < a.x + a.width - 1 &&
        a.y < b.y + b.height - 1 &&
        b.y < a.y + a.height - 1,
    ),
  )
}

/* Drag with the mouse, in small steps like a real pointer */
export async function drag(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 20 })
  await page.mouse.up()
}

export function sorted(letters: string): string {
  return [...letters].sort().join("")
}
