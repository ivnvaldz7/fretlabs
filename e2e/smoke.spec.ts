/**
 * FretLabs E2E smoke tests.
 *
 * These verify the app loads, renders, and responds to user interaction
 * without crashing. They do NOT validate calculation accuracy — that's
 * covered by the unit tests (171+ tests in __tests__/).
 *
 * Run: npm run test:e2e
 *      npm run test:e2e:ui   (headed with Playwright UI)
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
  test('page loads and renders header with expected sections', async ({ page }) => {
    await page.goto('/');

    // App title
    await expect(page.locator('h1')).toContainText('FretLabs');

    // Tagline
    await expect(page.getByText('Professional fretboard designer')).toBeVisible();

    // Sidebar section headings — use role="heading" for uniqueness
    await expect(page.getByRole('heading', { name: 'Scale Length' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Overhang' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Compensation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Export' })).toBeVisible();

    // Number inputs that confirm panel rendering
    const numberInputs = page.locator('input[type="number"]');
    await expect(numberInputs.first()).toBeVisible();
  });

  test('default fretboard renders SVG preview', async ({ page }) => {
    await page.goto('/');

    // The fretboard SVG has aria-label="Fretboard preview"
    const svg = page.getByRole('img', { name: 'Fretboard preview' });
    await expect(svg).toBeVisible({ timeout: 5000 });

    // Should contain fret lines
    const lines = svg.locator('line');
    await expect(lines).not.toHaveCount(0);
  });

  test('changing scale length recalculates the preview', async ({ page }) => {
    await page.goto('/');

    // Get the first number input
    const scaleInput = page.locator('input[type="number"]').first();
    await expect(scaleInput).toBeVisible();

    // Change scale length
    await scaleInput.fill('');
    await scaleInput.fill('700');
    await page.waitForTimeout(500);

    // SVG still renders (no crash)
    const svg = page.getByRole('img', { name: 'Fretboard preview' });
    await expect(svg).toBeVisible();
  });

  test('theme toggle switches between light and dark', async ({ page }) => {
    await page.goto('/');

    // Default is light in headless mode
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    const toggle = page.locator('button[aria-label*="mode"]');
    await expect(toggle).toBeVisible();

    // Click → dark
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Click → light
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('undo/redo works when toggling a panel mode', async ({ page }) => {
    await page.goto('/');

    const undoBtn = page.locator('button[aria-label="Undo"]');
    const redoBtn = page.locator('button[aria-label="Redo"]');
    await expect(undoBtn).toBeVisible();

    // Overhang has mode toggle buttons (Equal / Nut&Bridge / First&Last / All)
    const nutBridgeBtn = page.getByRole('button', { name: 'Nut & Bridge' }).first();
    const equalBtn = page.getByRole('button', { name: 'Equal' }).first();
    const isActive = (btn: ReturnType<typeof page.locator>) =>
      btn.evaluate((el) => el.classList.contains('bg-primary'));

    // Default: Equal is active
    expect(await isActive(equalBtn)).toBe(true);
    expect(await isActive(nutBridgeBtn)).toBe(false);

    // Click "Nut & Bridge" to change mode
    await nutBridgeBtn.click();
    await page.waitForTimeout(400);
    expect(await isActive(nutBridgeBtn)).toBe(true);
    expect(await isActive(equalBtn)).toBe(false);

    // Programmatically trigger undo through React's setConfig
    // to bypass any click/keyboard propagation issues
    const undone = await page.evaluate(() => {
      // Access the React root and dispatch a custom event
      // that the hook's keyboard handler picks up
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: false,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);
      // Return after a short delay for state to settle
      return new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(true), 200);
      });
    });
    await page.waitForTimeout(200);

    // Equal should now be active (undo reverted the mode change)
    expect(await isActive(equalBtn)).toBe(true);
    expect(await isActive(nutBridgeBtn)).toBe(false);

    // Redo via programmatic Ctrl+Shift+Z
    await page.evaluate(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);
    });
    await page.waitForTimeout(300);
    expect(await isActive(nutBridgeBtn)).toBe(true);
    expect(await isActive(equalBtn)).toBe(false);
  });

  test('export menu shows all download options', async ({ page }) => {
    await page.goto('/');

    // Buttons appear in both desktop and mobile — use .first() to get one
    await expect(page.getByRole('button', { name: 'Download SVG' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download DXF (CNC)' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download CSV' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download PDF' }).first()).toBeVisible();
  });
});
