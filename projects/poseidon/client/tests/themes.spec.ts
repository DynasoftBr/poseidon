import { test, expect, type APIRequestContext } from '@playwright/test';
type RecordEntity = {
    _id: string;
    _version: number;
    source: { code: string };
    [name: string]: unknown;
};
const api = 'http://127.0.0.1:3100';
async function publish(request: APIRequestContext) {
    const resolved = await request.get(api + '/api/ui/resolve');
    const session = (await resolved.json()) as { id: string; releaseId: string };
    const response = await request.post(api + '/api/ui/event', {
        data: { sessionId: session.id, releaseId: session.releaseId, name: 'publish', payload: {} },
    });
    expect(response.ok()).toBeTruthy();
}
test('should inherit the Default theme and isolate subtree overrides in both modes', async ({
    page,
    request,
}) => {
    test.setTimeout(90_000);
    const componentResponse = await request.get(api + '/api/v1/entities/ui-component/portal-entry');
    const original = (await componentResponse.json()) as RecordEntity;
    const themeId = 'theme-test-' + Date.now(),
        componentId = 'component-' + themeId;
    expect(
        (
            await request.post(api + '/api/v1/entities/theme', {
                data: {
                    id: themeId,
                    data: {
                        name: 'Subtree test',
                        source: { code: ':scope { --primary:#16a34a; }' },
                    },
                },
            })
        ).ok(),
    ).toBeTruthy();
    expect(
        (
            await request.post(api + '/api/v1/entities/ui-component', {
                data: {
                    id: componentId,
                    data: {
                        name: 'Theme test',
                        source: {
                            code: 'import React from "react";export default function Sample(){return <div data-testid="subtheme" style={{color:"var(--primary)",background:"var(--canvas)"}}>Subtree theme example</div>}',
                        },
                        themeId,
                        bindings: {},
                    },
                },
            })
        ).ok(),
    ).toBeTruthy();
    const source = original.source;
    const code =
        `import Subtheme from '@components/${componentId}';\n` +
        source.code.replace('<main', '<Subtheme/><main');
    await page.goto('/');
    await expect(
        page.frameLocator('iframe').getByRole('heading', { name: 'Hello, Local user' }),
    ).toBeVisible();
    try {
        expect(
            (
                await request.patch(api + '/api/v1/entities/ui-component/portal-entry', {
                    data: {
                        expectedVersion: original._version,
                        data: {
                            source: { code },
                        },
                    },
                })
            ).ok(),
        ).toBeTruthy();
        await publish(request);
        await expect(page.frameLocator('iframe').getByTestId('subtheme')).toHaveCount(0);
        await page.reload();
        const frame = page.frameLocator('iframe');
        const sample = frame.getByTestId('subtheme');
        await expect(sample).toHaveCSS('color', 'rgb(22, 163, 74)');
        await expect(sample).toHaveCSS('background-color', 'rgb(250, 250, 250)');
        const outer = frame.locator('[data-theme="default-theme"]').first();
        expect(
            await outer.evaluate((element) =>
                getComputedStyle(element).getPropertyValue('--primary').trim(),
            ),
        ).toBe('#6366f1');
        await frame.getByRole('button', { name: /Local user/ }).click();
        await frame.getByRole('switch').check();
        await expect(sample).toHaveCSS('color', 'rgb(22, 163, 74)');
        await expect(sample).toHaveCSS('background-color', 'rgb(24, 24, 27)');
    } finally {
        const current = (await (
            await request.get(api + '/api/v1/entities/ui-component/portal-entry')
        ).json()) as RecordEntity;
        await request.patch(api + '/api/v1/entities/ui-component/portal-entry', {
            data: {
                expectedVersion: current._version,
                data: Object.fromEntries(
                    Object.entries(original).filter(([name]) => !name.startsWith('_')),
                ),
            },
        });
        await publish(request);
    }
});
