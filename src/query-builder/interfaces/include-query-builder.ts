import {
  Simplified,
  IncludableKeys,
  RecusiveIncluded,
  ExtractIncludable,
  Included,
  IncludeBuilder,
  FilterBuilderInterface,
  HavingBuilder,
  AggregateBuilder,
  SimpleKeys,
} from "./utility-types";
import { QueryBuilder } from "./query-builder";

export interface IncludeQueryBuilder<
  TRoot,
  IK extends IncludableKeys<T>,
  T extends ExtractIncludable<TRoot, IK> = ExtractIncludable<TRoot, IK>,
  TResult = Simplified<T>
> extends QueryBuilder<T, TRoot, TResult> {
  include<K extends IncludableKeys<T>>(key: K): IncludeQueryBuilder<TRoot, IK, T, Included<T, TResult, K>>;
  include<K extends IncludableKeys<T>, R>(
    key: K,
    i?: IncludeBuilder<T, K, R>
  ): IncludeQueryBuilder<TRoot, IK, T, Included<T, TResult, K, R>>;
  where(func: (builder: FilterBuilderInterface<T, TRoot>) => void): IncludeQueryBuilder<TRoot, IK, T, TResult>;
  having(func: (builder: HavingBuilder<T>) => void): IncludeQueryBuilder<TRoot, IK, T, TResult>;
  aggregate<Agg>(func: (builder: AggregateBuilder<T>) => AggregateBuilder<T, Agg>): IncludeQueryBuilder<TRoot, IK, T, Agg>;
  select<K extends keyof TResult>(...keys: K[]): IncludeQueryBuilder<TRoot, IK, T, Pick<TResult, K>>;
  recursive(): IncludeQueryBuilder<TRoot, IK, T, RecusiveIncluded<TResult, IK>>;
}
