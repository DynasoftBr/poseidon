import type { EntityId } from './entity-id.js';

export abstract class Entity {
    _id!: EntityId;
    createdAt!: Date;
    updatedAt!: Date;
    version!: number;
}
