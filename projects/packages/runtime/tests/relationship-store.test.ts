import type { MongoClient } from 'mongodb';
import { RelationshipStore } from '../src/relationships/relationship-store';

interface RecordedRelationship {
    endpoints: [
        { entityPropertyId: string; entityId: string },
        { entityPropertyId: string; entityId: string },
    ];
    uniqueEndpointKeys: string[];
}

class RelationshipMongo {
    readonly indexes: Array<{ keys: object; options: object }> = [];
    readonly records: RecordedRelationship[] = [];

    client(): MongoClient {
        return {
            db: () => ({
                collection: () => ({
                    createIndex: (keys: object, options: object) => {
                        this.indexes.push({ keys, options });
                        return Promise.resolve('uniqueEndpointKeys_1');
                    },
                    insertOne: (record: RecordedRelationship) => {
                        this.records.push(record);
                        return Promise.resolve({ acknowledged: true });
                    },
                }),
            }),
        } as unknown as MongoClient;
    }
}

describe('RelationshipStore', () => {
    it('should store one canonical record and keys for to-one endpoints', async () => {
        const mongo = new RelationshipMongo();
        const store = new RelationshipStore(mongo.client(), () => undefined);

        await store.create(
            { entityPropertyId: 'ticket:creator', entityId: 'ticket-1', cardinality: 'one' },
            {
                entityPropertyId: 'user:createdTickets',
                entityId: 'user-1',
                cardinality: 'many',
            },
        );

        expect(mongo.indexes).toEqual([
            { keys: { uniqueEndpointKeys: 1 }, options: { unique: true } },
        ]);
        expect(mongo.records).toEqual([
            {
                endpoints: [
                    { entityPropertyId: 'ticket:creator', entityId: 'ticket-1' },
                    { entityPropertyId: 'user:createdTickets', entityId: 'user-1' },
                ],
                uniqueEndpointKeys: ['ticket:creator:ticket-1'],
            },
        ]);
    });

    it('should enforce both endpoints for a one-to-one relationship', async () => {
        const mongo = new RelationshipMongo();
        const store = new RelationshipStore(mongo.client(), () => undefined);

        await store.create(
            { entityPropertyId: 'passport:holder', entityId: 'passport-1', cardinality: 'one' },
            { entityPropertyId: 'user:passport', entityId: 'user-1', cardinality: 'one' },
        );

        expect(mongo.records[0]?.uniqueEndpointKeys).toEqual([
            'passport:holder:passport-1',
            'user:passport:user-1',
        ]);
    });

    it('should not create uniqueness keys for a many-to-many relationship', async () => {
        const mongo = new RelationshipMongo();
        const store = new RelationshipStore(mongo.client(), () => undefined);

        await store.create(
            { entityPropertyId: 'user:groups', entityId: 'user-1', cardinality: 'many' },
            { entityPropertyId: 'group:members', entityId: 'group-1', cardinality: 'many' },
        );

        expect(mongo.records[0]?.uniqueEndpointKeys).toEqual([]);
    });
});
