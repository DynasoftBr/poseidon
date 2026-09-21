import type {
    AggregateBuilder,
    Describe,
    KnownKeys,
    NewProperty,
    QueryAggregate,
    SimpleKeys,
} from './interfaces/utility-types';

export class QueryableAggregate<T, R = Record<never, never>> implements AggregateBuilder<T, R> {
    constructor(private readonly _aggregate: QueryAggregate) {}

    $sum<K extends KnownKeys<T, number>, A extends string = K>(
        key: K,
        as?: A,
    ): AggregateBuilder<T, NewProperty<R, A, number>> {
        this._aggregate[as || key] = { field: key, operator: '$sum' };
        return new QueryableAggregate<T, NewProperty<R, A, number>>(this._aggregate);
    }

    $count<K extends KnownKeys<T, number>, A extends string = K>(
        key: K,
        as?: A,
    ): AggregateBuilder<T, NewProperty<R, A, number>> {
        this._aggregate[as || key] = { field: key, operator: '$count' };
        return new QueryableAggregate<T, NewProperty<R, A, number>>(this._aggregate);
    }

    $avg<K extends KnownKeys<T, number>, A extends string = K>(
        key: K,
        as?: A,
    ): AggregateBuilder<T, NewProperty<R, A, number>> {
        this._aggregate[as || key] = { field: key, operator: '$avg' };
        return new QueryableAggregate<T, NewProperty<R, A, number>>(this._aggregate);
    }

    $group<K extends SimpleKeys<T>>(
        ...keys: K[]
    ): AggregateBuilder<T, Describe<Omit<R, K> & Pick<T, K>>> {
        for (const key of keys) this._aggregate[key] = { field: key, operator: '$group' };

        return new QueryableAggregate<T, Describe<Omit<R, K> & Pick<T, K>>>(this._aggregate);
    }
}
