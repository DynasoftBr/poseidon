import { randomUUID } from 'node:crypto';
import type { Entity, APIAction, EntityData, QueryEntitiesAction } from '@poseidon/models';
import type { DataStorage } from '@poseidon/data-access';
import {
    EntityNotFoundError,
    EntityTypeNotFoundError,
    EntityVersionConflictError,
    ValidationError,
    type ValidationProblem,
} from './poseidon-error';
import type { Repository } from './repository';
import type { RuntimeContext } from './runtime-context';
import { initializeEntityMetadata } from './system-actions';
import { system } from './system';
import { requireConcreteEntityType, getProperties } from './entity-model-utils';
import { prepareMutation } from './prepare-mutation';
import { applyBusinessRules } from './entity-rule-engine';

interface ActionState {
    payload: EntityData;
    outputs: Record<string, unknown>;
}

export class RuntimeRepository<TEntity extends Entity = Entity> implements Repository<TEntity> {
    private storage: DataStorage;

    public constructor(
        public readonly entityTypeName: string,
        private readonly context: RuntimeContext,
    ) {
        this.storage = context.storage;
    }

    public async get(id: string): Promise<TEntity> {
        await this.requireConcreteType();
        const entity = await this.storage.get(this.entityTypeName, id);
        if (!entity || entity._deletedAt) throw new EntityNotFoundError(id);
        return entity as TEntity;
    }

    public async query(action: QueryEntitiesAction): Promise<TEntity[]> {
        await this.requireConcreteType();
        return (await this.storage.query(this.entityTypeName, {
            ...action,
            entityTypeId: this.entityTypeName,
        })) as TEntity[];
    }

    public async create(data: EntityData): Promise<TEntity> {
        await this.requireConcreteType();
        const prepared = await prepareMutation(this.context, this.entityTypeName, data);
        const entity = initializeEntityMetadata(
            prepared,
            (await this.context.entityType(this.entityTypeName))!._id,
            this.context.user._id,
        ) as TEntity;
        await this.storage.create(this.entityTypeName, entity);
        return entity;
    }

    public async update(entity: TEntity): Promise<TEntity> {
        await this.requireConcreteType();
        const current = await this.get(entity._id);
        if (entity._version !== current._version) throw new EntityVersionConflictError(entity._id);
        const data = await prepareMutation(this.context, this.entityTypeName, entity, current);
        const updated = {
            ...current,
            ...data,
            _version: current._version + 1,
            _changedAt: new Date().toISOString(),
            _changedBy: this.context.user._id,
        } as TEntity;
        await this.storage.update(this.entityTypeName, updated);
        return updated;
    }

    public async delete(id: string, expectedVersion?: number): Promise<void> {
        await this.requireConcreteType();
        if (expectedVersion !== undefined && (await this.get(id))._version !== expectedVersion) {
            throw new EntityVersionConflictError(id);
        }
        return this.storage.delete(this.entityTypeName, id);
    }

    public async execute(actionName: string, payload: EntityData): Promise<unknown> {
        const type = await this.context.entityType(this.entityTypeName);
        if (!type) throw new EntityTypeNotFoundError(this.entityTypeName);
        const action =
            (type.actions as APIAction[] | undefined)?.find(
                (candidate) => candidate.name === actionName,
            ) ?? defaultAction(actionName);
        if (!action) throw new Error(`Action '${actionName}' does not exist.`);

        const result = await this.runAction(action, {
            payload:
                action.operation === 'create'
                    ? {
                          ...Object.fromEntries(
                              Object.entries(payload).filter(
                                  ([key]) => !key.startsWith('_') || key === '_id',
                              ),
                          ),
                          _id: payload._id ?? randomUUID(),
                      }
                    : { ...payload },
            outputs: {},
        });
        return action.id in result.outputs ? result.outputs[action.id] : result.payload;
    }

    private async requireConcreteType(): Promise<void> {
        const entityType = await this.context.entityType(this.entityTypeName);
        if (entityType) requireConcreteEntityType(entityType);
    }

    private async runAction(action: APIAction, state: ActionState): Promise<ActionState> {
        if (action.enabled === false) return state;

        try {
            await this.storage.beginTransaction();

            for (const before of action.before) {
                state = await this.runAction(before, state);
            }

            state = await this.executeOperation(action, state);
            await this.storage.commitTransaction();

            for (const after of action.after) {
                state = await this.runAction(after, state);
            }

            return state;
        } catch (error: unknown) {
            await this.storage.abortTransaction();
            throw error;
        }
    }

    private async executeOperation(action: APIAction, state: ActionState): Promise<ActionState> {
        switch (action.operation) {
            case 'create': {
                const entity = await this.create(state.payload);
                return output(state, action.id, entity, entity);
            }
            case 'update': {
                const entity = await this.update(state.payload as TEntity);
                return output(state, action.id, entity, entity);
            }
            case 'delete':
                await this.delete(
                    String(state.payload._id),
                    state.payload._version as number | undefined,
                );
                return output(state, action.id, undefined);
            case 'script':
                return await this.executeScript(action, state);
            case 'get':
                return output(state, action.id, await this.get(String(state.payload._id)));
            case 'query':
                return output(
                    state,
                    action.id,
                    await this.query({ ...state.payload, entityTypeId: this.entityTypeName }),
                );
            case 'validate':
                return output(state, action.id, await this.validate(state.payload));
            case 'business-rules': {
                const type = await this.context.entityType(this.entityTypeName);
                const payload = applyBusinessRules(
                    action.rules ?? [],
                    getProperties(type!),
                    state.payload,
                );
                return output(state, action.id, payload, payload);
            }
        }
    }

    private async validate(
        input: EntityData,
    ): Promise<{ valid: boolean; problems: ValidationProblem[] }> {
        try {
            await prepareMutation(this.context, this.entityTypeName, input);
            return { valid: true, problems: [] };
        } catch (error) {
            if (!(error instanceof ValidationError)) throw error;
            return { valid: false, problems: error.problems };
        }
    }

    private async executeScript(
        action: Extract<APIAction, { operation: 'script' }>,
        state: ActionState,
    ): Promise<ActionState> {
        const script = await this.context.repository('script').get(action.scriptId);
        const definition = action.system
            ? system.entityTypes.entityType.actions[
                  action.scriptId as keyof typeof system.entityTypes.entityType.actions
              ]
            : undefined;
        if (definition && script._createdBy === 'system') {
            const payload = await definition.code(
                state.payload,
                this.storage,
                this.context.user._id,
            );
            return output(state, action.id, payload, payload);
        }
        if (action.system || typeof script.code !== 'string' || !this.context.untrustedCodeRunner) {
            throw new ValidationError([
                {
                    property: 'scriptId',
                    message: `Script '${action.scriptId}' cannot be executed.`,
                },
            ]);
        }
        const result = await this.context.untrustedCodeRunner.execute(
            script.code,
            this.context,
            state.payload,
        );
        return output(state, action.id, result.output, result.payload ?? state.payload);
    }
}

function output(
    state: ActionState,
    id: string,
    value: unknown,
    payload: EntityData = state.payload,
): ActionState {
    return {
        payload,
        outputs: { ...state.outputs, [id]: value },
    };
}

function defaultAction(name: string): APIAction | undefined {
    const operations = ['create', 'update', 'delete', 'get', 'query', 'validate'] as const;
    const operation = operations.find((candidate) => candidate === name);
    return operation
        ? { id: name, name, label: name, enabled: true, operation, before: [], after: [] }
        : undefined;
}
