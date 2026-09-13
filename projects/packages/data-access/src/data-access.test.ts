import type { EntityEvent } from '@poseidon/model';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from './database';
import { MongoEventProjectionStore } from './mongo-event-projection-store';
import { MongoIndexManager } from './mongo-index-manager';

vi.mock('mongoose', () => ({
    default: {
        connect: vi.fn(),
        disconnect: vi.fn(),
        connection: { name: 'default-connection' },
    },
}));

describe('database lifecycle', () => {
    it('should connect and disconnect through Mongoose', async () => {
        await expect(connectDatabase('mongodb://example.test/poseidon')).resolves.toBe(
            mongoose.connection,
        );
        await disconnectDatabase();

        expect(mongoose.connect).toHaveBeenCalledWith('mongodb://example.test/poseidon');
        expect(mongoose.disconnect).toHaveBeenCalledOnce();
    });
});

describe('MongoEventProjectionStore', () => {
    it('should read projections and construct filtered queries', async () => {
        const fake = createConnection();
        const store = new MongoEventProjectionStore(fake.connection);
        const document = projectionDocument('ada', 'person', { name: 'Ada' });
        fake.entities.findOne.mockResolvedValueOnce(null).mockResolvedValue(document);
        fake.entities.find.mockReturnValue(cursor([document]));

        await expect(store.isInitialized()).resolves.toBe(false);
        await expect(store.hasEntity('ada')).resolves.toBe(true);
        await expect(store.findProjection('ada')).resolves.toMatchObject({
            id: 'ada',
            data: { name: 'Ada' },
        });
        await expect(
            store.findByEntityType({
                entityTypeId: 'person',
                filter: {
                    operator: 'and',
                    filters: [
                        { operator: 'equals', property: 'name', value: 'Ada' },
                        { operator: 'contains', property: 'tags', value: 'math' },
                    ],
                },
                offset: 2,
                limit: 5,
            }),
        ).resolves.toHaveLength(1);
        await expect(
            store.findByEntityType({
                entityTypeId: 'person',
                filter: { operator: 'equals', property: '$unsafe', value: true },
            }),
        ).rejects.toThrow("Invalid query property '$unsafe'.");

        expect(fake.entities.find).toHaveBeenCalledWith(
            expect.objectContaining({ entityTypeId: 'person', deletedAt: { $exists: false } }),
        );
    });

    it('should commit created, updated, and deleted projections in one transaction', async () => {
        const fake = createConnection();
        fake.entities.updateOne.mockResolvedValue({ matchedCount: 1 });
        const store = new MongoEventProjectionStore(fake.connection);

        await store.commit([createdEvent(), updatedEvent(), deletedEvent()]);

        expect(fake.session.withTransaction).toHaveBeenCalledOnce();
        expect(fake.events.bulkWrite).toHaveBeenCalledOnce();
        expect(fake.entities.updateOne).toHaveBeenCalledTimes(3);
        expect(fake.session.endSession).toHaveBeenCalledOnce();
    });

    it('should surface a projection version conflict', async () => {
        const fake = createConnection();
        fake.entities.updateOne.mockResolvedValue({ matchedCount: 0 });

        await expect(
            new MongoEventProjectionStore(fake.connection).commit([updatedEvent()]),
        ).rejects.toMatchObject({ code: 'entity-version-conflict' });
    });
});

describe('MongoIndexManager', () => {
    it('should reconcile index entities into MongoDB indexes', async () => {
        const fake = createConnection();
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

        await new MongoIndexManager(fake.connection).reconcile();

        expect(fake.entities.createIndex).toHaveBeenCalledWith(
            { entityTypeId: 1, 'data.name': 1 },
            expect.objectContaining({ name: 'poseidon__person-name', unique: true }),
        );
    });

    it('should reject invalid or incomplete index definitions', async () => {
        const fake = createConnection();
        fake.entities.find.mockReturnValue(cursor([]));
        const manager = new MongoIndexManager(fake.connection);

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

function createConnection() {
    const events = { bulkWrite: vi.fn() };
    const entities = {
        findOne: vi.fn(),
        find: vi.fn(),
        updateOne: vi.fn(),
        createIndex: vi.fn(),
    };
    const session = {
        withTransaction: vi.fn((callback: () => Promise<void>) => callback()),
        endSession: vi.fn(),
    };
    const connection = {
        collection: vi.fn((name: string) => (name === 'events' ? events : entities)),
        startSession: vi.fn().mockResolvedValue(session),
    };

    return { connection: connection as never, entities, events, session };
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
