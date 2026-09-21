import { randomUUID } from 'node:crypto';
import type { Entity, EntityType, APIAction, EntityData } from '@poseidon/models';
import type { DataStorage } from '@poseidon/data-access';
import { EntityNotFoundError, ValidationError, type ValidationProblem } from './poseidon-error';
import type { Repository } from './repository';
import type { RuntimeContext } from './runtime-context';
import { addMandatoryProperties } from './add-mandatory-properties';
import { defaultAction } from './default-action';
import { applyDefaults, applyConventions } from './entity-preparation';
import { getProperties } from './entity-model-utils';
import { validateEntity } from './entity-validator';

import type { ActionContext } from './action-context';

export class RuntimeRepository<TEntity extends Entity = Entity> implements Repository<TEntity> {
    protected readonly storage: DataStorage;

    private readonly handlers = new Map<string, (context: ActionContext) => Promise<unknown>>([
        ['create', ({ input }) => this.create(input)],
        ['update', ({ input }) => this.update(input as TEntity)],
        ['delete', ({ input }) => this.delete(String(input._id))],
        ['get', ({ input }) => this.get(String(input._id))],
        ['validate', ({ input }) => this.validate(input)],
        ['applyDefaults', (context) => applyDefaults(context, getProperties(this.entityType))],
        [
            'applyConventions',
            (context) => applyConventions(context, getProperties(this.entityType)),
        ],
        ['addMandatoryProperties', (context) => addMandatoryProperties(context, this.storage)],
    ]);

    public constructor(
        public readonly entityType: EntityType,
        context: RuntimeContext,
    ) {
        this.storage = context.storage;
    }

    public get entityTypeName(): string {
        return this.entityType.name;
    }

    public async get(id: string): Promise<TEntity> {
        const entity = await this.storage.get(this.entityTypeName, id);
        if (!entity) throw new EntityNotFoundError(id);
        return entity as TEntity;
    }

    public async create(data: EntityData): Promise<TEntity> {
        const entity = {
            ...data,
            _id: typeof data._id === 'string' ? data._id : randomUUID(),
        } as TEntity;
        await this.storage.create(this.entityTypeName, entity);
        return entity;
    }

    public async update(entity: TEntity): Promise<TEntity> {
        await this.storage.update(this.entityTypeName, entity);
        return entity;
    }

    public delete(id: string): Promise<void> {
        return this.storage.delete(this.entityTypeName, id);
    }

    public async execute(actionName: string, payload: EntityData): Promise<unknown> {
        const action =
            this.entityType.actions?.find((candidate) => candidate.name === actionName) ??
            defaultAction(actionName);
        if (!action) throw new Error(`Action '${actionName}' does not exist.`);

        const result = await this.runAction(action, {
            input: { ...payload },
            outputs: {},
        });
        return result.outputs[action.id];
    }

    private async runAction(action: APIAction, state: ActionContext): Promise<ActionContext> {
        if (action.enabled === false) return state;
        if (action.name === 'create') state.input._id ??= randomUUID();

        try {
            await this.storage.beginTransaction();

            for (const before of action.before) {
                await this.runAction(before, state);
            }

            state.outputs[action.id] = await this.executeAction(action.name, state);
            await this.storage.commitTransaction();

            return state;
        } catch (error: unknown) {
            await this.storage.abortTransaction();
            throw error;
        }
    }

    private executeAction(name: string, context: ActionContext): Promise<unknown> {
        const handler = this.handlers.get(name);
        if (!handler) throw new Error(`Action '${name}' has no implementation.`);
        return handler(context);
    }

    private validate(
        input: EntityData,
    ): Promise<{ valid: boolean; problems: ValidationProblem[] }> {
        try {
            const fields = getProperties(this.entityType).filter(
                (field) => !field.name.startsWith('_'),
            );
            const problems = validateEntity(
                fields,
                Object.fromEntries(Object.entries(input).filter(([key]) => !key.startsWith('_'))),
            );
            return Promise.resolve({ valid: problems.length === 0, problems });
        } catch (error) {
            if (!(error instanceof ValidationError)) return Promise.reject(error);
            return Promise.resolve({ valid: false, problems: error.problems });
        }
    }
}
