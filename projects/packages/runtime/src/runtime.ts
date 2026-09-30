import { randomUUID } from 'node:crypto';
import type { MongoClient } from 'mongodb';
import {
    definitionOf,
    operationAddress,
    operationMethodOf,
    type EntityClass,
    EntityAction as FrameworkAction,
    EntityProperty as FrameworkEntityProperty,
    EntityQuery as FrameworkQuery,
    type EntityTypeDefinition,
    type ActionDefinition,
    type QueryDefinition,
    type PoseidonRequest,
    type PoseidonTransport,
    type OperationReference,
    OperationReference as FrameworkOperationReference,
} from '@poseidon/framework';
import type { ActionContext } from './actions/action-context';
import type { RuntimeOperationContext } from './actions/runtime-operation-context';
import { applyConventions, applyDefaults } from './actions/entity-preparation';
import { EntityType as RuntimeEntityType } from './entity-types/entity-type';
import { Identity as RuntimeIdentity } from './entity-types/identity';
import {
    EntityTypeStore,
    type EntityRecord,
    type LoadedEntityTypeDefinition,
    type StoredEntityType,
} from './entity-types/entity-type-store';
import { User as RuntimeUser } from './entity-types/user';
import { EntityNotFoundError, ValidationError } from './poseidon-error';
import { RuntimeTransaction } from './runtime-transaction';
import { RelationshipManager } from './relationships/relationship-manager';
import { RelationshipStore } from './relationships/relationship-store';
import { validateEntity } from './validation/entity-validator';
import { resolveAllOperationPermissions } from './operation-permissions';
import { authorizeRuntimeRequest } from './runtime-authorization';

type DeclaredOperation = ActionDefinition | QueryDefinition;
/** Executes model operations and persists entities through MongoDB. */
export class Runtime implements PoseidonTransport {
    private readonly transaction: RuntimeTransaction;
    private readonly entityTypeStore: EntityTypeStore;
    private readonly relationships: RelationshipManager;
    private readonly runtimeEntityTypes = new Map<string, EntityClass>([
        [definitionOf(RuntimeEntityType).name, RuntimeEntityType],
        [definitionOf(RuntimeIdentity).name, RuntimeIdentity],
        [definitionOf(FrameworkEntityProperty).name, FrameworkEntityProperty],
        [definitionOf(FrameworkAction).name, FrameworkAction],
        [definitionOf(FrameworkQuery).name, FrameworkQuery],
        [definitionOf(RuntimeUser).name, RuntimeUser],
        [definitionOf(FrameworkOperationReference).name, FrameworkOperationReference],
    ]);

    /**
     * Creates the runtime.
     * @param {MongoClient} client - MongoDB client used by the runtime.
     */
    public constructor(private readonly client: MongoClient) {
        this.transaction = new RuntimeTransaction(client);
        this.entityTypeStore = new EntityTypeStore({
            getEntityType: (name) => this.getEntityType<LoadedEntityTypeDefinition>(name),
            get: (entityTypeName, id) => this.get(entityTypeName, id, true),
            save: (entityType, data) => this.save(entityType, data),
            validate: (entityType, data) => this.validate(entityType, data),
        });
        this.relationships = new RelationshipManager(
            new RelationshipStore(client, () => this.transaction.currentSession()),
            (entityTypeName, id) => this.get(entityTypeName, id, true),
            (entityTypeName, id) => this.delete(entityTypeName, id),
        );
    }

    /**
     * Sends a request to the runtime.
     * @template TResult - Action result.
     * @param {PoseidonRequest} request - {@link PoseidonRequest}.
     * @param {string | undefined} token - Authorization token for external requests.
     * @returns {Promise<TResult>} The action result.
     * @throws {@link Error} — If the entity type or operation does not exist, or execution fails.
     */
    public async send<TResult>(
        request: PoseidonRequest,
        token: string | undefined,
    ): Promise<TResult> {
        const entityType =
            (await this.getEntityType<EntityTypeDefinition>(request.entityType)) ??
            (request.entityType === definitionOf(RuntimeEntityType).name
                ? definitionOf(RuntimeEntityType)
                : null);
        if (!entityType) throw new EntityNotFoundError(request.entityType);

        const operation =
            entityType.actions?.find((candidate) => candidate.name === request.action) ??
            entityType.queries?.find((candidate) => candidate.name === request.action);
        if (!operation) throw new Error(`Operation '${request.action}' does not exist.`);

        const authenticated = await authorizeRuntimeRequest({
            entityType,
            operation,
            request,
            token,
        });

        const result = await this.runOperation(entityType, operation, {
            input: { ...request.payload },
            outputs: {},
            token: authenticated,
        });
        return result.outputs[operation._id] as TResult;
    }

    /**
     * Resolves every permission declared by one stored operation.
     * @param {string} address - Readable address of the operation.
     * @returns {Promise<string[]>} Promise resolving to all required operation addresses.
     */
    public resolveAllOperationPermissions(address: string): Promise<string[]> {
        return resolveAllOperationPermissions(address, (name) =>
            this.getEntityType<EntityTypeDefinition>(name),
        );
    }

    /**
     * Resolves a persisted operation reference to its readable API address.
     * @param {OperationReference} reference - Persisted {@link OperationReference} to the operation.
     * @returns {Promise<string>} Promise resolving to the readable operation address.
     */
    public async operationAddress(reference: OperationReference): Promise<string> {
        const entityType = await this.getEntityType<EntityTypeDefinition>(
            String(reference.entityTypeId),
        );
        if (!entityType) throw new EntityNotFoundError(String(reference.entityTypeId));
        const action = entityType.actions?.find(
            (operation) => operation._id === reference.operationId,
        );
        if (action) return operationAddress('action', entityType.name, action.name);
        const query = entityType.queries?.find(
            (operation) => operation._id === reference.operationId,
        );
        if (query) return operationAddress('query', entityType.name, query.name);
        throw new EntityNotFoundError(String(reference.operationId));
    }

    /**
     * Reads an entity by type and ID.
     * @template TEntity - Stored entity shape.
     * @param {string} entityTypeName - Entity type collection name.
     * @param {string} id - Entity ID.
     * @param {true} shouldThrow - Requires the entity to exist.
     * @returns {Promise<TEntity>} The stored entity.
     * @throws {@link Error} — If the entity is missing.
     */
    public get<TEntity extends EntityRecord = EntityRecord>(
        entityTypeName: string,
        id: string,
        shouldThrow: true,
    ): Promise<TEntity>;
    /**
     * Reads an entity by type and ID.
     * @template TEntity - Stored entity shape.
     * @param {string} entityTypeName - Entity type collection name.
     * @param {string} id - Entity ID.
     * @param {false} [shouldThrow=false] - Whether a missing entity throws an error.
     * @returns {Promise<TEntity | null>} The entity, or null when it is missing.
     */
    public get<TEntity extends EntityRecord = EntityRecord>(
        entityTypeName: string,
        id: string,
        shouldThrow?: false,
    ): Promise<TEntity | null>;
    /**
     * Reads a stored entity by its collection name and ID.
     * @template TEntity - Shape of the stored entity.
     * @param {string} entityTypeName - Name of the entity collection.
     * @param {string} id - Identifier of the entity to read or delete.
     * @param shouldThrow - Whether to throw when the entity is missing.
     * @returns {Promise<TEntity | null>} Promise resolving to the entity, or null when missing and not required.
     * @throws {@link Error} — If the entity is missing and shouldThrow is true.
     */
    public async get<TEntity extends EntityRecord = EntityRecord>(
        entityTypeName: string,
        id: string,
        shouldThrow = false,
    ): Promise<TEntity | null> {
        const entity = (await this.client
            .db()
            .collection<EntityRecord>(entityTypeName)
            .findOne({ _id: id }, this.transaction.options())) as TEntity | null;
        if (!entity && shouldThrow) throw new EntityNotFoundError(id);
        return entity;
    }

    /**
     * Reads an entity type by name.
     * @template TEntityType - Stored entity type shape.
     * @param {string} name - Entity type name.
     * @returns {Promise<TEntityType | null>} The entity type, or null when it is missing.
     */
    public async getEntityType<TEntityType extends EntityRecord = EntityRecord>(
        name: string,
    ): Promise<TEntityType | null> {
        const stored = (await this.client
            .db()
            .collection<EntityRecord>('entity-type')
            .findOne({ name }, this.transaction.options())) as StoredEntityType | null;
        if (stored) return (await this.entityTypeStore.hydrate(stored)) as unknown as TEntityType;
        return this.runtimeDefinition(name) as TEntityType | null;
    }

    private async runOperation(
        entityType: EntityTypeDefinition,
        operation: DeclaredOperation,
        state: ActionContext,
    ): Promise<ActionContext> {
        if (operation.enabled === false) return state;
        if (operation.name === 'save') state.input._id ??= randomUUID();

        try {
            this.transaction.begin();

            state.outputs[operation._id] = await this.executeOperation(
                entityType,
                operation,
                state,
            );
            await this.transaction.commit();

            return state;
        } catch (error: unknown) {
            await this.transaction.abort();
            throw error;
        }
    }

    private executeOperation(
        entityType: EntityTypeDefinition,
        operation: DeclaredOperation,
        state: ActionContext,
    ): Promise<unknown> {
        const entityClass = this.runtimeEntityTypes.get(entityType.name);
        const handler = entityClass && operationMethodOf(entityClass, operation.name);
        if (handler) {
            return Promise.resolve(
                (handler as (context: RuntimeOperationContext) => unknown)({
                    runtime: this,
                    entityType,
                    input: state.input,
                    outputs: state.outputs,
                    token: state.token,
                }),
            );
        }

        switch (operation.name) {
            case 'get':
                return this.get(entityType.name, String(state.input._id), true);
            case 'save':
                return this.save(entityType, state.input);
            case 'delete':
                return this.delete(entityType.name, String(state.input._id));
            case 'applyDefaults':
                return applyDefaults(state, entityType.properties);
            case 'applyConventions':
                return applyConventions(state, entityType.properties);
            case 'validate':
                return this.validate(entityType, state.input);
        }

        throw new Error(`Operation '${operation.name}' has no implementation.`);
    }

    /**
     * Persists entity data and its relationships.
     * @param {EntityTypeDefinition} entityType - {@link EntityTypeDefinition} targeted by the operation.
     * @param {Record<string, unknown>} data - Entity data to persist.
     * @returns {Promise<EntityRecord>} Promise resolving to the {@link EntityRecord}.
     */
    public async save(
        entityType: EntityTypeDefinition,
        data: Record<string, unknown>,
    ): Promise<EntityRecord> {
        const entity = {
            ...data,
            _id: typeof data._id === 'string' ? data._id : randomUUID(),
            _version: data._version === undefined ? 1 : data._version,
        } as EntityRecord;
        const persistent = this.relationships.dataWithoutRelationships(
            entityType,
            entity,
        ) as EntityRecord;
        if (data._version === undefined) await this.create(entityType.name, persistent);
        else await this.update(entityType.name, persistent);
        await this.relationships.save(entityType, entity, data);
        return entity;
    }

    /**
     * Applies submitted entity-type definitions.
     * @param {EntityTypeDefinition} entityType - {@link EntityTypeDefinition} used to persist the records.
     * @param {EntityTypeDefinition[]} definitions - {@link EntityTypeDefinition} records to create or update.
     * @returns {Promise<void>} Resolves after every definition is persisted.
     * @throws {@link Error} — If a definition cannot be persisted.
     */
    public applyDefinitions(
        entityType: EntityTypeDefinition,
        definitions: EntityTypeDefinition[],
    ): Promise<void> {
        return this.entityTypeStore.applyDefinitions(entityType, definitions);
    }

    private async validate(
        entityType: EntityTypeDefinition,
        data: Record<string, unknown>,
    ): Promise<void> {
        const problems = await validateEntity(entityType.properties, data, async (name) => {
            const definition = await this.getEntityType<EntityTypeDefinition>(name);
            if (!definition) throw new EntityNotFoundError(name);
            return definition;
        });
        if (problems.length > 0) throw new ValidationError(problems);
    }

    private async create(entityTypeName: string, entity: EntityRecord): Promise<void> {
        await this.requireConcreteType(entityTypeName);
        await this.client
            .db()
            .collection<EntityRecord>(entityTypeName)
            .insertOne(entity, this.transaction.options());
    }

    private async update(entityTypeName: string, entity: EntityRecord): Promise<void> {
        await this.requireConcreteType(entityTypeName);
        const result = await this.client
            .db()
            .collection<EntityRecord>(entityTypeName)
            .replaceOne({ _id: entity._id }, entity, this.transaction.options());
        if (result.matchedCount !== 1) throw new Error(`Entity '${entity._id}' does not exist.`);
    }

    /**
     * Deletes an entity and applies its relationship deletion rules.
     * @param {string} entityTypeName - Name of the entity collection.
     * @param {string} id - Identifier of the entity to read or delete.
     * @returns {Promise<void>} Promise resolving after the entity is deleted.
     * @throws {@link Error} — If the entity type or entity does not exist, or a relationship prevents deletion.
     */
    public async delete(entityTypeName: string, id: string): Promise<void> {
        const entityType = await this.getEntityType<EntityTypeDefinition>(entityTypeName);
        if (!entityType) throw new EntityNotFoundError(entityTypeName);
        await this.requireConcreteType(entityTypeName);
        await this.relationships.delete(entityType, id);
        const result = await this.client
            .db()
            .collection<EntityRecord>(entityTypeName)
            .deleteOne({ _id: id }, this.transaction.options());
        if (result.deletedCount !== 1) throw new Error(`Entity '${id}' does not exist.`);
    }

    private async requireConcreteType(name: string): Promise<void> {
        const entityType = await this.getEntityType(name);
        if (entityType?.structure === true) {
            throw new Error(`Structure '${name}' cannot be persisted independently.`);
        }
    }

    private runtimeDefinition(name: string): EntityTypeDefinition | null {
        const entityClass = this.runtimeEntityTypes.get(name);
        return entityClass ? definitionOf(entityClass) : null;
    }
}
