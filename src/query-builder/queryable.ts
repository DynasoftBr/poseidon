import { QueryableFilter } from "./queryable-filter";
import { QueryableHaving } from "./queryable-having";
import { QueryableInclude } from "./queryable-include";
import { QueryableAggregate } from "./queryable-aggregate";
import { Query } from "./interfaces/query";
import {
  Simplified,
  Describe,
  IncludableKeys,
  ExtractIncludable,
  FilterBuilderInterface,
  HavingBuilder,
  AggregateBuilder,
  SimpleKeys,
  SelectResult,
  Included,
  IncludeBuilder,
  Resolver,
} from "./interfaces/utility-types";
import { QueryBuilder } from "./interfaces/query-builder";

export class Queryable<T, TRoot = T, TResult = Simplified<T>> implements QueryBuilder<T, TRoot, TResult> {
  public constructor(private resolver: Resolver, public readonly _query: Query<T> = {}) {
    if (_query == null) {
      throw new Error("'_query' cannot be null.");
    }
  }

  include<K extends IncludableKeys<T>>(k: K): Queryable<T, TRoot, Included<T, TResult, K>>;
  include<K extends IncludableKeys<T>, R>(k: K, b?: IncludeBuilder<T, K, R>): Queryable<T, TRoot, Included<T, TResult, K, R>>;
  include<K extends IncludableKeys<T>, R>(k: K, b?: IncludeBuilder<T, K, R>): Queryable<T, TRoot, Included<T, TResult, K, R>> {
    let includeKeyQuery: Query<ExtractIncludable<T, K>> = null;
    b && (includeKeyQuery = {}) && b(new QueryableInclude<T, K>(includeKeyQuery));

    this._query.$include = this._query.$include || {};
    this._query.$include[k] = includeKeyQuery || true;

    return new Queryable<T, TRoot, Included<T, TResult, K, R>>(this.resolver, this._query);
  }

  where(func: (builder: FilterBuilderInterface<T, TRoot>) => void): Queryable<T, TRoot, TResult> {
    this._query.$where = this._query.$where || [];
    func && func(new QueryableFilter(this._query.$where));

    return new Queryable<T, TRoot, TResult>(this.resolver, this._query);
  }

  having(func: (builder: HavingBuilder<T>) => void): Queryable<T, TRoot, TResult> {
    this._query.$having = this._query.$having || [];
    func && func(new QueryableHaving(this._query.$having));

    return new Queryable<T, TRoot, TResult>(this.resolver, this._query);
  }

  aggregate<Agg>(func: (builder: AggregateBuilder<T>) => AggregateBuilder<T, Agg>): Queryable<T, TRoot, Agg> {
    this._query.$aggregate = this._query.$aggregate || {};
    func(new QueryableAggregate(this._query.$aggregate));

    return new Queryable<T, TRoot, Agg>(this.resolver, this._query);
  }

  select<K extends keyof TResult>(...keys: K[]): Queryable<T, TRoot, { [k in K]: TResult[k] }> {
    this._query.$select = this._query.$select || [];
    this._query.$select.push(...(<any>keys));

    return new Queryable<T, TRoot, { [k in K]: TResult[k] }>(this.resolver, this._query);
  }

  async first(): Promise<Describe<TResult>> {
    return this.resolver(this._query);
  }

  async toArray(): Promise<T[]> {
    throw new Error("Method not implemented.");
  }
}
