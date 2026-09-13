import { defineConfig, mergeConfig } from 'vitest/config';
import configShared from '../../../vitest.shared';

export default mergeConfig(
    configShared,
    defineConfig({
        test: {
            coverage: {
                thresholds: { statements: 97, branches: 83, functions: 100, lines: 98 },
            },
        },
    }),
);
