import type { Entity } from './entity.js';
import type { EntityId } from './entity-id.js';

declare const referenceTarget: unique symbol;

export interface EntityReference<T extends Entity> {
    _id: EntityId;
    readonly [referenceTarget]?: (entity: T) => T;
}

export type EntityReferenceKeys<T> = {
    [K in keyof T]-?: typeof referenceTarget extends keyof NonNullable<T[K]> ? K : never;
}[keyof T] & string;
