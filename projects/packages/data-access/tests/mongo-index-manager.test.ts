import { MongoIndexManager } from '../src/mongo-index-manager';
import { createClient, cursor, projectionDocument } from './mongo-test-helpers';

describe('MongoIndexManager', () => {
    it('should reconcile index entities into MongoDB indexes', async () => {
        const fake = createClient();
        fake.indexes.find.mockReturnValue(
            cursor([
                projectionDocument('person-name', 'index', {
                    entityTypeId: 'person',
                    name: 'person-name',
                    propertyIds: ['person:name'],
                    unique: true,
                }),
            ]),
        );
        fake.entityProperties.find.mockReturnValue(
            cursor([projectionDocument('person:name', 'entity-property', { name: 'name' })]),
        );
        fake.entityTypes.findOne.mockResolvedValue(
            projectionDocument('person', 'entity-type', { name: 'person' }),
        );

        await new MongoIndexManager(fake.client).reconcile();

        expect(fake.entities.createIndex).toHaveBeenCalledWith(
            { name: 1 },
            expect.objectContaining({ name: 'poseidon__person-name', unique: true }),
        );
    });

    it('should reject invalid or incomplete index definitions', async () => {
        const fake = createClient();
        fake.entityProperties.find.mockReturnValue(cursor([]));
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
        fake.entityProperties.find.mockReturnValue(
            cursor([projectionDocument('person:name', 'entity-property', { name: 'name' })]),
        );

        await expect(
            new MongoIndexManager(fake.client).apply({
                entityTypeId: 'missing',
                name: 'person-name',
                propertyIds: ['person:name'],
            }),
        ).rejects.toThrow("Index 'person-name' references a missing entity type.");
    });
});
