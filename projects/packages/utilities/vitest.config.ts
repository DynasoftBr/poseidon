import { defineConfig, mergeConfig } from 'vitest/config';
import configShared from '../../../vitest.shared';

export default mergeConfig(
    configShared,
    defineConfig({
        test: {
            coverage: {
                thresholds: {
                    statements: 90,
                    branches: 90,
                    functions: 90,
                    lines: 90,
                },
            },
        },
    }),
);
