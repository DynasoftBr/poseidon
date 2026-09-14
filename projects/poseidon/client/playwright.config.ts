import { defineConfig } from '@playwright/test';
export default defineConfig({
    testDir: './tests',
    globalSetup: './tests/global-setup.ts',
    workers: 1,
    use: { baseURL: 'http://127.0.0.1:5174', headless: true, channel: 'chrome' },
    reporter: 'list',
});
