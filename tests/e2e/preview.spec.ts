import { expect, test } from "@playwright/test"

test("Preview homepage is reachable through Vercel protection bypass", async ({ page }) => {
  await page.goto("/")
  await expect(page).not.toHaveTitle(/Vercel Authentication/i)
  await expect(page.locator("body")).not.toContainText("Log in to Vercel")
})

test("Preview admin route is reachable through Vercel protection bypass", async ({ page }) => {
  const response = await page.goto("/admin")
  expect(response?.status()).toBeLessThan(500)
  await expect(page.locator("body")).not.toContainText("Log in to Vercel")
})
