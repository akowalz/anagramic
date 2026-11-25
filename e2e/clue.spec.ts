import { expect, test, type Page } from "@playwright/test"
import {
  boxOf,
  lettersIn,
  open,
  pickTool,
  prepare,
  tiles,
  typeOnKeyboard,
} from "./helpers"

/*
 * A clue can be entered for reference. Its words can be tapped to add their
 * letters, and while there's a clue the tool picker becomes a dropdown.
 */

test.beforeEach(async ({ page }) => {
  await prepare(page)
})

const CLUE = "Words rearranged, a nag mars terribly (8)"

function clueWord(page: Page, word: string) {
  return page.locator(".clue-word", { hasText: new RegExp(`^${word}$`) })
}

/* Open the clue box from the empty prompt */
async function addClue(page: Page) {
  await page.getByRole("button", { name: "or add a clue" }).click()
}

async function enterClue(page: Page, clue = CLUE) {
  await page.getByLabel("Clue", { exact: true }).fill(clue)
  await page.getByRole("button", { name: "Done" }).click()
}

test("works without a clue, as before", async ({ page }) => {
  await open(page, "cat")

  await expect(page.locator(".tool-picker")).toBeVisible()
  await expect(page.locator(".clue-card")).toHaveCount(0)
})

test("a clue can be added after typing letters, once the tutorial's done", async ({
  page,
}) => {
  await open(page, "cat")
  const link = page.getByRole("button", { name: "Add a clue", exact: true })

  // Not until the last hint, to try another tool, is learned
  await expect(link).toHaveCount(0)
  await pickTool(page, "Wheel")
  await pickTool(page, "Line")
  await expect(link).toBeVisible()

  await link.click()
  await enterClue(page)

  await expect(page.locator(".clue-card")).toBeVisible()
  expect(await lettersIn(page, "Line")).toBe("CAT")
  // With a clue showing, it's not needed
  await expect(link).toHaveCount(0)

  // And it stays from then on
  await page.getByRole("button", { name: "Remove clue" }).click()
  await page.reload()
  await expect(link).toBeVisible()
})

test("a clue can be added from the empty prompt", async ({ page }) => {
  await open(page)

  await addClue(page)
  await expect(page.getByLabel("Clue", { exact: true })).toBeFocused()
  await enterClue(page)

  await expect(page.locator(".clue-text")).toContainText("a nag mars")
  // The tool picker moves into a dropdown in the header
  await expect(page.locator(".tool-picker")).toHaveCount(0)
  await expect(page.getByLabel("Tool")).toHaveValue("Line")
  await expect(page.locator(".clue-card")).toBeVisible()
  await expect(
    page.getByText("Tap words in the clue, or type").filter({ visible: true }),
  ).toBeVisible()
})

test("tapping clue words adds their letters, and again takes them out", async ({
  page,
}) => {
  await open(page)
  await addClue(page)
  await enterClue(page)
  await expect(page.locator(".clue-meta")).toContainText("0 of 8 letters")

  await clueWord(page, "a").click()
  await clueWord(page, "nag").click()
  await clueWord(page, "mars").click()

  expect(await lettersIn(page, "Line")).toBe("ANAGMARS")
  await expect(clueWord(page, "nag")).toHaveClass(/\bused\b/)
  await expect(page.locator(".clue-meta")).toContainText("8 of 8 letters")

  await clueWord(page, "nag").click()

  expect(await lettersIn(page, "Line")).toBe("AMARS")
  await expect(clueWord(page, "nag")).not.toHaveClass(/\bused\b/)
  await expect(page.locator(".clue-meta")).toContainText("5 of 8 letters")
})

test("a word stays used only while its letters are there", async ({ page }) => {
  await open(page)
  await addClue(page)
  await enterClue(page)
  await clueWord(page, "a").click()

  // Delete selects the letter, then deletes it
  await page.getByRole("button", { name: "Delete" }).click()
  await page.getByRole("button", { name: "Delete" }).click()

  await expect(tiles(page, "Line")).toHaveCount(0)
  await expect(clueWord(page, "a")).not.toHaveClass(/\bused\b/)
})

test("typing the clue doesn't type letters", async ({ page }) => {
  await open(page)
  await addClue(page)

  await page.keyboard.type("Some clue")

  await expect(page.getByLabel("Clue", { exact: true })).toHaveValue(
    "Some clue",
  )
  await expect(tiles(page, "Line")).toHaveCount(0)
})

test("the dropdown switches tools", async ({ page }) => {
  await open(page)
  await addClue(page)
  await enterClue(page)
  await typeOnKeyboard(page, "cat")

  await page.getByLabel("Tool").selectOption("Wheel")

  await expect(tiles(page, "Wheel").first()).toBeVisible()
})

test("the clue can be edited, and removed", async ({ page }) => {
  await open(page)
  await addClue(page)
  await enterClue(page)

  await page.getByRole("button", { name: "Edit clue" }).click()
  await expect(page.getByLabel("Clue", { exact: true })).toHaveValue(CLUE)
  await enterClue(page, "A different clue (5)")
  await expect(page.locator(".clue-text")).toContainText("A different clue")

  await page.getByRole("button", { name: "Remove clue" }).click()

  await expect(page.locator(".clue-card")).toHaveCount(0)
  await expect(page.locator(".tool-picker")).toBeVisible()
})

test("an emptied clue is no clue", async ({ page }) => {
  await open(page)
  await addClue(page)

  await enterClue(page, "   ")

  await expect(page.locator(".clue-card")).toHaveCount(0)
  await expect(page.locator(".tool-picker")).toBeVisible()
})

test("letters can still be typed with a clue", async ({ page }) => {
  await open(page)
  await addClue(page)
  await enterClue(page)

  await typeOnKeyboard(page, "xy")

  expect(await lettersIn(page, "Line")).toBe("XY")
  await expect(page.locator(".clue-meta")).toContainText("2 of 8 letters")
})

test.describe("Add a clue and the tutorial", () => {
  const link = (page: Page) =>
    page.getByRole("button", { name: "Add a clue", exact: true })

  test("switching tools early still brings it in", async ({ page }) => {
    // Before the "try another tool" hint has come up: still on the first hint
    await open(page, "cat")
    await expect(page.locator(".line-hint")).toHaveText(
      "Tap and drag to move letters",
    )
    await expect(link(page)).toHaveCount(0)

    await pickTool(page, "Wheel")

    await expect(link(page)).toBeVisible()
  })

  test("with a clue added mid-tutorial, the dropdown counts as trying another tool", async ({
    page,
  }) => {
    await open(page)
    await addClue(page)
    await enterClue(page)
    await typeOnKeyboard(page, "cat")
    // No tool picker with a clue, so no "try another tool" hint either
    await expect(page.locator(".toolbar-hint")).toHaveCount(0)

    await page.getByLabel("Tool").selectOption("Wheel")
    await page.getByRole("button", { name: "Remove clue" }).click()

    await expect(page.locator(".tool-picker")).toBeVisible()
    await expect(link(page)).toBeVisible()
    await expect(page.locator(".toolbar-hint")).not.toHaveText(/./)
  })

  test("with no letters, only the empty prompt's link shows", async ({
    page,
  }) => {
    await open(page, "c")
    await pickTool(page, "Wheel")
    await expect(link(page)).toBeVisible()

    // Delete selects the letter, then deletes it
    await page.getByRole("button", { name: "Delete" }).click()
    await page.getByRole("button", { name: "Delete" }).click()

    await expect(link(page)).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "or add a clue" }),
    ).toBeVisible()
  })

  test("it doesn't cover the tool, so taps there still reach it", async ({
    page,
  }) => {
    await open(page, "cat")
    await pickTool(page, "Freeform")

    const below = await boxOf(link(page))
    const tool = await boxOf(page.locator("#tool-container"))
    expect(below.y + below.height).toBeLessThanOrEqual(tool.y + 1)
  })

  test("it's under the tool picker in every tool", async ({ page }) => {
    await open(page, "cat")
    await pickTool(page, "Wheel")

    for (const tool of ["Line", "Wheel", "Freeform", "Floating"] as const) {
      await pickTool(page, tool)
      const picker = await boxOf(page.locator(".tool-picker"))
      const below = await boxOf(link(page))
      expect(below.y).toBeGreaterThanOrEqual(picker.y + picker.height - 1)
      expect(below.y).toBeLessThan(picker.y + picker.height + 20)
    }
  })
})
