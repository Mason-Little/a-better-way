import { test, expect } from '@playwright/test';

// See here how to get started:
// https://playwright.dev/docs/intro
test('visits the app root url and map loads', async ({ page }) => {
  await page.goto('/');
  // Check that the navigation panel is visible
  await expect(page.locator('text=Route Planner')).toBeVisible();
});
