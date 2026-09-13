import type { EntityProjection, QueryEntitiesCommand } from '@poseidon/model';
import { EntityTypeNotFoundError, ValidationError } from './poseidon-error';

export interface EntityQueryStore {
    findProjection(id: string): Promise<EntityProjection | null>;
    findByEntityType(command: QueryEntitiesCommand): Promise<EntityProjection[]>;
}

/** Queries projections using a small, declarative filter language. */
export class EntityQueryService {
    public constructor(private readonly store: EntityQueryStore) {}

    public async list(command: QueryEntitiesCommand): Promise<EntityProjection[]> {
        const entityType = await this.store.findProjection(command.entityTypeId);

        if (!entityType || entityType.entityTypeId !== 'entity-type') {
            throw new EntityTypeNotFoundError(command.entityTypeId);
        }
        if (
            command.limit !== undefined &&
            (!Number.isInteger(command.limit) || command.limit < 1)
        ) {
            throw new ValidationError([
                { property: 'limit', message: 'Limit must be a positive integer.' },
            ]);
        }
        if (
            command.offset !== undefined &&
            (!Number.isInteger(command.offset) || command.offset < 0)
        ) {
            throw new ValidationError([
                { property: 'offset', message: 'Offset must be a non-negative integer.' },
            ]);
        }

        return this.store.findByEntityType(command);
    }
}
