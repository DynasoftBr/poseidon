import type { PaginatedList } from '@poseidon/utilities';
import type { EntityReferenceTarget } from '../entity-reference';
import type { Query } from './query';

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

export type SimpleKeys<T> = KnownKeys<T, number | string | boolean | Date>;
type IncludedItem<T> = T extends PaginatedList<infer I> ? I : EntityReferenceTarget<T>;
export type IncludableKeys<T> = keyof {
    [K in keyof T as [IncludedItem<NonNullable<T[K]>>] extends [never] ? never : K]: T[K];
} &
    string;
export type ExtractIncludable<T, K extends IncludableKeys<T>> = IncludedItem<NonNullable<T[K]>>;
export type Operators = '$eq';

export interface HavingBuilder<T> {
    $sum<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: NoInfer<T[K]>): this;
    $sum<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: HavingOperandFunction<T>,
    ): this;
    $sum<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: KnownKeys<T, number>,
        field: true,
    ): this;

    $count<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: NoInfer<T[K]>,
    ): this;
    $count<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: HavingOperandFunction<T>,
    ): this;
    $count<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: KnownKeys<T, number>,
        field: true,
    ): this;

    $avg<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: NoInfer<T[K]>): this;
    $avg<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: HavingOperandFunction<T>,
    ): this;
    $avg<K extends KnownKeys<T, number>>(
        key: K,
        operator: Operators,
        operand: KnownKeys<T, number>,
        field: true,
    ): this;

    $or(func: (builder: HavingBuilder<T>) => void): this;
}

export interface HavingCompareFunc<T> {
    $sum: <K extends KnownKeys<T, number>>(key: K) => void;
    $count: <K extends KnownKeys<T, number>>(key: K) => void;
    $avg: <K extends KnownKeys<T, number>>(key: K) => void;
}

export type AggregateFuncs = '$sum' | '$count' | '$avg';
export interface ConditionComposition<TBuilder> {
    readonly $and?: TBuilder;
    $or?(func: (builder: TBuilder) => void): ConditionComposition<TBuilder>;
}

export type Simplified<T> = Pick<T, SimpleKeys<T>>;

export type RecursiveIncluded<T, K extends string> = {
    [key in keyof T | K]: (T & { [k in K]: RecursiveIncluded<T, K> })[key];
};

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
      : IncludedResult<EntityReferenceTarget<T>, R>;

export type SingleOrSet<T, K extends IncludableKeys<T>, TIncludeResult = null> = IncludedShape<
    T[K],
    TIncludeResult
>;

export type NewProperty<T, K extends string, TK> = Describe<Omit<T, K> & Record<K, TK>>;
export interface AggregateBuilder<T, R = Record<never, never>> {
    $sum<K extends KnownKeys<T, number>, A extends string = K>(
        key: K,
        as?: A,
    ): AggregateBuilder<T, NewProperty<R, A, number>>;
    $count<K extends KnownKeys<T, number>, A extends string = K>(
        key: K,
        as?: A,
    ): AggregateBuilder<T, NewProperty<R, A, number>>;
    $avg<K extends KnownKeys<T, number>, A extends string = K>(
        key: K,
        as?: A,
    ): AggregateBuilder<T, NewProperty<R, A, number>>;

    $group<K extends SimpleKeys<T>>(
        ...keys: K[]
    ): AggregateBuilder<T, Describe<Omit<R, K> & Pick<T, K>>>;
}

export type SelectResult<TResult, K extends SimpleKeys<TResult>> = Pick<TResult, K>;
export type Describe<T> = { [key in keyof T]: T[key] };

export interface QueryAggregate {
    [key: string]: { field: string; operator: GroupingFunction };
}

export type GroupingFunction = AggregateFuncs | '$group';

export type ConditionOperator<T, K extends SimpleKeys<T>> = {
    [operator in Operators]?: T[K] | string | { [func in AggregateFuncs]?: K };
};

export type Condition<T> = {
    [field in SimpleKeys<T>]?: ConditionOperator<T, field>;
};

export type HavingCondition<T> = {
    [func in AggregateFuncs]?: Condition<T>;
};

export type HavingOperandFunction<T> = (f: HavingCompareFunc<T>) => void;

export type HavingConditionGroup<T> = (HavingCondition<T> | HavingConditionGroup<T>)[];

export type IncludedKeys<T> = {
    [key in IncludableKeys<T>]?: Query<ExtractIncludable<T, key>> | true;
};
export type Resolver<T> = (query: Query<T>) => Promise<unknown>;
