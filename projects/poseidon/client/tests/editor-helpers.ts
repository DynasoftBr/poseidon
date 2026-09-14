import type { FrameLocator, Page } from '@playwright/test';
export async function replaceSource(
    page: Page,
    frame: FrameLocator,
    source: string,
): Promise<void> {
    await frame.getByRole('textbox', { name: 'Source code', exact: true }).focus();
    await page.keyboard.press('ControlOrMeta+A');
    await frame
        .getByRole('textbox', { name: 'Source code', exact: true })
        .evaluate((element, text) => {
            const clipboardData = new DataTransfer();
            clipboardData.setData('text/plain', text);
            element.dispatchEvent(
                new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
            );
        }, source);
}
export async function portalSource(page: Page): Promise<string> {
    const response = await page.request.get(
        'http://127.0.0.1:3000/api/v1/entities/ui-component/portal-entry',
    );
    const entity = await response.json();
    return entity.data.source.code as string;
}
