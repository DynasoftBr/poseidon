import { IQueryBuilder } from "./iquery-builder";
import { IndexedPropertyFilter } from "./indexed-property-filter";
import { IndexedPropertyFilterProxyHandler } from "./proxies/indexed-property-filter-proxy-handler";

export class QueryBuilder<T> implements IQueryBuilder<T> {

    public query: any = {};
    private booleanOp: any = null;

    public get where(): IndexedPropertyFilter<T> {
        const handler = new IndexedPropertyFilterProxyHandler<T>(this);
        return new Proxy<IndexedPropertyFilter<T>>({} as IndexedPropertyFilter<T>, handler);
    }

    private constructor(
        public entityType: string,
        query?: any,
        op: "$and" | "$or" = "$or") {

        if (query) {
            this.booleanOp = {};
            this.booleanOp[op] = [query, this.query];
        }
    }

    public or(query: IQueryBuilder<T>): IQueryBuilder<T> {
        return new QueryBuilder(this.entityType, query.query, "$or");
    }

    public and(query: IQueryBuilder<T>): IQueryBuilder<T> {
        return new QueryBuilder(this.entityType, query.query, "$and");
    }

    public static create<T>(entityType: string): IQueryBuilder<T> {
        return new QueryBuilder<T>(entityType);
    }

    private build(): any {
        if (this.booleanOp)
            return this.booleanOp;
        return this.query;
    }
}

