import { ExpressionSpecification } from './expression-specification';
import type {
    ComparisonOperator,
    ConditionExpression,
    FieldKeys,
    Operand,
    Scalar,
    Specification,
} from './specification';

declare const referenceType: unique symbol;
/**
 * Typed reference to a field in the candidate or root scope.
 * @template V - Value type of the referenced field.
 */
export interface FieldReference<V> {
    /** Type-only marker preserving the referenced field value type. */
    readonly [referenceType]: V;
    /** Field-reference {@link Operand} used in a comparison. */
    readonly operand: Extract<Operand, { kind: 'field' }>;
}

function fieldReference<V>(
    path: readonly string[],
    scope: 'candidate' | 'root' = 'candidate',
): FieldReference<V> {
    return {
        operand: Object.freeze({ kind: 'field', path: Object.freeze([...path]), scope }),
    } as FieldReference<V>;
}

/**
 * Builds comparisons against a selected scalar field.
 * @template T - Entity or value shape represented by this declaration.
 * @template K - Selected property key.
 */
export class SpecificationField<T, K extends FieldKeys<T>> {
    /**
     * Selects the field used by subsequent comparisons.
     * @param {K} key - Property key to select.
     */
    constructor(private readonly key: K) {}

    /**
     * Builds an equality comparison for the selected field.
     * @param {NoInfer<T[K]> | FieldReference<NoInfer<T[K]>>} value - Literal value or {@link FieldReference} to compare.
     * @returns {Specification<T>} {@link Specification} comparing the field for equality.
     */
    equals(value: NoInfer<T[K]> | FieldReference<NoInfer<T[K]>>): Specification<T> {
        return this.compare('equals', value);
    }

    /**
     * Builds a greater-than comparison for the selected numeric or date field.
     * @param {NonNullable<T[K]> extends (number | Date) ? SpecificationField<T, K> : never} this - {@link SpecificationField} restricted to a numeric or date field.
     * @param {NoInfer<T[K]> | FieldReference<NoInfer<T[K]>>} value - Literal value or {@link FieldReference} to compare.
     * @returns {Specification<T>} {@link Specification} comparing the field using greater-than.
     */
    greaterThan(
        this: NonNullable<T[K]> extends number | Date ? SpecificationField<T, K> : never,
        value: NoInfer<T[K]> | FieldReference<NoInfer<T[K]>>,
    ): Specification<T> {
        return this.compare('greater-than', value);
    }

    /**
     * Builds a less-than comparison for the selected numeric or date field.
     * @param {NonNullable<T[K]> extends (number | Date) ? SpecificationField<T, K> : never} this - {@link SpecificationField} restricted to a numeric or date field.
     * @param {NoInfer<T[K]> | FieldReference<NoInfer<T[K]>>} value - Literal value or {@link FieldReference} to compare.
     * @returns {Specification<T>} {@link Specification} comparing the field using less-than.
     */
    lessThan(
        this: NonNullable<T[K]> extends number | Date ? SpecificationField<T, K> : never,
        value: NoInfer<T[K]> | FieldReference<NoInfer<T[K]>>,
    ): Specification<T> {
        return this.compare('less-than', value);
    }

    private compare(
        operator: ComparisonOperator,
        value: T[K] | FieldReference<T[K]>,
    ): Specification<T> {
        const operand = toOperand(value as Scalar | FieldReference<T[K]>);
        return new ExpressionSpecification(
            Object.freeze({
                kind: 'comparison',
                field: this.key,
                operator,
                operand,
            }) as ConditionExpression<T>,
        );
    }
}

function toOperand(value: Scalar | FieldReference<unknown>): Operand {
    if (value instanceof Date) return Object.freeze({ kind: 'date', value: value.toISOString() });
    if (typeof value === 'object' && value !== null) return value.operand;
    return Object.freeze({ kind: 'literal', value });
}

/**
 * Selects fields and references for declarative conditions.
 * @template T - Entity or value shape represented by this declaration.
 */
export class SpecificationBuilder<T> {
    /**
     * Selects a scalar field for comparison.
     * @template K - Selected property key.
     * @param {K} key - Property key to select.
     * @returns {SpecificationField<T, K>} {@link SpecificationField} for the selected field.
     */
    field<K extends FieldKeys<T>>(key: K): SpecificationField<T, K> {
        return new SpecificationField(key);
    }

    /**
     * Builds a scoped field reference from a key or property selector.
     * @template K - Selected property key.
     * @param {K} key - Property key to select.
     * @param {'candidate' | 'root'} scope - Starting entity for the reference; defaults to the candidate.
     * @returns {FieldReference<T[K]>} {@link FieldReference} to the selected field and scope.
     */
    reference<K extends FieldKeys<T>>(key: K, scope?: 'candidate' | 'root'): FieldReference<T[K]>;
    /**
     * Builds a scoped field reference from a key or property selector.
     * @template V - Value type of the referenced field.
     * @param {(candidate: T) => V} selector - Selects the referenced property path.
     * @param {'candidate' | 'root'} scope - Starting entity for the reference; defaults to the candidate.
     * @returns {FieldReference<V>} {@link FieldReference} to the selected field and scope.
     */
    reference<V extends Scalar>(
        selector: (candidate: T) => V,
        scope?: 'candidate' | 'root',
    ): FieldReference<V>;
    /**
     * Builds a scoped field reference from a key or property selector.
     * @param {FieldKeys<T> | ((candidate: T) => Scalar)} key - {@link FieldKeys} to select.
     * @param {'candidate' | 'root'} scope - Starting entity for the reference; defaults to the candidate.
     * @returns {FieldReference<unknown>} {@link FieldReference} to the selected field and scope.
     */
    reference(
        key: FieldKeys<T> | ((candidate: T) => Scalar),
        scope: 'candidate' | 'root' = 'candidate',
    ): FieldReference<unknown> {
        if (typeof key === 'string') return fieldReference([key], scope);
        const path: string[] = [];
        const proxy: T = new Proxy({} as T & object, {
            get(_target, property: string) {
                path.push(property);
                return proxy;
            },
        });
        key(proxy);
        return fieldReference(path, scope);
    }
}

/**
 * Creates a builder for declarative field conditions.
 * @template T - Entity or value shape represented by this declaration.
 * @returns {SpecificationBuilder<T>} {@link SpecificationBuilder} for the entity shape.
 */
export function specification<T>(): SpecificationBuilder<T> {
    return new SpecificationBuilder<T>();
}
