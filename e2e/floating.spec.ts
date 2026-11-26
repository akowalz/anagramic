import { expect, test } from "@playwright/test"
import {
  boxesIn,
  boxOf,
  footerButton,
  open,
  pickTool,
  prepare,
  pressDelete,
  selectedTile,
  sorted,
} from "./helpers"

/*
 * Floating: the letters drift around a box.
 */

test.beforeEach(async ({ page }) => {
  await prepare(page)
})

const WORD = "FLOAT"

test.beforeEach(async ({ page }) => {
  await open(page, WORD)
  await pickTool(page, "Floating")
})

test("keeps every letter inside the box", async ({ page }) => {
  const box = await boxOf(page.locator(".floating-tool-box"))
  const tiles = await boxesIn(page, "Floating")

  expect(sorted(tiles.map((tile) => tile.letter).join(""))).toBe(sorted(WORD))
  for (const tile of tiles) {
    expect(tile.box.x).toBeGreaterThanOrEqual(box.x - 1)
    expect(tile.box.y).toBeGreaterThanOrEqual(box.y - 1)
    expect(tile.box.x + tile.box.width).toBeLessThanOrEqual(
      box.x + box.width + 1,
    )
    expect(tile.box.y + tile.box.height).toBeLessThanOrEqual(
      box.y + box.height + 1,
    )
  }
})

test("the letters drift", async ({ page }) => {
  const before = await boxesIn(page, "Floating")

  await expect
    .poll(async () => {
      const after = await boxesIn(page, "Floating")
      return after.some(
        (tile, i) =>
          Math.hypot(
            tile.box.x - before[i].box.x,
            tile.box.y - before[i].box.y,
          ) > 5,
      )
    })
    .toBe(true)
})

test("shuffle sends the letters somewhere new", async ({ page }) => {
  const before = await boxesIn(page, "Floating")

  await footerButton(page, "Shuffle").click()

  const after = await boxesIn(page, "Floating")
  const moved = after.filter(
    (tile, i) =>
      Math.hypot(tile.box.x - before[i].box.x, tile.box.y - before[i].box.y) >
      20,
  )
  expect(moved.length).toBeGreaterThan(WORD.length / 2)
})

test("delete highlights the letter it's about to delete", async ({ page }) => {
  await pressDelete(page)

  await expect(selectedTile(page, "Floating")).toHaveText("T")
})

test("fits a short screen, keyboard and all", async ({ page }) => {
  // e.g. an iPad's Slide Over window, or an iPhone SE
  await page.setViewportSize({ width: 510, height: 600 })

  const box = await boxOf(page.locator(".floating-tool-box"))
  const keyboard = await boxOf(page.locator(".keyboard"))

  expect(box.width).toBeCloseTo(box.height, 0)
  expect(box.y + box.height).toBeLessThanOrEqual(keyboard.y)
  expect(keyboard.y + keyboard.height).toBeLessThanOrEqual(600 + 1)
})
