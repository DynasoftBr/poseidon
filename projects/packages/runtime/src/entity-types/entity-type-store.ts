import {
    definitionOf,
    EntityAction as FrameworkAction,
    EntityQuery as FrameworkQuery,
    EntityProperty as FrameworkEntityProperty,
    type EntityId,
    type EntityTypeDefinition,
} from '@poseidon/framework';
import type { EntityRef } from '@poseidon/utilities';

/** Stored entity data identified by a persistent ID. */
export type EntityRecord = Record<string, unknown> & {
    /** Persistent {@link EntityId} of the entity. */
    _id: EntityId;
};
/** Persisted EntityType definition record with references to its child records. */
export type StoredEntityType = Omit<EntityTypeDefinition, 'properties' | 'actions' | 'queries'> & {
    /** {@link EntityRef} values pointing to property definition records. */
    properties: EntityRef<{ _id: string }>[];
    /** {@link EntityRef} values pointing to Action definition records. */
    actions?: EntityRef<{ _id: string }>[];
    /** {@link EntityRef} values pointing to Query definition records. */
    queries?: EntityRef<{ _id: string }>[];
};
/** Hydrated EntityType definition record with its persistence version. */
export type LoadedEntityTypeDefinition = EntityTypeDefinition & {
    /** Version of the persisted entity. */
    _version?: number;
};

interface EntityTypeStorage {
    getEntityType(name: string): Promise<LoadedEntityTypeDefinition | null>;
    get(entityTypeName: string, id: string): Promise<EntityRecord>;
    save(entityType: EntityTypeDefinition, data: Record<string, unknown>): Promise<EntityRecord>;
    validate(entityType: EntityTypeDefinition, data: Record<string, unknown>): Promise<void>;
}

/** Persists EntityType definitions and their referenced metadata records. */
export class EntityTypeStore {
    /**
     * Creates a store using the supplied entity persistence operations.
     * @param {EntityTypeStorage} storage - {@link EntityTypeStorage} used to read, validate, and persist definitions.
     */
    public constructor(private readonly storage: EntityTypeStorage) {}

    /**
     * Persists each submitted definition and its referenced child records.
     * @param {EntityTypeDefinition} entityType - {@link EntityTypeDefinition} governing persistence.
     * @param {EntityTypeDefinition[]} definitions - {@link EntityTypeDefinition} records to create or update.
     * @returns {Promise<void>} Promise resolving after all definitions have been persisted.
     */
    public async applyDefinitions(
        entityType: EntityTypeDefinition,
        definitions: EntityTypeDefinition[],
    ): Promise<void> {
        for (const definition of definitions) await this.applyDefinition(entityType, definition);
    }

    /**
     * Loads the property and operation records referenced by a stored definition.
     * @param {StoredEntityType} stored - {@link StoredEntityType} with child references.
     * @returns {Promise<EntityTypeDefinition>} Promise resolving to the {@link EntityTypeDefinition}.
     */
    public async hydrate(stored: StoredEntityType): Promise<EntityTypeDefinition> {
        const [properties, actions, queries] = await Promise.all([
            this.loadReferences<FrameworkEntityProperty>('entity-property', stored.properties),
            this.loadReferences<FrameworkAction>('action', stored.actions),
            this.loadReferences<FrameworkQuery>('query', stored.queries),
        ]);
        return {
            ...stored,
            properties,
            ...(stored.actions === undefined ? {} : { actions }),
            ...(stored.queries === undefined ? {} : { queries }),
        } as EntityTypeDefinition;
    }

    private async applyDefinition(
        entityType: EntityTypeDefinition,
        definition: EntityTypeDefinition,
    ): Promise<void> {
        const current = await this.storage.getEntityType(definition.name);
        const properties = await this.persistChildren(
            definitionOf(FrameworkEntityProperty),
            definition._id,
            definition.properties,
            current?.properties,
        );
        const actions = await this.persistChildren(
            definitionOf(FrameworkAction),
            definition._id,
            definition.actions,
            current?.actions,
        );
        const queries = await this.persistChildren(
            definitionOf(FrameworkQuery),
            definition._id,
            definition.queries,
            current?.queries,
        );
        const {
            actions: _actions,
            properties: _properties,
            queries: _queries,
            ...data
        } = definition;
        const storedDefinition: StoredEntityType = {
            ...data,
            ...(current?._version === undefined ? {} : { _version: current._version }),
            properties,
            ...(actions === undefined ? {} : { actions }),
            ...(queries === undefined ? {} : { queries }),
        };
        await this.storage.validate(entityType, storedDefinition);
        await this.storage.save(entityType, storedDefinition);
    }

    private persistChildren<TEntity extends { _id?: EntityId; _version?: number; name: string }>(
        entityType: EntityTypeDefinition,
        ownerId: EntityId,
        definitions: TEntity[],
        current: TEntity[] | undefined,
    ): Promise<EntityRef<{ _id: string }>[]>;
    private persistChildren<TEntity extends { _id?: EntityId; _version?: number; name: string }>(
        entityType: EntityTypeDefinition,
        ownerId: EntityId,
        definitions: TEntity[] | undefined,
        current: TEntity[] | undefined,
    ): Promise<EntityRef<{ _id: string }>[] | undefined>;
    private async persistChildren<
        TEntity extends { _id?: EntityId; _version?: number; name: string },
    >(
        entityType: EntityTypeDefinition,
        ownerId: EntityId,
        definitions: TEntity[] | undefined,
        current: TEntity[] | undefined,
    ): Promise<EntityRef<{ _id: string }>[] | undefined> {
        if (definitions === undefined) return undefined;
        const currentById = new Map((current ?? []).map((entity) => [entity._id, entity]));
        const references: EntityRef<{ _id: string }>[] = [];
        for (const definition of definitions) {
            const _id = definition._id ?? `${ownerId}:${definition.name}`;
            const existing = currentById.get(_id);
            await this.storage.save(entityType, {
                ...definition,
                _id,
                ...(existing?._version === undefined ? {} : { _version: existing._version }),
            });
            references.push({ _id });
        }
        return references;
    }

    private loadReferences<TEntity>(
        entityTypeName: string,
        references: EntityRef<{ _id: string }>[] | undefined,
    ): Promise<TEntity[]> {
        return Promise.all(
            (references ?? []).map(({ _id }) =>
                this.storage.get(entityTypeName, _id).then((entity) => entity as TEntity),
            ),
        );
    }
}
