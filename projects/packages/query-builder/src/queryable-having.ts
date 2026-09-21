import type {
    AggregateFuncs,
    HavingBuilder,
    HavingCompareFunc,
    HavingCondition,
    HavingConditionGroup,
    HavingOperandFunction,
    KnownKeys,
    Operators,
} from './interfaces/utility-types';

export class QueryableHaving<T> implements HavingBuilder<T> {
    constructor(private readonly group: HavingConditionGroup<T>) {}
    $or(func: (builder: HavingBuilder<T>) => void): this {
        const orGroup: HavingConditionGroup<T> = [];
        const builder = new QueryableHaving(orGroup);
        func(builder);

        this.group.push(orGroup);
        return this;
    }

    $sum<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: NoInfer<T[K]>): this;
    $sum<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: (f: HavingCompareFunc<T>) => void,
    ): this;
    $sum<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: KnownKeys<T, number>,
        field: true,
    ): this;
    $sum<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: KnownKeys<T, number> | T[K] | HavingOperandFunction<T>,
        field?: boolean,
    ): this {
        return this.addHavingCondition({ func: '$sum', key, operator, operand, field });
    }

    $count<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: NoInfer<T[K]>,
    ): this;
    $count<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        func: (f: HavingCompareFunc<T>) => void,
    ): this;
    $count<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: KnownKeys<T, number>,
        field: true,
    ): this;
    $count<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: KnownKeys<T, number> | T[K] | HavingOperandFunction<T>,
        field?: boolean,
    ): this {
        return this.addHavingCondition({ func: '$count', key, operator, operand, field });
    }

    $avg<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: NoInfer<T[K]>): this;
    $avg<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        func: (f: HavingCompareFunc<T>) => void,
    ): this;
    $avg<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: KnownKeys<T, number>,
        field: true,
    ): this;
    $avg<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: KnownKeys<T, number> | T[K] | HavingOperandFunction<T>,
        field?: boolean,
    ): this {
        return this.addHavingCondition({ func: '$avg', key, operator, operand, field });
    }

    private addHavingCondition<K extends KnownKeys<T, number>>(options: {
        func: AggregateFuncs;
        key: K;
        operator: Operators;
        operand: KnownKeys<T, number> | T[K] | HavingOperandFunction<T>;
        field?: boolean;
    }): this {
        const { func, key, operator, operand, field } = options;
        const operandResult =
            typeof operand === 'function'
                ? this.compareAggregate(operand as HavingOperandFunction<T>)
                : field
                  ? `$[${operand}]`
                  : operand;
        const condition: HavingCondition<T> = { [func]: { [key]: { [operator]: operandResult } } };
        this.group.push(condition);
        return this;
    }

    private compareAggregate(
        operand: HavingOperandFunction<T>,
    ): Partial<Record<AggregateFuncs, KnownKeys<T, number>>> {
        const result: Partial<Record<AggregateFuncs, KnownKeys<T, number>>> = {};
        operand({
            $sum: (key) => {
                result.$sum = key;
            },
            $count: (key) => {
                result.$count = key;
            },
            $avg: (key) => {
                result.$avg = key;
            },
        });
        return result;
    }
}
