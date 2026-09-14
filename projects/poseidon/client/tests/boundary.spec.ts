import { test, expect } from '@playwright/test';
test('should reject unrelated window messages and stale channel messages', async ({ page }) => {
    await page.addInitScript(() => {
        const original = MessagePort.prototype.postMessage;
        MessagePort.prototype.postMessage = function (this: MessagePort, message: unknown) {
            Object.defineProperty(window, 'poseidonTestPort', { value: this, configurable: true });
            original.call(this, message);
        };
    });
    await page.goto('/');
    const frame = page.frameLocator('iframe');
    await expect(frame.getByRole('heading', { name: 'Hello, Local user' })).toBeVisible();
    await page.evaluate(() => {
        window.postMessage({ type: 'poseidon:ready', version: 1 }, '*');
        const port = (window as unknown as { poseidonTestPort: MessagePort }).poseidonTestPort;
        port.postMessage({
            type: 'props',
            version: 1,
            sessionId: 'stale',
            releaseId: 'stale',
            props: { user: { name: 'Wrong user' } },
        });
    });
    await expect(frame.getByRole('heading', { name: 'Hello, Local user' })).toBeVisible();
    await page.waitForLoadState('networkidle');
    let mutations = 0;
    page.on('request', (request) => {
        if (request.url().endsWith('/api/ui/event')) mutations++;
    });
    await frame.locator('body').evaluate(() => {
        const port = (window as unknown as { poseidonTestPort: MessagePort }).poseidonTestPort;
        port.postMessage({
            type: 'event',
            version: 999,
            sessionId: 'stale',
            releaseId: 'stale',
            name: 'createConversation',
            payload: { data: { title: 'Injected', messages: [] } },
            requestId: 'injected',
        });
    });
    await frame.getByRole('button', { name: 'New chat', exact: true }).first().click();
    await expect(page).toHaveURL(/\/chat$/);
    expect(mutations).toBe(1);
});
test('should isolate the parent DOM and block direct network access and external frame navigation', async ({
    page,
}) => {
    let requests = 0;
    await page.route('https://example.com/**', (route) => {
        requests++;
        void route.fulfill({ body: 'Unexpected network request' });
    });
    await page.goto('/');
    const frame = page.frameLocator('iframe');
    await expect(frame.getByRole('heading', { name: 'Hello, Local user' })).toBeVisible();
    expect(
        await frame.locator('body').evaluate(() => {
            try {
                void parent.document;
                return false;
            } catch {
                return true;
            }
        }),
    ).toBe(true);
    expect(
        await frame.locator('body').evaluate(async () => {
            try {
                await fetch('https://example.com/poseidon-test');
                return false;
            } catch {
                return true;
            }
        }),
    ).toBe(true);
    const blocked = page.waitForEvent('console', {
        predicate: (message) => message.text().includes('frame-src'),
    });
    await frame.locator('body').evaluate(() => {
        location.href = 'https://example.com/poseidon-navigation-test';
    });
    await blocked;
    expect(requests).toBe(0);
});
