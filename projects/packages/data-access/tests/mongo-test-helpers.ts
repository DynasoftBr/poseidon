import type { MongoClient } from 'mongodb';

export function createClient() {
    const events = { bulkWrite: vi.fn() };
    const collection = () => ({
        findOne: vi.fn(),
        find: vi.fn(),
        updateOne: vi.fn(),
        insertOne: vi.fn(),
        replaceOne: vi.fn(),
        deleteOne: vi.fn(),
        createIndex: vi.fn(),
        drop: vi.fn(),
    });
    const entities = collection();
    const entityTypes = collection();
    const entityProperties = collection();
    const indexes = collection();
    const users = collection();
    const legacy = collection();
    const collections = new Map([
        ['person', entities],
        ['entity-type', entityTypes],
        ['entity-property', entityProperties],
        ['index', indexes],
        ['user', users],
        ['entities', legacy],
    ]);
    const session = {
        withTransaction: vi.fn((callback: () => Promise<void>) => callback()),
        endSession: vi.fn(),
    };
    const database = {
        collection: vi.fn((name: string) =>
            name === 'events' ? events : (collections.get(name) ?? collection()),
        ),
        listCollections: vi.fn(),
    };
    const client = {
        db: vi.fn().mockReturnValue(database),
        startSession: vi.fn().mockReturnValue(session),
    };

    return {
        client: client as unknown as MongoClient,
        entities,
        entityTypes,
        entityProperties,
        indexes,
        users,
        legacy,
        events,
        session,
        database,
    };
}

export function cursor<T>(documents: T[]) {
    return {
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue(documents),
        async *[Symbol.asyncIterator]() {
            for (const document of documents) yield document;
        },
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
