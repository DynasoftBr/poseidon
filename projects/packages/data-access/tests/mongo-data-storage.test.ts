import { MongoDataStorage } from '../src/mongo-data-storage';
import { createClient, projectionDocument } from './mongo-test-helpers';

describe('MongoDataStorage', () => {
    it('should write entities directly without creating events', async () => {
        const fake = createClient();
        const storage = new MongoDataStorage(fake.client);
        const entity = projectionDocument('ada', 'person', { name: 'Ada' });
        fake.entities.findOne.mockResolvedValue(entity);
        fake.entities.replaceOne.mockResolvedValue({ matchedCount: 1 });
        fake.entities.deleteOne.mockResolvedValue({ deletedCount: 1 });

        await expect(storage.getById('person', 'ada')).resolves.toEqual(entity);
        await storage.create('person', entity);
        await storage.update('person', { ...entity, _version: 2 });
        await storage.delete('person', 'ada');

        expect(fake.entities.insertOne).toHaveBeenCalledWith(entity);
        expect(fake.entities.replaceOne).toHaveBeenCalledWith(
            { _id: 'ada', _version: 1 },
            { ...entity, _version: 2 },
        );
        expect(fake.entities.deleteOne).toHaveBeenCalledWith({ _id: 'ada' });
        expect(fake.events.bulkWrite).not.toHaveBeenCalled();
    });

    it('should reject writes when the entity version or ID no longer matches', async () => {
        const fake = createClient();
        const storage = new MongoDataStorage(fake.client);
        const entity = projectionDocument('ada', 'person', { name: 'Ada' });
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
