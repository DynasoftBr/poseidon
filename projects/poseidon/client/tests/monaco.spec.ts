import { test, expect } from '@playwright/test';
import { replaceSource } from './editor-helpers';
test('should suggest component imports and add an import when completing a component', async ({
    page,
}) => {
    await page.goto('/components');
    const frame = page.frameLocator('iframe[title="Poseidon Portal"]');
    await frame.getByRole('button', { name: 'Create new', exact: true }).click();
    await expect(frame.getByLabel('Saved', { exact: true })).toBeVisible();
    await replaceSource(page, frame, 'import Button from "@components/ui-b');
    await expect(frame.locator('.view-lines')).toContainText(
        'import Button from "@components/ui-b',
    );
    await page.keyboard.press('Control+Space');
    const suggestions = frame.locator('.suggest-widget.visible');
    await expect(suggestions).toContainText('@components/ui-button', { timeout: 15000 });
    await page.keyboard.press('Escape');
    await replaceSource(page, frame, 'import Composer from "@components/portal-c');
    await expect(frame.locator('.view-lines')).toContainText(
        'import Composer from "@components/portal-c',
    );
    await page.keyboard.press('Control+Space');
    await expect(suggestions).toContainText('@components/portal-composer', { timeout: 15000 });
    await page.keyboard.press('Escape');
    await replaceSource(page, frame, 'export default function Example(){return <But');
    await expect(frame.locator('.view-lines')).toContainText(
        'export default function Example(){return <But',
    );
    await page.keyboard.press('Control+Space');
    await expect(suggestions).toContainText('Button', { timeout: 15000 });
    await suggestions.getByRole('option').filter({ hasText: '@components/ui-button' }).click();
    await expect(frame.locator('.view-lines')).toContainText(
        'import Button from "@components/ui-button"',
    );
    await page.keyboard.type('/>}');
    await expect(frame.locator('[aria-label="Code problems"]')).toHaveText('No problems reported', {
        timeout: 15000,
    });
});

test('should validate syntax, imports and component props while editing', async ({ page }) => {
    await page.goto('/components');
    const frame = page.frameLocator('iframe[title="Poseidon Portal"]');
    await frame.getByRole('button', { name: 'Create new', exact: true }).click();
    await expect(frame.getByLabel('Saved', { exact: true })).toBeVisible();
    const problems = frame.locator('[aria-label="Code problems"]');
    await replaceSource(
        page,
        frame,
        'import React from "react";\nexport default function Example(){return <div>Hello</div>}',
    );
    await expect(problems).toHaveText('No problems reported', { timeout: 15000 });
    await replaceSource(
        page,
        frame,
        'import React from "react";\nconst broken: number = "invalid";\nexport default function Example(){return <div>{broken}</div>}',
    );
    await expect(problems).toContainText("Type 'string' is not assignable to type 'number'", {
        timeout: 15000,
    });
    await replaceSource(page, frame, 'const = ; export default function Example(){return null}');
    await expect(problems).toContainText('expected', { timeout: 15000 });
    await replaceSource(
        page,
        frame,
        'import Button from "@components/ui-button";\nexport default function Example(){return <Button unknownProp="bad">Hello</Button>}',
    );
    await expect(problems).toContainText("Property 'unknownProp' does not exist", {
        timeout: 15000,
    });
    await expect(problems).not.toContainText('Import not declared');
    await replaceSource(
        page,
        frame,
        'import thing from "not-installed";\nexport default function Example(){return <div>{thing}</div>}',
    );
    await expect(problems).toContainText('Import not declared: not-installed', { timeout: 15000 });
    await replaceSource(
        page,
        frame,
        'import Button from "@components/ui-button";\nexport default function Example(){return <Button>Hello</Button>}',
    );
    await expect(problems).toHaveText('No problems reported', { timeout: 15000 });
    await replaceSource(
        page,
        frame,
        'import Button from "@components/ui-button";\nexport default function Example(){return <But',
    );
    await expect(frame.locator('.view-line').last()).toHaveText(
        'export default function Example(){return <But',
    );
    await page.keyboard.press('Control+Space');
    await expect(frame.locator('.suggest-widget.visible')).toContainText('Button', {
        timeout: 15000,
    });
});

test('should keep component source separate when switching after an unsaved edit', async ({
    page,
}) => {
    await page.route('**/api/ui/event', async (route) => {
        const event = route.request().postDataJSON();
        if (event?.name === 'updatecomponents' && event.payload.id === 'portal-entry') {
            await route.fulfill({
                status: 409,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Simulated concurrent update.' }),
            });
        } else await route.continue();
    });
    await page.goto('/components');
    const frame = page.frameLocator('iframe[title="Poseidon Portal"]');
    const response = await page.request.get(
        'http://127.0.0.1:3100/api/v1/entities/ui-component/source-editor',
    );
    const original = await response.json();
    await frame.getByRole('button', { name: 'Portal →', exact: true }).click();
    await replaceSource(
        page,
        frame,
        'export default function UnsavedPortal(){return <div>Unsaved Portal</div>}',
    );
    await expect(frame.locator('[aria-label="Saving"]')).toBeVisible();
    await frame.getByRole('button', { name: 'SourceEditor →', exact: true }).click();
    await expect(frame.locator('.view-lines')).toContainText('CodeEditor');
    await expect(frame.locator('.view-lines')).not.toContainText('entity-type-editor');
    const save = page.waitForRequest(
        (request) =>
            request.url().endsWith('/api/ui/event') &&
            request.postDataJSON()?.name === 'updatecomponents',
    );
    await page.route('**/api/ui/event', async (route) => {
        if (route.request().postDataJSON()?.name === 'updatecomponents') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(original),
            });
        } else await route.continue();
    });
    await replaceSource(page, frame, original.data.source.code + '\n');
    const savedCode = (await save).postDataJSON().payload.data.source.code as string;
    expect(savedCode.trim()).toBe(original.data.source.code.trim());
    expect(savedCode).not.toContain('Unsaved Portal');
    await expect(frame.locator('[aria-label="Code problems"]')).toHaveText('No problems reported');
});

test('should show only the selected primitive implementation', async ({ page }) => {
    await page.goto('/components');
    const frame = page.frameLocator('iframe[title="Poseidon Portal"]');
    await frame.getByRole('button', { name: 'ui-button →', exact: true }).click();
    await expect(frame.locator('.view-lines')).toContainText('function Button');
    await expect(frame.locator('.view-lines')).not.toContainText('function Card');

    await frame.getByRole('button', { name: 'ui-card →', exact: true }).click();
    await expect(frame.locator('.view-lines')).toContainText('function Card');
    await expect(frame.locator('.view-lines')).not.toContainText('function Button');
});

test('should toggle the problems drawer from the footer and restore focus when closed', async ({
    page,
}) => {
    await page.goto('/components');
    const frame = page.frameLocator('iframe[title="Poseidon Portal"]');
    await frame.getByRole('button', { name: 'ui-button →', exact: true }).click();
    const toggle = frame.getByRole('button', { name: /^Problems:/ });
    const drawer = frame.getByRole('region', { name: 'Problems drawer' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(drawer).toBeHidden();
    await toggle.click();
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveCSS('height', '208px');
    await expect(toggle.locator('svg').first()).toHaveCSS('width', '12px');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await drawer.getByRole('button', { name: 'Close problems' }).click();
    await expect(drawer).toBeHidden();
    await expect(toggle).toBeFocused();
    await toggle.click();
    await drawer.getByRole('button', { name: 'Close problems' }).focus();
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(toggle).toBeFocused();
});
