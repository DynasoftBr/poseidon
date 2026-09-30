import type { ClientSession, MongoClient } from 'mongodb';
import type { EntityId, RelationshipCardinality } from '@poseidon/framework';

export const relationshipCollectionName = 'relationship';

/** Identifies the entity and property at one end of a relationship. */
export interface RelationshipEndpoint {
    /** {@link EntityId} of the relationship property. */
    entityPropertyId: EntityId;
    /** {@link EntityId} of the entity at this endpoint. */
    entityId: EntityId;
}

/** Stored link between two entity relationship endpoints. */
export interface RelationshipRecord {
    /** The two {@link RelationshipEndpoint} values connected by this relationship. */
    endpoints: [RelationshipEndpoint, RelationshipEndpoint];
    /** Endpoint keys used to enforce single-valued relationships. */
    uniqueEndpointKeys: string[];
}

/** Relationship endpoint with its declared cardinality. */
export interface RelationshipEndpointInput extends RelationshipEndpoint {
    /** {@link RelationshipCardinality} limiting the related entities at this endpoint. */
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
     * @param {RelationshipEndpointInput} first - One {@link RelationshipEndpointInput}.
     * @param {RelationshipEndpointInput} second - Its {@link RelationshipEndpointInput}.
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
     * @param {RelationshipEndpointInput} first - One {@link RelationshipEndpointInput}.
     * @param {RelationshipEndpointInput} second - Its {@link RelationshipEndpointInput}.
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

    /**
     * Returns every relationship containing an endpoint.
     * @param {RelationshipEndpoint} endpoint - {@link RelationshipEndpoint}.
     * @returns {Promise<RelationshipRecord[]>} Promise resolving to the matching {@link RelationshipRecord}.
     */
    public find(endpoint: RelationshipEndpoint): Promise<RelationshipRecord[]> {
        return this.collection()
            .find({ endpoints: { $elemMatch: endpointOf(endpoint) } }, this.options())
            .toArray();
    }

    /**
     * Removes every relationship containing an endpoint.
     * @param {RelationshipEndpoint} endpoint - {@link RelationshipEndpoint}.
     */
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
