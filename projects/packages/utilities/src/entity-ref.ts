export declare const entityRefTarget: unique symbol;

/**
 * A typed reference to a persisted entity.
 * @template T - Entity or value shape represented by this declaration.
 */
export interface EntityRef<T extends { _id: string }> {
    /** Persistent identifier of the entity. */
    _id: T['_id'];
    /** Type-only marker preserving the referenced entity shape. */
    readonly [entityRefTarget]?: (entity: T) => T;
}
