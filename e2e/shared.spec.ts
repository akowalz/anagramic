import { expect, test } from "@playwright/test"
import {
  boxesIn,
  boxOf,
  centerOf,
  drag,
  footerButton,
  freeformReadingOrder,
  lettersIn,
  lockedTiles,
  lockSelected,
  open,
  pickTool,
  prepare,
  pressDelete,
  tiles,
} from "./helpers"

/*
 * The tools share one board: the same letters, in the same arrangement, with
 * the same locks. Freeform follows the arrangement until a tile is dragged by
 * hand; Floating keeps its own drift and ignores locks.
 */

test.beforeEach(async ({ page }) => {
  await prepare(page)
})

const WORD = "ANAGRAMS"

test("a shuffle in one tool shows in the others", async ({ page }) => {
  await open(page, WORD)
  await pickTool(page, "Wheel")

  await footerButton(page, "Shuffle").click()
  const order = await lettersIn(page, "Wheel")
  expect(order).not.toBe(WORD)

  await pickTool(page, "Line")
  expect(await lettersIn(page, "Line")).toBe(order)
  await pickTool(page, "Freeform")
  expect(await freeformReadingOrder(page)).toBe(order)
})

test("a swap in the wheel shows in the line", async ({ page }) => {
  await open(page, WORD)
  await pickTool(page, "Wheel")
  await tiles(page, "Wheel").nth(0).click()
  await tiles(page, "Wheel").nth(3).click()

  await pickTool(page, "Line")

  expect(await lettersIn(page, "Line")).toBe("GNAARAMS")
})

test("reordering the line shows in the wheel", async ({ page }) => {
  await open(page, WORD)
  await pickTool(page, "Line")
  const first = await boxOf(tiles(page, "Line").nth(0))
  const fourth = await boxOf(tiles(page, "Line").nth(3))
  await drag(page, centerOf(first), {
    x: centerOf(fourth).x + 10,
    y: centerOf(fourth).y,
  })
  await expect.poll(() => lettersIn(page, "Line")).not.toBe(WORD)
  const order = await lettersIn(page, "Line")

  await pickTool(page, "Wheel")

  expect(await lettersIn(page, "Wheel")).toBe(order)
})

test("a letter locked in one tool is locked in all of them", async ({
  page,
}) => {
  await open(page, WORD)
  await pickTool(page, "Line")
  await tiles(page, "Line").nth(3).click()
  await lockSelected(page, "Line")

  await pickTool(page, "Wheel")
  await expect(lockedTiles(page, "Wheel")).toHaveText(["G"])
  await pickTool(page, "Freeform")
  await expect(lockedTiles(page, "Freeform")).toHaveText(["G"])
})

test("a locked letter keeps its place when another tool shuffles", async ({
  page,
}) => {
  await open(page, WORD)
  await pickTool(page, "Line")
  await tiles(page, "Line").nth(3).click()
  await lockSelected(page, "Line")

  // Shuffle in the wheel, where nothing was locked by hand
  await pickTool(page, "Wheel")
  await footerButton(page, "Shuffle").click()

  const order = await lettersIn(page, "Wheel")
  expect(order).not.toBe(WORD)
  expect(order[3]).toBe("G")
})

test("reset in one tool resets the order and locks for all", async ({
  page,
}) => {
  await open(page, WORD)
  await pickTool(page, "Wheel")
  await tiles(page, "Wheel").nth(3).click()
  await lockSelected(page, "Wheel")
  await footerButton(page, "Shuffle").click()

  await pickTool(page, "Line")
  await footerButton(page, "Reset").click()

  await pickTool(page, "Wheel")
  expect(await lettersIn(page, "Wheel")).toBe(WORD)
  await expect(lockedTiles(page, "Wheel")).toHaveCount(0)
})

test("a letter deleted in one tool is gone from the others", async ({
  page,
}) => {
  await open(page, WORD)
  await pickTool(page, "Wheel")
  await footerButton(page, "Shuffle").click()
  const shuffled = await lettersIn(page, "Wheel")
  await tiles(page, "Wheel").nth(2).click()

  await pressDelete(page)

  const expected = shuffled.slice(0, 2) + shuffled.slice(3)
  expect(await lettersIn(page, "Wheel")).toBe(expected)
  await pickTool(page, "Line")
  expect(await lettersIn(page, "Line")).toBe(expected)
})

test.describe("Freeform once tiles are dragged by hand", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, WORD)
    const before = await boxesIn(page, "Freeform")
    await drag(page, centerOf(before[7].box), {
      x: centerOf(before[7].box).x + 40,
      y: centerOf(before[7].box).y - 150,
    })
  })

  test("other tools' shuffles leave them where they are", async ({ page }) => {
    const before = await boxesIn(page, "Freeform")

    await pickTool(page, "Line")
    await footerButton(page, "Shuffle").click()
    await pickTool(page, "Freeform")

    expect(await boxesIn(page, "Freeform")).toEqual(before)
  })

  test("shuffling them doesn't change the other tools' order", async ({
    page,
  }) => {
    await footerButton(page, "Shuffle").click()

    await pickTool(page, "Line")
    expect(await lettersIn(page, "Line")).toBe(WORD)
  })

  test("reset makes them follow the shared order again", async ({ page }) => {
    await footerButton(page, "Reset").click()
    await pickTool(page, "Wheel")
    await footerButton(page, "Shuffle").click()
    const order = await lettersIn(page, "Wheel")

    await pickTool(page, "Freeform")

    expect(await freeformReadingOrder(page)).toBe(order)
  })
})

test("locks don't apply in Floating", async ({ page }) => {
  await open(page, "FLOAT")
  await pickTool(page, "Wheel")
  await tiles(page, "Wheel").nth(0).click()
  await lockSelected(page, "Wheel")
  await pickTool(page, "Floating")

  // Nothing shows as locked, and the letter still moves when shuffled
  await expect(lockedTiles(page, "Floating")).toHaveCount(0)
  await expect(page.locator(".floating-tool-tile .tile-lock-badge")).toHaveCount(0)
  const tile = tiles(page, "Floating").filter({ hasText: "F" })
  const before = await boxOf(tile)
  await footerButton(page, "Shuffle").click()
  expect(await boxOf(tile)).not.toEqual(before)

  // The lock is still there in the other tools
  await pickTool(page, "Wheel")
  await expect(lockedTiles(page, "Wheel")).toHaveText(["F"])
})
