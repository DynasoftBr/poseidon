import type { EntityRef, entityRefTarget, PaginatedList } from '@poseidon/utilities';

type EntityRefTarget<R> = typeof entityRefTarget extends keyof R
    ? R extends EntityRef<infer T>
        ? T
        : never
    : never;
import type { Query } from './query';

/**
 * Named string keys whose values match the requested type.
 * @template T - Entity or value shape represented by this declaration.
 * @template TType - Value type used to select matching keys.
 */
export type KnownKeys<T, TType = unknown> = keyof {
    [
        K in keyof T as K extends string
            ? string extends K
                ? never
                : NonNullable<T[K]> extends TType
                  ? K
                  : never
            : never
    ]: T[K];
} &
    string;

/**
 * Keys containing scalar values supported by query projections.
 * @template T - Entity or value shape represented by this declaration.
 */
export type SimpleKeys<T> = KnownKeys<T, number | string | boolean | Date>;
type IncludedItem<T> = T extends PaginatedList<infer I> ? I : EntityRefTarget<T>;
/**
 * Keys that refer to entities or paginated entity collections.
 * @template T - Entity or value shape represented by this declaration.
 */
export type IncludableKeys<T> = keyof {
    [K in keyof T as [IncludedItem<NonNullable<T[K]>>] extends [never] ? never : K]: T[K];
} &
    string;
/**
 * Entity shape referenced by an includable property.
 * @template T - Entity or value shape represented by this declaration.
 * @template K - Selected property key.
 */
export type ExtractIncludable<T, K extends IncludableKeys<T>> = IncludedItem<NonNullable<T[K]>>;
/** Comparison operators supported by aggregate conditions. */
export type Operators = '$eq';

/**
 * Builds conditions on aggregate values.
 * @template T - Entity or value shape represented by this declaration.
 */
export interface HavingBuilder<T> {
    /**
     * Adds a comparison against the sum of a numeric field.
     * @template K - Selected property key.
     * @param {K} key - Property key to select.
     * @param {Operators} operator - {@link Operators} to apply.
     * @param {NoInfer<T[K]>} operand - Literal, field, or aggregate expression to compare against.
     * @returns {this} {@link HavingBuilder} with the sum expression added.
     */
    $sum<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: NoInfer<T[K]>): this;
    /**
     * Adds a comparison against the sum of a numeric field.
     * @template K - Selected property key.
     * @param {K} key - Property key to select.
     * @param {Operators} operator - {@link Operators} to apply.
     * @param {HavingOperandFunction<T>} operand - Literal, field, or {@link HavingOperandFunction} to compare against.
     * @returns {this} {@link HavingBuilder} with the sum expression added.
     */
    $sum<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: HavingOperandFunction<T>,
    ): this;
    /**
     * Adds a comparison against the sum of a numeric field.
     * @template K - Selected property key.
     * @param {K} key - Property key to select.
     * @param {Operators} operator - {@link Operators} to apply.
     * @param {KnownKeys<T, number>} operand - Literal, {@link KnownKeys}, or aggregate expression to compare against.
     * @param {true} field - Whether the operand names another field.
     * @returns {this} {@link HavingBuilder} with the sum expression added.
     */
    $sum<K extends KnownKeys<T, number>>(
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
     * @param {NoInfer<T[K]>} operand - Literal, field, or aggregate expression to compare against.
     * @returns {this} {@link HavingBuilder} with the count expression added.
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
     * @param {HavingOperandFunction<T>} operand - Literal, field, or {@link HavingOperandFunction} to compare against.
     * @returns {this} {@link HavingBuilder} with the count expression added.
     */
    $count<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: HavingOperandFunction<T>,
    ): this;
    /**
     * Adds a comparison against the count of a numeric field.
     * @template K - Selected property key.
     * @param {K} key - Property key to select.
     * @param {Operators} operator - {@link Operators} to apply.
     * @param {KnownKeys<T, number>} operand - Literal, {@link KnownKeys}, or aggregate expression to compare against.
     * @param {true} field - Whether the operand names another field.
     * @returns {this} {@link HavingBuilder} with the count expression added.
     */
    $count<K extends KnownKeys<T, number>>(
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
     * @param {NoInfer<T[K]>} operand - Literal, field, or aggregate expression to compare against.
     * @returns {this} {@link HavingBuilder} with the average expression added.
     */
    $avg<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: NoInfer<T[K]>): this;
    /**
     * Adds a comparison against the average of a numeric field.
     * @template K - Selected property key.
     * @param {K} key - Property key to select.
     * @param {Operators} operator - {@link Operators} to apply.
     * @param {HavingOperandFunction<T>} operand - Literal, field, or {@link HavingOperandFunction} to compare against.
     * @returns {this} {@link HavingBuilder} with the average expression added.
     */
    $avg<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: HavingOperandFunction<T>,
    ): this;
    /**
     * Adds a comparison against the average of a numeric field.
     * @template K - Selected property key.
     * @param {K} key - Property key to select.
     * @param {Operators} operator - {@link Operators} to apply.
     * @param {KnownKeys<T, number>} operand - Literal, {@link KnownKeys}, or aggregate expression to compare against.
     * @param {true} field - Whether the operand names another field.
     * @returns {this} {@link HavingBuilder} with the average expression added.
     */
    $avg<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: KnownKeys<T, number>,
        field: true,
    ): this;

    /**
     * Adds a nested group of alternative aggregate conditions.
     * @param {(builder: HavingBuilder<T>) => void} func - Callback that configures aggregate conditions through {@link HavingBuilder}.
     * @returns {this} This {@link HavingBuilder} with the alternative condition group added.
     */
    $or(func: (builder: HavingBuilder<T>) => void): this;
}

/**
 * Selects an aggregate expression as a comparison operand.
 * @template T - Entity or value shape represented by this declaration.
 */
export interface HavingCompareFunc<T> {
    /** Selects the sum of a field from {@link KnownKeys} as a comparison operand. */
    $sum: <K extends KnownKeys<T, number>>(key: K) => void;
    /** Selects the count of a field from {@link KnownKeys} as a comparison operand. */
    $count: <K extends KnownKeys<T, number>>(key: K) => void;
    /** Selects the average of a field from {@link KnownKeys} as a comparison operand. */
    $avg: <K extends KnownKeys<T, number>>(key: K) => void;
}

/** Supported aggregate functions. */
export type AggregateFuncs = '$sum' | '$count' | '$avg';
/**
 * Composes condition builders using conjunction and disjunction.
 * @template TBuilder - Builder used to compose conditions.
 */
export interface ConditionComposition<TBuilder> {
    /** Builder used to add conjunctive conditions. */
    readonly $and?: TBuilder;
    /**
     * Adds a nested group of alternative aggregate conditions.
     * @param {(builder: TBuilder) => void} func - Configures the aggregate projection or conditions.
     * @returns {ConditionComposition<TBuilder>} This {@link ConditionComposition} with the alternative condition group added.
     */
    $or?(func: (builder: TBuilder) => void): ConditionComposition<TBuilder>;
}

/**
 * Projection containing only scalar properties.
 * @template T - Entity or value shape represented by this declaration.
 */
export type Simplified<T> = Pick<T, SimpleKeys<T>>;

/**
 * Recursively adds a named relationship to an entity shape.
 * @template T - Entity or value shape represented by this declaration.
 * @template K - Selected property key.
 */
export type RecursiveIncluded<T, K extends string> = {
    [key in keyof T | K]: (T & { [k in K]: RecursiveIncluded<T, K> })[key];
};

/**
 * Result shape after expanding an included relationship.
 * @template T - Entity or value shape represented by this declaration.
 * @template TCurrent - Result shape before including the relationship.
 * @template K - Selected property key.
 * @template TIncludeResult - Projection applied to the included entity.
 */
export type Included<T, TCurrent, K extends IncludableKeys<T>, TIncludeResult = null> = Describe<
    Omit<TCurrent, K> & {
        [P in keyof Pick<T, K>]: SingleOrSet<T, P, TIncludeResult>;
    }
>;

type IncludedResult<TOriginal, TIncludeResult = null> = TIncludeResult extends null
    ? Simplified<TOriginal>
    : TIncludeResult;

type IncludedShape<T, R> = T extends null | undefined
    ? T
    : T extends PaginatedList<infer I>
      ? PaginatedList<IncludedResult<I, R>>
      : IncludedResult<EntityRefTarget<T>, R>;

/**
 * {@link Included} relationship shape preserving single or paginated cardinality.
 * @template T - Entity or value shape represented by this declaration.
 * @template K - Selected property key.
 * @template TIncludeResult - Projection applied to the included entity.
 */
export type SingleOrSet<T, K extends IncludableKeys<T>, TIncludeResult = null> = IncludedShape<
    T[K],
    TIncludeResult
>;

/**
 * Result shape with a named property added or replaced.
 * @template T - Entity or value shape represented by this declaration.
 * @template K - Selected property key.
 * @template TK - Value type of the added property.
 */
export type NewProperty<T, K extends string, TK> = Describe<Omit<T, K> & Record<K, TK>>;
/**
 * Builds aggregate projections while tracking their result shape.
 * @template T - Entity or value shape represented by this declaration.
 * @template R - Result shape produced by the builder.
 */
export interface AggregateBuilder<T, R = Record<never, never>> {
    /**
     * Adds the sum of a numeric field to the result projection.
     * @template K - Selected property key.
     * @template A - Output name of the aggregate projection.
     * @param {K} key - Property key to select.
     * @param {A} as - Output name for the aggregate value; defaults to the source key.
     * @returns {AggregateBuilder<T, NewProperty<R, A, number>>} {@link AggregateBuilder} with the sum expression added.
     */
    $sum<K extends KnownKeys<T, number>, A extends string = K>(
        key: K,
        as?: A,
    ): AggregateBuilder<T, NewProperty<R, A, number>>;
    /**
     * Adds the count of a numeric field to the result projection.
     * @template K - Selected property key.
     * @template A - Output name of the aggregate projection.
     * @param {K} key - Property key to select.
     * @param {A} as - Output name for the aggregate value; defaults to the source key.
     * @returns {AggregateBuilder<T, NewProperty<R, A, number>>} {@link AggregateBuilder} with the count expression added.
     */
    $count<K extends KnownKeys<T, number>, A extends string = K>(
        key: K,
        as?: A,
    ): AggregateBuilder<T, NewProperty<R, A, number>>;
    /**
     * Adds the average of a numeric field to the result projection.
     * @template K - Selected property key.
     * @template A - Output name of the aggregate projection.
     * @param {K} key - Property key to select.
     * @param {A} as - Output name for the aggregate value; defaults to the source key.
     * @returns {AggregateBuilder<T, NewProperty<R, A, number>>} {@link AggregateBuilder} with the average expression added.
     */
    $avg<K extends KnownKeys<T, number>, A extends string = K>(
        key: K,
        as?: A,
    ): AggregateBuilder<T, NewProperty<R, A, number>>;

    /**
     * Groups results by the selected scalar fields.
     * @template K - Selected property key.
     * @param {K[]} keys - Property keys to include in the result.
     * @returns {AggregateBuilder<T, Describe<Omit<R, K> & Pick<T, K>>>} {@link AggregateBuilder} with the grouping fields added.
     */
    $group<K extends SimpleKeys<T>>(
        ...keys: K[]
    ): AggregateBuilder<T, Describe<Omit<R, K> & Pick<T, K>>>;
}

/**
 * Result projection containing the selected scalar keys.
 * @template TResult - Result shape returned by the operation.
 * @template K - Selected property key.
 */
export type SelectResult<TResult, K extends SimpleKeys<TResult>> = Pick<TResult, K>;
/**
 * Expands a mapped result into its named properties.
 * @template T - Entity or value shape represented by this declaration.
 */
export type Describe<T> = { [key in keyof T]: T[key] };

/** Maps output names to their source fields and aggregate functions. */
export interface QueryAggregate {
    [key: string]: {
        /** Source field used by the aggregate expression. */
        field: string; /** Operation applied to the source field. */
        operator: GroupingFunction;
    };
}

/** Aggregate or grouping function applied to a query field. */
export type GroupingFunction = AggregateFuncs | '$group';

/**
 * Comparison operands supported for a scalar field.
 * @template T - Entity or value shape represented by this declaration.
 * @template K - Selected property key.
 */
export type ConditionOperator<T, K extends SimpleKeys<T>> = {
    [operator in Operators]?: T[K] | string | { [func in AggregateFuncs]?: K };
};

/**
 * Field comparisons within an aggregate condition.
 * @template T - Entity or value shape represented by this declaration.
 */
export type Condition<T> = {
    [field in SimpleKeys<T>]?: ConditionOperator<T, field>;
};

/**
 * Conditions keyed by aggregate function.
 * @template T - Entity or value shape represented by this declaration.
 */
export type HavingCondition<T> = {
    [func in AggregateFuncs]?: Condition<T>;
};

/**
 * Selects an aggregate expression to use as a comparison operand.
 * @template T - Entity or value shape represented by this declaration.
 */
export type HavingOperandFunction<T> = (f: HavingCompareFunc<T>) => void;

/**
 * Nested groups of aggregate conditions.
 * @template T - Entity or value shape represented by this declaration.
 */
export type HavingConditionGroup<T> = (HavingCondition<T> | HavingConditionGroup<T>)[];

/**
 * Queries or inclusion flags keyed by relationship name.
 * @template T - Entity or value shape represented by this declaration.
 */
export type IncludedKeys<T> = {
    [key in IncludableKeys<T>]?: Query<ExtractIncludable<T, key>> | true;
};
/**
 * Executes a declarative query and returns its result.
 * @template T - Entity or value shape represented by this declaration.
 */
export type Resolver<T> = (query: Query<T>) => Promise<unknown>;
