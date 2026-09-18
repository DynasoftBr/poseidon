import { randomUUID } from 'node:crypto';
import type { Entity, APIAction, EntityData, QueryEntitiesAction } from '@poseidon/models';
import type { DataStorage } from '@poseidon/data-access';
import { EntityNotFoundError, ValidationError } from './poseidon-error';
import type { Repository } from './repository';
import type { RuntimeContext } from './runtime-context';
import { initializeEntityMetadata } from './system-actions';
import { system } from './system';
import { requireConcreteEntityType } from './entity-model-utils';

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
        return (await this.storage.query(this.entityTypeName, action)) as TEntity[];
    }

    public async create(data: EntityData): Promise<TEntity> {
        await this.requireConcreteType();
        const entity = initializeEntityMetadata(
            data,
            this.entityTypeName,
            this.context.user._id,
        ) as TEntity;
        await this.storage.create(this.entityTypeName, entity);
        return entity;
    }

    public async update(entity: TEntity): Promise<TEntity> {
        await this.requireConcreteType();
        await this.storage.update(this.entityTypeName, entity);
        return entity;
    }

    public async delete(id: string): Promise<void> {
        await this.requireConcreteType();
        return this.storage.delete(this.entityTypeName, id);
    }

    public async execute(actionName: string, payload: EntityData): Promise<unknown> {
        const action = (
            await this.context.repository('entity-type').get(this.entityTypeName)
        ).actions?.find((candidate) => candidate.name === actionName);
        if (!action) throw new Error(`Action '${actionName}' does not exist.`);

        const result = await this.runAction(action, {
            payload: createInput(payload),
            outputs: {},
        });
        return result.outputs[action.id] ?? result.payload;
    }

    private async requireConcreteType(): Promise<void> {
        const entityType = await this.storage.get('entity-type', this.entityTypeName);
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
                await this.delete(String(state.payload._id));
                return output(state, action.id, undefined);
            case 'script':
                return await this.executeScript(action, state);
            case 'business-rules':
                return state;
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

function createInput(payload: EntityData): EntityData {
    const {
        _entityTypeId,
        _version,
        _createdAt,
        _createdBy,
        _changedAt,
        _changedBy,
        _deletedAt,
        _deletedBy,
        ...input
    } = payload;
    return {
        ...input,
        _id: typeof input._id === 'string' ? input._id : randomUUID(),
    };
}
