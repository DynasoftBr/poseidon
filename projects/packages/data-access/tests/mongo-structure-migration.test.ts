import { MongoStructureMigration } from '../src/mongo-structure-migration';
import { createClient, cursor, projectionDocument } from './mongo-test-helpers';

describe('MongoStructureMigration', () => {
    it('should remove standalone metadata and preserve property identifiers in the structure schema', async () => {
        const fake = createClient();
        fake.database.listCollections.mockReturnValue(cursor([{ name: 'entity-property' }]));
        fake.entityProperties.find.mockReturnValue(cursor([]));
        const properties = ['_id', '_createdAt', 'name', 'reversePropertyId'].map((name) => ({
            _id: `entity-property:${name}`,
            entityTypeId: 'entity-property',
            name,
            type: 'string',
            ...(name === 'reversePropertyId'
                ? { type: 'reference', relatedEntityTypeId: 'entity-property' }
                : {}),
        }));
        fake.entityTypes.find.mockReturnValue(
            cursor([projectionDocument('entity-property', 'entity-type', { properties })]),
        );
        await new MongoStructureMigration(fake.client).migrate();
        expect(fake.entityTypes.updateOne).toHaveBeenCalledWith(
            { _id: 'entity-property' },
            {
                $set: {
                    structure: true,
                    properties: [
                        properties[0],
                        properties[2],
                        {
                            _id: 'entity-property:reversePropertyId',
                            entityTypeId: 'entity-property',
                            name: 'reversePropertyId',
                            type: 'string',
                        },
                    ],
                },
            },
            { session: fake.session },
        );
    });

    it('should embed existing properties before removing their collection', async () => {
        const fake = createClient();
        fake.database.listCollections.mockReturnValue(cursor([{ name: 'entity-property' }]));
        fake.entityProperties.find.mockReturnValue(
            cursor([
                projectionDocument('person:name', 'entity-property', {
                    entityTypeId: 'person',
                    name: 'name',
                    type: 'string',
                }),
            ]),
        );
        fake.entityTypes.find.mockReturnValue(
            cursor([
                projectionDocument('person', 'entity-type', { properties: ['person:name'] }),
                projectionDocument('entity-property', 'entity-type', { properties: [] }),
                projectionDocument('entity-type', 'entity-type', {
                    properties: [
                        {
                            _id: 'entity-type:properties',
                            entityTypeId: 'entity-type',
                            name: 'properties',
                            type: 'array',
                            itemsType: 'reference',
                        },
                    ],
                }),
            ]),
        );

        await new MongoStructureMigration(fake.client).migrate();

        expect(fake.entityTypes.updateOne).toHaveBeenCalledWith(
            { _id: 'person' },
            {
                $set: {
                    properties: [
                        {
                            _id: 'person:name',
                            entityTypeId: 'person',
                            name: 'name',
                            type: 'string',
                        },
                    ],
                },
            },
            { session: fake.session },
        );
        expect(fake.entityTypes.updateOne).toHaveBeenCalledWith(
            { _id: 'entity-property' },
            { $set: { properties: [], structure: true } },
            { session: fake.session },
        );
        expect(fake.entityProperties.drop).toHaveBeenCalledOnce();
    });

    it('should preserve legacy records when a property definition is missing', async () => {
        const fake = createClient();
        fake.database.listCollections.mockReturnValue(cursor([{ name: 'entity-property' }]));
        fake.entityProperties.find.mockReturnValue(cursor([]));
        fake.entityTypes.find.mockReturnValue(
            cursor([projectionDocument('person', 'entity-type', { properties: ['missing'] })]),
        );

        await expect(new MongoStructureMigration(fake.client).migrate()).rejects.toThrow(
            "Property 'missing' is missing",
        );
        expect(fake.entityTypes.updateOne).not.toHaveBeenCalled();
        expect(fake.entityProperties.drop).not.toHaveBeenCalled();
    });

    it('should leave an already migrated database untouched', async () => {
        const fake = createClient();
        fake.database.listCollections.mockReturnValue(cursor([]));
        await new MongoStructureMigration(fake.client).migrate();
        expect(fake.entityTypes.updateOne).not.toHaveBeenCalled();
    });
});
