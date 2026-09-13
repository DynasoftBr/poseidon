import type { EntityEvent, EntityProjection } from '@poseidon/model';
import { EventPublisher } from './event-publisher';
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

    it('should reject an update with a stale version', async () => {
        const store = new InMemoryEntityStore([projection('ada', 'person', { name: 'Ada' })]);

        await expect(
            new EntityService(store, new EventPublisher()).update(
                { id: 'ada', entityTypeId: 'person', data: { name: 'Ada' }, expectedVersion: 2 },
                'system',
            ),
        ).rejects.toMatchObject({ code: 'entity-version-conflict' });
    });

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
});

class InMemoryEntityStore implements EntityStore {
    public readonly events: EntityEvent[] = [];
    private readonly projections = new Map<string, EntityProjection>();

    public constructor(projections: EntityProjection[]) {
        projections.forEach((projection) => this.projections.set(projection.id, projection));
    }

    public hasEntity(id: string): Promise<boolean> {
        return Promise.resolve(this.projections.has(id));
    }

    public findProjection(id: string): Promise<EntityProjection | null> {
        return Promise.resolve(this.projections.get(id) ?? null);
    }

    public commit(events: EntityEvent[]): Promise<void> {
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

function projection(
    id: string,
    entityTypeId: string,
    data: Record<string, unknown>,
): EntityProjection {
    return {
        id,
        entityTypeId,
        data,
        version: 1,
        createdAt: new Date(),
        createdById: 'system',
    };
}
