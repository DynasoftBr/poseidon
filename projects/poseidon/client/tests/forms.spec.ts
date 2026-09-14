import { test, expect } from '@playwright/test';
test('should share drafts across steps and preserve values after a failed submission', async ({
    page,
}) => {
    await page.goto('/tests/form-fixture.html');
    await page.getByRole('textbox', { name: 'Name' }).fill('Ada');
    await page.getByRole('button', { name: 'Change step' }).click();
    await expect(page.getByText('Greeting: Hello Ada')).toBeVisible();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Version conflict');
    await page.getByRole('button', { name: 'Change step' }).click();
    await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Ada');
    await page.getByRole('checkbox', { name: 'Simulate conflict' }).uncheck();
    await page.getByRole('button', { name: 'Change step' }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
});
