import { SpecificationBuilder, type Specification } from '@poseidon/utilities';
import type { Query } from './interfaces/query';
import type { IncludeBuilder, QueryBuilder } from './interfaces/query-builder';
import type {
    AggregateBuilder,
    Describe,
    ExtractIncludable,
    HavingBuilder,
    IncludableKeys,
    Included,
    Resolver,
} from './interfaces/utility-types';
import { QueryableAggregate } from './queryable-aggregate';
import { QueryableHaving } from './queryable-having';

/**
 * Builds a declarative query and executes it through a supplied resolver.
 * @template T - Entity or value shape represented by this declaration.
 * @template TRoot - Root entity shape available to nested queries.
 * @template TResult - Result shape returned by the operation.
 * @template Paginated - Whether the query requests paginated results.
 */
export class Queryable<T, TRoot = T, TResult = T, Paginated = false> implements QueryBuilder<
    T,
    TRoot,
    TResult,
    Paginated
> {
    /**
     * Creates a query builder with an optional execution resolver.
     * @param {Resolver<T> | undefined} resolver - {@link Resolver} used to load metadata or execute the query.
     * @param {Query<T>} _query - Mutable {@link Query} shared by chained builders.
     * @throws {@link Error} — If the supplied query is null.
     */
    public constructor(
        private resolver: Resolver<T> | undefined,
        public readonly _query: Query<T> = {},
    ) {
        if (!_query) {
            throw new Error("'_query' cannot be null.");
        }
    }

    /**
     * Includes a related entity or collection, optionally shaping its query.
     * @template K - Selected property key.
     * @param {K} k - Relationship property to include.
     * @returns {Queryable<T, TRoot, Included<T, TResult, K>, Paginated>} {@link Queryable} with the included relationship in its result shape.
     */
    include<K extends IncludableKeys<T>>(
        k: K,
    ): Queryable<T, TRoot, Included<T, TResult, K>, Paginated>;
    /**
     * Includes a related entity or collection, optionally shaping its query.
     * @template K - Selected property key.
     * @template R - Result shape produced by the builder.
     * @param {K} k - Relationship property to include.
     * @param {IncludeBuilder<T, TRoot, K, R>} b - {@link IncludeBuilder} that configures the included relationship query.
     * @returns {Queryable<T, TRoot, Included<T, TResult, K, R>, Paginated>} {@link Queryable} with the included relationship in its result shape.
     */
    include<K extends IncludableKeys<T>, R>(
        k: K,
        b: IncludeBuilder<T, TRoot, K, R>,
    ): Queryable<T, TRoot, Included<T, TResult, K, R>, Paginated>;
    /**
     * Includes a related entity or collection, optionally shaping its query.
     * @template K - Selected property key.
     * @template R - Result shape produced by the builder.
     * @param {K} k - Relationship property to include.
     * @param {IncludeBuilder<T, TRoot, K, R>} b - {@link IncludeBuilder} that configures the included relationship query.
     * @returns {Queryable<T, TRoot, Included<T, TResult, K, R>, Paginated>} {@link Queryable} with the included relationship in its result shape.
     */
    include<K extends IncludableKeys<T>, R>(
        k: K,
        b?: IncludeBuilder<T, TRoot, K, R>,
    ): Queryable<T, TRoot, Included<T, TResult, K, R>, Paginated> {
        let includeKeyQuery: Query<ExtractIncludable<T, K>> | undefined = undefined;
        if (b) {
            includeKeyQuery = {};
            b(new Queryable<ExtractIncludable<T, K>, TRoot>(undefined, includeKeyQuery));
        }

        this._query.$include = this._query.$include || {};
        this._query.$include[k] = includeKeyQuery || true;

        return new Queryable<T, TRoot, Included<T, TResult, K, R>, Paginated>(
            this.resolver,
            this._query,
        );
    }

    /**
     * Adds a condition, combining it with existing conditions using AND.
     * @param {Readonly<Specification<T>>} specification - {@link Specification} to add.
     * @returns {Queryable<T, TRoot, TResult, Paginated>} {@link Queryable} with the additional filter.
     */
    where(specification: Readonly<Specification<T>>): Queryable<T, TRoot, TResult, Paginated>;
    /**
     * Adds a condition, combining it with existing conditions using AND.
     * @param {(builder: SpecificationBuilder<T>) => Readonly<Specification<T>>} build - Builds a {@link Specification} with {@link SpecificationBuilder}.
     * @returns {Queryable<T, TRoot, TResult, Paginated>} {@link Queryable} with the additional filter.
     */
    where(
        build: (builder: SpecificationBuilder<T>) => Readonly<Specification<T>>,
    ): Queryable<T, TRoot, TResult, Paginated>;
    /**
     * Adds a condition, combining it with existing conditions using AND.
     * @param {Readonly<Specification<T>> | ((builder: SpecificationBuilder<T>) => Readonly<Specification<T>>)} condition - A {@link Specification}, or a callback that builds one with {@link SpecificationBuilder}.
     * @returns {Queryable<T, TRoot, TResult, Paginated>} {@link Queryable} with the additional filter.
     */
    where(
        condition:
            | Readonly<Specification<T>>
            | ((builder: SpecificationBuilder<T>) => Readonly<Specification<T>>),
    ): Queryable<T, TRoot, TResult, Paginated> {
        const specification =
            typeof condition === 'function' ? condition(new SpecificationBuilder<T>()) : condition;
        this._query.$where = this._query.$where
            ? { kind: 'and', conditions: [this._query.$where, specification.expression] }
            : specification.expression;
        return new Queryable<T, TRoot, TResult, Paginated>(this.resolver, this._query);
    }

    /**
     * Adds conditions on aggregate values.
     * @param {(builder: HavingBuilder<T>) => void} func - Callback that configures aggregate conditions through {@link HavingBuilder}.
     * @returns {Queryable<T, TRoot, TResult, Paginated>} {@link Queryable} with the aggregate conditions.
     */
    having(func: (builder: HavingBuilder<T>) => void): Queryable<T, TRoot, TResult, Paginated> {
        this._query.$having = this._query.$having || [];
        func(new QueryableHaving(this._query.$having));

        return new Queryable<T, TRoot, TResult, Paginated>(this.resolver, this._query);
    }

    /**
     * Adds aggregate projections and updates the result shape.
     * @template Agg - Aggregate result shape.
     * @param {(builder: AggregateBuilder<T>) => AggregateBuilder<T, Agg>} func - Callback that configures projections through {@link AggregateBuilder}.
     * @returns {Queryable<T, TRoot, Agg, Paginated>} {@link Queryable} with the aggregate result shape.
     */
    aggregate<Agg>(
        func: (builder: AggregateBuilder<T>) => AggregateBuilder<T, Agg>,
    ): Queryable<T, TRoot, Agg, Paginated> {
        this._query.$aggregate = this._query.$aggregate || {};
        func(new QueryableAggregate(this._query.$aggregate));

        return new Queryable<T, TRoot, Agg, Paginated>(this.resolver, this._query);
    }

    /**
     * Selects the properties returned by the query.
     * @template K - Selected property key.
     * @param {K[]} keys - Property keys to include in the result.
     * @returns {Queryable<T, TRoot, Pick<TResult, K>, Paginated>} {@link Queryable} with the selected result properties.
     */
    select<K extends keyof TResult>(
        ...keys: K[]
    ): Queryable<T, TRoot, Pick<TResult, K>, Paginated> {
        this._query.$select = this._query.$select || [];
        this._query.$select.push(...keys.map(String));

        return new Queryable<T, TRoot, Pick<TResult, K>, Paginated>(this.resolver, this._query);
    }

    /**
     * Sets the result offset and page size.
     * @param {number} skip - Number of matching results to skip.
     * @param {number} take - Maximum number of results in the page.
     * @returns {Queryable<T, TRoot, TResult, true>} {@link Queryable} configured for pagination.
     */
    paginate(skip: number, take: number): Queryable<T, TRoot, TResult, true> {
        this._query.$skip = skip;
        this._query.$take = take;

        return new Queryable<T, TRoot, TResult, true>(this.resolver, this._query);
    }

    /**
     * Marks the query for recursive relationship inclusion.
     * @returns {this} This {@link Queryable} with recursive inclusion enabled.
     */
    recursive(): this {
        this._query.$recursive = true;
        return this;
    }

    private resolve<R>(query: Query<T>): Promise<R> {
        if (!this.resolver) throw new Error('Query execution requires a resolver.');
        return this.resolver(query) as Promise<R>;
    }

    /**
     * Executes the query for its first result.
     * @returns {Promise<Describe<TResult>>} Promise resolving to the {@link Describe}.
     */
    first(): Promise<Describe<TResult>> {
        return this.resolve<Describe<TResult>>({ ...this._query, $first: true });
    }

    /**
     * Executes the query for all selected results.
     * @returns {Promise<Describe<TResult>[]>} Promise resolving to the {@link Describe}.
     */
    toArray(): Promise<Describe<TResult>[]> {
        const query = { ...this._query };
        delete query.$first;
        return this.resolve<Describe<TResult>[]>(query);
    }
}
