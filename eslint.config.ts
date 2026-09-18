import js from '@eslint/js';
import checkFile from 'eslint-plugin-check-file';
import { defineConfig, globalIgnores } from 'eslint/config';
import type { ESLint } from 'eslint';
import importPlugin from 'eslint-plugin-import';
import jsoncPlugin from 'eslint-plugin-jsonc';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import sonarjs from 'eslint-plugin-sonarjs';
import tseslint from 'typescript-eslint';

const noFileWideEslintDisable: NonNullable<ESLint.Plugin['rules']>[string] = {
    meta: {
        type: 'problem',
        messages: {
            fileWideDisable:
                'Disable ESLint only for a specific line, with a comment explaining why.',
        },
    },
    create(context) {
        return {
            Program() {
                if (!('getAllComments' in context.sourceCode)) return;
                const sourceCode = context.sourceCode as typeof context.sourceCode & {
                    getAllComments(): {
                        value: string;
                        loc: {
                            start: { line: number; column: number };
                            end: { line: number; column: number };
                        };
                    }[];
                };
                const comments = sourceCode.getAllComments();
                for (const comment of comments) {
                    if (/^\s*eslint-disable(?:\s|$)/.test(comment.value)) {
                        context.report({ loc: comment.loc, messageId: 'fileWideDisable' });
                    }
                }
            },
        };
    },
};

export default defineConfig([
    globalIgnores([
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/test-results/**',
        '**/.poseidon-artifacts/**',
        '**/.turbo/**',
        '**/package-lock.json',
        '**/*.tsbuildinfo',
        '.vscode/**',
    ]),
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettierRecommended,
    ...jsoncPlugin.configs['flat/recommended-with-jsonc'],
    {
        files: ['**/*.{ts,js,mjs,cjs}'],
        plugins: {
            sonarjs,
            import: importPlugin,
            'poseidon-lint': { rules: { 'no-file-wide-eslint-disable': noFileWideEslintDisable } },
        },
        rules: {
            'poseidon-lint/no-file-wide-eslint-disable': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/consistent-type-imports': 'error',
            'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
            'max-lines-per-function': [
                'error',
                { max: 60, skipBlankLines: true, skipComments: true, IIFEs: true },
            ],
            'max-depth': ['error', 5],
            complexity: ['error', 10],
            'max-params': ['error', 4],
            curly: ['error', 'multi-line'],
            eqeqeq: 'error',
            'no-else-return': 'error',
            'prefer-const': 'error',
            'no-var': 'error',
            'require-await': 'error',
            'no-console': ['error', { allow: ['warn', 'error'] }],
            'no-duplicate-imports': 'error',
            'import/no-cycle': 'error',
            'prettier/prettier': 'error',
            'no-restricted-syntax': [
                'error',
                {
                    selector: 'ExportDefaultDeclaration',
                    message: 'Prefer named exports over default exports.',
                },
                {
                    selector: 'TSEnumDeclaration',
                    message: 'Prefer const objects with as const over enums.',
                },
                {
                    selector: 'ThrowStatement > Literal',
                    message: 'Throw an Error object instead of a literal.',
                },
            ],
        },
    },
    {
        files: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**'],
        rules: {
            'max-lines': 'off',
            'max-lines-per-function': 'off',
            'sonarjs/cognitive-complexity': 'off',
            complexity: 'off',
        },
    },
    {
        files: ['**/*.config.{ts,js,mjs,cjs}', 'vitest.shared.ts'],
        rules: { 'no-restricted-syntax': 'off' },
    },
    {
        files: ['projects/**/*.ts'],
        plugins: { 'check-file': checkFile },
        rules: {
            'check-file/filename-naming-convention': [
                'error',
                { '**/*.ts': 'KEBAB_CASE' },
                { ignoreMiddleExtensions: true },
            ],
            'check-file/folder-naming-convention': ['error', { '**/!(__tests__)': 'KEBAB_CASE' }],
        },
    },
]);
