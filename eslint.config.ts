import js from '@eslint/js';
import checkFile from 'eslint-plugin-check-file';
import { defineConfig, globalIgnores } from 'eslint/config';
import type { ESLint } from 'eslint';
import importPlugin from 'eslint-plugin-import';
import jsoncPlugin from 'eslint-plugin-jsonc';
import jsdoc from 'eslint-plugin-jsdoc';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import sonarjs from 'eslint-plugin-sonarjs';
import tseslint from 'typescript-eslint';
import { jsdocTypes } from './eslint-rules/jsdoc-types';

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
            'poseidon-lint': {
                rules: {
                    'no-file-wide-eslint-disable': noFileWideEslintDisable,
                    'jsdoc-types': jsdocTypes,
                },
            },
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
        plugins: { jsdoc },
        settings: { jsdoc: { mode: 'typescript', tagNamePreference: { augments: 'extends' } } },
        rules: {
            'jsdoc/require-jsdoc': [
                'error',
                {
                    enableFixer: false,
                    require: { FunctionDeclaration: false },
                    contexts: [
                        'ExportNamedDeclaration > FunctionDeclaration',
                        'ExportNamedDeclaration > ClassDeclaration',
                        'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > :matches(ArrowFunctionExpression, FunctionExpression)',
                        'ExportNamedDeclaration > ClassDeclaration > ClassBody > MethodDefinition:not([accessibility="private"]):not([key.type="PrivateIdentifier"])',
                        'ExportNamedDeclaration > ClassDeclaration > ClassBody > PropertyDefinition:not([accessibility="private"]):not([key.type="PrivateIdentifier"])',
                        'ExportNamedDeclaration > TSInterfaceDeclaration',
                        'ExportNamedDeclaration > TSTypeAliasDeclaration',
                        'ExportNamedDeclaration TSInterfaceBody > TSPropertySignature',
                        'ExportNamedDeclaration > TSTypeAliasDeclaration TSPropertySignature:not(TSTypeParameterInstantiation TSPropertySignature)',
                        'ExportNamedDeclaration TSInterfaceBody > TSMethodSignature',
                        'ExportNamedDeclaration > TSDeclareFunction',
                    ],
                },
            ],
            'poseidon-lint/jsdoc-types': 'error',
            'jsdoc/require-description': ['error', { contexts: ['any'] }],
            'jsdoc/check-param-names': ['error', { checkDestructured: false }],
            'jsdoc/check-tag-names': 'error',
            'jsdoc/valid-types': 'error',
            'jsdoc/require-param': [
                'error',
                {
                    checkDestructured: false,
                    contexts: [
                        'FunctionDeclaration',
                        'FunctionExpression',
                        'ArrowFunctionExpression',
                        'TSDeclareFunction',
                        'TSMethodSignature',
                    ],
                },
            ],
            'jsdoc/require-param-description': 'error',
            'jsdoc/require-returns': [
                'error',
                {
                    contexts: [
                        'FunctionDeclaration',
                        'FunctionExpression',
                        'ArrowFunctionExpression',
                        'TSDeclareFunction',
                        'TSMethodSignature',
                    ],
                },
            ],
            'jsdoc/require-returns-description': 'error',
            'jsdoc/require-template': 'error',
            'jsdoc/require-tags': [
                'error',
                {
                    tags: [
                        {
                            tag: 'extends',
                            context:
                                ':matches(ClassDeclaration, ClassExpression)[superClass!=null]',
                        },
                        {
                            tag: 'template',
                            context:
                                ':matches(FunctionExpression, ArrowFunctionExpression, TSMethodSignature)[typeParameters.params.length>0]',
                        },
                    ],
                },
            ],
            'jsdoc/require-template-description': 'error',
            'jsdoc/require-throws': 'error',
            'jsdoc/require-throws-description': 'error',
        },
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
