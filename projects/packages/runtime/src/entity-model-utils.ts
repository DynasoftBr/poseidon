import type { EntityCommand, Entity, EntityProperty } from '@poseidon/models';
import { ValidationError } from './poseidon-error';

export function toProperty(projection: Entity | null, id: string): EntityProperty {
    if (!projection || projection._entityTypeId !== 'entity-property') {
        throw new ValidationError([
            { property: 'properties', message: `Property '${id}' was not found.` },
        ]);
    }

    return projection as EntityProperty;
}

export function getCommands(projection: Entity): EntityCommand[] | undefined {
    return Array.isArray(projection.commands)
        ? (projection.commands as EntityCommand[])
        : undefined;
}
