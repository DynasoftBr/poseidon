import { IPropertyFilter } from "./iproperty-filter";

export type IndexedPropertyFilter<T, TKey = T> = {
    [key in keyof TKey]: IPropertyFilter<T> & IndexedPropertyFilter<T, TKey[key]>;
};