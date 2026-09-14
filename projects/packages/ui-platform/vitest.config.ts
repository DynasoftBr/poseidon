import { defineConfig, mergeConfig } from 'vitest/config';
import shared from '../../../vitest.shared';
export default mergeConfig(
    shared,
    defineConfig({
        test: {
            coverage: { thresholds: { lines: 80, functions: 80, statements: 80, branches: 70 } },
        },
    }),
);
