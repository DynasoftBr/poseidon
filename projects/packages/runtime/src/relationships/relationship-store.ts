import type { ClientSession, MongoClient } from 'mongodb';
import type { EntityId, RelationshipCardinality } from '@poseidon/framework';

export const relationshipCollectionName = 'relationship';

export interface RelationshipEndpoint {
    entityPropertyId: EntityId;
    entityId: EntityId;
}

export interface RelationshipRecord {
    endpoints: [RelationshipEndpoint, RelationshipEndpoint];
    uniqueEndpointKeys: string[];
}

export interface RelationshipEndpointInput extends RelationshipEndpoint {
    cardinality: RelationshipCardinality;
}

/** Persists canonical relationship records in the application database. */
export class RelationshipStore {
    private indexCreation?: Promise<void>;

    /**
     * Creates a relationship store.
     * @param {MongoClient} client - MongoDB client used for relationship records.
     * @param {() => ClientSession | undefined} session - Current transaction session provider.
     */
    public constructor(
        private readonly client: MongoClient,
        private readonly session: () => ClientSession | undefined,
    ) {}

    /**
     * Creates the unique index that enforces to-one relationship endpoints.
     * @returns {Promise<void>} Resolves once the index exists.
     */
    public async ensureIndexes(): Promise<void> {
        this.indexCreation ??= this.collection()
            .createIndex({ uniqueEndpointKeys: 1 }, { unique: true })
            .then(() => undefined);
        await this.indexCreation;
    }

    /**
     * Creates one canonical relationship record for two inverse endpoints.
     * @param {RelationshipEndpointInput} first - One declared endpoint.
     * @param {RelationshipEndpointInput} second - Its declared inverse endpoint.
     * @returns {Promise<void>} Resolves once the relationship is stored.
     */
    public async replace(
        first: RelationshipEndpointInput,
        second: RelationshipEndpointInput,
    ): Promise<void> {
        await this.remove(first);
        await this.create(first, second);
    }

    /**
     * Creates one canonical relationship record for two inverse endpoints.
     * @param {RelationshipEndpointInput} first - One declared endpoint.
     * @param {RelationshipEndpointInput} second - Its declared inverse endpoint.
     * @returns {Promise<void>} Resolves once the relationship is stored.
     */
    public async create(
        first: RelationshipEndpointInput,
        second: RelationshipEndpointInput,
    ): Promise<void> {
        await this.ensureIndexes();
        const relationship: RelationshipRecord = {
            endpoints: [endpointOf(first), endpointOf(second)],
            uniqueEndpointKeys: uniqueEndpointKeys(first, second),
        };
        await this.collection().insertOne(relationship, this.options());
    }

    /** Returns every relationship containing an endpoint. */
    public find(endpoint: RelationshipEndpoint): Promise<RelationshipRecord[]> {
        return this.collection()
            .find({ endpoints: { $elemMatch: endpointOf(endpoint) } }, this.options())
            .toArray();
    }

    /** Removes every relationship containing an endpoint. */
    public async remove(endpoint: RelationshipEndpoint): Promise<void> {
        await this.collection().deleteMany(
            { endpoints: { $elemMatch: endpointOf(endpoint) } },
            this.options(),
        );
    }

    private collection() {
        return this.client.db().collection<RelationshipRecord>(relationshipCollectionName);
    }

    private options(): { session: ClientSession } | undefined {
        const session = this.session();
        return session ? { session } : undefined;
    }
}

function endpointOf({ entityPropertyId, entityId }: RelationshipEndpoint): RelationshipEndpoint {
    return { entityPropertyId, entityId };
}

function uniqueEndpointKeys(
    first: RelationshipEndpointInput,
    second: RelationshipEndpointInput,
): string[] {
    return [first, second]
        .filter((endpoint) => endpoint.cardinality === 'one')
        .map((endpoint) => `${endpoint.entityPropertyId}:${endpoint.entityId}`);
}
