import type { APIAction, EntityData } from '@poseidon/models';
import type { DataStorage } from '@poseidon/data-access';

export type SystemActionHandler = (
    payload: EntityData,
    storage: DataStorage,
    actorId: string,
) => EntityData | Promise<EntityData>;

export type SystemActionDefinition = Extract<APIAction, { operation: 'script' }> & {
    code: SystemActionHandler;
};
