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

export class Queryable<T, TRoot = T, TResult = T, Paginated = false> implements QueryBuilder<
    T,
    TRoot,
    TResult,
    Paginated
> {
    public constructor(
        private resolver: Resolver<T> | undefined,
        public readonly _query: Query<T> = {},
    ) {
        if (!_query) {
            throw new Error("'_query' cannot be null.");
        }
    }

    include<K extends IncludableKeys<T>>(
        k: K,
    ): Queryable<T, TRoot, Included<T, TResult, K>, Paginated>;
    include<K extends IncludableKeys<T>, R>(
        k: K,
        b: IncludeBuilder<T, TRoot, K, R>,
    ): Queryable<T, TRoot, Included<T, TResult, K, R>, Paginated>;
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

    where(specification: Readonly<Specification<T>>): Queryable<T, TRoot, TResult, Paginated>;
    where(
        build: (builder: SpecificationBuilder<T>) => Readonly<Specification<T>>,
    ): Queryable<T, TRoot, TResult, Paginated>;
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

    having(func: (builder: HavingBuilder<T>) => void): Queryable<T, TRoot, TResult, Paginated> {
        this._query.$having = this._query.$having || [];
        func(new QueryableHaving(this._query.$having));

        return new Queryable<T, TRoot, TResult, Paginated>(this.resolver, this._query);
    }

    aggregate<Agg>(
        func: (builder: AggregateBuilder<T>) => AggregateBuilder<T, Agg>,
    ): Queryable<T, TRoot, Agg, Paginated> {
        this._query.$aggregate = this._query.$aggregate || {};
        func(new QueryableAggregate(this._query.$aggregate));

        return new Queryable<T, TRoot, Agg, Paginated>(this.resolver, this._query);
    }

    select<K extends keyof TResult>(
        ...keys: K[]
    ): Queryable<T, TRoot, Pick<TResult, K>, Paginated> {
        this._query.$select = this._query.$select || [];
        this._query.$select.push(...keys.map(String));

        return new Queryable<T, TRoot, Pick<TResult, K>, Paginated>(this.resolver, this._query);
    }

    paginate(skip: number, take: number): Queryable<T, TRoot, TResult, true> {
        this._query.$skip = skip;
        this._query.$take = take;

        return new Queryable<T, TRoot, TResult, true>(this.resolver, this._query);
    }

    recursive(): this {
        this._query.$recursive = true;
        return this;
    }

    private resolve<R>(query: Query<T>): Promise<R> {
        if (!this.resolver) throw new Error('Query execution requires a resolver.');
        return this.resolver(query) as Promise<R>;
    }

    first(): Promise<Describe<TResult>> {
        return this.resolve<Describe<TResult>>({ ...this._query, $first: true });
    }

    toArray(): Promise<Describe<TResult>[]> {
        const query = { ...this._query };
        delete query.$first;
        return this.resolve<Describe<TResult>[]>(query);
    }
}
