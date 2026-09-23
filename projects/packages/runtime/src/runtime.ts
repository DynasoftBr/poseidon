import { randomUUID } from 'node:crypto';
import type { ClientSession, MongoClient } from 'mongodb';
import {
    definitionOf,
    operationMethodOf,
    type EntityClass,
    type EntityId,
    type EntityTypeDefinition,
    type PoseidonAction,
    type PoseidonQuery,
    type PoseidonRequest,
    type PoseidonTransport,
} from '@poseidon/framework';
import type { ActionContext } from './actions/action-context';
import type { RuntimeOperationContext } from './actions/runtime-operation-context';
import { applyConventions, applyDefaults } from './actions/entity-preparation';
import { EntityType as RuntimeEntityType } from './entity-types/entity-type';
import { EntityNotFoundError } from './poseidon-error';

type EntityRecord = Record<string, unknown> & { _id: EntityId };
type DeclaredOperation = PoseidonAction | PoseidonQuery;

/** Executes declared actions against MongoDB. */
export class Runtime implements PoseidonTransport {
    private session?: ClientSession;
    private transactionDepth = 0;
    private readonly runtimeEntityTypes = new Map<string, EntityClass>([
        [definitionOf(RuntimeEntityType).name, RuntimeEntityType],
    ]);

    /**
     * Creates the runtime.
     * @param {MongoClient} client - MongoDB client used by the runtime.
     */
    public constructor(private readonly client: MongoClient) {}

    /**
     * Sends a request to the runtime.
     * @template TResult - Action result.
     * @param {PoseidonRequest} request - Action invocation.
     * @param {string | undefined} _token - Authorization token, currently unused.
     * @returns {Promise<TResult>} The action result.
     * @throws If the entity type or operation does not exist, or execution fails.
     */
    public async send<TResult>(
        request: PoseidonRequest,
        _token: string | undefined,
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

        const result = await this.runOperation(entityType, operation, {
            input: { ...request.payload },
            outputs: {},
        });
        return result.outputs[operation.id] as TResult;
    }

    /**
     * Reads an entity by type and ID.
     * @template TEntity - Stored entity shape.
     * @param {string} entityTypeName - Entity type collection name.
     * @param {string} id - Entity ID.
     * @param {boolean} [shouldThrow=false] - Whether a missing entity throws an error.
     * @returns {Promise<TEntity | null>} The entity, or null when it is missing.
     */
    public get<TEntity extends EntityRecord = EntityRecord>(
        entityTypeName: string,
        id: string,
        shouldThrow: true,
    ): Promise<TEntity>;
    public get<TEntity extends EntityRecord = EntityRecord>(
        entityTypeName: string,
        id: string,
        shouldThrow?: false,
    ): Promise<TEntity | null>;
    public async get<TEntity extends EntityRecord = EntityRecord>(
        entityTypeName: string,
        id: string,
        shouldThrow = false,
    ): Promise<TEntity | null> {
        const entity = (await this.client
            .db()
            .collection<EntityRecord>(entityTypeName)
            .findOne({ _id: id }, this.options())) as TEntity | null;
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
        return (await this.client
            .db()
            .collection<EntityRecord>('entity-type')
            .findOne({ name }, this.options())) as TEntityType | null;
    }

    private async runOperation(
        entityType: EntityTypeDefinition,
        operation: DeclaredOperation,
        state: ActionContext,
    ): Promise<ActionContext> {
        if (operation.enabled === false) return state;
        if (operation.name === 'save') state.input._id ??= randomUUID();

        try {
            this.beginTransaction();

            if ('before' in operation) {
                for (const before of operation.before) {
                    await this.runOperation(entityType, before, state);
                }
            }

            state.outputs[operation.id] = await this.executeOperation(entityType, operation, state);
            await this.commitTransaction();

            return state;
        } catch (error: unknown) {
            await this.abortTransaction();
            throw error;
        }
    }

    private executeOperation(
        entityType: EntityTypeDefinition,
        operation: DeclaredOperation,
        state: ActionContext,
    ): Promise<unknown> {
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
        }

        const entityClass = this.runtimeEntityTypes.get(entityType.name);
        const handler = entityClass && operationMethodOf(entityClass, operation.name);
        if (!handler) throw new Error(`Operation '${operation.name}' has no implementation.`);

        return Promise.resolve(
            (handler as (context: RuntimeOperationContext) => unknown)({
                runtime: this,
                entityType,
                input: state.input,
                outputs: state.outputs,
            }),
        );
    }

    public async save(
        entityType: EntityTypeDefinition,
        data: Record<string, unknown>,
    ): Promise<EntityRecord> {
        if (data._version !== undefined) {
            await this.update(entityType.name, data as EntityRecord);
            return data as EntityRecord;
        }

        const entity = {
            ...data,
            _id: typeof data._id === 'string' ? data._id : randomUUID(),
            _version: 1,
        } as EntityRecord;
        await this.create(entityType.name, entity);
        return entity;
    }

    /**
     * Applies submitted entity-type definitions.
     * @param {EntityTypeDefinition} entityType - EntityType definition used to persist the records.
     * @param {EntityTypeDefinition[]} definitions - Definitions to create or update.
     * @returns {Promise<void>} Resolves after every definition is persisted.
     * @throws If a definition cannot be persisted.
     */
    public async applyDefinitions(
        entityType: EntityTypeDefinition,
        definitions: EntityTypeDefinition[],
    ): Promise<void> {
        for (const definition of definitions) {
            const current = await this.getEntityType<EntityTypeDefinition>(definition.name);
            await this.save(entityType, { ...current, ...definition });
        }
    }

    private async create(entityTypeName: string, entity: EntityRecord): Promise<void> {
        await this.requireConcreteType(entityTypeName);
        await this.client
            .db()
            .collection<EntityRecord>(entityTypeName)
            .insertOne(entity, this.options());
    }

    private async update(entityTypeName: string, entity: EntityRecord): Promise<void> {
        await this.requireConcreteType(entityTypeName);
        const result = await this.client
            .db()
            .collection<EntityRecord>(entityTypeName)
            .replaceOne({ _id: entity._id }, entity, this.options());
        if (result.matchedCount !== 1) throw new Error(`Entity '${entity._id}' does not exist.`);
    }

    public async delete(entityTypeName: string, id: string): Promise<void> {
        await this.requireConcreteType(entityTypeName);
        const result = await this.client
            .db()
            .collection<EntityRecord>(entityTypeName)
            .deleteOne({ _id: id }, this.options());
        if (result.deletedCount !== 1) throw new Error(`Entity '${id}' does not exist.`);
    }

    private beginTransaction(): void {
        if (this.session) {
            this.transactionDepth += 1;
            return;
        }
        this.session = this.client.startSession();
        this.session.startTransaction();
        this.transactionDepth = 1;
    }

    private async commitTransaction(): Promise<void> {
        this.transactionDepth -= 1;
        if (this.transactionDepth > 0) return;
        try {
            await this.session?.commitTransaction();
        } finally {
            await this.endSession();
        }
    }

    private async abortTransaction(): Promise<void> {
        try {
            await this.session?.abortTransaction();
        } finally {
            await this.endSession();
        }
    }

    private async endSession(): Promise<void> {
        await this.session?.endSession();
        this.session = undefined;
        this.transactionDepth = 0;
    }

    private options(): { session: ClientSession } | undefined {
        return this.session ? { session: this.session } : undefined;
    }

    private async requireConcreteType(name: string): Promise<void> {
        const entityType = await this.getEntityType(name);
        if (entityType?.structure === true) {
            throw new Error(`Structure '${name}' cannot be persisted independently.`);
        }
    }
}
