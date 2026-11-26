import { expect, test, type Page } from "@playwright/test"
import {
  boxOf,
  footerButton,
  lettersIn,
  open,
  pickTool,
  prepare,
  tiles,
  typeOnKeyboard,
} from "./helpers"

/*
 * A clue can be entered for reference. Its words can be tapped to add their
 * letters. The tool picker stays, under the clue.
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

/* Entering a clue closes the in-app keyboard; open it again to type */
async function showKeyboard(page: Page) {
  await footerButton(page, "Keyboard").click()
}

/* The keys' wrapper collapses to nothing when the keyboard's closed */
function keyboardHeight(page: Page) {
  return page
    .locator(".keyboard-keys-wrapper")
    .evaluate((el) => el.getBoundingClientRect().height)
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
  // The tool picker stays, under the clue
  const card = await boxOf(page.locator(".clue-card"))
  const picker = await boxOf(page.locator(".tool-picker"))
  expect(picker.y).toBeGreaterThanOrEqual(card.y + card.height)
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
  await expect(page.locator(".clue-count")).toHaveText("0/8")

  await clueWord(page, "a").click()
  await clueWord(page, "nag").click()
  await clueWord(page, "mars").click()

  expect(await lettersIn(page, "Line")).toBe("ANAGMARS")
  await expect(clueWord(page, "nag")).toHaveClass(/\bused\b/)
  await expect(page.locator(".clue-count")).toHaveText("8/8")

  await clueWord(page, "nag").click()

  expect(await lettersIn(page, "Line")).toBe("AMARS")
  await expect(clueWord(page, "nag")).not.toHaveClass(/\bused\b/)
  await expect(page.locator(".clue-count")).toHaveText("5/8")
})

test("a word stays used only while its letters are there", async ({ page }) => {
  await open(page)
  await addClue(page)
  await enterClue(page)
  await clueWord(page, "a").click()

  // Delete selects the letter, then deletes it
  await showKeyboard(page)
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

test("the tool picker still switches tools with a clue", async ({ page }) => {
  await open(page)
  await addClue(page)
  await enterClue(page)
  await showKeyboard(page)
  await typeOnKeyboard(page, "cat")

  await pickTool(page, "Wheel")

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

test("the count turns yellow at the answer's length, and red past it", async ({
  page,
}) => {
  await open(page)
  await addClue(page)
  await enterClue(page, "A short clue (3)")
  const count = page.locator(".clue-count")

  await showKeyboard(page)
  await typeOnKeyboard(page, "ab")
  await expect(count).toHaveText("2/3")
  await expect(count).not.toHaveClass(/\b(exact|over)\b/)

  await typeOnKeyboard(page, "c")
  await expect(count).toHaveText("3/3")
  await expect(count).toHaveClass(/\bexact\b/)

  await typeOnKeyboard(page, "d")
  await expect(count).toHaveText("4/3")
  await expect(count).toHaveClass(/\bover\b/)
})

test("the in-app keyboard closes while entering a clue, and stays closed", async ({
  page,
}) => {
  await open(page)
  await expect.poll(() => keyboardHeight(page)).toBeGreaterThan(100)

  await addClue(page)
  await expect.poll(() => keyboardHeight(page)).toBe(0)

  await enterClue(page)
  await expect.poll(() => keyboardHeight(page)).toBe(0)
  await expect(footerButton(page, "Keyboard")).toBeVisible()
})

test("with the keyboard open too, the tool picker moves up into the header", async ({
  page,
}) => {
  await open(page)
  await addClue(page)
  await enterClue(page)
  const picker = page.locator(".tool-picker")
  await expect(page.locator("#main-navigation .tool-picker")).toBeVisible()

  await showKeyboard(page)
  await expect(page.locator("#header .tool-picker")).toBeVisible()
  await expect(picker).toHaveCount(1)
  // Still there to use
  await pickTool(page, "Wheel")
  await expect(page.locator(".tool-picker-tool.active")).toHaveText("Wheel")

  await page.getByRole("button", { name: "Hide keyboard" }).click()
  await expect(page.locator("#main-navigation .tool-picker")).toBeVisible()

  // And back in its usual place once the clue is gone
  await showKeyboard(page)
  await page.getByRole("button", { name: "Remove clue" }).click()
  await expect(page.locator("#main-navigation .tool-picker")).toBeVisible()
})

test("a multi-word enumeration counts all the letters", async ({ page }) => {
  await open(page)
  await addClue(page)
  await enterClue(page, "Festive dessert, with a nag (6, 4)")

  await expect(page.locator(".clue-count")).toHaveText("0/10")
  await expect(page.locator(".clue-enumeration")).toHaveText("(6, 4)")
  await expect(page.locator(".clue-word")).toHaveCount(5)
})

test("the clue is kept in the link, so it survives a reload", async ({
  page,
}) => {
  await open(page)
  await addClue(page)
  await enterClue(page)
  await clueWord(page, "nag").click()
  expect(new URL(page.url()).searchParams.get("clue")).toBe(CLUE)

  await page.reload()

  await expect(page.locator(".clue-text")).toContainText("a nag mars")
  expect(await lettersIn(page, "Line")).toBe("NAG")

  await page.getByRole("button", { name: "Remove clue" }).click()
  expect(new URL(page.url()).searchParams.has("clue")).toBe(false)
})

test("letters can still be typed with a clue", async ({ page }) => {
  await open(page)
  await addClue(page)
  await enterClue(page)

  await showKeyboard(page)
  await typeOnKeyboard(page, "xy")

  expect(await lettersIn(page, "Line")).toBe("XY")
  await expect(page.locator(".clue-count")).toHaveText("2/8")
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

  test("with a clue added mid-tutorial, switching tools still counts", async ({
    page,
  }) => {
    await open(page)
    await addClue(page)
    await enterClue(page)
    await showKeyboard(page)
    await typeOnKeyboard(page, "cat")
    // No "Add a clue" while there's a clue
    await pickTool(page, "Wheel")
    await expect(link(page)).toHaveCount(0)

    await page.getByRole("button", { name: "Remove clue" }).click()

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
