import type { EntityId, IndexDefinition } from '@poseidon/models';
import { systemFields, type BootstrapContext } from './system-fields';

export function createCoreIndexes(context: BootstrapContext): IndexDefinition[] {
    return [
        createIndex('entity-type-name', 'entity-type', ['entity-type:name'], context),
        createIndex('user-login', 'user', ['user:login'], context),
    ];
}

function createIndex(
    name: string,
    entityTypeId: EntityId,
    propertyIds: EntityId[],
    context: BootstrapContext,
): IndexDefinition {
    return {
        ...systemFields(name, 'index', context),
        entityTypeId,
        name,
        propertyIds,
        unique: true,
    };
}
