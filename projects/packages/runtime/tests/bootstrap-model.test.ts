import { createBootstrapModel, ensureBootstrapModel } from '../src/bootstrap-model';
import type { DataStorage } from '@poseidon/data-access';

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

    it('should create missing entities with their audit metadata', async () => {
        const model = createBootstrapModel('system', new Date('2026-09-13T00:00:00.000Z'));
        const storage = createStorage([]);

        await expect(ensureBootstrapModel(storage, model)).resolves.toBe(true);
        expect(storage.create).toHaveBeenCalledWith(model.users[0]);
        expect(storage.create).toHaveBeenCalledWith(model.entityTypes[0]);
        expect(storage.create).toHaveBeenCalledWith(model.entityProperties[0]);
        expect(storage.create).toHaveBeenCalledWith(model.indexes[0]);
    });

    it('should add new core entity types and properties to an existing store', async () => {
        const model = createBootstrapModel('system', new Date());
        const entities = [
            ...model.users,
            ...model.entityTypes,
            ...model.entityProperties,
            ...model.indexes,
        ];
        const identity = entities.filter(
            (entity) =>
                entity._id === 'identity' ||
                (entity._entityTypeId === 'entity-property' && entity.entityTypeId === 'identity'),
        );
        const storage = createStorage(
            entities.filter((entity) => !identity.includes(entity)).map((entity) => entity._id),
        );

        await expect(ensureBootstrapModel(storage, model)).resolves.toBe(true);
        expect(storage.create).toHaveBeenCalledTimes(identity.length);
        for (const entity of identity) expect(storage.create).toHaveBeenCalledWith(entity);
    });

    it('should preserve an initialized store', async () => {
        const model = createBootstrapModel('system', new Date());
        const entities = [
            ...model.users,
            ...model.entityTypes,
            ...model.entityProperties,
            ...model.indexes,
        ];
        const storage = createStorage(entities.map((entity) => entity._id));

        await expect(ensureBootstrapModel(storage, model)).resolves.toBe(false);
        expect(storage.create).not.toHaveBeenCalled();
    });
});

function createStorage(existingIds: string[]): DataStorage & { create: ReturnType<typeof vi.fn> } {
    return {
        getById: vi
            .fn()
            .mockImplementation((id: string) =>
                Promise.resolve(existingIds.includes(id) ? { _id: id } : null),
            ),
        create: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
    };
}
