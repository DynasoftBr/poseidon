import type { ConditionExpression, Specification } from './specification';

export class ExpressionSpecification<T> implements Specification<T> {
    constructor(public readonly expression: ConditionExpression<T>) {}

    and(other: Readonly<Specification<T>>): Specification<T> {
        return this.combine('and', [other]);
    }

    or(other: Readonly<Specification<T>>): Specification<T> {
        return this.combine('or', [other]);
    }

    not(): Specification<T> {
        return new ExpressionSpecification(
            Object.freeze({ kind: 'not', condition: this.expression }),
        );
    }

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
