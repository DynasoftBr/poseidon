import { AggregateBuilder, QueryAggregate, KnownKeys, NewProperty, SimpleKeys } from "./interfaces/utility-types";

export class QueryableAggregate<T, R = {}> implements AggregateBuilder<T, R> {
  constructor(private readonly _aggregate: QueryAggregate) { }

  $sum<K extends KnownKeys<T, number>, A extends string = K>(key: K, as?: A): AggregateBuilder<T, NewProperty<R, A, number>> {
    this._aggregate[as || key] = "$sum";
    return new QueryableAggregate<T, NewProperty<R, A, number>>(this._aggregate);
  }

  $count<K extends KnownKeys<T, number>, A extends string = K>(key: K, as?: A): AggregateBuilder<T, NewProperty<R, A, number>> {
    this._aggregate[as || key] = "$count";
    return new QueryableAggregate<T, NewProperty<R, A, number>>(this._aggregate);
  }

  $avg<K extends KnownKeys<T, number>, A extends string = K>(key: K, as?: A): AggregateBuilder<T, NewProperty<R, A, number>> {
    this._aggregate[as || key] = "$avg";
    return new QueryableAggregate<T, NewProperty<R, A, number>>(this._aggregate);
  }

  $group<K extends SimpleKeys<T>>(...keys: K[]): AggregateBuilder<T, { [key in K | keyof R]: (T & R)[key]; }> {
    for (const key of keys)
      this._aggregate[key] = "$group";

    return new QueryableAggregate<T, { [key in K | keyof R]: (T & R)[key]; }>(this._aggregate);
  }
}
