import { QueryableFilter } from "./queryable-filter";
import { QueryableHaving } from "./queryable-having";
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
  Included,
  Resolver,
  SimpleKeys,
  KnownKeys,
} from "./interfaces/utility-types";
import { QueryBuilder, IncludeBuilder } from "./interfaces/query-builder";

export class Queryable<T, TRoot = T, TResult = T, Paginated = false> implements QueryBuilder<T, TRoot, TResult, Paginated> {
  public constructor(private resolver: Resolver<T>, public readonly _query: Query<T> = {}) {
    if (_query == null) {
      throw new Error("'_query' cannot be null.");
    }
  }

  include<K extends IncludableKeys<T>>(k: K): Queryable<T, TRoot, Included<T, TResult, K>, Paginated>;
  include<K extends IncludableKeys<T>, R>(
    k: K,
    b?: IncludeBuilder<T, TRoot, K, R>
  ): Queryable<T, TRoot, Included<T, TResult, K, R>, Paginated>;
  include<K extends IncludableKeys<T>, R>(
    k: K,
    b?: IncludeBuilder<T, TRoot, K, R>
  ): Queryable<T, TRoot, Included<T, TResult, K, R>, Paginated> {
    let includeKeyQuery: Query<ExtractIncludable<T, K>> = null;
    b && (includeKeyQuery = {}) && b(new Queryable<ExtractIncludable<T, K>, TRoot>(null, includeKeyQuery));

    this._query.$include = this._query.$include || {};
    this._query.$include[k] = includeKeyQuery || true;

    return new Queryable<T, TRoot, Included<T, TResult, K, R>, Paginated>(this.resolver, this._query);
  }

  filter(func: (builder: FilterBuilderInterface<T, TRoot>) => void): Queryable<T, TRoot, TResult, Paginated> {
    this._query.$where = this._query.$where || [];
    func && func(new QueryableFilter(this._query.$where));

    return new Queryable<T, TRoot, TResult, Paginated>(this.resolver, this._query);
  }

  having(func: (builder: HavingBuilder<T>) => void): Queryable<T, TRoot, TResult, Paginated> {
    this._query.$having = this._query.$having || [];
    func && func(new QueryableHaving(this._query.$having));

    return new Queryable<T, TRoot, TResult, Paginated>(this.resolver, this._query);
  }

  aggregate<Agg>(func: (builder: AggregateBuilder<T>) => AggregateBuilder<T, Agg>): Queryable<T, TRoot, Agg, Paginated> {
    this._query.$aggregate = this._query.$aggregate || {};
    func(new QueryableAggregate(this._query.$aggregate));

    return new Queryable<T, TRoot, Agg, Paginated>(this.resolver, this._query);
  }

  select<K extends keyof TResult>(...keys: K[]): Queryable<T, TRoot, { [k in K]: TResult[k] }, Paginated> {
    this._query.$select = this._query.$select || [];
    this._query.$select.push(...(<any>keys));

    return new Queryable<T, TRoot, { [k in K]: TResult[k] }, Paginated>(this.resolver, this._query);
  }

  paginate<K extends keyof TResult>(skip: number, take: number): Queryable<T, TRoot, TResult, true> {
    this._query.$skip = skip;
    this._query.$take = take;

    return new Queryable<T, TRoot, TResult, true>(this.resolver, this._query);
  }

  async first(): Promise<Describe<TResult>> {
    this._query.$first = true;
    return this.resolver(this._query);
  }

  async toArray(): Promise<Describe<TResult>[]> {
    return this.resolver(this._query);
  }
}
