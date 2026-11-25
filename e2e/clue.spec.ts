import { expect, test, type Page } from "@playwright/test"
import { lettersIn, open, prepare, tiles, typeOnKeyboard } from "./helpers"

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

test("a clue can be added after typing letters, keeping them", async ({
  page,
}) => {
  await open(page, "cat")

  await page.getByRole("button", { name: "Add a clue" }).click()
  await enterClue(page)

  await expect(page.locator(".clue-card")).toBeVisible()
  expect(await lettersIn(page, "Line")).toBe("CAT")
  // With a clue showing, it's not needed
  await expect(page.getByRole("button", { name: "Add a clue" })).toHaveCount(0)
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
