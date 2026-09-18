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
            { _id: 'script', _createdBy: 'system', _createdAt: now.toISOString() },
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
        for (const entityType of model.entityTypes) {
            expect(entityType.properties).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ _id: `${entityType.name}:_id` }),
                ]),
            );
        }
        expect(model.entityProperties).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    _id: 'entity-type:properties',
                    itemsType: 'object',
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
            ]),
        );
        expect(model.indexes).toHaveLength(2);
        expect(model.scripts).toEqual([
            expect.objectContaining({
                _id: 'addMandatoryProperties',
                _entityTypeId: 'script',
                code: null,
            }),
        ]);
    });

    it('should create missing entities with their audit metadata', async () => {
        const model = createBootstrapModel('system', new Date('2026-09-13T00:00:00.000Z'));
        const storage = createStorage([]);

        await expect(ensureBootstrapModel(storage, model)).resolves.toBe(true);
        expect(storage.create).toHaveBeenCalledWith('user', model.users[0]);
        expect(storage.create).toHaveBeenCalledWith('entity-type', model.entityTypes[0]);
        expect(storage.create).not.toHaveBeenCalledWith('entity-property', expect.anything());
        expect(storage.create).toHaveBeenCalledWith('index', model.indexes[0]);
        expect(storage.create).toHaveBeenCalledWith('script', model.scripts[0]);
    });

    it('should add new core entity types and properties to an existing store', async () => {
        const model = createBootstrapModel('system', new Date());
        const entities = [...model.users, ...model.entityTypes, ...model.indexes, ...model.scripts];
        const identity = entities.filter((entity) => entity._id === 'identity');
        const storage = createStorage(
            entities.filter((entity) => !identity.includes(entity)).map((entity) => entity._id),
        );

        await expect(ensureBootstrapModel(storage, model)).resolves.toBe(true);
        expect(storage.create).toHaveBeenCalledTimes(identity.length);
        for (const entity of identity) {
            expect(storage.create).toHaveBeenCalledWith(entity._entityTypeId, entity);
        }
    });

    it('should preserve an initialized store', async () => {
        const model = createBootstrapModel('system', new Date());
        const entities = [...model.users, ...model.entityTypes, ...model.indexes, ...model.scripts];
        const storage = createStorage(entities.map((entity) => entity._id));

        await expect(ensureBootstrapModel(storage, model)).resolves.toBe(false);
        expect(storage.create).not.toHaveBeenCalled();
    });

    it('should use an entity type name when its ID differs from the collection name', async () => {
        const model = createBootstrapModel('system', new Date());
        const userType = model.entityTypes.find((type) => type.name === 'user');
        if (!userType) throw new Error('User type is missing from the bootstrap model.');
        userType._id = 'user-type-id';
        model.users[0]._entityTypeId = userType._id;
        const storage = createStorage([]);

        await ensureBootstrapModel(storage, model);

        expect(storage.get).toHaveBeenCalledWith('user', 'system');
        expect(storage.create).toHaveBeenCalledWith('user', model.users[0]);
    });

    it('should resolve an additive seed type from the stored entity type definition', async () => {
        const model = createBootstrapModel('system', new Date());
        model.entityTypes = model.entityTypes.filter((type) => type._id !== 'entity-type');
        const storage = createStorage([]);
        storage.get = vi
            .fn()
            .mockImplementation((name: string, id: string) =>
                Promise.resolve(
                    name === 'entity-type' && id === 'entity-type'
                        ? { _id: id, name: 'entity-type' }
                        : null,
                ),
            );

        await ensureBootstrapModel(storage, model);

        expect(storage.get).toHaveBeenCalledWith('entity-type', 'entity-type');
        expect(storage.create).toHaveBeenCalledWith('entity-type', model.entityTypes[0]);
    });

    it('should reject an additive seed before writing when its type definition is missing', async () => {
        const model = createBootstrapModel('system', new Date());
        model.entityTypes = model.entityTypes.filter((type) => type._id !== 'entity-type');
        const storage = createStorage([]);

        await expect(ensureBootstrapModel(storage, model)).rejects.toThrow(
            "Seed entity type 'entity-type' has no definition.",
        );
        expect(storage.create).not.toHaveBeenCalled();
    });
});

function createStorage(existingIds: string[]): DataStorage & { create: ReturnType<typeof vi.fn> } {
    return {
        get: vi
            .fn()
            .mockImplementation((_entityTypeName: string, id: string) =>
                Promise.resolve(existingIds.includes(id) ? { _id: id } : null),
            ),
        create: vi.fn().mockResolvedValue(undefined),
        query: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        beginTransaction: () => Promise.resolve(),
        commitTransaction: () => Promise.resolve(),
        abortTransaction: () => Promise.resolve(),
    };
}
