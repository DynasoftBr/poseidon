import {
  IncludableKeys,
  ExtractIncludable,
  Simplified,
  Included,
  FilterBuilderInterface,
  HavingBuilder,
  AggregateBuilder,
  IncludeBuilder,
} from "./utility-types";

export interface QueryBuilder<T, TRoot = T, TResult = Simplified<T>> {
  include<K extends IncludableKeys<T>>(key: K): QueryBuilder<T, TRoot, Included<T, TResult, K>>;
  include<K extends IncludableKeys<T>, R>(key: K, i?: IncludeBuilder<T, K, R>): QueryBuilder<T, TRoot, Included<T, TResult, K, R>>;
  where(func: (builder: FilterBuilderInterface<T, TRoot>) => void): QueryBuilder<T, TRoot, TResult>;
  having(func: (builder: HavingBuilder<T>) => void): QueryBuilder<T, TRoot, TResult>;
  aggregate<Agg>(func: (builder: AggregateBuilder<T>) => AggregateBuilder<T, Agg>): QueryBuilder<T, TRoot, Agg>;
  select<K extends keyof TResult>(...keys: K[]): QueryBuilder<T, TRoot, Pick<TResult, K>>;
}
