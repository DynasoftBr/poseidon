import type { MongoClient } from 'mongodb';

export function createClient() {
    const collection = createCollection;
    const entities = collection();
    const entityTypes = collection();
    const collections = new Map([
        ['person', entities],
        ['entity-type', entityTypes],
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
        session,
        database,
    };
}

function createCollection() {
    return {
        findOne: vi.fn(),
        insertOne: vi.fn(),
        replaceOne: vi.fn(),
        deleteOne: vi.fn(),
    };
}

export function entityDocument(id: string, data: Record<string, unknown>) {
    return {
        ...data,
        _id: id,
    };
}
