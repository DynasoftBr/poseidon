import { IndexedPropertyFilter } from "../indexed-property-filter";
import { PropertyFilter } from "../property-filter";
import { IQueryBuilder } from "../iquery-builder";
import { IPropertyFilter } from "../iproperty-filter";
import { IntersectionProxyHandler } from "./intersection-proxy-handler";

export class IndexedPropertyFilterProxyHandler<T>
    implements ProxyHandler<IndexedPropertyFilter<T>> {

    private inst: IndexedPropertyFilter<T>;

    constructor(private query: IQueryBuilder<T>) { }

    get(target: IndexedPropertyFilter<T>, name: string) {
        const inst = new PropertyFilter<T>(name, this.query);
        const handler = new IntersectionProxyHandler();

        return new Proxy<IPropertyFilter<T> & IndexedPropertyFilter<T>>(inst as any, handler);
    }
}