import { Queryable } from "./queryable";
import { Query } from "./interfaces/query";
import { IncludeQueryBuilder } from "./interfaces/include-query-builder";
import { QueryBuilder } from "./interfaces/query-builder";
import {
  IncludableKeys,
  Included,
  FilterBuilderInterface,
  Simplified,
  IncludeBuilder,
  HavingBuilder,
  AggregateBuilder,
  SimpleKeys,
  SelectResult,
  RecusiveIncluded,
  ExtractIncludable,
} from "./interfaces/utility-types";

export class QueryableInclude<
  TRoot,
  IK extends IncludableKeys<T>,
  T extends ExtractIncludable<TRoot, IK> = ExtractIncludable<TRoot, IK>,
  TResult = Simplified<T>
> implements IncludeQueryBuilder<TRoot, IK, T, TResult> {
  private _underlyingQueryable: QueryBuilder<T, TRoot, Simplified<T>>;

  constructor(private readonly includeQuery: Query<T>) {
    this._underlyingQueryable = new Queryable<T, TRoot>(() => null, includeQuery);
  }

  recursive(): IncludeQueryBuilder<TRoot, IK, T, RecusiveIncluded<TResult, IK>> {
    this.includeQuery.$recursive = true;
    return new QueryableInclude<TRoot, IK, T, RecusiveIncluded<TResult, IK>>(this.includeQuery);
  }

  include<K extends IncludableKeys<T>>(k: K): IncludeQueryBuilder<TRoot, IK, T, Included<T, TResult, K>>;
  include<K extends IncludableKeys<T>, R>(k: K, b?: IncludeBuilder<T, K, R>): IncludeQueryBuilder<TRoot, IK, T, Included<T, TResult, K, R>>;
  include<K extends IncludableKeys<T>, R>(k: K, b?: IncludeBuilder<T, K, R>): IncludeQueryBuilder<TRoot, IK, T, Included<T, TResult, K, R>> {
    this._underlyingQueryable.include(k, b);
    return new QueryableInclude<TRoot, K, T, Included<T, TResult, K, R>>(this.includeQuery);
  }

  where(func: (builder: FilterBuilderInterface<T, TRoot>) => void): IncludeQueryBuilder<TRoot, IK, T, TResult> {
    this._underlyingQueryable.where(func);
    return this;
  }

  having(func: (builder: HavingBuilder<T>) => void): IncludeQueryBuilder<TRoot, IK, T, TResult> {
    this._underlyingQueryable.having(func);
    return this;
  }

  aggregate<Agg>(func: (builder: AggregateBuilder<T, {}>) => AggregateBuilder<T, Agg>): IncludeQueryBuilder<TRoot, IK, T, Agg> {
    this._underlyingQueryable.aggregate(func);
    return new QueryableInclude<TRoot, IK, T, Agg>(this.includeQuery);
  }

  select<K extends keyof TResult>(...keys: K[]): IncludeQueryBuilder<TRoot, IK, T, Pick<TResult, K>> {
    throw new Error("Method not implemented.");
  }
}
