declare const referenceTarget: unique symbol;

export interface EntityReference<T extends { _id: string }> {
    _id: T['_id'];
    readonly [referenceTarget]?: (entity: T) => T;
}

export type EntityReferenceTarget<R> = typeof referenceTarget extends keyof R
    ? R extends EntityReference<infer T>
        ? T
        : never
    : never;
