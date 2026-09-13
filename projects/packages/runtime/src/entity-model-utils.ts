import type { EntityCommand, EntityProjection, EntityProperty } from '@poseidon/model';
import { ValidationError } from './poseidon-error';

export function toProperty(projection: EntityProjection | null, id: string): EntityProperty {
    if (!projection || projection.entityTypeId !== 'entity-property') {
        throw new ValidationError([
            { property: 'properties', message: `Property '${id}' was not found.` },
        ]);
    }

    return {
        id: projection.id,
        createdAt: projection.createdAt,
        createdById: projection.createdById,
        ...projection.data,
    } as EntityProperty;
}

export function getCommands(projection: EntityProjection): EntityCommand[] | undefined {
    return Array.isArray(projection.data.commands)
        ? (projection.data.commands as EntityCommand[])
        : undefined;
}
