import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';
import { jsdocTypes } from './jsdoc-types';

const linter = new Linter();
const config: Linter.Config = {
    languageOptions: { parser: tseslint.parser },
    plugins: { local: { rules: { 'jsdoc-types': jsdocTypes } } },
    rules: { 'local/jsdoc-types': 'error' },
};

function lint(code: string): Linter.LintMessage[] {
    return linter.verify(code, config);
}

describe('JSDoc types', () => {
    it('should reject a stale parameter type when its annotation changes', () => {
        const messages = lint(
            '/** @param {string} value - Input. */ function run(value: number) {}',
        );
        expect(messages).toMatchObject([
            { ruleId: 'local/jsdoc-types', messageId: 'mismatchedType', severity: 2 },
        ]);
    });

    it('should reject a stale return type', () => {
        expect(
            lint('/** @returns {string} Result. */ function run(): number { return 1; }'),
        ).toMatchObject([{ messageId: 'mismatchedType' }]);
    });

    it('should require types on documented parameters and returns with explicit annotations', () => {
        const source =
            '/**\n * @param value - Input.\n * @returns Result.\n */ function run(value: number): number { return value; }';
        expect(lint(source)).toMatchObject([
            { messageId: 'missingType' },
            { messageId: 'missingType' },
        ]);
    });

    it.each([
        ['boolean', 'number'],
        ['int', 'number'],
        ['Date', 'string'],
        ['Promise<string>', 'Promise<number>'],
        ['Record<string, string[]>', 'Record<string, number[]>'],
        ['Result', 'OtherResult'],
        ["'hello world'", "'helloworld'"],
        ['(value: string) => void', '(value: number) => void'],
    ])('should detect changes from %s to %s', (documented, declared) => {
        expect(
            lint(
                `/** @param {${documented}} value - Input. */ function run(value: ${declared}) {}`,
            ),
        ).toMatchObject([{ messageId: 'mismatchedType' }]);
    });

    it('should accept matching primitive, generic, union, and object types', () => {
        expect(
            lint(
                '/**\n * @param {{id: string; values: Array<T | null>}} input - Input.\n * @returns {Promise<T | undefined>} Result.\n */ function run<T>(input: { id: string; values: Array<T | null> }): Promise<T | undefined> { throw new Error(); }',
            ),
        ).toEqual([]);
    });

    it('should compare optional and rest parameters', () => {
        expect(
            lint(
                '/**\n * @param {string} [label] - Label.\n * @param {number[]} values - Values.\n */ function run(label?: string, ...values: number[]) {}',
            ),
        ).toEqual([]);
    });

    it('should check protected methods and constructor parameter properties', () => {
        expect(
            lint(
                'class Service { /** @param {string} count - Count. */ constructor(public count: number) {} /** @returns {string} Count. */ protected countAll(): number { return 0; } }',
            ),
        ).toMatchObject([{ messageId: 'mismatchedType' }, { messageId: 'mismatchedType' }]);
    });

    it('should check arrow functions documented on their variables', () => {
        expect(
            lint('/** @param {string} value - Input. */ const run = (value: number): void => {};'),
        ).toMatchObject([{ messageId: 'mismatchedType' }]);
    });

    it('should check each overload against its own documentation', () => {
        expect(
            lint(
                '/** @param {string} value - Input. */ function run(value: string): void; /** @param {string} value - Input. */ function run(value: number): void; function run(value: string | number): void {}',
            ),
        ).toMatchObject([{ messageId: 'mismatchedType' }]);
    });

    it('should check interface method signatures', () => {
        expect(
            lint('interface Service { /** @returns {string} Result. */ run(): number; }'),
        ).toMatchObject([{ messageId: 'mismatchedType' }]);
    });

    it('should check destructured parameter types without matching nested tags to other parameters', () => {
        expect(
            lint(
                '/**\n * @param {{value: string}} options - Input.\n * @param {string} options.value - Value.\n * @param {number} count - Count.\n */ function run({value}: {value: number}, count: number) {}',
            ),
        ).toMatchObject([{ messageId: 'mismatchedType' }]);
    });

    it('should report a missing return type when the description starts with a link', () => {
        const source =
            '/** @returns {@link Result} for the caller. */ function run(): Result { throw new Error(); }';
        expect(lint(source)).toMatchObject([{ messageId: 'missingType' }]);
    });

    it('should normalize optional and variadic JSDoc parameter syntax', () => {
        expect(
            lint(
                '/**\n * @param {string=} label - Label.\n * @param {...number} values - Values.\n */ function run(label?: string, ...values: number[]) {}',
            ),
        ).toEqual([]);
    });

    it('should report a mismatch in a multiline object type', () => {
        const source =
            '/**\n * @param {{\n *   value: string\n * }} input - The input.\n */ function run(input: { value: number }) {}';
        expect(lint(source)).toMatchObject([{ messageId: 'mismatchedType', line: 2 }]);
    });

    it('should accept redundant parentheses without hiding a mismatch', () => {
        expect(
            lint('/** @param {(string)} value - Input. */ function run(value: string) {}'),
        ).toEqual([]);
        expect(
            lint('/** @param {(string)} value - Input. */ function run(value: number) {}'),
        ).toMatchObject([{ messageId: 'mismatchedType' }]);
    });

    it('should accept conditional types with parenthesized union constraints', () => {
        const source =
            '/** @param {T extends (number | Date) ? T : never} value - Input. */ function run<T>(value: T extends number | Date ? T : never) {}';
        expect(lint(source)).toEqual([]);
    });

    it('should leave inferred types and absent tags to the other documentation rules', () => {
        expect(
            lint('/** @returns {number} Result. */ function run(value = 1) { return value; }'),
        ).toEqual([]);
        expect(lint('/** Executes the operation. */ function run(value: number): void {}')).toEqual(
            [],
        );
    });
});
