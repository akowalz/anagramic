import { expect, test } from "@playwright/test"
import {
  anyOverlap,
  boxesIn,
  boxOf,
  centerOf,
  drag,
  footerButton,
  freeformReadingOrder,
  lockedTiles,
  lockSelected,
  open,
  prepare,
  selectedTile,
  sorted,
  tiles,
  typeOnKeyboard,
} from "./helpers"

/*
 * Freeform: tiles start laid out like text and can be dragged anywhere.
 */

test.beforeEach(async ({ page }) => {
  await prepare(page)
})

const WORD = "ANAGRAMS"

test("lays the tiles out like text, in the order typed", async ({ page }) => {
  await open(page, WORD)

  expect(await freeformReadingOrder(page)).toBe(WORD)
  const boxes = await boxesIn(page, "Freeform")
  expect(anyOverlap(boxes.map((tile) => tile.box))).toBe(false)
})

test("tapping a tile selects it, and tapping again deselects", async ({
  page,
}) => {
  await open(page, WORD)
  const tile = tiles(page, "Freeform").nth(3)

  await tile.click()
  await expect(selectedTile(page, "Freeform")).toHaveText("G")
  await expect(page.locator(".draggable-tile .tile-lock-button")).toBeVisible()

  await tile.click()
  await expect(selectedTile(page, "Freeform")).toHaveCount(0)
})

test("tapping empty space deselects", async ({ page }) => {
  await open(page, WORD)
  await tiles(page, "Freeform").nth(0).click()

  const canvas = await boxOf(page.locator(".tile-canvas"))
  await page.mouse.click(canvas.x + canvas.width / 2, canvas.y + 10)

  await expect(selectedTile(page, "Freeform")).toHaveCount(0)
})

test("dragging a tile leaves it where it was dropped", async ({ page }) => {
  await open(page, WORD)
  const before = await boxesIn(page, "Freeform")
  const from = centerOf(before[7].box)
  const to = { x: from.x + 40, y: from.y - 150 }

  await drag(page, from, to)

  const after = await boxesIn(page, "Freeform")
  expect(centerOf(after[7].box).x).toBeCloseTo(to.x, 0)
  expect(centerOf(after[7].box).y).toBeCloseTo(to.y, 0)
  // The others stay put
  for (let i = 0; i < 7; i++) {
    expect(after[i].box).toEqual(before[i].box)
  }
})

test("a tile dropped on another pushes it aside", async ({ page }) => {
  await open(page, WORD)
  const before = await boxesIn(page, "Freeform")

  await drag(page, centerOf(before[7].box), centerOf(before[0].box))

  const after = await boxesIn(page, "Freeform")
  expect(anyOverlap(after.map((tile) => tile.box))).toBe(false)
})

test("a locked tile can't be dragged", async ({ page }) => {
  await open(page, WORD)
  const tile = tiles(page, "Freeform").nth(2)
  await tile.click()
  await lockSelected(page, "Freeform")
  await expect(lockedTiles(page, "Freeform")).toHaveText(["A"])
  const before = await boxOf(tile)

  await drag(page, centerOf(before), { x: before.x, y: before.y - 150 })

  expect(await boxOf(tile)).toEqual(before)
})

test("shuffle rearranges the tiles but not a locked one", async ({ page }) => {
  await open(page, WORD)
  const locked = tiles(page, "Freeform").nth(3)
  await locked.click()
  await lockSelected(page, "Freeform")
  const lockedBox = await boxOf(locked)

  await footerButton(page, "Shuffle").click()

  const order = await freeformReadingOrder(page)
  expect(order).not.toBe(WORD)
  expect(sorted(order)).toBe(sorted(WORD))
  expect(order[3]).toBe("G")
  expect(await boxOf(locked)).toEqual(lockedBox)
  // Still laid out like text: nothing overlaps
  const boxes = await boxesIn(page, "Freeform")
  expect(anyOverlap(boxes.map((tile) => tile.box))).toBe(false)
})

test("after dragging, shuffle swaps the tiles' spots around", async ({
  page,
}) => {
  await open(page, WORD)
  const before = await boxesIn(page, "Freeform")
  await drag(page, centerOf(before[0].box), {
    x: centerOf(before[0].box).x,
    y: centerOf(before[0].box).y - 150,
  })
  const spots = (await boxesIn(page, "Freeform")).map(
    ({ box }) => `${box.x},${box.y}`,
  )

  await footerButton(page, "Shuffle").click()

  const after = (await boxesIn(page, "Freeform")).map(
    ({ box }) => `${box.x},${box.y}`,
  )
  expect(after).not.toEqual(spots)
  expect([...after].sort()).toEqual([...spots].sort())
})

test("a letter typed after dragging lands clear of the other tiles", async ({
  page,
}) => {
  await open(page, WORD)
  const before = await boxesIn(page, "Freeform")
  // Drop a tile where the next letter would go in the layout
  await drag(page, centerOf(before[0].box), {
    x: centerOf(before[7].box).x + 56,
    y: centerOf(before[7].box).y,
  })

  await typeOnKeyboard(page, "x")

  const after = await boxesIn(page, "Freeform")
  expect(after.map((tile) => tile.letter).join("")).toBe(WORD + "X")
  expect(anyOverlap(after.map((tile) => tile.box))).toBe(false)
})

test("reset puts the tiles back in order and unlocks them", async ({
  page,
}) => {
  await open(page, WORD)
  const before = await boxesIn(page, "Freeform")
  await tiles(page, "Freeform").nth(1).click()
  await lockSelected(page, "Freeform")
  await drag(page, centerOf(before[5].box), {
    x: centerOf(before[5].box).x,
    y: centerOf(before[5].box).y - 150,
  })
  await footerButton(page, "Shuffle").click()

  await footerButton(page, "Reset").click()

  expect(await freeformReadingOrder(page)).toBe(WORD)
  await expect(lockedTiles(page, "Freeform")).toHaveCount(0)
  const after = await boxesIn(page, "Freeform")
  after.forEach((tile, i) => expect(tile.box).toEqual(before[i].box))
})

test("tiles follow the layout when the keyboard is hidden", async ({
  page,
}) => {
  await open(page, WORD)

  await page.getByRole("button", { name: "Hide keyboard" }).click()

  expect(await freeformReadingOrder(page)).toBe(WORD)
  const canvas = await boxOf(page.locator(".tile-canvas"))
  for (const { box } of await boxesIn(page, "Freeform")) {
    expect(box.y).toBeGreaterThanOrEqual(canvas.y)
    expect(box.y + box.height).toBeLessThanOrEqual(canvas.y + canvas.height)
  }
})

test("dragged tiles are pulled back in when the keyboard opens", async ({
  page,
}) => {
  await open(page, WORD)
  await page.getByRole("button", { name: "Hide keyboard" }).click()
  const tile = tiles(page, "Freeform").nth(0)
  const canvas = await boxOf(page.locator(".tile-canvas"))
  // Near the bottom of the taller canvas, where the keyboard will be
  await drag(page, centerOf(await boxOf(tile)), {
    x: canvas.x + canvas.width / 2,
    y: canvas.y + canvas.height - 25,
  })

  await footerButton(page, "Keyboard").click()

  const smaller = await boxOf(page.locator(".tile-canvas"))
  const box = await boxOf(tile)
  expect(box.y + box.height).toBeLessThanOrEqual(smaller.y + smaller.height + 1)
})
