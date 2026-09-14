import type { EntityEvent, Entity } from '@poseidon/models';
import { EventPublisher } from './event-publisher';
import { createBootstrapModel } from './bootstrap-model';
import { EntityService, type EntityStore } from './entity-service';

describe('EntityService', () => {
    it('should create every EntityType through its declarative properties', async () => {
        const store = new InMemoryEntityStore([
            projection('person', 'entity-type', {
                properties: ['person:name', 'person:created-at'],
            }),
            projection('person:name', 'entity-property', {
                entityTypeId: 'person',
                name: 'name',
                type: 'string',
                required: true,
                convention: 'capitalize-first-letter',
            }),
            projection('person:created-at', 'entity-property', {
                entityTypeId: 'person',
                name: 'createdAt',
                type: 'date-time',
                default: '[[NOW]]',
            }),
        ]);
        const service = new EntityService(store, new EventPublisher());

        const result = await service.create(
            { id: 'ada', entityTypeId: 'person', data: { name: 'aDA lOVELACE' } },
            'system',
        );

        expect(result.data).toMatchObject({ name: 'Ada Lovelace' });
        expect(result.data.createdAt).toEqual(expect.any(String));
        expect(store.events).toHaveLength(1);
    });

    it('should validate the declared EntityType properties', async () => {
        const store = new InMemoryEntityStore([
            projection('person', 'entity-type', { properties: ['person:name'] }),
            projection('person:name', 'entity-property', {
                entityTypeId: 'person',
                name: 'name',
                type: 'string',
                required: true,
            }),
        ]);
        const service = new EntityService(store, new EventPublisher());

        await expect(
            service.create({ id: 'ada', entityTypeId: 'person', data: {} }, 'system'),
        ).rejects.toMatchObject({ code: 'validation' });
    });

    it('should append update and delete events with an expected version', async () => {
        const store = new InMemoryEntityStore([
            projection('person', 'entity-type', { properties: ['person:name'] }),
            projection('person:name', 'entity-property', {
                entityTypeId: 'person',
                name: 'name',
                type: 'string',
                required: true,
            }),
            projection('ada', 'person', { name: 'Ada' }),
        ]);
        const service = new EntityService(store, new EventPublisher());

        const updated = await service.update(
            {
                id: 'ada',
                entityTypeId: 'person',
                data: { name: 'Ada Lovelace' },
                expectedVersion: 1,
            },
            'system',
        );
        await service.delete({ id: 'ada', entityTypeId: 'person', expectedVersion: 2 }, 'system');

        expect(updated).toMatchObject({ data: { name: 'Ada Lovelace' }, version: 2 });
        expect(store.events.map((event) => event.type)).toEqual([
            'entity-updated',
            'entity-deleted',
        ]);
    });

    it.each(['update', 'delete'] as const)(
        'should reject %s when the transaction reports a version conflict',
        async (operation) => {
            const current = {
                ...projection('patient:ada', 'patient', { name: 'Ada' }),
                version: 2,
            };
            const store = graphStore([current]);
            store.failCommitWith = { code: 'entity-version-conflict' };
            const commit = vi.spyOn(store, 'commit');
            const publisher = new EventPublisher();
            const listener = vi.fn();
            publisher.subscribe('entity-updated', listener);
            publisher.subscribe('entity-deleted', listener);
            const service = new EntityService(store, publisher);
            const command = { id: current.id, entityTypeId: 'patient', expectedVersion: 1 };

            await expect(
                operation === 'update'
                    ? service.update({ ...command, data: { name: 'Ada Lovelace' } }, 'system')
                    : service.delete(command, 'system'),
            ).rejects.toMatchObject({ code: 'entity-version-conflict' });

            expect(commit).toHaveBeenCalledWith([
                expect.objectContaining({ entityId: current.id, expectedVersion: 1 }),
            ]);
            expect(await store.findProjection(current.id)).toEqual(current);
            expect(store.events).toEqual([]);
            expect(listener).not.toHaveBeenCalled();
        },
    );

    it('should reject a reference to an entity outside its declared target type', async () => {
        const store = new InMemoryEntityStore([
            projection('appointment', 'entity-type', { properties: ['appointment:patient'] }),
            projection('appointment:patient', 'entity-property', {
                entityTypeId: 'appointment',
                name: 'patient',
                type: 'reference',
                relatedEntityTypeId: 'patient',
            }),
            projection('person:ada', 'person', { name: 'Ada' }),
        ]);

        await expect(
            new EntityService(store, new EventPublisher()).create(
                {
                    id: 'appointment:1',
                    entityTypeId: 'appointment',
                    data: { patient: 'person:ada' },
                },
                'system',
            ),
        ).rejects.toMatchObject({ code: 'validation' });
    });

    it('should materialize a relation-link event for a declared relation', async () => {
        const store = new InMemoryEntityStore([
            projection('appointment', 'entity-type', { properties: ['appointment:patient'] }),
            projection('appointment:patient', 'entity-property', {
                entityTypeId: 'appointment',
                name: 'patient',
                type: 'reference',
                relatedEntityTypeId: 'patient',
                relationKind: 'belongs-to-one',
                reversePropertyId: 'patient:appointments',
            }),
            projection('patient:appointments', 'entity-property', {
                entityTypeId: 'patient',
                name: 'appointments',
                type: 'reference',
                relatedEntityTypeId: 'appointment',
                relationKind: 'has-many',
            }),
            projection('patient:ada', 'patient', { name: 'Ada' }),
        ]);

        await new EntityService(store, new EventPublisher()).create(
            {
                id: 'appointment:1',
                entityTypeId: 'appointment',
                data: { patient: 'patient:ada' },
            },
            'system',
        );

        expect(store.events).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    entityTypeId: 'relation-link',
                    data: {
                        relationPropertyId: 'appointment:patient',
                        thisId: 'appointment:1',
                        thatId: 'patient:ada',
                    },
                }),
                expect.objectContaining({
                    entityTypeId: 'relation-link',
                    data: {
                        relationPropertyId: 'patient:appointments',
                        thisId: 'patient:ada',
                        thatId: 'appointment:1',
                    },
                }),
            ]),
        );
    });

    it('should create a nested reference through the same graph transaction', async () => {
        const store = new InMemoryEntityStore([
            projection('appointment', 'entity-type', { properties: ['appointment:patient'] }),
            projection('appointment:patient', 'entity-property', {
                entityTypeId: 'appointment',
                name: 'patient',
                type: 'reference',
                relatedEntityTypeId: 'patient',
            }),
            projection('patient', 'entity-type', { properties: ['patient:name'] }),
            projection('patient:name', 'entity-property', {
                entityTypeId: 'patient',
                name: 'name',
                type: 'string',
                required: true,
            }),
        ]);

        const result = await new EntityService(store, new EventPublisher()).create(
            {
                id: 'appointment:1',
                entityTypeId: 'appointment',
                data: { patient: { id: 'patient:ada', data: { name: 'Ada' } } },
            },
            'system',
        );

        expect(result.data).toEqual({ patient: 'patient:ada' });
        expect(store.events.map((event) => event.entityId)).toEqual([
            'patient:ada',
            'appointment:1',
        ]);
    });

    it('should patch an existing nested entity only with its current version', async () => {
        const store = graphStore([projection('patient:ada', 'patient', { name: 'Ada' })]);
        const service = new EntityService(store, new EventPublisher());

        await service.create(
            {
                id: 'appointment:1',
                entityTypeId: 'appointment',
                data: {
                    patient: {
                        id: 'patient:ada',
                        expectedVersion: 1,
                        data: { name: 'Ada Lovelace' },
                    },
                },
            },
            'system',
        );

        expect(store.events.map((event) => event.type)).toEqual([
            'entity-updated',
            'entity-created',
        ]);
        await expect(
            service.create(
                {
                    id: 'appointment:2',
                    entityTypeId: 'appointment',
                    data: { patient: { id: 'patient:ada', data: { name: 'Ada Byron' } } },
                },
                'system',
            ),
        ).rejects.toMatchObject({ code: 'entity-version-conflict' });
    });

    it('should expose generic reads and declarative queries', async () => {
        const store = graphStore([
            projection('appointment:1', 'appointment', { patient: 'patient:ada' }),
        ]);
        const service = new EntityService(store, new EventPublisher());

        await expect(service.get('appointment', 'appointment:1')).resolves.toMatchObject({
            id: 'appointment:1',
        });
        await expect(service.get('patient', 'appointment:1')).rejects.toMatchObject({
            code: 'entity-not-found',
        });
        await expect(
            service.query({ entityTypeId: 'appointment', limit: 1 }),
        ).resolves.toHaveLength(1);
        await expect(
            service.query({ entityTypeId: 'appointment', offset: -1 }),
        ).rejects.toMatchObject({ code: 'validation' });
        await expect(
            service.query({ entityTypeId: 'appointment', limit: 1.5 }),
        ).rejects.toMatchObject({ code: 'validation' });
        await expect(service.query({ entityTypeId: 'missing' })).rejects.toMatchObject({
            code: 'entity-type-not-found',
        });
    });

    it('should resolve query specifications against the requested type before querying', async () => {
        const store = graphStore([]);
        const query = vi.spyOn(store, 'findByEntityType');
        const service = new EntityService(store, new EventPublisher());
        const filter = {
            kind: 'comparison',
            propertyId: 'appointment:patient',
            operator: 'equals',
            value: 'patient:ada',
        } as const;
        await service.query({ entityTypeId: 'appointment', filter });
        expect(query).toHaveBeenCalledWith(
            { entityTypeId: 'appointment', filter },
            new Map([['appointment:patient', 'patient']]),
        );
        query.mockClear();
        await expect(
            service.query({
                entityTypeId: 'appointment',
                filter: { ...filter, propertyId: 'patient:name' },
            }),
        ).rejects.toMatchObject({ code: 'validation' });
        expect(query).not.toHaveBeenCalled();
        expect(store.events).toEqual([]);
    });

    it('should preserve unchanged nested entities and reject a new entity version', async () => {
        const store = graphStore([projection('patient:ada', 'patient', { name: 'Ada' })]);
        const service = new EntityService(store, new EventPublisher());

        await service.create(
            {
                id: 'appointment:1',
                entityTypeId: 'appointment',
                data: { patient: { id: 'patient:ada', data: { name: 'Ada' } } },
            },
            'system',
        );
        expect(store.events).toHaveLength(1);
        await expect(
            service.create(
                {
                    id: 'appointment:2',
                    entityTypeId: 'appointment',
                    data: {
                        patient: {
                            id: 'patient:grace',
                            expectedVersion: 1,
                            data: { name: 'Grace' },
                        },
                    },
                },
                'system',
            ),
        ).rejects.toMatchObject({ code: 'validation' });
    });

    it('should map transactional conflicts to domain errors', async () => {
        const store = graphStore([]);
        const service = new EntityService(store, new EventPublisher());
        store.failCommitWith = { code: 'entity-already-exists' };
        await expect(
            service.create(
                { id: 'appointment:1', entityTypeId: 'appointment', data: {} },
                'system',
            ),
        ).rejects.toMatchObject({ code: 'entity-already-exists' });
        store.failCommitWith = { code: 'entity-version-conflict' };
        await expect(
            service.create(
                { id: 'appointment:2', entityTypeId: 'appointment', data: {} },
                'system',
            ),
        ).rejects.toMatchObject({ code: 'entity-version-conflict' });
        store.failCommitWith = new Error('write failure');
        await expect(
            service.create(
                { id: 'appointment:3', entityTypeId: 'appointment', data: {} },
                'system',
            ),
        ).rejects.toThrow('write failure');
    });

    it.each([1, 2])(
        'should return the current entity without writes when unchanged with expected version %i',
        async (expectedVersion) => {
            const store = graphStore([
                {
                    ...projection('appointment:1', 'appointment', { patient: 'patient:ada' }),
                    version: 2,
                },
                projection('patient:ada', 'patient', { name: 'Ada' }),
            ]);
            const publisher = new EventPublisher();
            const listener = vi.fn();
            publisher.subscribe('entity-updated', listener);

            const result = await new EntityService(store, publisher).update(
                {
                    id: 'appointment:1',
                    entityTypeId: 'appointment',
                    expectedVersion,
                    data: { patient: 'patient:ada' },
                },
                'system',
            );

            expect(result).toEqual(await store.findProjection('appointment:1'));
            expect(result.version).toBe(2);
            expect(store.events).toEqual([]);
            expect(listener).not.toHaveBeenCalled();
        },
    );

    it('should reject reference arrays with duplicate configured values', async () => {
        const store = graphStore([
            projection('group', 'entity-type', { properties: ['group:members'] }),
            projection('group:members', 'entity-property', {
                entityTypeId: 'group',
                name: 'members',
                type: 'array',
                itemsType: 'reference',
                relatedEntityTypeId: 'patient',
                uniqueBy: 'name',
            }),
            projection('patient:ada', 'patient', { name: 'Ada' }),
            projection('patient:ada-copy', 'patient', { name: 'Ada' }),
        ]);

        await expect(
            new EntityService(store, new EventPublisher()).create(
                {
                    id: 'group:1',
                    entityTypeId: 'group',
                    data: { members: ['patient:ada', 'patient:ada-copy'] },
                },
                'system',
            ),
        ).rejects.toMatchObject({ code: 'validation' });
    });

    it('should create an EntityType with nested property definitions', async () => {
        const bootstrap = createBootstrapModel('system', new Date());
        const store = new InMemoryEntityStore([
            ...bootstrap.users,
            ...bootstrap.entityTypes,
            ...bootstrap.entityProperties,
            ...bootstrap.indexes,
        ]);

        const entityType = await new EntityService(store, new EventPublisher()).create(
            {
                id: 'product',
                entityTypeId: 'entity-type',
                data: {
                    name: 'Product',
                    label: 'Product',
                    properties: [
                        {
                            id: 'product:name',
                            data: {
                                entityTypeId: 'product',
                                name: 'name',
                                type: 'string',
                                required: true,
                            },
                        },
                    ],
                },
            },
            'system',
        );

        expect(entityType.data.properties).toEqual(['product:name']);
        expect(store.events.map((event) => event.entityId)).toEqual(['product:name', 'product']);
    });

    it('should validate nested EntityProperty metadata from the bootstrap model', async () => {
        const bootstrap = createBootstrapModel('system', new Date());
        const store = new InMemoryEntityStore([
            ...bootstrap.users,
            ...bootstrap.entityTypes,
            ...bootstrap.entityProperties,
            ...bootstrap.indexes,
        ]);

        await expect(
            new EntityService(store, new EventPublisher()).create(
                {
                    id: 'invalid',
                    entityTypeId: 'entity-type',
                    data: {
                        name: 'Invalid',
                        label: 'Invalid',
                        properties: [
                            {
                                id: 'invalid:value',
                                data: {
                                    entityTypeId: 'invalid',
                                    name: 'value',
                                    type: 'not-a-property-type',
                                },
                            },
                        ],
                    },
                },
                'system',
            ),
        ).rejects.toMatchObject({ code: 'validation' });
    });
});

function graphStore(extra: Entity[]): InMemoryEntityStore {
    return new InMemoryEntityStore([
        projection('appointment', 'entity-type', { properties: ['appointment:patient'] }),
        projection('appointment:patient', 'entity-property', {
            entityTypeId: 'appointment',
            name: 'patient',
            type: 'reference',
            relatedEntityTypeId: 'patient',
        }),
        projection('patient', 'entity-type', { properties: ['patient:name'] }),
        projection('patient:name', 'entity-property', {
            entityTypeId: 'patient',
            name: 'name',
            type: 'string',
            required: true,
        }),
        ...extra,
    ]);
}

class InMemoryEntityStore implements EntityStore {
    public readonly events: EntityEvent[] = [];
    public failCommitWith: unknown;
    private readonly projections = new Map<string, Entity>();

    public constructor(projections: Entity[]) {
        projections.forEach((projection) => this.projections.set(projection.id, projection));
    }

    public hasEntity(id: string): Promise<boolean> {
        return Promise.resolve(this.projections.has(id));
    }

    public findProjection(id: string): Promise<Entity | null> {
        return Promise.resolve(this.projections.get(id) ?? null);
    }

    public findByEntityType(command: { entityTypeId: string }): Promise<Entity[]> {
        return Promise.resolve(
            [...this.projections.values()].filter(
                (entity) => entity.entityTypeId === command.entityTypeId,
            ),
        );
    }

    public commit(events: EntityEvent[]): Promise<void> {
        if (this.failCommitWith) return Promise.reject(this.failCommitWith);
        this.events.push(...events);
        events.forEach((event) => {
            const current = this.projections.get(event.entityId);
            this.projections.set(event.entityId, {
                ...projection(event.entityId, event.entityTypeId, event.data),
                version: current ? current.version + 1 : 1,
                ...(event.type === 'entity-deleted' ? { deletedAt: event.occurredAt } : {}),
            });
        });
        return Promise.resolve();
    }
}

function projection(id: string, entityTypeId: string, data: Record<string, unknown>): Entity {
    return {
        id,
        entityTypeId,
        data,
        version: 1,
        createdAt: new Date(),
        createdById: 'system',
    };
}
