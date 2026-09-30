import type { Query } from './interfaces/query';
import { Queryable } from './queryable';

/**
 * Builds a query for an included relationship without an execution resolver.
 * @template T - Entity or value shape represented by this declaration.
 * @template TRoot - Root entity shape available to nested queries.
 * @template TResult - Result shape returned by the operation.
 * @template Paginated - Whether the query requests paginated results.
 * @extends {Queryable<T, TRoot, TResult, Paginated>}
 */
export class IncludedQueryable<T, TRoot = T, TResult = T, Paginated = false> extends Queryable<
    T,
    TRoot,
    TResult,
    Paginated
> {
    /**
     * Creates a builder for a nested relationship query.
     * @param {Query<T>} query - {@link Query} to build upon.
     * @throws {@link Error} — If the supplied query is null.
     */
    constructor(query: Query<T> = {}) {
        super(undefined, query);
    }
}
