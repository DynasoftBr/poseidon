import { IQueryBuilder } from "./iquery-builder";

export interface IPropertyFilter<T> {
    equals(value: any): IQueryBuilder<T>;
    contains(value: any): IQueryBuilder<T>;
    regExMatch(regEx: string): IQueryBuilder<T>;
    in(array: any[]): IQueryBuilder<T>;
    between(first: number | Date, last: number | Date): IQueryBuilder<T>;
    lowerThan(val: number | Date): IQueryBuilder<T>;
    greaterThan(val: number | Date): IQueryBuilder<T>;
    all(array: any[]): IQueryBuilder<T>;
    size(size: number): IQueryBuilder<T>;
    nested(name: string): IPropertyFilter<T>;
}