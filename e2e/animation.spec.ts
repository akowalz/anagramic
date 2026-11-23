import { expect, test } from "@playwright/test"
import { boxOf, centerOf, pickTool, tileAt } from "./helpers"

/*
 * Checks of how things move, so unlike the other UI tests these keep CSS
 * transitions on (there's no prepare()). They look at where a tile is just
 * after something happens, not just where it ends up.
 */

test.describe("Wheel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?fodder=ANAGRAMS")
    await pickTool(page, "Wheel")
    await expect(tileAt(page, "Wheel", 7)).toBeVisible()
  })

  for (const swap of [true, false]) {
    test(`a dropped tile eases in from where it was let go (${
      swap ? "swapping" : "going back"
    })`, async ({ page }) => {
      const id = await tileAt(page, "Wheel", 0).getAttribute("data-id")
      const tile = page.locator(`.wheel-tool-tile[data-id="${id}"]`)
      const home = centerOf(await boxOf(tile))
      const wheel = await boxOf(page.locator(".wheel-boundary"))
      const drop = swap
        ? centerOf(await boxOf(tileAt(page, "Wheel", 3)))
        : { x: wheel.x + wheel.width / 2, y: wheel.y + wheel.height / 2 }

      await page.mouse.move(home.x, home.y)
      await page.mouse.down()
      await page.mouse.move(drop.x, drop.y, { steps: 20 })
      await page.mouse.up()

      // Just after letting go it's still near the finger, not back home
      const justAfter = centerOf(await boxOf(tile))
      const fromDrop = Math.hypot(justAfter.x - drop.x, justAfter.y - drop.y)
      const fromHome = Math.hypot(justAfter.x - home.x, justAfter.y - home.y)
      expect(fromDrop).toBeLessThan(fromHome)
    })
  }
})
