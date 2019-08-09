import { IPropertyFilter } from "../iproperty-filter";
import { IndexedPropertyFilter } from "../indexed-property-filter";

export class IntersectionProxyHandler<T = any>
    implements ProxyHandler<IPropertyFilter<T> & IndexedPropertyFilter<T>> {

    get(target: IPropertyFilter<T> & IndexedPropertyFilter<T>, name: string)
        : IPropertyFilter<T> & IndexedPropertyFilter<T> | any {

        const propValue = (target as any)[name];

        if (typeof propValue == "undefined") {
            target.nested(name);
            return new Proxy<IPropertyFilter<T> & IndexedPropertyFilter<T>>(target, this);
        } else if (typeof propValue == "function") {
            return function () {
                return (propValue as Function).apply(target, arguments);
            };
        } else {
            return propValue;
        }
    }
}