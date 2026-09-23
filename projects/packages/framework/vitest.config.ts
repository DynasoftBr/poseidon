import { defineConfig, mergeConfig } from 'vitest/config';
import configShared from '../../../vitest.shared';

export default mergeConfig(
    configShared,
    defineConfig({
        test: {
            coverage: {
                thresholds: {
                    statements: 100,
                    branches: 100,
                    functions: 100,
                    lines: 100,
                },
            },
        },
    }),
);
