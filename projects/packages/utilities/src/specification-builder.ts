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
export interface FieldReference<V> {
    readonly [referenceType]: V;
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

export class SpecificationField<T, K extends FieldKeys<T>> {
    constructor(private readonly key: K) {}

    equals(value: NoInfer<T[K]> | FieldReference<NoInfer<T[K]>>): Specification<T> {
        return this.compare('equals', value);
    }

    greaterThan(
        this: NonNullable<T[K]> extends number | Date ? SpecificationField<T, K> : never,
        value: NoInfer<T[K]> | FieldReference<NoInfer<T[K]>>,
    ): Specification<T> {
        return this.compare('greater-than', value);
    }

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

export class SpecificationBuilder<T> {
    field<K extends FieldKeys<T>>(key: K): SpecificationField<T, K> {
        return new SpecificationField(key);
    }

    reference<K extends FieldKeys<T>>(key: K, scope?: 'candidate' | 'root'): FieldReference<T[K]>;
    reference<V extends Scalar>(
        selector: (candidate: T) => V,
        scope?: 'candidate' | 'root',
    ): FieldReference<V>;
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

export function specification<T>(): SpecificationBuilder<T> {
    return new SpecificationBuilder<T>();
}
