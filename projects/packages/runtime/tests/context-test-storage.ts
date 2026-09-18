import type { Entity } from '@poseidon/models';
import type { DataStorage } from '@poseidon/data-access';

export function entity(
    id: string,
    entityTypeId: string,
    data: Record<string, unknown> = {},
): Entity {
    return {
        _id: id,
        _entityTypeId: entityTypeId,
        _version: 1,
        _createdAt: '2026-09-16T00:00:00.000Z',
        _createdBy: 'system',
        ...data,
    };
}

export function storage(
    records: Entity[],
): DataStorage & { query: ReturnType<typeof vi.fn>; commits: number } {
    const entities = new Map(records.map((record) => [record._id, record]));
    let snapshot: Map<string, Entity> | undefined;
    let transactionDepth = 0;
    const result: DataStorage & { query: ReturnType<typeof vi.fn>; commits: number } = {
        commits: 0,
        get: vi.fn((entityTypeName: string, id: string) => {
            const record = entities.get(id);
            return Promise.resolve(record?._entityTypeId === entityTypeName ? record : null);
        }),
        query: vi.fn().mockResolvedValue([]),
        create: vi.fn((_entityTypeName: string, record: Entity) => {
            if (entities.has(record._id)) {
                return Promise.reject(new Error('Entity already exists.'));
            }
            entities.set(record._id, record);
            return Promise.resolve();
        }),
        update: vi.fn((_entityTypeName: string, record: Entity) => {
            entities.set(record._id, record);
            return Promise.resolve();
        }),
        delete: vi.fn((_entityTypeName: string, id: string) => {
            entities.delete(id);
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
