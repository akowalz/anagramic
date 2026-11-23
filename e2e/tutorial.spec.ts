import { expect, test, type Page } from "@playwright/test"
import {
  boxOf,
  centerOf,
  drag,
  lockSelected,
  open,
  pickTool,
  prepare,
  tiles,
  type ToolName,
  tileAt,
} from "./helpers"

/*
 * The tutorial: one hint at a time just above the letters, learned by doing
 * what it says, and remembered on the device. Each test starts on a fresh
 * device, with nothing learned.
 */

test.beforeEach(async ({ page }) => {
  await prepare(page)
})

const WORD = "ANAGRAMS"
const LOCK = "Tap a letter to lock it in place"
const TRY_TOOLS = "Try another tool to see the letters a new way"

function hintIn(page: Page, tool: ToolName) {
  const hints = {
    Line: ".line-hint",
    Wheel: ".wheel-hint",
    Freeform: ".freeform-hint",
    Floating: ".floating-hint",
  }
  return page.locator(hints[tool])
}

/* Shown, rather than faded out */
async function expectHint(page: Page, tool: ToolName, text: string) {
  const hint = hintIn(page, tool)
  await expect(hint).toHaveText(text)
  await expect(hint).not.toHaveClass(/\bout\b/)
}

/* Drag a tile to past the end. A different tile each time, so it really moves. */
async function dragToEnd(page: Page, tool: ToolName, nth = 0) {
  const first = await boxOf(tileAt(page, tool, nth))
  const last = await boxOf(tileAt(page, tool, WORD.length - 1))
  await drag(page, centerOf(first), {
    x: centerOf(last).x + 10,
    y: centerOf(last).y - (tool === "Freeform" ? 120 : 0),
  })
}

async function lockFirstTile(page: Page, tool: ToolName) {
  await tileAt(page, tool, 0).click()
  await lockSelected(page, tool)
}

test("Line teaches moving, then locking, then trying other tools", async ({
  page,
}) => {
  await open(page, WORD)
  await expectHint(page, "Line", "Tap and drag to move letters")

  // It sits just above the letters
  const hint = await boxOf(hintIn(page, "Line"))
  const gap =
    (await boxOf(tiles(page, "Line").first())).y - (hint.y + hint.height)
  expect(gap).toBeGreaterThan(0)
  expect(gap).toBeLessThan(20)

  await dragToEnd(page, "Line")
  await expectHint(page, "Line", "Tap and drag to move letters")
  await dragToEnd(page, "Line")
  await expectHint(page, "Line", LOCK)

  await lockFirstTile(page, "Line")
  await expectHint(page, "Line", TRY_TOOLS)
  // The longest hint wraps rather than running off the sides of the screen
  const viewport = page.viewportSize()!
  const box = await boxOf(hintIn(page, "Line"))
  expect(box.x).toBeGreaterThanOrEqual(15)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width - 15)

  // Trying another tool is what it asks, so that's it learned
  await pickTool(page, "Wheel")
  await pickTool(page, "Line")
  await expect(hintIn(page, "Line")).toHaveClass(/\bout\b/)
  await page.waitForTimeout(600)
  await expect(hintIn(page, "Line")).toHaveClass(/\bout\b/)
})

test("Wheel teaches swapping, then locking", async ({ page }) => {
  await open(page, WORD)
  await pickTool(page, "Wheel")
  await expectHint(page, "Wheel", "Drag a letter onto another to swap them")

  await tileAt(page, "Wheel", 0).click()
  await tileAt(page, "Wheel", 3).click()
  await expectHint(page, "Wheel", LOCK)

  await lockFirstTile(page, "Wheel")
  await expect(hintIn(page, "Wheel")).toHaveClass(/\bout\b/)
})

test("Freeform teaches dragging, then locking", async ({ page }) => {
  await open(page, WORD)
  await pickTool(page, "Freeform")
  await expect(tiles(page, "Freeform")).toHaveCount(WORD.length)
  await expectHint(page, "Freeform", "Drag letters anywhere")

  // It stays put while tiles are dragged, even right over it
  const before = await boxOf(hintIn(page, "Freeform"))

  await drag(page, centerOf(await boxOf(tiles(page, "Freeform").nth(0))), {
    x: centerOf(before).x,
    y: centerOf(before).y,
  })
  await expectHint(page, "Freeform", "Drag letters anywhere")
  expect(await boxOf(hintIn(page, "Freeform"))).toEqual(before)
  await dragToEnd(page, "Freeform", 1)
  await expectHint(page, "Freeform", LOCK)

  await lockFirstTile(page, "Freeform")
  await expect(hintIn(page, "Freeform")).toHaveClass(/\bout\b/)
})

test("Floating says to watch, then fades away on its own", async ({ page }) => {
  await open(page, WORD)
  await pickTool(page, "Floating")

  await expectHint(page, "Floating", "Just let the letters float by")
  // In the middle of the box, behind the letters
  const box = await boxOf(page.locator(".floating-tool-box"))
  const hint = await boxOf(hintIn(page, "Floating"))
  expect(centerOf(hint).x).toBeCloseTo(centerOf(box).x, -1)
  expect(centerOf(hint).y).toBeCloseTo(centerOf(box).y, -1)

  // After a few seconds it's learned, and fades
  await expect(hintIn(page, "Floating")).toHaveClass(/\bout\b/, {
    timeout: 6000,
  })
  // TEMPORARY: while RESET_HINTS_ON_LOAD is on (see src/lib/hints.ts), it
  // can't stay gone after a reload. Put this back before deploying:
  //   await page.reload()
  //   await pickTool(page, "Floating")
  //   await expect(hintIn(page, "Floating")).toHaveClass(/\bout\b/)
})

test("locking is learned once, for every tool", async ({ page }) => {
  await open(page, WORD)
  await pickTool(page, "Wheel")
  await lockFirstTile(page, "Wheel")

  // Line still teaches moving, but skips locking once that's learned
  await pickTool(page, "Line")
  await expectHint(page, "Line", "Tap and drag to move letters")
  // The first letter is locked now (locks are shared), so drag others
  await dragToEnd(page, "Line", 1)
  await dragToEnd(page, "Line", 1)
  await expect(hintIn(page, "Line")).toHaveClass(/\bout\b/)
})

// TEMPORARY: skipped while RESET_HINTS_ON_LOAD is on (see src/lib/hints.ts).
// Re-enable it, with that flag off, before deploying.
test.fixme("what's been learned is remembered after a reload", async ({
  page,
}) => {
  await open(page, WORD)
  await dragToEnd(page, "Line")
  await dragToEnd(page, "Line")
  await expectHint(page, "Line", LOCK)

  await page.reload()
  await expect(tiles(page, "Line")).toHaveCount(WORD.length)

  await expectHint(page, "Line", LOCK)
})

test("the lock hint stays until a letter is actually locked", async ({
  page,
}) => {
  await open(page, WORD)
  await dragToEnd(page, "Line", 0)
  await dragToEnd(page, "Line", 1)
  await expectHint(page, "Line", LOCK)
  const resting = await boxOf(hintIn(page, "Line"))

  // Selecting a letter shows its lock button; the hint moves up above it
  await tiles(page, "Line").nth(2).click()
  await expect(hintIn(page, "Line")).toHaveClass(/\blifted\b/)
  await expectHint(page, "Line", LOCK)
  const lifted = await boxOf(hintIn(page, "Line"))
  const button = await boxOf(page.locator(".line-tool-tile .tile-lock-button"))
  expect(lifted.y).toBeLessThan(resting.y)
  expect(lifted.y + lifted.height).toBeLessThanOrEqual(button.y + 1)

  // Deselecting puts it back; locking finishes it
  await tiles(page, "Line").nth(2).click()
  await expect(hintIn(page, "Line")).not.toHaveClass(/\blifted\b/)
  await lockFirstTile(page, "Line")
  await expect(hintIn(page, "Line")).toHaveClass(/\bout\b/)
})
