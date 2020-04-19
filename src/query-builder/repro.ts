export type KnownKeys<T, TType = any> = {
  [K in keyof T]: string extends K ? never : number extends K ? never : K;
} extends { [_ in keyof T]: infer U }
  ? U extends keyof T
    ? T[U] extends TType
      ? U extends string
        ? U
        : never
      : never
    : never
  : never;

export interface QueryBuilder2<T, TResult> {
  select<K extends KnownKeys<TResult>>(...keys: K[]): QueryBuilder2<T, Pick<TResult, K>>;
}

export class QueryableInclude2<T, TResult> implements QueryBuilder2<T, TResult> {

  select<K extends KnownKeys<TResult>>(...keys: K[]): QueryBuilder2<T, Pick<TResult, K>> {
    throw new Error("Method not implemented.");
  }
}
