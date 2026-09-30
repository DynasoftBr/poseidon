/** Values supported as scalar comparison operands. */
export type Scalar = string | number | boolean | Date | null | undefined;
/**
 * String keys whose values can be used in scalar comparisons.
 * @template T - Entity or value shape represented by this declaration.
 */
export type FieldKeys<T> = keyof {
    [K in keyof T as T[K] extends Scalar ? K : never]: T[K];
} &
    string;
/** Supported scalar comparison operations. */
export type ComparisonOperator = 'equals' | 'greater-than' | 'less-than';

type ComparisonExpression<T> = {
    [K in FieldKeys<T>]: {
        readonly kind: 'comparison';
        readonly field: K;
        readonly operator: ComparisonOperator;
        readonly operand: Operand<T[K]>;
    };
}[FieldKeys<T>];

/**
 * Declarative comparison or logical composition of conditions.
 * @template T - Entity or value shape represented by this declaration.
 */
export type ConditionExpression<T> =
    | ComparisonExpression<T>
    | {
          /** Discriminator identifying this variant. */
          readonly kind: 'and' | 'or' | 'nor';
          /** Child {@link ConditionExpression} values combined by this logical operator. */
          readonly conditions: readonly ConditionExpression<T>[];
      }
    | {
          /** Discriminator identifying this variant. */
          readonly kind: 'not'; /** Expression negated by this condition. */
          readonly condition: ConditionExpression<T>;
      };

/**
 * Literal, serialized date, or scoped field comparison operand.
 * @template V - Value type of the referenced field.
 */
export type Operand<V = Scalar> =
    | {
          /** Discriminator identifying this variant. */
          readonly kind: 'literal'; /** Literal comparison value or serialized ISO date. */
          readonly value: Exclude<V, Date>;
      }
    | {
          /** Discriminator identifying this variant. */
          readonly kind: 'date'; /** Literal comparison value or serialized ISO date. */
          readonly value: string;
      }
    | {
          /** Discriminator identifying this variant. */
          readonly kind: 'field';
          /** Property names locating the referenced field. */
          readonly path: readonly string[];
          /** Whether the reference starts at the candidate or root entity. */
          readonly scope: 'candidate' | 'root';
      };

/**
 * Declarative condition with immutable logical composition.
 * @template T - Entity or value shape represented by this declaration.
 */
export interface Specification<T> {
    /** {@link ConditionExpression} represented by this specification. */
    readonly expression: ConditionExpression<T>;
    /**
     * Builds a condition requiring both specifications to match.
     * @param {Readonly<Specification<T>>} other - {@link Specification} to combine with this one.
     * @returns {Specification<T>} {@link Specification} combining both expressions with AND.
     */
    and(other: Readonly<Specification<T>>): Specification<T>;
    /**
     * Builds a condition requiring either specification to match.
     * @param {Readonly<Specification<T>>} other - {@link Specification} to combine with this one.
     * @returns {Specification<T>} {@link Specification} combining both expressions with OR.
     */
    or(other: Readonly<Specification<T>>): Specification<T>;
    /**
     * Builds a condition that negates this specification.
     * @returns {Specification<T>} {@link Specification} containing the negated expression.
     */
    not(): Specification<T>;
    /**
     * Builds a condition requiring none of the supplied specifications or this one to match.
     * @param {readonly Readonly<Specification<T>>[]} others - {@link Specification} values to combine with this one.
     * @returns {Specification<T>} {@link Specification} combining all expressions with NOR.
     */
    nor(...others: readonly Readonly<Specification<T>>[]): Specification<T>;
}
