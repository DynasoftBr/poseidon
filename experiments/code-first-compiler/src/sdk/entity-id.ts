declare const entityIdBrand: unique symbol;

export type EntityId = string & { readonly [entityIdBrand]: true };
