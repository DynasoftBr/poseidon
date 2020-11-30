import { Query } from "./query";

export type KnownKeys<T, TType = any> = {
  [K in keyof T]: string extends K ? never : number extends K ? never : K;
} extends { [_ in keyof T]: infer U }
  ? U extends keyof T
    ? T[U] extends TType
      ? U extends string
        ? U
        : never
      : never
    : never
  : never;

export type SimpleKeys<T> = KnownKeys<T, number> | KnownKeys<T, string> | KnownKeys<T, boolean> | KnownKeys<T, Date>;
export type IncludableKeys<T> = Exclude<KnownKeys<T>, SimpleKeys<T>>;
export type ExtractIncludable<T, K extends IncludableKeys<T>> = T[K] extends PaginatedResult<infer I>
  ? I
  : T[K] extends Array<infer I>
  ? I
  : T[K];
export type Operators = "$eq";

export type KeySelector<T> = { [k in keyof T]: k extends SimpleKeys<T> ? void : KeySelector<T[k]> };

export interface FilterBuilderInterface<T, TRoot = T> {
  where<K extends SimpleKeys<T>>(key: K, operator: Operators, operand: T[K]): this;
  where<K extends SimpleKeys<T>>(key: K, operator: Operators, operand: (root: KeySelector<TRoot>) => void): this;
  where<K extends SimpleKeys<T>>(key: K, operator: Operators, operand: K, field?: boolean): this;
  $or(func: (builder: FilterBuilderInterface<T, TRoot>) => void): this;
}

export interface HavingBuilder<T> {
  $sum<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: T[K]): this;
  $sum<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: HavingOperandFuncion<T>): this;
  $sum<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: T[K] | K | HavingOperandFuncion<T>, field?: boolean): this;

  $count<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: T[K]): this;
  $count<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: HavingOperandFuncion<T>): this;
  $count<K extends KnownKeys<T, number>>(
    key: K,
    operator: Operators,
    operand: T[K] | K | HavingOperandFuncion<T>,
    field?: boolean
  ): this;

  $avg<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: T[K]): this;
  $avg<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: HavingOperandFuncion<T>): this;
  $avg<K extends KnownKeys<T, number>>(key: K, operator: Operators, operand: T[K] | K | HavingOperandFuncion<T>, field?: boolean): this;

  $or(func: (builder: HavingBuilder<T>) => void): this;
}

export interface HavingCompareFunc<T> {
  $sum?: <K extends KnownKeys<T, number>>(key: K) => void;
  $count?: <K extends KnownKeys<T, number>>(key: K) => void;
  $avg?: <K extends KnownKeys<T, number>>(key: K) => void;
}

export type AggregateFuncs = "$sum" | "$count" | "$avg";
export interface ConditionComposition<T, TBuilder> {
  readonly $and?: TBuilder;
  $or?(func: (builder: TBuilder) => void): ConditionComposition<T, TBuilder>;
}

export type Simplified<T> = Pick<T, SimpleKeys<T>>;

export type RecusiveIncluded<T, K extends string> = {
  [key in keyof T | K]: (T & { [k in K]: RecusiveIncluded<T, K> })[key];
};

export type Included<T, TCurrent, K extends IncludableKeys<T>, TIncludeResult = null> = TCurrent extends T
  ? {
      [key in keyof TCurrent]: (TCurrent & { [k in K]: SingleOrSet<T, K, TIncludeResult> })[key];
    }
  : { [key in keyof TCurrent | K]: (TCurrent & { [k in K]: SingleOrSet<T, K, TIncludeResult> })[key] };

type IncludedResult<TOriginal, TIncludeResult = null> = TIncludeResult extends null ? Simplified<TOriginal> : TIncludeResult;

export type SingleOrSet<T, K extends IncludableKeys<T>, TIncludeResult = null> = T[K] extends PaginatedResult<infer I>
  ? PaginatedResult<IncludedResult<I, TIncludeResult>>
  : T[K] extends Array<infer I>
  ? Array<IncludedResult<I, TIncludeResult>>
  : IncludedResult<T[K], TIncludeResult>;

export type NewProperty<T, K extends string, TK> = { [key in keyof T | K]: (T & { [k in K]: TK })[key] };
export interface AggregateBuilder<T, R = {}> {
  $sum<K extends KnownKeys<T, number>, A extends string = K>(key: K, as?: A): AggregateBuilder<T, NewProperty<R, A, number>>;
  $count<K extends KnownKeys<T, number>, A extends string = K>(key: K, as?: A): AggregateBuilder<T, NewProperty<R, A, number>>;
  $avg<K extends KnownKeys<T, number>, A extends string = K>(key: K, as?: A): AggregateBuilder<T, NewProperty<R, A, number>>;

  $group<K extends SimpleKeys<T>>(...keys: K[]): AggregateBuilder<T, { [key in keyof R | K]: (T & R)[key] }>;
}

export type SelectResult<TResult, K extends SimpleKeys<TResult>> = { [k in K]: TResult[k] };
export type Describe<T> = T extends T ? { [key in keyof T]: T[key] } : never;

export interface PaginatedResult<T> {
  page?: number;
  total?: number;
  items: T[];
}

export interface QueryAggregate {
  [key: string]: GroupingFunction;
}

export type AggregateFunction = "$count" | "$sum" | "$avg";

export type GroupingFunction = AggregateFunction | "$group";

export type ConditionOperator<T, K extends SimpleKeys<T>> = {
  [operator in Operators]?: T[K] | string | { [func in AggregateFuncs]?: K };
};

export type Condition<T> = {
  [field in SimpleKeys<T>]?: ConditionOperator<T, field>;
};

export type HavingCondition<T> = {
  [func in AggregateFuncs]?: Condition<T>;
};

export type HavingOperandFuncion<T> = (f: HavingCompareFunc<T>) => void;

export type HavingConditionGroup<T> = (HavingCondition<T> | HavingConditionGroup<T>)[];

export type ConditionGroup<T> = (Condition<T> | ConditionGroup<T>)[];
export type IncludedKeys<T> = {
  [key in IncludableKeys<T>]: Query<ExtractIncludable<T, key>> | true;
};
export type Resolver<T> = (query: Query<T>) => Promise<any>;
