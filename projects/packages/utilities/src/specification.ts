export type Scalar = string | number | boolean | Date | null | undefined;
export type FieldKeys<T> = keyof {
    [K in keyof T as T[K] extends Scalar ? K : never]: T[K];
} &
    string;
export type ComparisonOperator = 'equals' | 'greater-than' | 'less-than';

type ComparisonExpression<T> = {
    [K in FieldKeys<T>]: {
        readonly kind: 'comparison';
        readonly field: K;
        readonly operator: ComparisonOperator;
        readonly operand: Operand<T[K]>;
    };
}[FieldKeys<T>];

export type ConditionExpression<T> =
    | ComparisonExpression<T>
    | {
          readonly kind: 'and' | 'or' | 'nor';
          readonly conditions: readonly ConditionExpression<T>[];
      }
    | { readonly kind: 'not'; readonly condition: ConditionExpression<T> };

export type Operand<V = Scalar> =
    | { readonly kind: 'literal'; readonly value: Exclude<V, Date> }
    | { readonly kind: 'date'; readonly value: string }
    | {
          readonly kind: 'field';
          readonly path: readonly string[];
          readonly scope: 'candidate' | 'root';
      };

export interface Specification<T> {
    readonly expression: ConditionExpression<T>;
    and(other: Readonly<Specification<T>>): Specification<T>;
    or(other: Readonly<Specification<T>>): Specification<T>;
    not(): Specification<T>;
    nor(...others: readonly Readonly<Specification<T>>[]): Specification<T>;
}
