import { MongoActionModelMigration } from '../src/mongo-action-model-migration';
import { createClient, cursor } from './mongo-test-helpers';

describe('action model migration', () => {
    it('should preserve IDs and embedded structures while removing relationship semantics', async () => {
        const fake = createClient();
        fake.entityTypes.find.mockReturnValue(
            cursor([
                {
                    _id: 'customer',
                    name: 'customer',
                    _version: 2,
                    properties: [
                        {
                            name: 'owner',
                            type: 'reference',
                            relatedEntityTypeId: 'user',
                            relationKind: 'belongs-to-one',
                            reversePropertyId: 'users:customers',
                        },
                        {
                            name: 'groups',
                            type: 'array',
                            itemsType: 'reference',
                            relatedEntityTypeId: 'group',
                        },
                        { name: 'address', type: 'object', relatedEntityTypeId: 'address' },
                        {
                            name: 'addresses',
                            type: 'array',
                            itemsType: 'object',
                            relatedEntityTypeId: 'address',
                        },
                    ],
                },
                {
                    _id: 'entity-property',
                    name: 'entity-property',
                    _version: 1,
                    properties: [
                        { name: 'type', type: 'string', enum: ['reference', 'string'] },
                        { name: 'itemsType', type: 'string', enum: ['reference', 'string'] },
                        { name: 'relationKind', type: 'string' },
                        { name: 'reversePropertyId', type: 'string' },
                    ],
                },
                {
                    _id: 'unchanged',
                    name: 'unchanged',
                    _version: 1,
                    properties: [{ name: 'name', type: 'string' }],
                },
                { _id: 'incomplete', name: 'incomplete' },
            ]),
        );
        await new MongoActionModelMigration(fake.client).migrate();
        expect(fake.entityTypes.updateOne).toHaveBeenCalledTimes(2);
        expect(fake.entityTypes.updateOne).toHaveBeenCalledWith(
            { _id: 'customer', _version: 2 },
            {
                $set: {
                    _version: 3,
                    properties: [
                        { name: 'owner', type: 'string' },
                        { name: 'groups', type: 'array', itemsType: 'string' },
                        { name: 'address', type: 'object', relatedEntityTypeId: 'address' },
                        {
                            name: 'addresses',
                            type: 'array',
                            itemsType: 'object',
                            relatedEntityTypeId: 'address',
                        },
                    ],
                },
            },
        );
        const propertyUpdate = fake.entityTypes.updateOne.mock.calls[1][1].$set.properties;
        expect(propertyUpdate.map((field: { name: string }) => field.name)).toEqual([
            'type',
            'itemsType',
        ]);
        expect(propertyUpdate[0].enum).not.toContain('reference');
    });
    it('should allow new identities without the retired membership inputs', async () => {
        const fake = createClient();
        fake.entityTypes.find.mockReturnValue(
            cursor([
                {
                    _id: 'identity',
                    name: 'identity',
                    _version: 1,
                    properties: [
                        { name: 'members', type: 'array', itemsType: 'reference', required: true },
                    ],
                },
            ]),
        );
        await new MongoActionModelMigration(fake.client).migrate();
        expect(fake.entityTypes.updateOne).toHaveBeenCalledWith(
            { _id: 'identity', _version: 1 },
            {
                $set: {
                    _version: 2,
                    properties: [
                        { name: 'members', type: 'array', itemsType: 'string', required: false },
                    ],
                },
            },
        );
    });
    it('should leave an already migrated model unchanged', async () => {
        const fake = createClient();
        fake.entityTypes.find.mockReturnValue(
            cursor([
                {
                    _id: 'customer',
                    name: 'customer',
                    properties: [{ name: 'owner', type: 'string' }],
                },
            ]),
        );
        await new MongoActionModelMigration(fake.client).migrate();
        expect(fake.entityTypes.updateOne).not.toHaveBeenCalled();
    });
});
