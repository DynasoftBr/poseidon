import { MongoIndexManager } from '../src/mongo-index-manager';
import { createClient, cursor, entityDocument } from './mongo-test-helpers';

describe('MongoIndexManager', () => {
    it('should reject a collection index on a structure', async () => {
        const fake = createClient();
        fake.entityTypes.findOne.mockResolvedValue({ name: 'address', structure: true });
        await expect(
            new MongoIndexManager(fake.client).apply({
                entityTypeId: 'address',
                name: 'city',
                propertyIds: ['address:city'],
            }),
        ).rejects.toThrow("Structure 'address' cannot have collection indexes.");
        expect(fake.database.collection).not.toHaveBeenCalledWith('address');
    });
    it('should reconcile index entities into MongoDB indexes', async () => {
        const fake = createClient();
        fake.indexes.find.mockReturnValue(
            cursor([
                entityDocument('person-name', 'index', {
                    entityTypeId: 'person',
                    name: 'person-name',
                    propertyIds: ['person:name'],
                    unique: true,
                }),
            ]),
        );
        fake.entityTypes.findOne.mockResolvedValue(
            entityDocument('person', 'entity-type', {
                name: 'person',
                properties: [{ _id: 'person:name', name: 'name' }],
            }),
        );

        await new MongoIndexManager(fake.client).reconcile();

        expect(fake.entities.createIndex).toHaveBeenCalledWith(
            { name: 1 },
            expect.objectContaining({ name: 'poseidon__person-name', unique: true }),
        );
    });

    it('should reject invalid or incomplete index definitions', async () => {
        const fake = createClient();
        fake.entityTypes.findOne.mockResolvedValue(
            entityDocument('person', 'entity-type', { name: 'person', properties: [] }),
        );
        const manager = new MongoIndexManager(fake.client);

        await expect(manager.apply({})).rejects.toThrow('Index entity has an invalid definition.');
        await expect(
            manager.apply({
                entityTypeId: 'person',
                name: 'person-name',
                propertyIds: ['person:name'],
            }),
        ).rejects.toThrow("Index 'person-name' references a missing property.");
    });

    it('should reject an index targeting a missing entity type', async () => {
        const fake = createClient();

        await expect(
            new MongoIndexManager(fake.client).apply({
                entityTypeId: 'missing',
                name: 'person-name',
                propertyIds: ['person:name'],
            }),
        ).rejects.toThrow("Index 'person-name' references a missing entity type.");
    });
});
