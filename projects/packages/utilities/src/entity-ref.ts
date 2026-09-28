export declare const entityRefTarget: unique symbol;

/** A typed reference to a persisted entity. */
export interface EntityRef<T extends { _id: string }> {
    _id: T['_id'];
    readonly [entityRefTarget]?: (entity: T) => T;
}
