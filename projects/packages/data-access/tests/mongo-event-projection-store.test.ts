import type { EntityEvent } from '@poseidon/models';
import { MongoEventProjectionStore } from '../src/mongo-event-projection-store';
import { createClient, cursor, projectionDocument } from './mongo-test-helpers';

describe('MongoEventProjectionStore', () => {
    it('should reject standalone structure projections', async () => {
        const fake = createClient();
        fake.entityTypes.findOne.mockResolvedValue({ name: 'person', structure: true });
        await expect(
            new MongoEventProjectionStore(fake.client).commit([createdEvent()]),
        ).rejects.toThrow("Structure 'person' cannot be persisted independently.");
        expect(fake.entities.insertOne).not.toHaveBeenCalled();
    });
    it('should read projections and construct filtered queries', async () => {
        const fake = createClient();
        fake.entityTypes.findOne.mockResolvedValue(
            projectionDocument('person', 'entity-type', { name: 'person' }),
        );
        const store = new MongoEventProjectionStore(fake.client);
        const document = projectionDocument('ada', 'person', { name: 'Ada' });
        fake.users.findOne.mockResolvedValueOnce(null);
        fake.entities.findOne.mockResolvedValue(document);
        fake.entities.find.mockReturnValue(cursor([document]));

        await expect(store.isInitialized()).resolves.toBe(false);
        await expect(store.hasEntity('person', 'ada')).resolves.toBe(true);
        await expect(store.findProjection('person', 'ada')).resolves.toMatchObject({
            _id: 'ada',
            name: 'Ada',
        });
        fake.entities.findOne.mockResolvedValueOnce(null);
        await expect(store.findProjection('person', 'missing')).resolves.toBeNull();
        fake.entityTypes.findOne.mockResolvedValueOnce(
            projectionDocument('person', 'entity-type', { name: 'person' }),
        );
        await expect(store.findEntityTypeByName('person')).resolves.toMatchObject({
            name: 'person',
        });
        await expect(
            store.findByEntityType(
                'person',
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
        expect(fake.entities.find).toHaveBeenCalledWith(
            expect.objectContaining({ _entityTypeId: 'person', _deletedAt: { $exists: false } }),
            undefined,
        );
    });

    it('should commit created, updated, and deleted projections in one transaction', async () => {
        const fake = createClient();
        fake.entities.insertOne.mockResolvedValue({});
        fake.entities.updateOne.mockResolvedValue({ matchedCount: 1 });
        fake.entityTypes.findOne.mockResolvedValue(
            projectionDocument('person', 'entity-type', { name: 'person' }),
        );
        const store = new MongoEventProjectionStore(fake.client);

        await store.commit([createdEvent(), updatedEvent(), deletedEvent()]);

        expect(fake.session.withTransaction).toHaveBeenCalledOnce();
        expect(fake.events.bulkWrite).toHaveBeenCalledOnce();
        expect(fake.entities.insertOne).toHaveBeenCalledOnce();
        expect(fake.entities.insertOne).toHaveBeenCalledWith(
            expect.objectContaining({ _id: 'ada', name: 'Ada', _version: 1 }),
            expect.any(Object),
        );
        expect(fake.entities.updateOne).toHaveBeenCalledTimes(2);
        expect(fake.session.endSession).toHaveBeenCalledOnce();
    });

    it('should surface a projection version conflict', async () => {
        const fake = createClient();
        fake.entities.updateOne.mockResolvedValue({ matchedCount: 0 });
        fake.entityTypes.findOne.mockResolvedValue(
            projectionDocument('person', 'entity-type', { name: 'person' }),
        );

        await expect(
            new MongoEventProjectionStore(fake.client).commit([updatedEvent()]),
        ).rejects.toMatchObject({ code: 'entity-version-conflict' });
    });

    it('should reject a concurrent create without writing a projection', async () => {
        const fake = createClient();
        fake.entities.insertOne.mockRejectedValue({ code: 11000 });
        fake.entityTypes.findOne.mockResolvedValue(
            projectionDocument('person', 'entity-type', { name: 'person' }),
        );

        await expect(
            new MongoEventProjectionStore(fake.client).commit([createdEvent()]),
        ).rejects.toMatchObject({ code: 'entity-already-exists' });
    });

    it('should retain unexpected projection write failures', async () => {
        const fake = createClient();
        fake.entities.insertOne.mockRejectedValue(new Error('Database unavailable.'));
        fake.entityTypes.findOne.mockResolvedValue(
            projectionDocument('person', 'entity-type', { name: 'person' }),
        );

        await expect(
            new MongoEventProjectionStore(fake.client).commit([createdEvent()]),
        ).rejects.toThrow('Database unavailable.');
    });

    it('should reject an event whose entity type no longer exists', async () => {
        const fake = createClient();

        await expect(
            new MongoEventProjectionStore(fake.client).commit([createdEvent()]),
        ).rejects.toThrow("Entity type 'person' does not exist.");
        expect(fake.entities.insertOne).not.toHaveBeenCalled();
    });
});

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
