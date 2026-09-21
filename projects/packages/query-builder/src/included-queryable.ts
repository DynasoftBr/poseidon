import type { Query } from './interfaces/query';
import { Queryable } from './queryable';

export class IncludedQueryable<T, TRoot = T, TResult = T, Paginated = false> extends Queryable<
    T,
    TRoot,
    TResult,
    Paginated
> {
    constructor(query: Query<T> = {}) {
        super(undefined, query);
    }
}
