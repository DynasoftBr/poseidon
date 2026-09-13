import type { CreateEntityTypeCommand, EntityEvent, EntityProjection } from '@poseidon/model';
import { EventPublisher } from './event-publisher';
import { EntityTypeService, type EntityTypeStore } from './entity-type-service';

describe('EntityTypeService', () => {
    it('should create an entity type and its properties through events', async () => {
        const store = new InMemoryEntityTypeStore();
        const service = new EntityTypeService(store, new EventPublisher());

        const projection = await service.create(createAppointmentCommand(), 'system');

        expect(projection).toMatchObject({
            id: 'appointment',
            entityTypeId: 'entity-type',
            data: {
                name: 'Appointment',
                properties: ['appointment:starts-at', 'appointment:patient'],
            },
        });
        expect(store.events).toHaveLength(3);
        await expect(service.get('appointment')).resolves.toMatchObject({ id: 'appointment' });
    });

    it('should reject duplicate property names', async () => {
        const service = new EntityTypeService(new InMemoryEntityTypeStore(), new EventPublisher());
        const command = createAppointmentCommand();
        command.properties.push({
            id: 'appointment:patient-copy',
            name: 'patient',
            type: 'reference',
        });

        await expect(service.create(command, 'system')).rejects.toMatchObject({
            code: 'validation',
        });
    });

    it('should retain declarative property metadata in the model event', async () => {
        const store = new InMemoryEntityTypeStore();
        const command = createAppointmentCommand();
        command.properties[0].convention = 'upper-case';
        command.properties[0].default = '[[NOW]]';

        await new EntityTypeService(store, new EventPublisher()).create(command, 'system');

        expect(store.events[1].data).toMatchObject({
            convention: 'upper-case',
            default: '[[NOW]]',
        });
    });

    it('should reject a reference without a related entity type', async () => {
        const command = createAppointmentCommand();
        command.properties[1].relatedEntityTypeId = undefined;
        const service = new EntityTypeService(new InMemoryEntityTypeStore(), new EventPublisher());

        await expect(service.create(command, 'system')).rejects.toMatchObject({
            code: 'validation',
        });
    });

    it('should validate malformed entity type and relation metadata', async () => {
        const service = new EntityTypeService(new InMemoryEntityTypeStore(), new EventPublisher());

        await expect(
            service.create(
                {
                    id: '',
                    name: '',
                    label: '',
                    properties: [
                        {
                            id: '',
                            name: '',
                            type: 'invalid' as 'string',
                            convention: 'invalid' as 'lower-case',
                            relationKind: 'invalid' as 'has-one',
                        },
                    ],
                },
                'system',
            ),
        ).rejects.toMatchObject({ code: 'validation' });

        await expect(
            service.create(
                {
                    id: 'note',
                    name: 'Note',
                    label: 'Note',
                    properties: [
                        {
                            id: 'note:author',
                            name: 'author',
                            type: 'string',
                            relationKind: 'has-one',
                        },
                    ],
                },
                'system',
            ),
        ).rejects.toMatchObject({ code: 'validation' });
        await expect(service.get('missing')).rejects.toMatchObject({
            code: 'entity-type-not-found',
        });
    });
});

function createAppointmentCommand(): CreateEntityTypeCommand {
    return {
        id: 'appointment',
        name: 'Appointment',
        label: 'Appointment',
        properties: [
            {
                id: 'appointment:starts-at',
                name: 'startsAt',
                type: 'date-time' as const,
                required: true,
            },
            {
                id: 'appointment:patient',
                name: 'patient',
                type: 'reference' as const,
                relatedEntityTypeId: 'patient',
                relationKind: 'belongs-to-one',
            },
        ],
    };
}

class InMemoryEntityTypeStore implements EntityTypeStore {
    public readonly events: EntityEvent[] = [];
    private readonly projections = new Map<string, EntityProjection>();

    public hasEntity(id: string): Promise<boolean> {
        return Promise.resolve(this.projections.has(id));
    }

    public findProjection(id: string): Promise<EntityProjection | null> {
        return Promise.resolve(this.projections.get(id) ?? null);
    }

    public commit(events: EntityEvent[]): Promise<void> {
        this.events.push(...events);

        events.forEach((event) => {
            this.projections.set(event.entityId, {
                id: event.entityId,
                entityTypeId: event.entityTypeId,
                data: event.data,
                version: 1,
                createdAt: event.occurredAt,
                createdById: event.actorId,
            });
        });

        return Promise.resolve();
    }
}
