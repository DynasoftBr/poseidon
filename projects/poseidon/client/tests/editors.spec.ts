import { test, expect } from '@playwright/test';
test('should open the components route from the navigation menu', async ({ page }) => {
    await page.goto('/');
    const frame = page.frameLocator('iframe[title="Poseidon Portal"]');
    await frame.getByRole('link', { name: 'Components', exact: true }).click();
    await expect(page).toHaveURL(/\/components$/);
    await expect(frame.getByRole('navigation', { name: 'Component files' })).toBeVisible();
    await expect(
        frame.getByRole('heading', { name: 'Components', exact: true }).locator('..'),
    ).toHaveCSS('background-color', 'rgb(250, 250, 250)');
    await expect(frame.getByRole('navigation', { name: 'Breadcrumb' })).toContainText(
        'Poseidon/Components',
    );
    const navigation = frame.locator('[data-portal-sidebar]');
    await frame.getByRole('button', { name: 'Toggle navigation' }).click();
    await expect(navigation).toBeHidden();
    await frame.getByRole('button', { name: 'Toggle navigation' }).click();
    await expect(navigation).toBeVisible();
    await frame.getByRole('button', { name: 'Local user menu' }).click();
    await expect(frame.getByRole('switch', { name: 'Dark mode' })).toBeVisible();
    await expect(frame.getByRole('button', { name: 'Logout' })).toBeVisible();
});

test('should create an entity type with a relationship and declarative action', async ({
    page,
}) => {
    await page.goto('/entities');
    const frame = page.frameLocator('iframe');
    await frame.getByRole('button', { name: 'Create new', exact: true }).click();
    await frame.getByRole('textbox', { name: 'Entity name' }).fill('Example ' + Date.now());
    await frame.getByRole('button', { name: 'Add property' }).click();
    await frame.getByRole('textbox', { name: 'Property name' }).fill('owner');
    await frame.getByRole('combobox', { name: 'Type', exact: true }).selectOption('reference');
    await frame.getByRole('combobox', { name: 'Related entity type' }).selectOption('user');
    await frame
        .getByRole('textbox', { name: 'Declarative actions' })
        .fill(
            JSON.stringify([
                { id: 'create', name: 'create', label: 'Create', operation: 'create', rules: [] },
            ]),
        );
    await frame.getByRole('button', { name: 'Save entity type' }).click();
    await expect(frame.getByRole('status')).toHaveText('Entity type saved.');
});

test('should allow editing a core entity type', async ({ page }) => {
    await page.goto('/entities');
    const frame = page.frameLocator('iframe');
    await frame.getByRole('button', { name: 'Entity type →', exact: true }).click();
    await expect(frame.getByRole('textbox', { name: 'Entity name' })).toHaveValue('entity-type');
    await expect(frame.getByRole('button', { name: 'Add property' })).toBeVisible();
    await expect(frame.getByRole('textbox', { name: 'Declarative actions' })).toBeEnabled();
    await expect(frame.getByRole('button', { name: 'Save entity type' })).toBeVisible();
});

test('should create, update and delete an identity', async ({ page }) => {
    await page.goto('/identities');
    const frame = page.frameLocator('iframe[title="Poseidon Portal"]');
    const suffix = Date.now();
    const administrator = `Administrator ${suffix}`;
    const administratorTeam = `${administrator} team`;
    const readOnly = `Read only ${suffix}`;

    await frame.getByRole('button', { name: 'Create identity' }).click();
    await frame.getByRole('textbox', { name: 'Identity name' }).fill(administrator);
    await frame.getByRole('combobox', { name: 'Owner' }).selectOption('system');
    await frame.getByRole('button', { name: 'Save identity' }).click();
    await expect(frame.getByRole('status')).toHaveText('Identity saved.');

    await frame.getByRole('textbox', { name: 'Identity name' }).fill(administratorTeam);
    await frame.getByRole('button', { name: 'Save identity' }).click();
    await expect(frame.getByRole('status')).toHaveText('Identity saved.');

    await frame.getByRole('button', { name: 'Create identity' }).click();
    await frame.getByRole('textbox', { name: 'Identity name' }).fill(readOnly);
    await frame.getByRole('combobox', { name: 'Owner' }).selectOption('system');
    await frame.getByRole('button', { name: 'Add member' }).click();
    await frame
        .getByRole('dialog', { name: 'Add member' })
        .getByRole('button', { name: administratorTeam })
        .click();
    await frame.getByRole('button', { name: 'Save identity' }).click();
    await expect(frame.getByRole('status')).toHaveText('Identity saved.');

    await frame.getByRole('button', { name: `${administratorTeam} →` }).click();
    await expect(frame.getByRole('list', { name: 'Member of' })).toContainText(readOnly);

    await frame.getByRole('button', { name: `${readOnly} →` }).click();
    await frame.getByRole('button', { name: 'Delete identity' }).click();
    const dialog = frame.getByRole('dialog', { name: 'Delete identity?' });
    await dialog.getByRole('button', { name: 'Delete identity' }).click();
    await expect(frame.getByRole('status')).toHaveText('Identity deleted.');
    await expect(frame.getByRole('button', { name: `${readOnly} →` })).toHaveCount(0);
});
test('should preview saved components without replacing the editor session', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/components');
    const frame = page.frameLocator('iframe[title="Poseidon Portal"]');
    await frame.getByRole('button', { name: 'Portal →', exact: true }).click();
    await expect(frame.getByRole('textbox', { name: 'Source code', exact: true })).toBeVisible();
    await frame.getByRole('button', { name: 'Preview', exact: true }).click();
    const preview = page.frameLocator('iframe[title="Draft preview"]');
    await expect(preview.getByRole('heading', { name: 'Hello, Preview' })).toBeVisible({
        timeout: 30_000,
    });
    await page.getByRole('button', { name: 'Close preview', exact: true }).click();
    await frame.getByRole('button', { name: /^Problems:/ }).click();
    await expect(frame.getByRole('region', { name: 'Problems drawer' })).toBeVisible();
    await expect(frame.getByLabel('Code problems').getByRole('status')).toHaveText(
        'Preview built.',
    );
    await expect(frame.getByRole('status')).toHaveCount(1);
    await expect(frame.getByRole('textbox', { name: 'Source code', exact: true })).toBeVisible();
    await expect(frame.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('Portal');
});
test('should toggle the component list and Triton sidebar from the editor header', async ({
    page,
}) => {
    await page.goto('/components');
    const frame = page.frameLocator('iframe[title="Poseidon Portal"]');
    const componentList = frame.getByRole('navigation', { name: 'Component files' });
    await expect(componentList).toBeVisible();
    await frame.getByRole('button', { name: 'Hide component list' }).click();
    await expect(componentList).toBeHidden();
    await frame.getByRole('button', { name: 'Show component list' }).click();
    await expect(componentList).toBeVisible();
    await frame.getByRole('button', { name: 'ui-button →', exact: true }).click();
    await frame.getByRole('button', { name: 'Show problems panel' }).click();
    await expect(frame.getByRole('region', { name: 'Problems drawer' })).toBeVisible();
    await expect(frame.getByRole('button', { name: /^Problems:/ })).toHaveAttribute(
        'aria-expanded',
        'true',
    );
    await frame.getByRole('button', { name: /^Problems:/ }).click();
    await expect(frame.getByRole('region', { name: 'Problems drawer' })).toBeHidden();
    await expect(frame.getByRole('button', { name: 'Show problems panel' })).toBeVisible();
    await expect(frame.getByRole('complementary', { name: 'Triton' })).toBeVisible();
    await expect(frame.getByPlaceholder('Describe what to build')).toBeVisible();
    await frame.getByRole('button', { name: 'Close Triton' }).first().click();
    await expect(frame.getByRole('complementary', { name: 'Triton' })).toBeHidden();
});

test('should compose a component visually and generate its source', async ({ page }) => {
    await page.goto('/components');
    const frame = page.frameLocator('iframe[title="Poseidon Portal"]');
    const name = `Visual example ${Date.now()}`;
    await frame.getByRole('button', { name: 'Create new', exact: true }).click();
    await frame.getByRole('textbox', { name: 'Name', exact: true }).fill(name);
    await expect(frame.getByRole('button', { name: 'Visual', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
    );
    await frame.getByRole('button', { name: 'Text', exact: true }).click();
    await frame.getByRole('textbox', { name: 'text', exact: true }).fill('Hello from visual');
    await frame.getByRole('button', { name: 'ui-card', exact: true }).click();
    await frame.getByRole('button', { name: 'ui-switch', exact: true }).click();
    await frame.getByRole('textbox', { name: /^label/ }).fill('Enabled');
    await frame.getByRole('checkbox', { name: /^checked/ }).check();
    await expect(frame.locator('[aria-label="Saved"]')).toBeVisible({ timeout: 10_000 });
    await frame.getByRole('button', { name: 'Code', exact: true }).click();
    await expect(frame.locator('.view-lines')).toContainText('Hello from visual');
    await expect(frame.locator('.view-lines')).toContainText('@poseidon-visual');
    await expect(frame.locator('.view-lines')).toContainText(
        "import Card from '@components/ui-card'",
    );
    await expect(frame.locator('.view-lines')).toContainText('onChange={() => undefined}');
});

test('should close the mobile drawer with Escape and restore focus', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto('/');
    const frame = page.frameLocator('iframe');
    const toggle = frame.getByRole('button', { name: 'Toggle navigation', exact: true });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(frame.getByRole('dialog', { name: 'Navigation', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(frame.getByRole('dialog', { name: 'Navigation', exact: true })).toHaveCount(0);
    await expect(toggle).toBeFocused();
});
