import { MongoDataStorage } from '../src/mongo-data-storage';
import { createClient, cursor, entityDocument } from './mongo-test-helpers';

describe('MongoDataStorage', () => {
    it('should reject standalone structure writes before accessing their collection', async () => {
        const fake = createClient();
        fake.entityTypes.findOne.mockResolvedValue({ name: 'address', structure: true });
        const storage = new MongoDataStorage(fake.client);
        await expect(
            storage.create('address', entityDocument('home', 'address', {})),
        ).rejects.toThrow("Structure 'address' cannot be persisted independently.");
        expect(fake.database.collection).not.toHaveBeenCalledWith('address');
    });
    it('should write entities directly', async () => {
        const fake = createClient();
        const storage = new MongoDataStorage(fake.client);
        const entity = entityDocument('ada', 'person', { name: 'Ada' });
        fake.entities.findOne.mockResolvedValue(entity);
        fake.entities.replaceOne.mockResolvedValue({ matchedCount: 1 });
        fake.entities.deleteOne.mockResolvedValue({ deletedCount: 1 });

        await expect(storage.get('person', 'ada')).resolves.toEqual(entity);
        await storage.create('person', entity);
        await storage.update('person', { ...entity, _version: 2 });
        await storage.delete('person', 'ada');

        expect(fake.entities.insertOne).toHaveBeenCalledWith(entity, undefined);
        expect(fake.entities.replaceOne).toHaveBeenCalledWith(
            { _id: 'ada', _version: 1 },
            { ...entity, _version: 2 },
            undefined,
        );
        expect(fake.entities.deleteOne).toHaveBeenCalledWith({ _id: 'ada' }, undefined);
    });

    it('should reject writes when the entity version or ID no longer matches', async () => {
        const fake = createClient();
        const storage = new MongoDataStorage(fake.client);
        const entity = entityDocument('ada', 'person', { name: 'Ada' });
        fake.entities.replaceOne.mockResolvedValue({ matchedCount: 0 });
        fake.entities.deleteOne.mockResolvedValue({ deletedCount: 0 });

        await expect(storage.update('person', { ...entity, _version: 2 })).rejects.toThrow(
            "Entity 'ada' version mismatch.",
        );
        await expect(storage.delete('person', 'ada')).rejects.toThrow(
            "Entity 'ada' does not exist.",
        );
    });
});

describe('MongoDataStorage queries', () => {
    it('should query live entities by type', async () => {
        const fake = createClient();
        const entity = entityDocument('ada', 'person', { name: 'Ada' });
        fake.entities.find.mockReturnValue(cursor([entity]));
        fake.entityTypes.findOne.mockResolvedValue({
            _id: 'person',
            properties: [{ _id: 'person:name', name: 'name' }],
        });

        await expect(
            new MongoDataStorage(fake.client).query('person', {
                entityTypeId: 'person',
                filter: {
                    kind: 'comparison',
                    propertyId: 'person:name',
                    operator: 'equals',
                    value: 'Ada',
                },
                limit: 5,
                offset: 2,
            }),
        ).resolves.toEqual([entity]);

        expect(fake.entities.find).toHaveBeenCalledWith(
            expect.objectContaining({ _entityTypeId: 'person', _deletedAt: { $exists: false } }),
            undefined,
        );
    });
});

describe('MongoDataStorage transactions', () => {
    it('should expose an explicit transaction lifecycle', async () => {
        const fake = createClient();
        const storage = new MongoDataStorage(fake.client);

        await storage.beginTransaction();
        await storage.beginTransaction();
        await storage.create('person', entityDocument('ada', 'person', { name: 'Ada' }));
        await storage.commitTransaction();
        expect(fake.session.commitTransaction).not.toHaveBeenCalled();
        await storage.commitTransaction();

        expect(fake.session.startTransaction).toHaveBeenCalledOnce();
        expect(fake.session.commitTransaction).toHaveBeenCalledOnce();
        expect(fake.session.endSession).toHaveBeenCalledOnce();
    });

    it('should commit writes from one session', async () => {
        const fake = createClient();
        const entity = entityDocument('ada', 'person', { name: 'Ada' });
        const storage = new MongoDataStorage(fake.client);

        await storage.beginTransaction();
        await storage.create('person', entity);
        await storage.get('person', 'ada');
        await storage.commitTransaction();

        expect(fake.client.startSession).toHaveBeenCalledOnce();
        expect(fake.session.startTransaction).toHaveBeenCalledOnce();
        expect(fake.entities.insertOne).toHaveBeenCalledWith(entity, { session: fake.session });
        expect(fake.session.commitTransaction).toHaveBeenCalledOnce();
        expect(fake.session.endSession).toHaveBeenCalledOnce();
    });

    it('should abort when a action step fails', async () => {
        const fake = createClient();
        const storage = new MongoDataStorage(fake.client);

        await storage.beginTransaction();
        await storage.abortTransaction();

        expect(fake.session.abortTransaction).toHaveBeenCalledOnce();
        expect(fake.session.commitTransaction).not.toHaveBeenCalled();
        expect(fake.session.endSession).toHaveBeenCalledOnce();
    });
});
