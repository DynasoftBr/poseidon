import type { Entity, EntityEvent, FormDefinition, JsonValue } from '@poseidon/models';
import {
    EntityService,
    EventPublisher,
    ValidationError,
    type EntityStore,
} from '@poseidon/runtime';
import { evaluate, prepareForm } from './forms';

interface Target {
    id: string;
    entityTypeId: string;
    data: Record<string, JsonValue>;
    expectedVersion?: number;
    definition: FormDefinition['entities'][number];
}
function targetsFor(definition: FormDefinition, fields: Record<string, JsonValue>): Target[] {
    const ids = new Set<string>();
    return definition.entities.map((target) => {
        const id = evaluate(target.id, fields);
        if (typeof id !== 'string' || ids.has(id)) {
            throw new Error('Each form target needs a distinct string ID.');
        }
        ids.add(id);
        const expectedVersion = target.expectedVersion
            ? evaluate(target.expectedVersion, fields)
            : undefined;
        if (
            expectedVersion !== undefined &&
            (typeof expectedVersion !== 'number' || !Number.isInteger(expectedVersion))
        ) {
            throw new Error('Invalid expected version.');
        }
        return {
            id,
            entityTypeId: target.entityTypeId,
            data: Object.fromEntries(
                Object.entries(target.values).map(([key, expression]) => [
                    key,
                    evaluate(expression, fields),
                ]),
            ),
            expectedVersion: expectedVersion as number | undefined,
            definition: target,
        };
    });
}
class FormStore implements EntityStore {
    public readonly events: EntityEvent[] = [];
    private readonly staged = new Map<string, Entity>();
    private readonly prospective = new Map<string, Entity>();
    public constructor(
        private readonly store: EntityStore,
        targets: Target[],
        actorId: string,
    ) {
        for (const target of targets) {
            this.prospective.set(target.id, {
                ...target.data,
                _id: target.id,
                _entityTypeId: target.entityTypeId,
                _version: target.expectedVersion ?? 1,
                _createdAt: new Date().toISOString(),
                _createdBy: actorId,
            });
        }
    }
    public hasEntity(id: string): Promise<boolean> {
        return this.staged.has(id) ? Promise.resolve(true) : this.store.hasEntity(id);
    }
    public async findProjection(id: string): Promise<Entity | null> {
        return (
            this.staged.get(id) ??
            (await this.store.findProjection(id)) ??
            this.prospective.get(id) ??
            null
        );
    }
    public async commit(events: EntityEvent[]): Promise<void> {
        for (const event of events) {
            const prior = await this.findProjection(event.entityId);
            this.staged.set(event.entityId, {
                ...prior,
                ...event.data,
                _id: event.entityId,
                _entityTypeId: event.entityTypeId,
                _version: event.type === 'entity-created' ? 1 : (event.expectedVersion ?? 0) + 1,
                _createdAt: prior?._createdAt ?? event.occurredAt.toISOString(),
                _createdBy: prior?._createdBy ?? event.actorId,
                ...(event.type === 'entity-deleted'
                    ? { _deletedAt: event.occurredAt.toISOString(), _deletedBy: event.actorId }
                    : {}),
            });
        }
        this.events.push(...events);
    }
}
export async function submitForm(
    store: EntityStore,
    publisher: EventPublisher,
    definition: FormDefinition,
    context: { input: Record<string, JsonValue>; actorId: string },
): Promise<Entity[]> {
    const targets = targetsFor(definition, prepareForm(definition, context.input));
    const buffer = new FormStore(store, targets, context.actorId);
    const service = new EntityService(buffer, new EventPublisher());
    const result: Entity[] = [];
    for (const target of targets) {
        try {
            const command = { id: target.id, entityTypeId: target.entityTypeId, data: target.data };
            result.push(
                target.expectedVersion === undefined
                    ? await service.create(command, context.actorId)
                    : await service.update(
                          { ...command, expectedVersion: target.expectedVersion },
                          context.actorId,
                      ),
            );
        } catch (error) {
            throw remapError(error, target);
        }
    }
    await store.commit(buffer.events);
    publisher.publish(buffer.events);
    return result;
}
function remapError(error: unknown, target: Target): unknown {
    if (!(error instanceof ValidationError)) return error;
    return new ValidationError(
        error.problems.map((problem) => {
            const property = problem.property
                .replace(/^\//, '')
                .split('/')[0]
                .replace(/~1/g, '/')
                .replace(/~0/g, '~');
            const expression = target.definition.values[property];
            return {
                ...problem,
                property: expression?.kind === 'field' ? expression.name : 'form',
            };
        }),
    );
}
