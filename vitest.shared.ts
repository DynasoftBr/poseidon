import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const packages = resolve(__dirname, 'projects/packages');

export default defineConfig({
    resolve: {
        alias: {
            '@poseidon/models': resolve(packages, 'models/src/index.ts'),
            '@poseidon/service-utils': resolve(packages, 'service-utils/src/index.ts'),
            '@poseidon/data-access': resolve(packages, 'data-access/src/index.ts'),
            '@poseidon/runtime': resolve(packages, 'runtime/src/index.ts'),
        },
    },
    test: {
        globals: true,
        environment: 'node',
        exclude: ['dist/**', 'node_modules/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**'],
            exclude: ['**/*.test.ts', '**/__tests__/**', '**/src/index.ts'],
        },
    },
});
