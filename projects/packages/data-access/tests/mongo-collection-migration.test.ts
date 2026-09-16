import { MongoCollectionMigration } from '../src/mongo-collection-migration';
import { createClient, cursor, projectionDocument } from './mongo-test-helpers';

describe('MongoCollectionMigration', () => {
    it('should leave a database without the shared collection untouched', async () => {
        const fake = createClient();
        fake.database.listCollections.mockReturnValue(cursor([]));

        await new MongoCollectionMigration(fake.client).migrate();

        expect(fake.legacy.drop).not.toHaveBeenCalled();
    });

    it('should copy existing entities by type name before removing the shared collection', async () => {
        const fake = createClient();
        const type = projectionDocument('person-type-id', 'entity-type', { name: 'person' });
        const person = projectionDocument('ada', 'person-type-id', { name: 'Ada' });
        fake.database.listCollections.mockReturnValue(cursor([{ name: 'entities' }]));
        fake.legacy.find
            .mockReturnValueOnce(cursor([type]))
            .mockReturnValueOnce(cursor([type, person]));
        fake.entityTypes.findOne.mockResolvedValue(null);
        fake.entities.findOne.mockResolvedValue(null);

        await new MongoCollectionMigration(fake.client).migrate();

        expect(fake.entityTypes.insertOne).toHaveBeenCalledWith(type);
        expect(fake.entities.insertOne).toHaveBeenCalledWith(person);
        expect(fake.legacy.drop).toHaveBeenCalledOnce();
    });

    it('should resume a partial copy without replacing matching target documents', async () => {
        const fake = createClient();
        const type = projectionDocument('person-type-id', 'entity-type', { name: 'person' });
        fake.database.listCollections.mockReturnValue(cursor([{ name: 'entities' }]));
        fake.legacy.find.mockReturnValueOnce(cursor([type])).mockReturnValueOnce(cursor([type]));
        fake.entityTypes.findOne.mockResolvedValue(type);

        await new MongoCollectionMigration(fake.client).migrate();

        expect(fake.entityTypes.insertOne).not.toHaveBeenCalled();
        expect(fake.legacy.drop).toHaveBeenCalledOnce();
    });

    it('should retain the source when an entity type is missing', async () => {
        const fake = createClient();
        fake.database.listCollections.mockReturnValue(cursor([{ name: 'entities' }]));
        fake.legacy.find
            .mockReturnValueOnce(cursor([]))
            .mockReturnValueOnce(cursor([projectionDocument('ada', 'missing', { name: 'Ada' })]));

        await expect(new MongoCollectionMigration(fake.client).migrate()).rejects.toThrow(
            "Cannot migrate entity 'ada': entity type is missing.",
        );
        expect(fake.legacy.drop).not.toHaveBeenCalled();
    });

    it('should retain the source when an existing target differs', async () => {
        const fake = createClient();
        const type = projectionDocument('person-type-id', 'entity-type', { name: 'person' });
        fake.database.listCollections.mockReturnValue(cursor([{ name: 'entities' }]));
        fake.legacy.find.mockReturnValueOnce(cursor([type])).mockReturnValueOnce(cursor([type]));
        fake.entityTypes.findOne.mockResolvedValue({ ...type, name: 'other' });

        await expect(new MongoCollectionMigration(fake.client).migrate()).rejects.toThrow(
            "Cannot migrate entity 'person-type-id': target differs from source.",
        );
        expect(fake.legacy.drop).not.toHaveBeenCalled();
    });
});
