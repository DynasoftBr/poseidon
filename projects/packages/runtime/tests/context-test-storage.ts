import type { Entity, EntityType } from '@poseidon/models';
import { defaultAction } from '../src/default-action';
import type { DataStorage } from '@poseidon/data-access';

export function entity(id: string, data: Record<string, unknown> = {}): Entity {
    return {
        _id: id,
        ...data,
    };
}

export function storage(
    collections: Record<string, Entity[]> = {},
): DataStorage & { commits: number } {
    const entities = collectionRecords(collections);
    let snapshot: Map<string, Entity> | undefined;
    let transactionDepth = 0;
    const result: DataStorage & { commits: number } = {
        commits: 0,
        get: vi.fn((entityTypeName: string, id: string) => {
            const record = entities.get(key(entityTypeName, id));
            return Promise.resolve(record ?? null);
        }),
        getEntityType: vi.fn((name: string) =>
            Promise.resolve(
                ([...entities.entries()].find(
                    ([id, record]) => id === key('entity-type', record._id) && record.name === name,
                )?.[1] as EntityType | undefined) ?? null,
            ),
        ),
        create: vi.fn((entityTypeName: string, record: Entity) => {
            if (entities.has(key(entityTypeName, record._id))) {
                return Promise.reject(new Error('Entity already exists.'));
            }
            entities.set(key(entityTypeName, record._id), record);
            return Promise.resolve();
        }),
        update: vi.fn((entityTypeName: string, record: Entity) => {
            entities.set(key(entityTypeName, record._id), record);
            return Promise.resolve();
        }),
        delete: vi.fn((entityTypeName: string, id: string) => {
            entities.delete(key(entityTypeName, id));
            return Promise.resolve();
        }),
        beginTransaction: () => {
            if (transactionDepth === 0) snapshot = new Map(entities);
            transactionDepth += 1;
            return Promise.resolve();
        },
        commitTransaction: () => {
            transactionDepth -= 1;
            if (transactionDepth > 0) return Promise.resolve();
            result.commits += 1;
            snapshot = undefined;
            return Promise.resolve();
        },
        abortTransaction: () => {
            if (snapshot) {
                entities.clear();
                for (const [id, record] of snapshot) entities.set(id, record);
                snapshot = undefined;
            }
            transactionDepth = 0;
            return Promise.resolve();
        },
    };
    return result;
}

export async function getEntityType(data: DataStorage, name: string): Promise<EntityType> {
    return (await data.get('entity-type', name)) as EntityType;
}

export function entityType(name: string, data: Partial<EntityType> = {}): EntityType {
    return { ...entity(name), name, label: name, properties: [], ...data };
}

function key(name: string, id: string): string {
    return JSON.stringify([name, id]);
}

function collectionRecords(collections: Record<string, Entity[]>): Map<string, Entity> {
    return new Map(
        Object.entries(collections).flatMap(([name, records]) =>
            records.map((record) => [key(name, record._id), record] as const),
        ),
    );
}

export function entityTypeDefinition(): EntityType {
    return entityType('entity-type', {
        properties: [
            { _id: 'entity-type:name', name: 'name', type: 'string', required: true },
            { _id: 'entity-type:label', name: 'label', type: 'string', required: true },
            {
                _id: 'entity-type:properties',
                name: 'properties',
                type: 'array',
                itemsType: 'object',
            },
        ],
        actions: ['create', 'update'].map((name) => {
            const action = defaultAction(name)!;
            return {
                ...action,
                before: [
                    {
                        id: 'addMandatoryProperties',
                        name: 'addMandatoryProperties',
                        label: 'Add mandatory properties',
                        enabled: true,
                        before: [],
                    },
                    ...action.before,
                ],
            };
        }),
    });
}
