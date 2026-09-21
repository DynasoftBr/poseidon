import type { Specification, SpecificationBuilder } from '@poseidon/utilities';
import type {
    AggregateBuilder,
    ExtractIncludable,
    HavingBuilder,
    IncludableKeys,
    Included,
} from './utility-types';

export type IncludeBuilder<T, TRoot, K extends IncludableKeys<T>, TResult> = (
    builder: QueryBuilder<ExtractIncludable<T, K>, TRoot>,
) => QueryBuilder<ExtractIncludable<T, K>, TRoot, TResult>;

export interface QueryBuilder<T, TRoot = T, TResult = T, Paginated = false> {
    include<K extends IncludableKeys<T>>(
        key: K,
    ): QueryBuilder<T, TRoot, Included<T, TResult, K>, Paginated>;
    include<K extends IncludableKeys<T>, R>(
        key: K,
        i: IncludeBuilder<T, TRoot, K, R>,
    ): QueryBuilder<T, TRoot, Included<T, TResult, K, R>, Paginated>;
    recursive(): QueryBuilder<T, TRoot, TResult, Paginated>;
    where(specification: Readonly<Specification<T>>): QueryBuilder<T, TRoot, TResult, Paginated>;
    where(
        build: (builder: SpecificationBuilder<T>) => Readonly<Specification<T>>,
    ): QueryBuilder<T, TRoot, TResult, Paginated>;
    having(func: (builder: HavingBuilder<T>) => void): QueryBuilder<T, TRoot, TResult, Paginated>;
    aggregate<Agg>(
        func: (builder: AggregateBuilder<T>) => AggregateBuilder<T, Agg>,
    ): QueryBuilder<T, TRoot, Agg, Paginated>;
    select<K extends keyof TResult>(
        ...keys: K[]
    ): QueryBuilder<T, TRoot, Pick<TResult, K>, Paginated>;
    paginate(skip: number, take: number): QueryBuilder<T, TRoot, TResult, true>;
}
