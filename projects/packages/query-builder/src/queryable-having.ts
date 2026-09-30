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

/**
 * Accumulates conditions on aggregate values.
 * @template T - Entity or value shape represented by this declaration.
 */
export class QueryableHaving<T> implements HavingBuilder<T> {
    /**
     * Creates a builder over the supplied aggregate condition group.
     * @param {HavingConditionGroup<T>} group - Mutable {@link HavingConditionGroup} to populate.
     */
    constructor(private readonly group: HavingConditionGroup<T>) {}
    /**
     * Adds a nested group of alternative aggregate conditions.
     * @param {(builder: HavingBuilder<T>) => void} func - Callback that configures aggregate conditions through {@link HavingBuilder}.
     * @returns {this} This {@link QueryableHaving} with the alternative condition group added.
     */
    $or(func: (builder: HavingBuilder<T>) => void): this {
        const orGroup: HavingConditionGroup<T> = [];
        const builder = new QueryableHaving(orGroup);
        func(builder);

        this.group.push(orGroup);
        return this;
    }

    /**
     * Adds a comparison against the sum of a numeric field.
     * @template K - Selected property key.
     * @param {K} key - Property key to select.
     * @param {Operators} operator - {@link Operators} to apply.
     * @param {NoInfer<T[K]>} operand - Literal, field, or aggregate expression to compare against.
     * @returns {this} {@link QueryableHaving} with the sum expression added.
     */
    $sum<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: NoInfer<T[K]>): this;
    /**
     * Adds a comparison against the sum of a numeric field.
     * @template K - Selected property key.
     * @param {K} key - Property key to select.
     * @param {Operators} operator - {@link Operators} to apply.
     * @param {(f: HavingCompareFunc<T>) => void} operand - Literal, field, or {@link HavingCompareFunc} to compare against.
     * @returns {this} {@link QueryableHaving} with the sum expression added.
     */
    $sum<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: (f: HavingCompareFunc<T>) => void,
    ): this;
    /**
     * Adds a comparison against the sum of a numeric field.
     * @template K - Selected property key.
     * @param {K} key - Property key to select.
     * @param {Operators} operator - {@link Operators} to apply.
     * @param {KnownKeys<T, number>} operand - Literal, {@link KnownKeys}, or aggregate expression to compare against.
     * @param {true} field - Whether the operand names another field.
     * @returns {this} {@link QueryableHaving} with the sum expression added.
     */
    $sum<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: KnownKeys<T, number>,
        field: true,
    ): this;
    /**
     * Adds a comparison against the sum of a numeric field.
     * @template K - Selected property key.
     * @param {K} key - Property key to select.
     * @param {Operators} operator - {@link Operators} to apply.
     * @param {KnownKeys<T, number> | T[K] | HavingOperandFunction<T>} operand - Literal, {@link KnownKeys}, or aggregate expression to compare against.
     * @param {boolean} field - Whether the operand names another field.
     * @returns {this} {@link QueryableHaving} with the sum expression added.
     */
    $sum<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: KnownKeys<T, number> | T[K] | HavingOperandFunction<T>,
        field?: boolean,
    ): this {
        return this.addHavingCondition({ func: '$sum', key, operator, operand, field });
    }

    /**
     * Adds a comparison against the count of a numeric field.
     * @template K - Selected property key.
     * @param {K} key - Property key to select.
     * @param {Operators} operator - {@link Operators} to apply.
     * @param {NoInfer<T[K]>} operand - Literal, field, or aggregate expression to compare against.
     * @returns {this} {@link QueryableHaving} with the count expression added.
     */
    $count<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: NoInfer<T[K]>,
    ): this;
    /**
     * Adds a comparison against the count of a numeric field.
     * @template K - Selected property key.
     * @param {K} key - Property key to select.
     * @param {Operators} operator - {@link Operators} to apply.
     * @param {(f: HavingCompareFunc<T>) => void} func - Callback that selects an aggregate operand through {@link HavingCompareFunc}.
     * @returns {this} {@link QueryableHaving} with the count expression added.
     */
    $count<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        func: (f: HavingCompareFunc<T>) => void,
    ): this;
    /**
     * Adds a comparison against the count of a numeric field.
     * @template K - Selected property key.
     * @param {K} key - Property key to select.
     * @param {Operators} operator - {@link Operators} to apply.
     * @param {KnownKeys<T, number>} operand - Literal, {@link KnownKeys}, or aggregate expression to compare against.
     * @param {true} field - Whether the operand names another field.
     * @returns {this} {@link QueryableHaving} with the count expression added.
     */
    $count<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: KnownKeys<T, number>,
        field: true,
    ): this;
    /**
     * Adds a comparison against the count of a numeric field.
     * @template K - Selected property key.
     * @param {K} key - Property key to select.
     * @param {Operators} operator - {@link Operators} to apply.
     * @param {KnownKeys<T, number> | T[K] | HavingOperandFunction<T>} operand - Literal, {@link KnownKeys}, or aggregate expression to compare against.
     * @param {boolean} field - Whether the operand names another field.
     * @returns {this} {@link QueryableHaving} with the count expression added.
     */
    $count<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: KnownKeys<T, number> | T[K] | HavingOperandFunction<T>,
        field?: boolean,
    ): this {
        return this.addHavingCondition({ func: '$count', key, operator, operand, field });
    }

    /**
     * Adds a comparison against the average of a numeric field.
     * @template K - Selected property key.
     * @param {K} key - Property key to select.
     * @param {Operators} operator - {@link Operators} to apply.
     * @param {NoInfer<T[K]>} operand - Literal, field, or aggregate expression to compare against.
     * @returns {this} {@link QueryableHaving} with the average expression added.
     */
    $avg<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: NoInfer<T[K]>): this;
    /**
     * Adds a comparison against the average of a numeric field.
     * @template K - Selected property key.
     * @param {K} key - Property key to select.
     * @param {Operators} operator - {@link Operators} to apply.
     * @param {(f: HavingCompareFunc<T>) => void} func - Callback that selects an aggregate operand through {@link HavingCompareFunc}.
     * @returns {this} {@link QueryableHaving} with the average expression added.
     */
    $avg<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        func: (f: HavingCompareFunc<T>) => void,
    ): this;
    /**
     * Adds a comparison against the average of a numeric field.
     * @template K - Selected property key.
     * @param {K} key - Property key to select.
     * @param {Operators} operator - {@link Operators} to apply.
     * @param {KnownKeys<T, number>} operand - Literal, {@link KnownKeys}, or aggregate expression to compare against.
     * @param {true} field - Whether the operand names another field.
     * @returns {this} {@link QueryableHaving} with the average expression added.
     */
    $avg<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: KnownKeys<T, number>,
        field: true,
    ): this;
    /**
     * Adds a comparison against the average of a numeric field.
     * @template K - Selected property key.
     * @param {K} key - Property key to select.
     * @param {Operators} operator - {@link Operators} to apply.
     * @param {KnownKeys<T, number> | T[K] | HavingOperandFunction<T>} operand - Literal, {@link KnownKeys}, or aggregate expression to compare against.
     * @param {boolean} field - Whether the operand names another field.
     * @returns {this} {@link QueryableHaving} with the average expression added.
     */
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
