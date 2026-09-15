import { MongoIndexManager } from '../src/mongo-index-manager';
import { createClient, cursor, projectionDocument } from './mongo-test-helpers';

describe('MongoIndexManager', () => {
    it('should reconcile index entities into MongoDB indexes', async () => {
        const fake = createClient();
        fake.entities.find
            .mockReturnValueOnce(
                cursor([
                    projectionDocument('person-name', 'index', {
                        entityTypeId: 'person',
                        name: 'person-name',
                        propertyIds: ['person:name'],
                        unique: true,
                    }),
                ]),
            )
            .mockReturnValueOnce(
                cursor([projectionDocument('person:name', 'entity-property', { name: 'name' })]),
            );

        await new MongoIndexManager(fake.client).reconcile();

        expect(fake.entities.createIndex).toHaveBeenCalledWith(
            { _entityTypeId: 1, name: 1 },
            expect.objectContaining({ name: 'poseidon__person-name', unique: true }),
        );
    });

    it('should reject invalid or incomplete index definitions', async () => {
        const fake = createClient();
        fake.entities.find.mockReturnValue(cursor([]));
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
});
