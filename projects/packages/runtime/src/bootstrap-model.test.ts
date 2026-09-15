import {
    createBootstrapEvents,
    createBootstrapModel,
    ensureBootstrapModel,
    type BootstrapStore,
} from './bootstrap-model';
import { EventPublisher } from './event-publisher';

describe('createBootstrapModel', () => {
    it('should create the core entity types from the shared model', () => {
        const now = new Date('2026-09-13T00:00:00.000Z');

        const model = createBootstrapModel('system', now);

        expect(model.users).toMatchObject([
            { _id: 'system', _entityTypeId: 'user', login: 'system', _version: 1 },
        ]);
        expect(model.entityTypes).toMatchObject([
            {
                _id: 'entity-type',
                _createdBy: 'system',
                _createdAt: now.toISOString(),
                label: 'Entity type',
                pluralLabel: 'Entity types',
                description: 'Defines the structure and behaviour of an entity.',
                menuLocation: 'Platform',
            },
            { _id: 'entity-property', _createdBy: 'system', _createdAt: now.toISOString() },
            { _id: 'index', _createdBy: 'system', _createdAt: now.toISOString() },
            { _id: 'user', _createdBy: 'system', _createdAt: now.toISOString() },
            { _id: 'identity', _createdBy: 'system', _createdAt: now.toISOString() },
            { _id: 'relation-link', _createdBy: 'system', _createdAt: now.toISOString() },
        ]);
        for (const entityType of model.entityTypes) {
            expect(entityType).toEqual(
                expect.objectContaining({
                    label: expect.any(String),
                    pluralLabel: expect.any(String),
                    description: expect.any(String),
                    menuLocation: 'Platform',
                }),
            );
        }
        expect(model.entityProperties).toHaveLength(92);
        for (const entityType of model.entityTypes) {
            expect(entityType.properties).toEqual(
                expect.arrayContaining([`${entityType.name}:_id`, `${entityType.name}:_createdAt`]),
            );
        }
        expect(model.entityProperties).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    _id: 'entity-type:properties',
                    itemsType: 'reference',
                    relatedEntityTypeId: 'entity-property',
                    uniqueBy: 'name',
                }),
                expect.objectContaining({
                    _id: 'entity-property:default',
                    type: 'json',
                }),
                expect.objectContaining({
                    _id: 'entity-type:menuLocation',
                    type: 'string',
                    required: false,
                }),
                expect.objectContaining({
                    _id: 'identity:members',
                    itemsType: 'reference',
                    relatedEntityTypeId: 'identity',
                    relationKind: 'has-many',
                    reversePropertyId: 'identity:memberOf',
                }),
            ]),
        );
        expect(model.indexes).toHaveLength(2);
    });

    it('should preserve entity payloads and audit metadata in bootstrap events', () => {
        const now = new Date('2026-09-13T00:00:00.000Z');
        const model = createBootstrapModel('system', now);
        const entities = [
            ...model.users,
            ...model.entityTypes,
            ...model.entityProperties,
            ...model.indexes,
        ];
        const events = createBootstrapEvents(model);

        for (const entity of entities) {
            expect(events.find((event) => event.entityId === entity._id)).toEqual({
                id: `bootstrap:${entity._entityTypeId}:${entity._id}`,
                type: 'entity-created',
                entityId: entity._id,
                entityTypeId: entity._entityTypeId,
                data: Object.fromEntries(
                    Object.entries(entity).filter(([name]) => !name.startsWith('_')),
                ),
                actorId: 'system',
                occurredAt: now,
            });
        }
        expect(
            model.entityProperties.find((property) => property._id === 'user:name'),
        ).toMatchObject({
            _entityTypeId: 'entity-property',
            entityTypeId: 'user',
            name: 'name',
        });
    });

    it('should initialize only an empty store', async () => {
        const model = createBootstrapModel('system', new Date());
        const store = createStore([]);
        const publisher = new EventPublisher();

        await expect(ensureBootstrapModel(store, publisher, model)).resolves.toBe(true);
        expect(store.commit).toHaveBeenCalledWith(createBootstrapEvents(model));
    });

    it('should add new core entity types and properties to an existing store', async () => {
        const model = createBootstrapModel('system', new Date());
        const events = createBootstrapEvents(model);
        const identityEvents = events.filter(
            (event) =>
                event.entityId === 'identity' ||
                (event.entityTypeId === 'entity-property' &&
                    event.data.entityTypeId === 'identity'),
        );
        const store = createStore(
            events
                .filter((event) => !identityEvents.includes(event))
                .map((event) => event.entityId),
        );

        await expect(ensureBootstrapModel(store, new EventPublisher(), model)).resolves.toBe(true);
        expect(store.commit).toHaveBeenCalledWith(identityEvents);
    });

    it('should preserve an initialized store', async () => {
        const model = createBootstrapModel('system', new Date());
        const store = createStore(createBootstrapEvents(model).map((event) => event.entityId));
        const publisher = new EventPublisher();

        await expect(ensureBootstrapModel(store, publisher, model)).resolves.toBe(false);
        expect(store.commit).not.toHaveBeenCalled();
    });
});

function createStore(existingIds: string[]): BootstrapStore & { commit: ReturnType<typeof vi.fn> } {
    return {
        hasEntity: vi
            .fn()
            .mockImplementation((id: string) => Promise.resolve(existingIds.includes(id))),
        commit: vi.fn().mockResolvedValue(undefined),
    };
}
