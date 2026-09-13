/* eslint-disable complexity, max-lines, max-lines-per-function, max-params */
import {
    entityEventTypes,
    entityMutationErrorCodes,
    type CreateEntityCommand,
    type DeleteEntityCommand,
    type EntityEvent,
    type Entity,
    type EntityProperty,
    type QueryEntitiesCommand,
    type UpdateEntityCommand,
} from '@poseidon/model';
import type { EventPublisher } from './event-publisher';
import { applyEntityRules } from './entity-rule-engine';
import { getCommands, toProperty } from './entity-model-utils';
import { createRelationEvents, deleteRelationEvents } from './relation-events';
import { validateEntity } from './entity-validator';
import {
    EntityAlreadyExistsError,
    EntityNotFoundError,
    EntityTypeNotFoundError,
    EntityVersionConflictError,
    ValidationError,
} from './poseidon-error';

export interface EntityStore {
    hasEntity(id: string): Promise<boolean>;
    findProjection(id: string): Promise<Entity | null>;
    commit(events: EntityEvent[]): Promise<void>;
    findByEntityType?(command: QueryEntitiesCommand): Promise<Entity[]>;
}

/** Creates records for any EntityType through the same event/projection path. */
export class EntityService {
    public constructor(
        private readonly store: EntityStore,
        private readonly publisher: EventPublisher,
    ) {}

    public async create(command: CreateEntityCommand, actorId: string): Promise<Entity> {
        const entityType = await this.store.findProjection(command.entityTypeId);

        if (!entityType || entityType.entityTypeId !== 'entity-type') {
            throw new EntityTypeNotFoundError(command.entityTypeId);
        }
        if (await this.store.hasEntity(command.id)) {
            throw new EntityAlreadyExistsError(command.id);
        }

        const properties = await this.getProperties(entityType);
        const prepared = await this.prepareNestedMutations(
            command.entityTypeId,
            command.data,
            actorId,
            new Map([[command.id, { entityTypeId: command.entityTypeId, data: command.data }]]),
            new Set([command.id]),
        );
        const data = applyEntityRules(
            getCommands(entityType),
            'create',
            properties,
            applyDefaultsAndConventions(prepared.data, properties),
        );
        const problems = validateEntity(properties, data);

        if (problems.length > 0) throw new ValidationError(problems);
        await this.validateReferences(properties, data, prepared.staged);

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
            ...prepared.events,
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

    public async get(entityTypeId: string, id: string): Promise<Entity> {
        const projection = await this.store.findProjection(id);

        if (!projection || projection.entityTypeId !== entityTypeId || projection.deletedAt) {
            throw new EntityNotFoundError(id);
        }

        return projection;
    }

    public async query(command: QueryEntitiesCommand): Promise<Entity[]> {
        await this.requireEntityType(command.entityTypeId);
        if (!this.store.findByEntityType) {
            throw new Error('Entity queries are not configured.');
        }
        if (
            command.limit !== undefined &&
            (!Number.isInteger(command.limit) || command.limit < 1)
        ) {
            throw new ValidationError([
                { property: 'limit', message: 'Limit must be a positive integer.' },
            ]);
        }
        if (
            command.offset !== undefined &&
            (!Number.isInteger(command.offset) || command.offset < 0)
        ) {
            throw new ValidationError([
                { property: 'offset', message: 'Offset must be a non-negative integer.' },
            ]);
        }

        return this.store.findByEntityType(command);
    }

    public async update(command: UpdateEntityCommand, actorId: string): Promise<Entity> {
        const current = await this.requireCurrent(
            command.entityTypeId,
            command.id,
            command.expectedVersion,
        );
        const entityType = await this.requireEntityType(command.entityTypeId);
        const properties = await this.getProperties(entityType);
        const prepared = await this.prepareNestedMutations(
            command.entityTypeId,
            command.data,
            actorId,
            new Map([[command.id, { entityTypeId: command.entityTypeId, data: current.data }]]),
            new Set([command.id]),
        );
        const data = applyEntityRules(
            getCommands(entityType),
            'update',
            properties,
            applyConventions({ ...current.data, ...prepared.data }, properties),
        );
        const problems = validateEntity(properties, data);

        if (problems.length > 0) throw new ValidationError(problems);
        await this.validateReferences(properties, data, prepared.staged);

        if (sameData(current.data, data) && prepared.events.length === 0) {
            return current;
        }

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
            ...prepared.events,
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

    private async requireEntityType(entityTypeId: string): Promise<Entity> {
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
    ): Promise<Entity> {
        const current = await this.store.findProjection(id);

        if (!current || current.entityTypeId !== entityTypeId || current.deletedAt) {
            throw new EntityTypeNotFoundError(id);
        }
        if (current.version !== expectedVersion) throw new EntityVersionConflictError(id);

        return current;
    }

    private async getProperties(entityType: Entity): Promise<EntityProperty[]> {
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

    private async prepareNestedMutations(
        entityTypeId: string,
        input: Record<string, unknown>,
        actorId: string,
        staged: Map<string, StagedEntity>,
        definitions: Set<string>,
    ): Promise<PreparedGraph> {
        const entityType = await this.requireEntityType(entityTypeId);
        const properties = await this.getProperties(entityType);
        const data = { ...input };
        const events: EntityEvent[] = [];

        for (const property of properties.filter((candidate) => isReference(candidate))) {
            const value = data[property.data.name];
            if (value === undefined) continue;
            const values = Array.isArray(value) ? value : [value];
            const ids = await Promise.all(
                values.map(async (reference) => {
                    if (!isNestedEnvelope(reference)) return reference;
                    if (definitions.has(reference.id)) {
                        throw new ValidationError([
                            {
                                property: property.data.name,
                                message: `Entity '${reference.id}' is defined more than once.`,
                            },
                        ]);
                    }
                    definitions.add(reference.id);
                    const nested = await this.prepareNestedMutations(
                        property.data.relatedEntityTypeId ?? '',
                        reference.data,
                        actorId,
                        staged,
                        definitions,
                    );
                    events.push(...nested.events);
                    const existing = await this.store.findProjection(reference.id);
                    if (!existing && reference.expectedVersion !== undefined) {
                        throw new ValidationError([
                            {
                                property: property.data.name,
                                message: 'New nested entities cannot specify an expected version.',
                            },
                        ]);
                    }
                    const nestedType = await this.requireEntityType(
                        property.data.relatedEntityTypeId ?? '',
                    );
                    const nestedProperties = await this.getProperties(nestedType);
                    const nextData = existing
                        ? applyEntityRules(
                              getCommands(nestedType),
                              'update',
                              nestedProperties,
                              applyConventions(
                                  { ...existing.data, ...nested.data },
                                  nestedProperties,
                              ),
                          )
                        : applyEntityRules(
                              getCommands(nestedType),
                              'create',
                              nestedProperties,
                              applyDefaultsAndConventions(nested.data, nestedProperties),
                          );
                    const problems = validateEntity(nestedProperties, nextData);
                    if (problems.length > 0) throw new ValidationError(problems);
                    staged.set(reference.id, {
                        entityTypeId: property.data.relatedEntityTypeId ?? '',
                        data: nextData,
                    });
                    await this.validateReferences(nestedProperties, nextData, staged);
                    if (!existing) {
                        const event = createEvent(
                            'entity-created',
                            property.data.relatedEntityTypeId ?? '',
                            reference.id,
                            nextData,
                            actorId,
                        );
                        events.push(
                            event,
                            ...createRelationEvents(event, nestedProperties, nextData, {
                                reverseProperties:
                                    await this.getReverseProperties(nestedProperties),
                            }),
                        );
                    } else if (!sameData(existing.data, nextData)) {
                        if (
                            reference.expectedVersion === undefined ||
                            reference.expectedVersion !== existing.version
                        ) {
                            throw new EntityVersionConflictError(reference.id);
                        }
                        const event = createEvent(
                            'entity-updated',
                            property.data.relatedEntityTypeId ?? '',
                            reference.id,
                            nextData,
                            actorId,
                            existing.version,
                        );
                        events.push(
                            event,
                            ...createRelationEvents(event, nestedProperties, nextData, {
                                previousData: existing.data,
                                reverseProperties:
                                    await this.getReverseProperties(nestedProperties),
                            }),
                        );
                    }
                    return reference.id;
                }),
            );
            data[property.data.name] = Array.isArray(value) ? ids : ids[0];
        }

        return { data, events, staged };
    }

    private async validateReferences(
        properties: EntityProperty[],
        data: Record<string, unknown>,
        staged = new Map<string, StagedEntity>(),
    ): Promise<void> {
        const references = properties.filter(
            (property) => isReference(property) && data[property.data.name] !== undefined,
        );

        const problems = (
            await Promise.all(
                references.map(async (property) => {
                    const value = data[property.data.name];
                    const ids = Array.isArray(value) ? value : [value];
                    const projections = await Promise.all(
                        ids.map((id) => {
                            const stagedEntity = staged.get(String(id));
                            return stagedEntity
                                ? projection(
                                      String(id),
                                      stagedEntity.entityTypeId,
                                      stagedEntity.data,
                                  )
                                : this.store.findProjection(String(id));
                        }),
                    );

                    if (
                        projections.some(
                            (projection) =>
                                !projection ||
                                projection.entityTypeId !== property.data.relatedEntityTypeId ||
                                projection.deletedAt,
                        )
                    ) {
                        return {
                            property: property.data.name,
                            message: 'Reference does not point to an existing related entity.',
                        };
                    }
                    if (
                        property.data.uniqueBy &&
                        !hasUniqueReferenceValues(
                            projections.filter(isProjection),
                            property.data.uniqueBy,
                        )
                    ) {
                        return {
                            property: property.data.name,
                            message: `Reference values must be unique by '${property.data.uniqueBy}'.`,
                        };
                    }

                    return undefined;
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
            property.data.reversePropertyId ? [property.data.reversePropertyId] : [],
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
            if (hasCode(error, entityMutationErrorCodes.alreadyExists)) {
                throw new EntityAlreadyExistsError(entityId);
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
        if (data[property.data.name] === undefined && property.data.default !== undefined) {
            data[property.data.name] = resolveDefault(property.data.default);
        }
        const value = data[property.data.name];
        if (typeof value === 'string' && property.data.convention) {
            data[property.data.name] = applyConvention(value, property.data.convention);
        }
    });

    return data;
}

function applyConventions(
    input: Record<string, unknown>,
    properties: EntityProperty[],
): Record<string, unknown> {
    return applyDefaultsAndConventions(
        input,
        properties.filter((property) => property.data.default === undefined),
    );
}

function isReference(property: EntityProperty): boolean {
    return (
        property.data.type === 'reference' ||
        (property.data.type === 'array' && property.data.itemsType === 'reference')
    );
}

function isNestedEnvelope(
    value: unknown,
): value is { id: string; data: Record<string, unknown>; expectedVersion?: number } {
    return (
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'data' in value &&
        typeof value.id === 'string' &&
        typeof value.data === 'object' &&
        value.data !== null &&
        (!('expectedVersion' in value) || typeof value.expectedVersion === 'number')
    );
}

function createEvent(
    type: EntityEvent['type'],
    entityTypeId: string,
    entityId: string,
    data: Record<string, unknown>,
    actorId: string,
    expectedVersion?: number,
): EntityEvent {
    const version = expectedVersion === undefined ? '' : `:${expectedVersion + 1}`;
    return {
        id: `${type}:${entityTypeId}:${entityId}${version}`,
        type,
        entityTypeId,
        entityId,
        data,
        actorId,
        occurredAt: new Date(),
        expectedVersion,
    };
}

function sameData(left: Record<string, unknown>, right: Record<string, unknown>): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
}

function hasUniqueReferenceValues(projections: Entity[], property: string): boolean {
    const values = projections.map((projection) => JSON.stringify(projection.data[property]));
    return new Set(values).size === values.length;
}

function isProjection(projection: Entity | null): projection is Entity {
    return projection !== null;
}

interface StagedEntity {
    entityTypeId: string;
    data: Record<string, unknown>;
}
interface PreparedGraph {
    data: Record<string, unknown>;
    events: EntityEvent[];
    staged: Map<string, StagedEntity>;
}

function projection(id: string, entityTypeId: string, data: Record<string, unknown>): Entity {
    return { id, entityTypeId, data, version: 1, createdAt: new Date(), createdById: 'system' };
}

function resolveDefault(value: unknown): unknown {
    return value === '[[NOW]]' ? new Date().toISOString() : value;
}

function applyConvention(value: string, convention: EntityProperty['data']['convention']): string {
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
