import type { JsonValue } from './json-value';

export type Expression =
    | { kind: 'literal'; value: JsonValue }
    | { kind: 'field'; name: string }
    | { kind: 'if'; condition: Expression; then: Expression; otherwise: Expression }
    | {
          kind: 'add' | 'subtract' | 'multiply' | 'divide' | 'concat' | 'equals';
          values: Expression[];
      };
