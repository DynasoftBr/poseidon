import type {
    AggregateBuilder,
    Describe,
    KnownKeys,
    NewProperty,
    QueryAggregate,
    SimpleKeys,
} from './interfaces/utility-types';

/**
 * Accumulates aggregate projections in a query definition.
 * @template T - Entity or value shape represented by this declaration.
 * @template R - Result shape produced by the builder.
 */
export class QueryableAggregate<T, R = Record<never, never>> implements AggregateBuilder<T, R> {
    /**
     * Creates a builder over the supplied aggregate projections.
     * @param {QueryAggregate} _aggregate - Mutable {@link QueryAggregate} to populate.
     */
    constructor(private readonly _aggregate: QueryAggregate) {}

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
    ): AggregateBuilder<T, NewProperty<R, A, number>> {
        this._aggregate[as || key] = { field: key, operator: '$sum' };
        return new QueryableAggregate<T, NewProperty<R, A, number>>(this._aggregate);
    }

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
    ): AggregateBuilder<T, NewProperty<R, A, number>> {
        this._aggregate[as || key] = { field: key, operator: '$count' };
        return new QueryableAggregate<T, NewProperty<R, A, number>>(this._aggregate);
    }

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
    ): AggregateBuilder<T, NewProperty<R, A, number>> {
        this._aggregate[as || key] = { field: key, operator: '$avg' };
        return new QueryableAggregate<T, NewProperty<R, A, number>>(this._aggregate);
    }

    /**
     * Groups results by the selected scalar fields.
     * @template K - Selected property key.
     * @param {K[]} keys - Property keys to include in the result.
     * @returns {AggregateBuilder<T, Describe<Omit<R, K> & Pick<T, K>>>} {@link AggregateBuilder} with the grouping fields added.
     */
    $group<K extends SimpleKeys<T>>(
        ...keys: K[]
    ): AggregateBuilder<T, Describe<Omit<R, K> & Pick<T, K>>> {
        for (const key of keys) this._aggregate[key] = { field: key, operator: '$group' };

        return new QueryableAggregate<T, Describe<Omit<R, K> & Pick<T, K>>>(this._aggregate);
    }
}
