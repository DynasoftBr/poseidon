import {
    entityEventTypes,
    entityMutationErrorCodes,
    type CreateEntityCommand,
    type DeleteEntityCommand,
    type EntityEvent,
    type EntityProjection,
    type EntityProperty,
    type UpdateEntityCommand,
} from '@poseidon/model';
import type { EventPublisher } from './event-publisher';
import { applyEntityRules } from './entity-rule-engine';
import { getCommands, toProperty } from './entity-model-utils';
import { createRelationEvents, deleteRelationEvents } from './relation-events';
import { validateEntity } from './entity-validator';
import {
    EntityAlreadyExistsError,
    EntityTypeNotFoundError,
    EntityVersionConflictError,
    ValidationError,
} from './poseidon-error';

export interface EntityStore {
    hasEntity(id: string): Promise<boolean>;
    findProjection(id: string): Promise<EntityProjection | null>;
    commit(events: EntityEvent[]): Promise<void>;
}

/** Creates records for any EntityType through the same event/projection path. */
export class EntityService {
    public constructor(
        private readonly store: EntityStore,
        private readonly publisher: EventPublisher,
    ) {}

    public async create(command: CreateEntityCommand, actorId: string): Promise<EntityProjection> {
        const entityType = await this.store.findProjection(command.entityTypeId);

        if (!entityType || entityType.entityTypeId !== 'entity-type') {
            throw new EntityTypeNotFoundError(command.entityTypeId);
        }
        if (await this.store.hasEntity(command.id)) {
            throw new EntityAlreadyExistsError(command.id);
        }

        const properties = await this.getProperties(entityType);
        const data = applyEntityRules(
            getCommands(entityType),
            'create',
            properties,
            applyDefaultsAndConventions(command.data, properties),
        );
        const problems = validateEntity(properties, data);

        if (problems.length > 0) throw new ValidationError(problems);
        await this.validateReferences(properties, data);

        const event: EntityEvent = {
            id: `entity-created:${command.entityTypeId}:${command.id}`,
            type: entityEventTypes.created,
            entityTypeId: command.entityTypeId,
            entityId: command.id,
            data,
            actorId,
            occurredAt: new Date(),
        };

        const events = [
            event,
            ...createRelationEvents(event, properties, data, {
                reverseProperties: await this.getReverseProperties(properties),
            }),
        ];
        await this.commit(events, command.id);
        this.publisher.publish(events);

        return {
            id: event.entityId,
            entityTypeId: event.entityTypeId,
            data: event.data,
            version: 1,
            createdAt: event.occurredAt,
            createdById: event.actorId,
        };
    }

    public async update(command: UpdateEntityCommand, actorId: string): Promise<EntityProjection> {
        const current = await this.requireCurrent(
            command.entityTypeId,
            command.id,
            command.expectedVersion,
        );
        const properties = await this.getProperties(
            await this.requireEntityType(command.entityTypeId),
        );
        const data = applyEntityRules(
            getCommands(await this.requireEntityType(command.entityTypeId)),
            'update',
            properties,
            applyDefaultsAndConventions({ ...current.data, ...command.data }, properties),
        );
        const problems = validateEntity(properties, data);

        if (problems.length > 0) throw new ValidationError(problems);
        await this.validateReferences(properties, data);

        const event: EntityEvent = {
            id: `entity-updated:${command.entityTypeId}:${command.id}:${command.expectedVersion + 1}`,
            type: entityEventTypes.updated,
            entityTypeId: command.entityTypeId,
            entityId: command.id,
            data,
            actorId,
            occurredAt: new Date(),
            expectedVersion: command.expectedVersion,
        };

        const events = [
            event,
            ...createRelationEvents(event, properties, data, {
                previousData: current.data,
                reverseProperties: await this.getReverseProperties(properties),
            }),
        ];
        await this.commit(events, command.id);
        this.publisher.publish(events);

        return {
            ...current,
            data,
            version: current.version + 1,
            changedAt: event.occurredAt,
            changedById: actorId,
        };
    }

    public async delete(command: DeleteEntityCommand, actorId: string): Promise<void> {
        const current = await this.requireCurrent(
            command.entityTypeId,
            command.id,
            command.expectedVersion,
        );
        const event: EntityEvent = {
            id: `entity-deleted:${command.entityTypeId}:${command.id}:${command.expectedVersion + 1}`,
            type: entityEventTypes.deleted,
            entityTypeId: command.entityTypeId,
            entityId: command.id,
            data: current.data,
            actorId,
            occurredAt: new Date(),
            expectedVersion: command.expectedVersion,
        };

        const entityType = await this.requireEntityType(command.entityTypeId);
        const properties = await this.getProperties(entityType);
        const events = [
            event,
            ...deleteRelationEvents(event, properties, current.data, {
                reverseProperties: await this.getReverseProperties(properties),
            }),
        ];
        await this.commit(events, command.id);
        this.publisher.publish(events);
    }

    private async requireEntityType(entityTypeId: string): Promise<EntityProjection> {
        const entityType = await this.store.findProjection(entityTypeId);

        if (!entityType || entityType.entityTypeId !== 'entity-type') {
            throw new EntityTypeNotFoundError(entityTypeId);
        }

        return entityType;
    }

    private async requireCurrent(
        entityTypeId: string,
        id: string,
        expectedVersion: number,
    ): Promise<EntityProjection> {
        const current = await this.store.findProjection(id);

        if (!current || current.entityTypeId !== entityTypeId || current.deletedAt) {
            throw new EntityTypeNotFoundError(id);
        }
        if (current.version !== expectedVersion) throw new EntityVersionConflictError(id);

        return current;
    }

    private async getProperties(entityType: EntityProjection): Promise<EntityProperty[]> {
        const propertyIds = entityType.data.properties;

        if (!Array.isArray(propertyIds) || !propertyIds.every((id) => typeof id === 'string')) {
            throw new ValidationError([
                {
                    property: 'properties',
                    message: 'Entity type has an invalid property definition.',
                },
            ]);
        }

        const projections = await Promise.all(
            propertyIds.map((id) => this.store.findProjection(id)),
        );

        return projections.map((projection, index) => toProperty(projection, propertyIds[index]));
    }

    private async validateReferences(
        properties: EntityProperty[],
        data: Record<string, unknown>,
    ): Promise<void> {
        const references = properties.filter(
            (property) => property.type === 'reference' && data[property.name] !== undefined,
        );

        const problems = (
            await Promise.all(
                references.map(async (property) => {
                    const value = data[property.name];
                    const ids = Array.isArray(value) ? value : [value];
                    const projections = await Promise.all(
                        ids.map((id) => this.store.findProjection(String(id))),
                    );

                    return projections.some(
                        (projection) =>
                            !projection ||
                            projection.entityTypeId !== property.relatedEntityTypeId ||
                            projection.deletedAt,
                    )
                        ? {
                              property: property.name,
                              message: 'Reference does not point to an existing related entity.',
                          }
                        : undefined;
                }),
            )
        ).filter(
            (problem): problem is { property: string; message: string } => problem !== undefined,
        );

        if (problems.length > 0) throw new ValidationError(problems);
    }

    private async getReverseProperties(
        properties: EntityProperty[],
    ): Promise<Map<string, EntityProperty>> {
        const reversePropertyIds = properties.flatMap((property) =>
            property.reversePropertyId ? [property.reversePropertyId] : [],
        );
        const projections = await Promise.all(
            reversePropertyIds.map((id) => this.store.findProjection(id)),
        );

        return new Map(
            projections.map((projection, index) => [
                reversePropertyIds[index],
                toProperty(projection, reversePropertyIds[index]),
            ]),
        );
    }

    private async commit(events: EntityEvent[], entityId: string): Promise<void> {
        try {
            await this.store.commit(events);
        } catch (error: unknown) {
            if (hasCode(error, entityMutationErrorCodes.versionConflict)) {
                throw new EntityVersionConflictError(entityId);
            }

            throw error;
        }
    }
}

function hasCode(error: unknown, code: string): error is { code: string } {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

function applyDefaultsAndConventions(
    input: Record<string, unknown>,
    properties: EntityProperty[],
): Record<string, unknown> {
    const data = { ...input };

    properties.forEach((property) => {
        if (data[property.name] === undefined && property.default !== undefined) {
            data[property.name] = resolveDefault(property.default);
        }
        const value = data[property.name];
        if (typeof value === 'string' && property.convention) {
            data[property.name] = applyConvention(value, property.convention);
        }
    });

    return data;
}

function resolveDefault(value: unknown): unknown {
    return value === '[[NOW]]' ? new Date().toISOString() : value;
}

function applyConvention(value: string, convention: EntityProperty['convention']): string {
    if (convention === 'lower-case') return value.toLowerCase();
    if (convention === 'upper-case') return value.toUpperCase();
    if (convention === 'capitalize-first-letter') {
        return value.replace(
            /\w\S*/g,
            (word) => word[0].toUpperCase() + word.slice(1).toLowerCase(),
        );
    }
    return value;
}
