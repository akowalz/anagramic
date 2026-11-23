import { expect, test, type Page } from "@playwright/test"
import {
  boxesIn,
  boxOf,
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
  tileAt,
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
  await tileAt(page, "Wheel", 0).click()
  await tileAt(page, "Wheel", 3).click()

  expect(await lettersIn(page, "Wheel")).toBe("GNAAR" + "AMS")
  await expect(selectedTile(page, "Wheel")).toHaveCount(0)
})

test("tapping the selected tile again deselects it", async ({ page }) => {
  const tile = tileAt(page, "Wheel", 2)

  await tile.click()
  await expect(selectedTile(page, "Wheel")).toHaveCount(1)
  await tile.click()

  await expect(selectedTile(page, "Wheel")).toHaveCount(0)
  expect(await lettersIn(page, "Wheel")).toBe(WORD)
})

test("a locked tile can't be swapped", async ({ page }) => {
  await tileAt(page, "Wheel", 1).click()
  await lockSelected(page, "Wheel")

  await tileAt(page, "Wheel", 1).click()
  await tileAt(page, "Wheel", 4).click()

  expect(await lettersIn(page, "Wheel")).toBe(WORD)
  // The tapped tile is selected instead
  await expect(selectedTile(page, "Wheel")).toHaveText("R")
})

test("shuffle rearranges the letters but not a locked one", async ({
  page,
}) => {
  await tileAt(page, "Wheel", 3).click()
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
  await tileAt(page, "Wheel", 3).click()
  await lockSelected(page, "Wheel")
  await footerButton(page, "Shuffle").click()

  await footerButton(page, "Reset").click()

  expect(await lettersIn(page, "Wheel")).toBe(WORD)
  await expect(lockedTiles(page, "Wheel")).toHaveCount(0)
})

test.describe("dragging", () => {
  async function hold(page: Page, from: { x: number; y: number }) {
    await page.mouse.move(from.x, from.y)
    await page.mouse.down()
  }

  test("dropping a tile on another swaps them", async ({ page }) => {
    const first = centerOf(await boxOf(tiles(page, "Wheel").nth(0)))
    const fourth = centerOf(await boxOf(tiles(page, "Wheel").nth(3)))

    await hold(page, first)
    await page.mouse.move(fourth.x, fourth.y, { steps: 20 })

    // Hovering only previews: the target is marked, nothing has swapped yet
    await expect(tiles(page, "Wheel").nth(3)).toHaveClass(/\bdrop-target\b/)
    expect(await lettersIn(page, "Wheel")).toBe(WORD)

    await page.mouse.up()

    expect(await lettersIn(page, "Wheel")).toBe("GNAARAMS")
    await expect(page.locator(".wheel-tool-tile.drop-target")).toHaveCount(0)
  })

  test("the swap it shows still happens if the pointer slips a little as it lifts", async ({
    page,
  }) => {
    // A finger often moves a few pixels as it comes off the screen
    const first = centerOf(await boxOf(tiles(page, "Wheel").nth(0)))
    const fourth = centerOf(await boxOf(tiles(page, "Wheel").nth(3)))

    await hold(page, first)
    await page.mouse.move(fourth.x, fourth.y, { steps: 20 })
    await expect(tiles(page, "Wheel").nth(3)).toHaveClass(/\bdrop-target\b/)
    // Just outside the drop zone (80% of a 46px tile), but not far
    await page.mouse.move(fourth.x + 44, fourth.y, { steps: 3 })
    await expect(tiles(page, "Wheel").nth(3)).toHaveClass(/\bdrop-target\b/)
    await page.mouse.up()

    expect(await lettersIn(page, "Wheel")).toBe("GNAARAMS")
  })

  test("dropping a tile anywhere else puts it back", async ({ page }) => {
    const tile = tiles(page, "Wheel").nth(0)
    const before = await boxOf(tile)
    const wheel = await boxOf(page.locator(".wheel-boundary"))

    await hold(page, centerOf(before))
    // The empty middle of the wheel, away from every tile
    await page.mouse.move(
      wheel.x + wheel.width / 2,
      wheel.y + wheel.height / 2,
      {
        steps: 20,
      },
    )
    await expect(page.locator(".wheel-tool-tile.drop-target")).toHaveCount(0)
    await page.mouse.up()

    expect(await lettersIn(page, "Wheel")).toBe(WORD)
    await expect.poll(() => boxOf(tile)).toEqual(before)
  })

  test("a locked tile can't be dragged, or swapped onto", async ({ page }) => {
    await tiles(page, "Wheel").nth(3).click()
    await lockSelected(page, "Wheel")
    const first = centerOf(await boxOf(tiles(page, "Wheel").nth(0)))
    const fourth = centerOf(await boxOf(tiles(page, "Wheel").nth(3)))

    // Onto the locked tile: no target, no swap
    await hold(page, first)
    await page.mouse.move(fourth.x, fourth.y, { steps: 20 })
    await expect(page.locator(".wheel-tool-tile.drop-target")).toHaveCount(0)
    await page.mouse.up()
    expect(await lettersIn(page, "Wheel")).toBe(WORD)

    // The locked tile itself doesn't move
    await hold(page, fourth)
    await page.mouse.move(first.x, first.y, { steps: 20 })
    await page.mouse.up()
    expect(await lettersIn(page, "Wheel")).toBe(WORD)
  })

  test("a drag isn't also a tap", async ({ page }) => {
    const first = centerOf(await boxOf(tiles(page, "Wheel").nth(0)))
    const wheel = await boxOf(page.locator(".wheel-boundary"))

    await hold(page, first)
    await page.mouse.move(
      wheel.x + wheel.width / 2,
      wheel.y + wheel.height / 2,
      {
        steps: 10,
      },
    )
    await page.mouse.up()

    await expect(selectedTile(page, "Wheel")).toHaveCount(0)
  })
})
