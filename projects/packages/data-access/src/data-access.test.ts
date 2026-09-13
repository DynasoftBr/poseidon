import type { EntityEvent } from '@poseidon/model';
import { MongoClient } from 'mongodb';
import { connectDatabase, disconnectDatabase } from './database';
import { MongoEventProjectionStore } from './mongo-event-projection-store';
import { MongoIndexManager } from './mongo-index-manager';

vi.mock('mongodb', () => ({
    MongoClient: vi.fn(
        class {
            public connect = vi.fn().mockResolvedValue(undefined);
            public close = vi.fn().mockResolvedValue(undefined);
        },
    ),
}));

describe('database lifecycle', () => {
    it('should connect and close the selected client', async () => {
        const client = await connectDatabase('mongodb://example.test/poseidon');
        await disconnectDatabase(client);

        expect(MongoClient).toHaveBeenCalledWith('mongodb://example.test/poseidon');
        expect(client.connect).toHaveBeenCalledOnce();
        expect(client.close).toHaveBeenCalledOnce();
    });

    it('should keep database clients independent', async () => {
        const first = await connectDatabase('mongodb://example.test/first');
        const second = await connectDatabase('mongodb://example.test/second');
        await disconnectDatabase(first);

        expect(first).not.toBe(second);
        expect(second.close).not.toHaveBeenCalled();
        await disconnectDatabase(second);
    });
});

describe('MongoEventProjectionStore', () => {
    it('should read projections and construct filtered queries', async () => {
        const fake = createClient();
        const store = new MongoEventProjectionStore(fake.client);
        const document = projectionDocument('ada', 'person', { name: 'Ada' });
        fake.entities.findOne.mockResolvedValueOnce(null).mockResolvedValue(document);
        fake.entities.find.mockReturnValue(cursor([document]));

        await expect(store.isInitialized()).resolves.toBe(false);
        await expect(store.hasEntity('ada')).resolves.toBe(true);
        await expect(store.findProjection('ada')).resolves.toMatchObject({
            id: 'ada',
            data: { name: 'Ada' },
        });
        fake.entities.findOne.mockResolvedValueOnce(null);
        await expect(store.findProjection('missing')).resolves.toBeNull();
        await expect(
            store.findByEntityType(
                {
                    entityTypeId: 'person',
                    filter: {
                        kind: 'and',
                        conditions: [
                            {
                                kind: 'comparison',
                                operator: 'equals',
                                propertyId: 'person:name',
                                value: 'Ada',
                            },
                            {
                                kind: 'comparison',
                                operator: 'contains',
                                propertyId: 'person:tags',
                                value: 'math',
                            },
                        ],
                    },
                    offset: 2,
                    limit: 5,
                },
                new Map([
                    ['person:name', 'name'],
                    ['person:tags', 'tags'],
                ]),
            ),
        ).resolves.toHaveLength(1);
        await expect(
            store.findByEntityType(
                {
                    entityTypeId: 'person',
                    filter: {
                        kind: 'comparison',
                        operator: 'equals',
                        propertyId: '$unsafe',
                        value: true,
                    },
                },
                new Map(),
            ),
        ).rejects.toThrow("Invalid specification property '$unsafe'.");

        expect(fake.entities.find).toHaveBeenCalledWith(
            expect.objectContaining({ entityTypeId: 'person', deletedAt: { $exists: false } }),
        );
    });

    it('should commit created, updated, and deleted projections in one transaction', async () => {
        const fake = createClient();
        fake.entities.insertOne.mockResolvedValue({});
        fake.entities.updateOne.mockResolvedValue({ matchedCount: 1 });
        const store = new MongoEventProjectionStore(fake.client);

        await store.commit([createdEvent(), updatedEvent(), deletedEvent()]);

        expect(fake.session.withTransaction).toHaveBeenCalledOnce();
        expect(fake.events.bulkWrite).toHaveBeenCalledOnce();
        expect(fake.entities.insertOne).toHaveBeenCalledOnce();
        expect(fake.entities.updateOne).toHaveBeenCalledTimes(2);
        expect(fake.session.endSession).toHaveBeenCalledOnce();
    });

    it('should surface a projection version conflict', async () => {
        const fake = createClient();
        fake.entities.updateOne.mockResolvedValue({ matchedCount: 0 });

        await expect(
            new MongoEventProjectionStore(fake.client).commit([updatedEvent()]),
        ).rejects.toMatchObject({ code: 'entity-version-conflict' });
    });

    it('should reject a concurrent create without writing a projection', async () => {
        const fake = createClient();
        fake.entities.insertOne.mockRejectedValue({ code: 11000 });

        await expect(
            new MongoEventProjectionStore(fake.client).commit([createdEvent()]),
        ).rejects.toMatchObject({ code: 'entity-already-exists' });
    });

    it('should retain unexpected projection write failures', async () => {
        const fake = createClient();
        fake.entities.insertOne.mockRejectedValue(new Error('Database unavailable.'));

        await expect(
            new MongoEventProjectionStore(fake.client).commit([createdEvent()]),
        ).rejects.toThrow('Database unavailable.');
    });
});

describe('MongoIndexManager', () => {
    it('should reconcile index entities into MongoDB indexes', async () => {
        const fake = createClient();
        fake.entities.find
            .mockReturnValueOnce(
                cursor([
                    projectionDocument('person-name', 'index', {
                        entityTypeId: 'person',
                        name: 'person-name',
                        propertyIds: ['person:name'],
                        unique: true,
                    }),
                ]),
            )
            .mockReturnValueOnce(
                cursor([projectionDocument('person:name', 'entity-property', { name: 'name' })]),
            );

        await new MongoIndexManager(fake.client).reconcile();

        expect(fake.entities.createIndex).toHaveBeenCalledWith(
            { entityTypeId: 1, 'data.name': 1 },
            expect.objectContaining({ name: 'poseidon__person-name', unique: true }),
        );
    });

    it('should reject invalid or incomplete index definitions', async () => {
        const fake = createClient();
        fake.entities.find.mockReturnValue(cursor([]));
        const manager = new MongoIndexManager(fake.client);

        await expect(manager.apply({})).rejects.toThrow('Index entity has an invalid definition.');
        await expect(
            manager.apply({
                entityTypeId: 'person',
                name: 'person-name',
                propertyIds: ['person:name'],
            }),
        ).rejects.toThrow("Index 'person-name' references a missing property.");
    });
});

function createClient() {
    const events = { bulkWrite: vi.fn() };
    const entities = {
        findOne: vi.fn(),
        find: vi.fn(),
        updateOne: vi.fn(),
        insertOne: vi.fn(),
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

function cursor<T>(documents: T[]) {
    return {
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue(documents),
    };
}

function projectionDocument(id: string, entityTypeId: string, data: Record<string, unknown>) {
    return {
        _id: id,
        entityTypeId,
        data,
        version: 1,
        createdAt: new Date(),
        createdById: 'system',
    };
}

function createdEvent(): EntityEvent {
    return event('entity-created');
}

function updatedEvent(): EntityEvent {
    return { ...event('entity-updated'), expectedVersion: 1 };
}

function deletedEvent(): EntityEvent {
    return { ...event('entity-deleted'), expectedVersion: 2 };
}

function event(type: EntityEvent['type']): EntityEvent {
    return {
        id: `${type}:person:ada`,
        type,
        entityTypeId: 'person',
        entityId: 'ada',
        data: { name: 'Ada' },
        actorId: 'system',
        occurredAt: new Date(),
    };
}
