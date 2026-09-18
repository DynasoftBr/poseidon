import type { BootstrapModel, EntityId, SystemUser } from '@poseidon/models';
import type { DataStorage } from '@poseidon/data-access';
import { DatabaseSeed } from './bootstrap/database-seed';
import { createCoreEntityTypes } from './bootstrap/system-entity-types';
import { systemFields } from './bootstrap/system-fields';
import { createCoreIndexes } from './bootstrap/system-indexes';
import { createCoreProperties } from './bootstrap/system-properties';
import { system } from './system';

export { DatabaseSeed };
export { createSystemProperties } from './bootstrap/system-properties';

export function createBootstrapModel(systemUserId: EntityId, now: Date): BootstrapModel {
    const context = { systemUserId, now };
    const users: SystemUser[] = [
        { ...systemFields(systemUserId, 'user', context), name: 'System', login: 'system' },
    ];
    const entityProperties = createCoreProperties(context);

    return {
        users,
        entityTypes: createCoreEntityTypes(context, entityProperties),
        entityProperties,
        indexes: createCoreIndexes(context),
        scripts: Object.values(system.entityTypes.entityType.actions).map((action) => ({
            ...systemFields(action.id, 'script', context),
            code: null,
        })),
    };
}

export function ensureBootstrapModel(
    storage: DataStorage,
    model: BootstrapModel,
): Promise<boolean> {
    return new DatabaseSeed(storage).apply(model);
}
