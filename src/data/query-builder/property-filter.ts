import { IQueryBuilder } from "./iquery-builder";
import { IPropertyFilter } from "./iproperty-filter";
export class PropertyFilter<T> implements IPropertyFilter<T> {
    constructor(protected prop: string, private readonly query: IQueryBuilder<T>) { }

    public equals(value: any): IQueryBuilder<T> {
        this.query.query[`${this.prop}`] = value;
        return this.query;
    }

    public contains(value: any): IQueryBuilder<T> {
        return this.regExMatch(`/^${value}$/i`);
    }

    public regExMatch(regEx: string): IQueryBuilder<T> {
        this.query.query[this.prop] = { $regex: regEx };
        return this.query;
    }

    public in(array: any[]): IQueryBuilder<T> {
        this.query.query[this.prop] = { $in: array };
        return this.query;
    }

    public between(first: number | Date, last: number | Date): IQueryBuilder<T> {
        this.query.query[this.prop] = { $gte: first, $lte: last };
        return this.query;
    }

    public lowerThan(val: number | Date): IQueryBuilder<T> {
        this.query.query[this.prop] = { $lt: val };
        return this.query;
    }

    public greaterThan(val: number | Date): IQueryBuilder<T> {
        this.query.query[this.prop] = { $gt: val };
        return this.query;
    }

    public all(array: any[]): IQueryBuilder<T> {
        this.query.query[this.prop] = { $all: array };
        return this.query;
    }

    public size(size: number): IQueryBuilder<T> {
        this.query.query[this.prop] = { $size: size };
        return this.query;
    }

    public nested(name: string): IPropertyFilter<T> {
        this.prop += `.${name}`;
        return this;
    }
}
