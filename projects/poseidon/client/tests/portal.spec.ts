import { replaceSource, portalSource } from './editor-helpers';
import { test, expect } from '@playwright/test';
for (const width of [320, 375, 768, 1024, 1440]) {
    test(`should render Home without horizontal overflow at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/');
        const frame = page.frameLocator('iframe');
        await expect(frame.getByRole('heading', { name: 'Hello, Local user' })).toBeVisible();
        expect(await frame.locator('body').evaluate((body) => body.scrollWidth <= innerWidth)).toBe(
            true,
        );
        await expect(frame.getByRole('textbox', { name: 'Message Triton' })).toBeVisible();
    });
}
test('should persist chat and navigate through browser history', async ({ page }) => {
    await page.goto('/');
    const frame = page.frameLocator('iframe');
    const title = `Help me organize suppliers ${Date.now()}`;
    await frame.getByRole('textbox', { name: 'Message Triton' }).fill(title);
    await frame.getByRole('button', { name: 'Send message' }).click();
    await expect(frame.getByText('Triton · Simulated', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/chat\//);
    await expect(frame.getByRole('button', { name: title, exact: true })).toBeVisible();
    await page.reload();
    await frame.getByRole('button', { name: title, exact: true }).first().click();
    await expect(frame.getByText('Triton · Simulated', { exact: true })).toBeVisible();
});

test('should retain a working release when a draft build fails', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/components');
    const frame = page.frameLocator('iframe');
    await frame.getByRole('button', { name: 'Portal →', exact: true }).click();
    const original = await portalSource(page);
    await replaceSource(page, frame, original + '\nconst broken: number = "invalid";');
    await expect(frame.locator('[aria-label="Saved"]')).toBeVisible({ timeout: 10_000 });
    await frame.getByRole('button', { name: 'Publish Portal', exact: true }).click();
    await frame.getByRole('button', { name: 'Show problems panel' }).click();
    await expect(frame.getByRole('status')).toContainText('portal-entry:', { timeout: 30_000 });
    await page.goto('/');
    await expect(frame.getByRole('heading', { name: 'Hello, Local user' })).toBeVisible();
    await page.goto('/components');
    await frame.getByRole('button', { name: 'Portal →', exact: true }).click();
    await replaceSource(page, frame, original);
    await expect(frame.locator('[aria-label="Saved"]')).toBeVisible({ timeout: 10_000 });
    await frame.getByRole('button', { name: 'Publish Portal', exact: true }).click();
    await frame.getByRole('button', { name: 'Show problems panel' }).click();
    await expect(frame.getByRole('status')).toContainText('Release published', { timeout: 30_000 });
});
