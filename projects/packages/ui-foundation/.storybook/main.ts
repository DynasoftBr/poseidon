import type { StorybookConfig } from '@storybook/react-vite';
import tailwind from '@tailwindcss/vite';
const config: StorybookConfig = {
    stories: ['../src/**/*.stories.tsx'],
    framework: '@storybook/react-vite',
    viteFinal(config) {
        config.plugins = [...(config.plugins ?? []), tailwind()];
        return config;
    },
};
// Storybook requires a default configuration export.
// eslint-disable-next-line no-restricted-syntax
export default config;
