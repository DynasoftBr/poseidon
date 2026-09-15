import type { MongoClient } from 'mongodb';

export function createClient() {
    const events = { bulkWrite: vi.fn() };
    const entities = {
        findOne: vi.fn(),
        find: vi.fn(),
        updateOne: vi.fn(),
        insertOne: vi.fn(),
        replaceOne: vi.fn(),
        deleteOne: vi.fn(),
        createIndex: vi.fn(),
    };
    const session = {
        withTransaction: vi.fn((callback: () => Promise<void>) => callback()),
        endSession: vi.fn(),
    };
    const database = {
        collection: vi.fn((name: string) => (name === 'events' ? events : entities)),
    };
    const client = {
        db: vi.fn().mockReturnValue(database),
        startSession: vi.fn().mockReturnValue(session),
    };

    return { client: client as unknown as MongoClient, entities, events, session };
}

export function cursor<T>(documents: T[]) {
    return {
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue(documents),
    };
}

export function projectionDocument(
    id: string,
    entityTypeId: string,
    data: Record<string, unknown>,
) {
    return {
        ...data,
        _id: id,
        _entityTypeId: entityTypeId,
        _version: 1,
        _createdAt: new Date().toISOString(),
        _createdBy: 'system',
    };
}
