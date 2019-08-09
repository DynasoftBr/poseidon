import { IndexedPropertyFilter } from "./indexed-property-filter";

export interface IQueryBuilder<T> {
    entityType: string;
    query: any;
    or(query: IQueryBuilder<T>): IQueryBuilder<T>;
    and(query: IQueryBuilder<T>): IQueryBuilder<T>;
    readonly where: IndexedPropertyFilter<T>;
}
