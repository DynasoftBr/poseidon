import type { Specification, SpecificationBuilder } from '@poseidon/utilities';
import type {
    AggregateBuilder,
    ExtractIncludable,
    HavingBuilder,
    IncludableKeys,
    Included,
} from './utility-types';

/**
 * Configures the query and result shape of an included relationship.
 * @template T - Entity or value shape represented by this declaration.
 * @template TRoot - Root entity shape available to nested queries.
 * @template K - Selected property key.
 * @template TResult - Result shape returned by the operation.
 */
export type IncludeBuilder<T, TRoot, K extends IncludableKeys<T>, TResult> = (
    builder: QueryBuilder<ExtractIncludable<T, K>, TRoot>,
) => QueryBuilder<ExtractIncludable<T, K>, TRoot, TResult>;

/**
 * Fluent contract for selecting, filtering, and shaping query results.
 * @template T - Entity or value shape represented by this declaration.
 * @template TRoot - Root entity shape available to nested queries.
 * @template TResult - Result shape returned by the operation.
 * @template Paginated - Whether the query requests paginated results.
 */
export interface QueryBuilder<T, TRoot = T, TResult = T, Paginated = false> {
    /**
     * Includes a related entity or collection, optionally shaping its query.
     * @template K - Selected property key.
     * @param {K} key - Property key to select.
     * @returns {QueryBuilder<T, TRoot, Included<T, TResult, K>, Paginated>} {@link QueryBuilder} with the included relationship in its result shape.
     */
    include<K extends IncludableKeys<T>>(
        key: K,
    ): QueryBuilder<T, TRoot, Included<T, TResult, K>, Paginated>;
    /**
     * Includes a related entity or collection, optionally shaping its query.
     * @template K - Selected property key.
     * @template R - Result shape produced by the builder.
     * @param {K} key - Property key to select.
     * @param {IncludeBuilder<T, TRoot, K, R>} i - {@link IncludeBuilder} that configures the included relationship query.
     * @returns {QueryBuilder<T, TRoot, Included<T, TResult, K, R>, Paginated>} {@link QueryBuilder} with the included relationship in its result shape.
     */
    include<K extends IncludableKeys<T>, R>(
        key: K,
        i: IncludeBuilder<T, TRoot, K, R>,
    ): QueryBuilder<T, TRoot, Included<T, TResult, K, R>, Paginated>;
    /**
     * Marks the query for recursive relationship inclusion.
     * @returns {QueryBuilder<T, TRoot, TResult, Paginated>} This {@link QueryBuilder} with recursive inclusion enabled.
     */
    recursive(): QueryBuilder<T, TRoot, TResult, Paginated>;
    /**
     * Adds a condition, combining it with existing conditions using AND.
     * @param {Readonly<Specification<T>>} specification - {@link Specification} to add.
     * @returns {QueryBuilder<T, TRoot, TResult, Paginated>} {@link QueryBuilder} with the additional filter.
     */
    where(specification: Readonly<Specification<T>>): QueryBuilder<T, TRoot, TResult, Paginated>;
    /**
     * Adds a condition, combining it with existing conditions using AND.
     * @param {(builder: SpecificationBuilder<T>) => Readonly<Specification<T>>} build - Builds a {@link Specification} with {@link SpecificationBuilder}.
     * @returns {QueryBuilder<T, TRoot, TResult, Paginated>} {@link QueryBuilder} with the additional filter.
     */
    where(
        build: (builder: SpecificationBuilder<T>) => Readonly<Specification<T>>,
    ): QueryBuilder<T, TRoot, TResult, Paginated>;
    /**
     * Adds conditions on aggregate values.
     * @param {(builder: HavingBuilder<T>) => void} func - Callback that configures aggregate conditions through {@link HavingBuilder}.
     * @returns {QueryBuilder<T, TRoot, TResult, Paginated>} {@link QueryBuilder} with the aggregate conditions.
     */
    having(func: (builder: HavingBuilder<T>) => void): QueryBuilder<T, TRoot, TResult, Paginated>;
    /**
     * Adds aggregate projections and updates the result shape.
     * @template Agg - Aggregate result shape.
     * @param {(builder: AggregateBuilder<T>) => AggregateBuilder<T, Agg>} func - Callback that configures projections through {@link AggregateBuilder}.
     * @returns {QueryBuilder<T, TRoot, Agg, Paginated>} {@link QueryBuilder} with the aggregate result shape.
     */
    aggregate<Agg>(
        func: (builder: AggregateBuilder<T>) => AggregateBuilder<T, Agg>,
    ): QueryBuilder<T, TRoot, Agg, Paginated>;
    /**
     * Selects the properties returned by the query.
     * @template K - Selected property key.
     * @param {K[]} keys - Property keys to include in the result.
     * @returns {QueryBuilder<T, TRoot, Pick<TResult, K>, Paginated>} {@link QueryBuilder} with the selected result properties.
     */
    select<K extends keyof TResult>(
        ...keys: K[]
    ): QueryBuilder<T, TRoot, Pick<TResult, K>, Paginated>;
    /**
     * Sets the result offset and page size.
     * @param {number} skip - Number of matching results to skip.
     * @param {number} take - Maximum number of results in the page.
     * @returns {QueryBuilder<T, TRoot, TResult, true>} {@link QueryBuilder} configured for pagination.
     */
    paginate(skip: number, take: number): QueryBuilder<T, TRoot, TResult, true>;
}
