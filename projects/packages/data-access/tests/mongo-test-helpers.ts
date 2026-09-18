import type { MongoClient } from 'mongodb';

export function createClient() {
    const collection = createCollection;
    const entities = collection();
    const entityTypes = collection();
    const indexes = collection();
    const users = collection();
    const collections = new Map([
        ['person', entities],
        ['entity-type', entityTypes],
        ['index', indexes],
        ['user', users],
    ]);
    let active = false;
    const session = {
        startTransaction: vi.fn(() => {
            active = true;
        }),
        commitTransaction: vi.fn(() => {
            active = false;
            return Promise.resolve();
        }),
        abortTransaction: vi.fn(() => {
            active = false;
            return Promise.resolve();
        }),
        inTransaction: vi.fn(() => active),
        endSession: vi.fn(),
    };
    const database = {
        collection: vi.fn((name: string) => collections.get(name) ?? collection()),
    };
    const client = {
        db: vi.fn().mockReturnValue(database),
        startSession: vi.fn().mockReturnValue(session),
    };

    return {
        client: client as unknown as MongoClient,
        entities,
        entityTypes,
        indexes,
        users,
        session,
        database,
    };
}

function createCollection() {
    return {
        findOne: vi.fn(),
        find: vi.fn(),
        insertOne: vi.fn(),
        replaceOne: vi.fn(),
        deleteOne: vi.fn(),
        createIndex: vi.fn(),
    };
}

export function cursor<T>(documents: T[]) {
    return {
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue(documents),
    };
}

export function entityDocument(id: string, entityTypeId: string, data: Record<string, unknown>) {
    return {
        ...data,
        _id: id,
        _entityTypeId: entityTypeId,
        _version: 1,
        _createdAt: new Date().toISOString(),
        _createdBy: 'system',
    };
}
