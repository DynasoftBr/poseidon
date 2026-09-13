import { defineConfig, mergeConfig } from 'vitest/config';
import configShared from '../../../vitest.shared';

export default mergeConfig(
    configShared,
    defineConfig({
        test: {
            coverage: {
                thresholds: {
                    statements: 94,
                    branches: 82,
                    functions: 97,
                    lines: 94,
                },
            },
        },
    }),
);
