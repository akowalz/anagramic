import { expect, test } from "@playwright/test"
import {
  footerButton,
  lettersIn,
  open,
  pickTool,
  prepare,
  pressDelete,
  selectedTile,
  tiles,
  typeOnKeyboard,
} from "./helpers"

test.beforeEach(async ({ page }) => {
  await prepare(page)
})

test.describe("typing", () => {
  test("asks for letters until some are typed", async ({ page }) => {
    await open(page)
    await expect(
      page.getByText("Type to add letters").filter({ visible: true }),
    ).toBeVisible()

    await typeOnKeyboard(page, "cat")

    await expect(
      page.getByText("Type to add letters").filter({ visible: true }),
    ).toBeHidden()
    await pickTool(page, "Line")
    expect(await lettersIn(page, "Line")).toBe("CAT")
  })

  test("keeps the letters in the link so it can be shared", async ({
    page,
  }) => {
    await open(page)
    await typeOnKeyboard(page, "dog")

    await expect(page).toHaveURL(/\?fodder=DOG$/)
  })

  test("takes letters from a shared link, ignoring anything else", async ({
    page,
  }) => {
    await page.goto("/?fodder=c-o%200l")
    await pickTool(page, "Line")

    expect(await lettersIn(page, "Line")).toBe("COL")
  })

  test("types with a physical keyboard too", async ({ page }) => {
    await open(page)

    await page.keyboard.type("sun")
    await pickTool(page, "Line")

    expect(await lettersIn(page, "Line")).toBe("SUN")
  })

  test("typing a letter clears the selection", async ({ page }) => {
    await open(page, "cat")
    await pickTool(page, "Line")
    await tiles(page, "Line").nth(0).click()
    await expect(selectedTile(page, "Line")).toHaveCount(1)

    await typeOnKeyboard(page, "s")

    await expect(selectedTile(page, "Line")).toHaveCount(0)
    expect(await lettersIn(page, "Line")).toBe("CATS")
  })
})

test.describe("delete", () => {
  test("first selects the last letter, without deleting it", async ({
    page,
  }) => {
    await open(page, "cat")
    await pickTool(page, "Line")

    await pressDelete(page)

    expect(await lettersIn(page, "Line")).toBe("CAT")
    await expect(selectedTile(page, "Line")).toHaveText("T")
  })

  test("deletes the selected letter and selects the one typed before it", async ({
    page,
  }) => {
    await open(page, "cat")
    await pickTool(page, "Line")

    await pressDelete(page)
    await pressDelete(page)

    expect(await lettersIn(page, "Line")).toBe("CA")
    await expect(selectedTile(page, "Line")).toHaveText("A")
  })

  test("deletes a tapped letter from the middle", async ({ page }) => {
    await open(page, "cat")
    await pickTool(page, "Line")
    await tiles(page, "Line").nth(1).click()

    await pressDelete(page)

    expect(await lettersIn(page, "Line")).toBe("CT")
    await expect(selectedTile(page, "Line")).toHaveText("C")
  })

  test("deletes the right one of two repeated letters", async ({ page }) => {
    await open(page, "cool")
    await pickTool(page, "Line")
    // The second O
    await tiles(page, "Line").nth(2).click()

    await pressDelete(page)

    expect(await lettersIn(page, "Line")).toBe("COL")
    // The first O, typed before the deleted one, is now selected
    await expect(tiles(page, "Line").nth(1)).toHaveClass(/\bactive\b/)
  })

  test("selects the next letter after deleting the first", async ({ page }) => {
    await open(page, "cat")
    await pickTool(page, "Line")
    await tiles(page, "Line").nth(0).click()

    await pressDelete(page)

    expect(await lettersIn(page, "Line")).toBe("AT")
    await expect(selectedTile(page, "Line")).toHaveText("A")
  })

  test("deletes everything when pressed repeatedly", async ({ page }) => {
    await open(page, "cat")

    for (let i = 0; i < 4; i++) await pressDelete(page)

    await expect(tiles(page, "Line")).toHaveCount(0)
    await expect(
      page.getByText("Type to add letters").filter({ visible: true }),
    ).toBeVisible()
    await expect(page).not.toHaveURL(/fodder/)
  })

  test("Backspace works like the delete key", async ({ page }) => {
    await open(page, "cat")
    await pickTool(page, "Line")

    await page.keyboard.press("Backspace")
    await expect(selectedTile(page, "Line")).toHaveText("T")
    await page.keyboard.press("Backspace")

    expect(await lettersIn(page, "Line")).toBe("CA")
  })

  test("works in every tool", async ({ page }) => {
    await open(page, "cats")

    for (const tool of ["Freeform", "Line", "Wheel", "Floating"] as const) {
      await pickTool(page, tool)
      await pressDelete(page)
      await expect(selectedTile(page, tool)).toHaveCount(1)
      await pressDelete(page)
    }

    await expect(tiles(page, "Line")).toHaveCount(0)
  })
})

test.describe("tools", () => {
  test("Line's hint waits until there are letters to move", async ({
    page,
  }) => {
    await open(page)
    const hint = page.locator(".tooltip")
    const height = (await hint.boundingBox())!.height
    await expect(hint).toHaveText(/^\s*$/)

    await typeOnKeyboard(page, "c")

    await expect(hint).toHaveText("Tap and drag to move letters")
    expect((await hint.boundingBox())!.height).toBe(height)
  })

  test("opens on Line", async ({ page }) => {
    await open(page, "cat")

    await expect(page.locator(".tool-picker-tool.active")).toHaveText("Line")
    await expect(tiles(page, "Line").first()).toBeVisible()
  })

  test("are ordered most rigid to least", async ({ page }) => {
    await open(page, "cat")

    await expect(page.locator(".tool-picker-tool")).toHaveText([
      "Line",
      "Wheel",
      "Freeform",
      "Floating",
    ])
  })

  test("each tool shows the letters and its own hint", async ({ page }) => {
    await open(page, "cat")

    const hints = {
      Freeform: "Drag to rearrange letters, tap to lock",
      Line: "Tap and drag to move letters",
      Wheel: "Tap to swap or lock letters",
      Floating: "Just let the letters float by",
    } as const

    for (const [tool, hint] of Object.entries(hints)) {
      await pickTool(page, tool as keyof typeof hints)
      await expect(page.locator(".tooltip")).toHaveText(hint)
      await expect(tiles(page, tool as keyof typeof hints)).toHaveCount(3)
      await expect(
        tiles(page, tool as keyof typeof hints).first(),
      ).toBeVisible()
    }
  })

  test("only the active tool is shown", async ({ page }) => {
    await open(page, "cat")
    await pickTool(page, "Wheel")

    await expect(tiles(page, "Wheel").first()).toBeVisible()
    await expect(tiles(page, "Freeform").first()).toBeHidden()
    await expect(tiles(page, "Line").first()).toBeHidden()
  })

  test("switching tools clears the selection", async ({ page }) => {
    await open(page, "cat")
    await pickTool(page, "Line")
    await tiles(page, "Line").nth(0).click()

    await pickTool(page, "Wheel")

    await expect(selectedTile(page, "Wheel")).toHaveCount(0)
  })

  test("Floating has a shuffle button but no reset", async ({ page }) => {
    await open(page, "cat")
    await pickTool(page, "Floating")

    await expect(footerButton(page, "Shuffle")).toBeVisible()
    await expect(footerButton(page, "Reset")).toHaveCount(0)
  })
})

test.describe("layout", () => {
  test("the keyboard can be hidden and shown again", async ({ page }) => {
    await open(page, "cat")
    // Hidden keys stay in the page, in a wrapper that collapses to nothing
    const keys = page.locator(".keyboard-keys-wrapper")
    const height = () =>
      keys.evaluate((el) => el.getBoundingClientRect().height)

    await page.getByRole("button", { name: "Hide keyboard" }).click()
    await expect.poll(height).toBe(0)
    await expect(footerButton(page, "Keyboard")).toBeVisible()

    await footerButton(page, "Keyboard").click()
    await expect.poll(height).toBeGreaterThan(100)
    await expect(footerButton(page, "Keyboard")).toHaveCount(0)
  })

  test("everything fits on a phone screen", async ({ page }) => {
    await open(page, "anagrams")
    const viewport = page.viewportSize()!

    for (const selector of [
      "h1",
      ".tool-picker",
      ".tool-footer",
      ".keyboard-key-delete",
      ".keyboard-toggle",
    ]) {
      const box = await page.locator(selector).boundingBox()
      expect(box, selector).not.toBeNull()
      expect(box!.y, selector).toBeGreaterThanOrEqual(0)
      expect(box!.y + box!.height, selector).toBeLessThanOrEqual(
        viewport.height,
      )
      expect(box!.x + box!.width, selector).toBeLessThanOrEqual(viewport.width)
    }
  })

  test("the title opens the about page and goes back", async ({ page }) => {
    await open(page, "cat")

    await page.getByRole("heading", { name: "anagramic" }).click()
    await expect(page.getByRole("heading", { name: "About" })).toBeVisible()

    await page.getByRole("heading", { name: "anagramic" }).click()
    await expect(tiles(page, "Line")).toHaveCount(3)
  })
})

test.describe("dark mode", () => {
  test.use({ colorScheme: "dark" })

  test("follows the device setting", async ({ page }) => {
    await open(page, "cat")

    const background = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    )
    // --app-bg in dark mode, #1d181e
    expect(background).toBe("rgb(29, 24, 30)")
  })
})
