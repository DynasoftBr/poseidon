import type { ConditionExpression, Specification } from './specification';

/**
 * Composes immutable declarative condition expressions.
 * @template T - Entity or value shape represented by this declaration.
 */
export class ExpressionSpecification<T> implements Specification<T> {
    /**
     * Wraps a declarative condition for logical composition.
     * @param {ConditionExpression<T>} expression - {@link ConditionExpression} represented by the specification.
     */
    constructor(public readonly expression: ConditionExpression<T>) {}

    /**
     * Builds a condition requiring both specifications to match.
     * @param {Readonly<Specification<T>>} other - {@link Specification} to combine with this one.
     * @returns {Specification<T>} {@link Specification} combining both expressions with AND.
     */
    and(other: Readonly<Specification<T>>): Specification<T> {
        return this.combine('and', [other]);
    }

    /**
     * Builds a condition requiring either specification to match.
     * @param {Readonly<Specification<T>>} other - {@link Specification} to combine with this one.
     * @returns {Specification<T>} {@link Specification} combining both expressions with OR.
     */
    or(other: Readonly<Specification<T>>): Specification<T> {
        return this.combine('or', [other]);
    }

    /**
     * Builds a condition that negates this specification.
     * @returns {Specification<T>} {@link Specification} containing the negated expression.
     */
    not(): Specification<T> {
        return new ExpressionSpecification(
            Object.freeze({ kind: 'not', condition: this.expression }),
        );
    }

    /**
     * Builds a condition requiring none of the supplied specifications or this one to match.
     * @param {readonly Readonly<Specification<T>>[]} others - {@link Specification} values to combine with this one.
     * @returns {Specification<T>} {@link Specification} combining all expressions with NOR.
     */
    nor(...others: readonly Readonly<Specification<T>>[]): Specification<T> {
        return this.combine('nor', others);
    }

    private combine(
        kind: 'and' | 'or' | 'nor',
        others: readonly Readonly<Specification<T>>[],
    ): Specification<T> {
        return new ExpressionSpecification(
            Object.freeze({
                kind,
                conditions: Object.freeze([
                    this.expression,
                    ...others.map((other) => other.expression),
                ]),
            }),
        );
    }
}
