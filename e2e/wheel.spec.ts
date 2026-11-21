import { expect, test } from "@playwright/test"
import {
  boxesIn,
  centerOf,
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
 * Wheel: the letters around a circle. Tap one tile and then another to swap.
 */

test.beforeEach(async ({ page }) => {
  await prepare(page)
})

const WORD = "ANAGRAMS"

test.beforeEach(async ({ page }) => {
  await open(page, WORD)
  await pickTool(page, "Wheel")
})

test("puts the letters around a circle, clockwise from the top", async ({
  page,
}) => {
  expect(await lettersIn(page, "Wheel")).toBe(WORD)

  const centers = (await boxesIn(page, "Wheel")).map(({ box }) => centerOf(box))
  const middle = {
    x: centers.reduce((sum, c) => sum + c.x, 0) / centers.length,
    y: centers.reduce((sum, c) => sum + c.y, 0) / centers.length,
  }
  const distances = centers.map((c) =>
    Math.hypot(c.x - middle.x, c.y - middle.y),
  )
  distances.forEach((d) => expect(d).toBeCloseTo(distances[0], -1))

  // The first letter is at the top, the second is to its right
  expect(Math.min(...centers.map((c) => c.y))).toBeCloseTo(centers[0].y, 0)
  expect(centers[1].x).toBeGreaterThan(centers[0].x)
})

test("tapping two tiles swaps them", async ({ page }) => {
  await tiles(page, "Wheel").nth(0).click()
  await tiles(page, "Wheel").nth(3).click()

  expect(await lettersIn(page, "Wheel")).toBe("GNAAR" + "AMS")
  await expect(selectedTile(page, "Wheel")).toHaveCount(0)
})

test("tapping the selected tile again deselects it", async ({ page }) => {
  const tile = tiles(page, "Wheel").nth(2)

  await tile.click()
  await expect(selectedTile(page, "Wheel")).toHaveCount(1)
  await tile.click()

  await expect(selectedTile(page, "Wheel")).toHaveCount(0)
  expect(await lettersIn(page, "Wheel")).toBe(WORD)
})

test("a locked tile can't be swapped", async ({ page }) => {
  await tiles(page, "Wheel").nth(1).click()
  await lockSelected(page, "Wheel")

  await tiles(page, "Wheel").nth(1).click()
  await tiles(page, "Wheel").nth(4).click()

  expect(await lettersIn(page, "Wheel")).toBe(WORD)
  // The tapped tile is selected instead
  await expect(selectedTile(page, "Wheel")).toHaveText("R")
})

test("shuffle rearranges the letters but not a locked one", async ({
  page,
}) => {
  await tiles(page, "Wheel").nth(3).click()
  await lockSelected(page, "Wheel")

  await footerButton(page, "Shuffle").click()

  const order = await lettersIn(page, "Wheel")
  expect(order).not.toBe(WORD)
  expect(sorted(order)).toBe(sorted(WORD))
  expect(order[3]).toBe("G")
  await expect(lockedTiles(page, "Wheel")).toHaveText(["G"])
})

test("reset puts the letters back in order and unlocks them", async ({
  page,
}) => {
  await tiles(page, "Wheel").nth(3).click()
  await lockSelected(page, "Wheel")
  await footerButton(page, "Shuffle").click()

  await footerButton(page, "Reset").click()

  expect(await lettersIn(page, "Wheel")).toBe(WORD)
  await expect(lockedTiles(page, "Wheel")).toHaveCount(0)
})
