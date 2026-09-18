import type { APIAction, Entity, EntityProperty } from '@poseidon/models';
import { ValidationError } from './poseidon-error';

export function toProperty(projection: unknown, id: string): EntityProperty {
    if (
        !projection ||
        typeof projection !== 'object' ||
        !('name' in projection) ||
        !('type' in projection)
    ) {
        throw new ValidationError([
            { property: 'properties', message: `Property '${id}' was not found.` },
        ]);
    }

    return projection as EntityProperty;
}

export function getActions(projection: Entity): APIAction[] | undefined {
    return Array.isArray(projection.actions) ? (projection.actions as APIAction[]) : undefined;
}

export function getProperties(entityType: Entity): EntityProperty[] {
    if (!Array.isArray(entityType.properties)) {
        throw new ValidationError([
            { property: 'properties', message: 'Entity type has an invalid property definition.' },
        ]);
    }
    return entityType.properties.map((property: EntityProperty) =>
        toProperty(property, property?._id),
    );
}

export function requireConcreteEntityType(entityType: Entity): void {
    if (entityType.structure === true) {
        throw new ValidationError([
            {
                property: 'structure',
                message: `Structure '${String(entityType.name)}' cannot be persisted independently.`,
            },
        ]);
    }
}
