import { expect, test } from "@playwright/test"
import {
  boxesIn,
  boxOf,
  centerOf,
  drag,
  footerButton,
  lettersIn,
  lockedTiles,
  lockSelected,
  open,
  pickTool,
  prepare,
  selectedTile,
  sorted,
  tiles,
} from "./helpers"

/*
 * Line: the letters in a row. Drag to reorder them.
 */

test.beforeEach(async ({ page }) => {
  await prepare(page)
})

const WORD = "ANAGRAMS"

test.beforeEach(async ({ page }) => {
  await open(page, WORD)
  await pickTool(page, "Line")
})

test("shows the letters in a row, in the order typed", async ({ page }) => {
  expect(await lettersIn(page, "Line")).toBe(WORD)

  const boxes = await boxesIn(page, "Line")
  boxes.slice(1).forEach(({ box }, i) => {
    expect(box.y).toBeCloseTo(boxes[i].box.y, 0)
    expect(box.x).toBeGreaterThan(boxes[i].box.x)
  })
})

test("dragging a tile along the row reorders the letters", async ({ page }) => {
  const first = await boxOf(tiles(page, "Line").nth(0))
  const fourth = await boxOf(tiles(page, "Line").nth(3))

  await drag(page, centerOf(first), {
    x: centerOf(fourth).x + 10,
    y: centerOf(fourth).y,
  })

  await expect.poll(() => lettersIn(page, "Line")).not.toBe(WORD)
  const order = await lettersIn(page, "Line")
  expect(sorted(order)).toBe(sorted(WORD))
  expect(order.indexOf("N")).toBe(0)
})

test("tapping a tile selects it and offers to lock it", async ({ page }) => {
  await tiles(page, "Line").nth(4).click()

  await expect(selectedTile(page, "Line")).toHaveText("R")
  await lockSelected(page, "Line")

  await expect(lockedTiles(page, "Line")).toHaveText(["R"])
  await expect(selectedTile(page, "Line")).toHaveCount(0)
})

test("a locked tile can't be dragged", async ({ page }) => {
  const tile = tiles(page, "Line").nth(0)
  await tile.click()
  await lockSelected(page, "Line")
  const fourth = await boxOf(tiles(page, "Line").nth(3))

  await drag(page, centerOf(await boxOf(tile)), centerOf(fourth))

  expect(await lettersIn(page, "Line")).toBe(WORD)
})

test("shuffle rearranges the letters but not a locked one", async ({
  page,
}) => {
  await tiles(page, "Line").nth(3).click()
  await lockSelected(page, "Line")

  await footerButton(page, "Shuffle").click()

  const order = await lettersIn(page, "Line")
  expect(order).not.toBe(WORD)
  expect(sorted(order)).toBe(sorted(WORD))
  expect(order[3]).toBe("G")
  await expect(lockedTiles(page, "Line")).toHaveText(["G"])
})

test("reset puts the letters back in order and unlocks them", async ({
  page,
}) => {
  await tiles(page, "Line").nth(3).click()
  await lockSelected(page, "Line")
  await footerButton(page, "Shuffle").click()

  await footerButton(page, "Reset").click()

  expect(await lettersIn(page, "Line")).toBe(WORD)
  await expect(lockedTiles(page, "Line")).toHaveCount(0)
})

test("dragging doesn't resize the rack or leave tiles uneven", async ({
  page,
}) => {
  await open(page, "cat")
  await pickTool(page, "Line")
  const rack = page.locator(".line-rack")
  const rackBefore = await boxOf(rack)
  const sizes = async () =>
    (await boxesIn(page, "Line")).map(({ box }) =>
      [box.y, box.width, box.height].map((n) => Math.round(n * 10) / 10),
    )
  const sizesBefore = await sizes()
  const first = centerOf(await boxOf(tiles(page, "Line").nth(0)))
  const last = centerOf(await boxOf(tiles(page, "Line").nth(2)))

  await page.mouse.move(first.x, first.y)
  await page.mouse.down()
  await page.mouse.move(last.x + 5, last.y, { steps: 20 })
  // The lifted tile is scaled up, but the rack stays the same size
  expect(await boxOf(rack)).toEqual(rackBefore)
  await page.mouse.up()

  await expect(page.locator(".line-tool-tile.dragging")).toHaveCount(0)
  expect(await lettersIn(page, "Line")).toBe("ATC")
  expect(await boxOf(rack)).toEqual(rackBefore)
  await expect.poll(sizes).toEqual(sizesBefore)
})

test("the browser never pans while a tile is held", async ({ page }) => {
  // On iOS, panning mid-drag nudged the dragged tile off the row a little
  // more with each pass. Headless Chrome can't reproduce that, so check that
  // panning is off for every tile.
  await open(page, "cat")
  await pickTool(page, "Line")

  for (const tile of await tiles(page, "Line").all()) {
    await expect(tile).toHaveCSS("touch-action", "none")
  }
})
