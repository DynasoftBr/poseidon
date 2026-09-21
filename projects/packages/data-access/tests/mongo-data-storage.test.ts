import { MongoDataStorage } from '../src/mongo-data-storage';
import { createClient, entityDocument } from './mongo-test-helpers';

describe('MongoDataStorage', () => {
    it('should reject standalone structure writes before accessing their collection', async () => {
        const fake = createClient();
        fake.entityTypes.findOne.mockResolvedValue({ name: 'address', structure: true });
        const storage = new MongoDataStorage(fake.client);
        await expect(storage.create('address', entityDocument('home', {}))).rejects.toThrow(
            "Structure 'address' cannot be persisted independently.",
        );
        expect(fake.database.collection).not.toHaveBeenCalledWith('address');
    });
    it('should write entities directly', async () => {
        const fake = createClient();
        const storage = new MongoDataStorage(fake.client);
        const entity = entityDocument('ada', { name: 'Ada' });
        fake.entities.findOne.mockResolvedValue(entity);
        fake.entities.replaceOne.mockResolvedValue({ matchedCount: 1 });
        fake.entities.deleteOne.mockResolvedValue({ deletedCount: 1 });

        await expect(storage.get('person', 'ada')).resolves.toEqual(entity);
        await storage.create('person', entity);
        await storage.update('person', { ...entity, name: 'Grace' });
        await storage.delete('person', 'ada');

        expect(fake.entities.insertOne).toHaveBeenCalledWith(entity, undefined);
        expect(fake.entities.replaceOne).toHaveBeenCalledWith(
            { _id: 'ada' },
            { ...entity, name: 'Grace' },
            undefined,
        );
        expect(fake.entities.deleteOne).toHaveBeenCalledWith({ _id: 'ada' }, undefined);
    });

    it('should reject writes when the entity no longer exists', async () => {
        const fake = createClient();
        const storage = new MongoDataStorage(fake.client);
        const entity = entityDocument('ada', { name: 'Ada' });
        fake.entities.replaceOne.mockResolvedValue({ matchedCount: 0 });
        fake.entities.deleteOne.mockResolvedValue({ deletedCount: 0 });

        await expect(storage.update('person', { ...entity, name: 'Grace' })).rejects.toThrow(
            "Entity 'ada' does not exist.",
        );
        await expect(storage.delete('person', 'ada')).rejects.toThrow(
            "Entity 'ada' does not exist.",
        );
    });
});

describe('MongoDataStorage entity type lookup', () => {
    it.each([false, true])(
        'should find one entity type by name with a session: %s',
        async (transactional) => {
            const fake = createClient();
            const type = entityDocument('person-type-id', {
                name: 'person',
                label: 'Person',
                properties: [],
            });
            fake.entityTypes.findOne.mockResolvedValueOnce(type).mockResolvedValueOnce(null);
            const storage = new MongoDataStorage(fake.client);
            if (transactional) await storage.beginTransaction();

            expect(await storage.getEntityType('person')).toEqual(type);
            expect(fake.entityTypes.findOne).toHaveBeenCalledWith(
                { name: 'person' },
                transactional ? { session: fake.session } : undefined,
            );
            expect(await storage.getEntityType('missing')).toBeNull();
            if (transactional) await storage.commitTransaction();
        },
    );
});

describe('MongoDataStorage transactions', () => {
    it('should expose an explicit transaction lifecycle', async () => {
        const fake = createClient();
        const storage = new MongoDataStorage(fake.client);

        await storage.beginTransaction();
        await storage.beginTransaction();
        await storage.create('person', entityDocument('ada', { name: 'Ada' }));
        await storage.commitTransaction();
        expect(fake.session.commitTransaction).not.toHaveBeenCalled();
        await storage.commitTransaction();

        expect(fake.session.startTransaction).toHaveBeenCalledOnce();
        expect(fake.session.commitTransaction).toHaveBeenCalledOnce();
        expect(fake.session.endSession).toHaveBeenCalledOnce();
    });

    it('should commit writes from one session', async () => {
        const fake = createClient();
        const entity = entityDocument('ada', { name: 'Ada' });
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
