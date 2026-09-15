import { validateSpecification } from './specification';
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
} from '@poseidon/models';
import type { EventPublisher } from './event-publisher';
import { applyEntityRules } from './entity-rule-engine';
import { getCommands, toProperty } from './entity-model-utils';
import { createRelationEvents, deleteRelationEvents } from './relation-events';
import { validateEntity } from './entity-validator';
import { createSystemProperties } from './bootstrap-model';
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
    findByEntityType?(
        command: QueryEntitiesCommand,
        propertyNames: ReadonlyMap<string, string>,
    ): Promise<Entity[]>;
}

/** Creates records for any EntityType through the same event/projection path. */
export class EntityService {
    public constructor(
        private readonly store: EntityStore,
        private readonly publisher: EventPublisher,
    ) {}

    public async create(command: CreateEntityCommand, actorId: string): Promise<Entity> {
        const entityType = await this.store.findProjection(command.entityTypeId);

        if (!entityType || entityType._entityTypeId !== 'entity-type') {
            throw new EntityTypeNotFoundError(command.entityTypeId);
        }
        if (await this.store.hasEntity(command.id)) {
            throw new EntityAlreadyExistsError(command.id);
        }

        const properties = await this.getProperties(entityType);
        const input =
            command.entityTypeId === 'entity-type'
                ? withSystemProperties(command.id, command.data, actorId)
                : command.data;
        const prepared = await this.prepareNestedMutations(
            command.entityTypeId,
            input,
            actorId,
            new Map([[command.id, { entityTypeId: command.entityTypeId, data: input }]]),
            new Set([command.id]),
        );
        const data = applyEntityRules(
            getCommands(entityType),
            'create',
            properties,
            applyDefaultsAndConventions(prepared.data, properties),
        );
        const eventTime = new Date();
        const candidate = projection(command.id, command.entityTypeId, data, actorId, eventTime);
        const problems = validateEntity(properties, candidate);

        if (problems.length > 0) throw new ValidationError(problems);
        await this.validateReferences(properties, candidate, prepared.staged);

        const event: EntityEvent = {
            id: `entity-created:${command.entityTypeId}:${command.id}`,
            type: entityEventTypes.created,
            entityTypeId: command.entityTypeId,
            entityId: command.id,
            data,
            actorId,
            occurredAt: eventTime,
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

        return projection(
            event.entityId,
            event.entityTypeId,
            event.data,
            event.actorId,
            event.occurredAt,
        );
    }

    public async get(entityTypeId: string, id: string): Promise<Entity> {
        const projection = await this.store.findProjection(id);

        if (!projection || projection._entityTypeId !== entityTypeId || projection._deletedAt) {
            throw new EntityNotFoundError(id);
        }

        return projection;
    }

    public async query(command: QueryEntitiesCommand): Promise<Entity[]> {
        const entityType = await this.requireEntityType(command.entityTypeId);
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

        const properties = await this.getProperties(entityType);
        const propertyNames = new Map(properties.map((property) => [property._id, property.name]));
        if (command.filter !== undefined) validateSpecification(command.filter, propertyNames);
        return this.store.findByEntityType(command, propertyNames);
    }

    public async update(command: UpdateEntityCommand, actorId: string): Promise<Entity> {
        const current = await this.requireCurrent(command.entityTypeId, command.id);
        const entityType = await this.requireEntityType(command.entityTypeId);
        const properties = await this.getProperties(entityType);
        const input =
            command.entityTypeId === 'entity-type'
                ? retainSystemProperties(command.id, current, command.data)
                : command.data;
        const prepared = await this.prepareNestedMutations(
            command.entityTypeId,
            input,
            actorId,
            new Map([
                [command.id, { entityTypeId: command.entityTypeId, data: entityData(current) }],
            ]),
            new Set([command.id]),
        );
        const data = applyEntityRules(
            getCommands(entityType),
            'update',
            properties,
            applyConventions({ ...entityData(current), ...prepared.data }, properties),
        );
        const candidate: Entity = {
            ...current,
            ...data,
            _version: current._version + 1,
            _changedAt: new Date().toISOString(),
            _changedBy: actorId,
        };
        const problems = validateEntity(properties, candidate);

        if (problems.length > 0) throw new ValidationError(problems);
        await this.validateReferences(properties, candidate, prepared.staged);

        if (sameData(entityData(current), data) && prepared.events.length === 0) {
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
                previousData: entityData(current),
                reverseProperties: await this.getReverseProperties(properties),
            }),
        ];
        await this.commit(events, command.id);
        this.publisher.publish(events);

        return {
            ...current,
            ...data,
            _version: current._version + 1,
            _changedAt: event.occurredAt.toISOString(),
            _changedBy: actorId,
        };
    }

    public async delete(command: DeleteEntityCommand, actorId: string): Promise<void> {
        const current = await this.requireCurrent(command.entityTypeId, command.id);
        const event: EntityEvent = {
            id: `entity-deleted:${command.entityTypeId}:${command.id}:${command.expectedVersion + 1}`,
            type: entityEventTypes.deleted,
            entityTypeId: command.entityTypeId,
            entityId: command.id,
            data: entityData(current),
            actorId,
            occurredAt: new Date(),
            expectedVersion: command.expectedVersion,
        };

        const entityType = await this.requireEntityType(command.entityTypeId);
        const properties = await this.getProperties(entityType);
        const events = [
            event,
            ...deleteRelationEvents(event, properties, entityData(current), {
                reverseProperties: await this.getReverseProperties(properties),
            }),
        ];
        await this.commit(events, command.id);
        this.publisher.publish(events);
    }

    private async requireEntityType(entityTypeId: string): Promise<Entity> {
        const entityType = await this.store.findProjection(entityTypeId);

        if (!entityType || entityType._entityTypeId !== 'entity-type') {
            throw new EntityTypeNotFoundError(entityTypeId);
        }

        return entityType;
    }

    private async requireCurrent(entityTypeId: string, id: string): Promise<Entity> {
        const current = await this.store.findProjection(id);

        if (!current || current._entityTypeId !== entityTypeId || current._deletedAt) {
            throw new EntityTypeNotFoundError(id);
        }

        return current;
    }

    private async getProperties(entityType: Entity): Promise<EntityProperty[]> {
        const propertyIds = entityType.properties;

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
            const value = data[property.name];
            if (value === undefined) continue;
            const values = Array.isArray(value) ? value : [value];
            const ids = await Promise.all(
                values.map(async (reference) => {
                    if (!isNestedEnvelope(reference)) return reference;
                    if (definitions.has(reference.id)) {
                        throw new ValidationError([
                            {
                                property: property.name,
                                message: `Entity '${reference.id}' is defined more than once.`,
                            },
                        ]);
                    }
                    definitions.add(reference.id);
                    const nested = await this.prepareNestedMutations(
                        property.relatedEntityTypeId ?? '',
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
                                property: property.name,
                                message: 'New nested entities cannot specify an expected version.',
                            },
                        ]);
                    }
                    const nestedType = await this.requireEntityType(
                        property.relatedEntityTypeId ?? '',
                    );
                    const nestedProperties = await this.getProperties(nestedType);
                    const nextData = existing
                        ? applyEntityRules(
                              getCommands(nestedType),
                              'update',
                              nestedProperties,
                              applyConventions(
                                  { ...entityData(existing), ...nested.data },
                                  nestedProperties,
                              ),
                          )
                        : applyEntityRules(
                              getCommands(nestedType),
                              'create',
                              nestedProperties,
                              applyDefaultsAndConventions(nested.data, nestedProperties),
                          );
                    const candidate = existing
                        ? { ...existing, ...nextData, _version: existing._version + 1 }
                        : projection(
                              reference.id,
                              property.relatedEntityTypeId ?? '',
                              nextData,
                              actorId,
                          );
                    const problems = validateEntity(nestedProperties, candidate);
                    if (problems.length > 0) throw new ValidationError(problems);
                    staged.set(reference.id, {
                        entityTypeId: property.relatedEntityTypeId ?? '',
                        data: nextData,
                    });
                    await this.validateReferences(nestedProperties, candidate, staged);
                    if (!existing) {
                        const event = createEvent(
                            'entity-created',
                            property.relatedEntityTypeId ?? '',
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
                    } else if (!sameData(entityData(existing), nextData)) {
                        if (
                            reference.expectedVersion === undefined ||
                            reference.expectedVersion !== existing._version
                        ) {
                            throw new EntityVersionConflictError(reference.id);
                        }
                        const event = createEvent(
                            'entity-updated',
                            property.relatedEntityTypeId ?? '',
                            reference.id,
                            nextData,
                            actorId,
                            existing._version,
                        );
                        events.push(
                            event,
                            ...createRelationEvents(event, nestedProperties, nextData, {
                                previousData: entityData(existing),
                                reverseProperties:
                                    await this.getReverseProperties(nestedProperties),
                            }),
                        );
                    }
                    return reference.id;
                }),
            );
            data[property.name] = Array.isArray(value) ? ids : ids[0];
        }

        return { data, events, staged };
    }

    private async validateReferences(
        properties: EntityProperty[],
        data: Record<string, unknown>,
        staged = new Map<string, StagedEntity>(),
    ): Promise<void> {
        const references = properties.filter(
            (property) => isReference(property) && data[property.name] !== undefined,
        );

        const problems = (
            await Promise.all(
                references.map(async (property) => {
                    const value = data[property.name];
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
                                projection._entityTypeId !== property.relatedEntityTypeId ||
                                projection._deletedAt,
                        )
                    ) {
                        return {
                            property: property.name,
                            message: 'Reference does not point to an existing related entity.',
                        };
                    }
                    if (
                        property.uniqueBy &&
                        !hasUniqueReferenceValues(
                            projections.filter(isProjection),
                            property.uniqueBy,
                        )
                    ) {
                        return {
                            property: property.name,
                            message: `Reference values must be unique by '${property.uniqueBy}'.`,
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

function applyConventions(
    input: Record<string, unknown>,
    properties: EntityProperty[],
): Record<string, unknown> {
    return applyDefaultsAndConventions(
        input,
        properties.filter((property) => property.default === undefined),
    );
}

function isReference(property: EntityProperty): boolean {
    return (
        property.type === 'reference' ||
        (property.type === 'array' && property.itemsType === 'reference')
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
    const values = projections.map((projection) => JSON.stringify(projection[property]));
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

function projection(
    id: string,
    entityTypeId: string,
    data: Record<string, unknown>,
    actorId = 'system',
    occurredAt = new Date(),
): Entity {
    return {
        ...data,
        _id: id,
        _entityTypeId: entityTypeId,
        _version: 1,
        _createdAt: occurredAt.toISOString(),
        _createdBy: actorId,
    };
}

function entityData(entity: Entity): Record<string, unknown> {
    const {
        _id,
        _entityTypeId,
        _version,
        _createdAt,
        _createdBy,
        _changedAt,
        _changedBy,
        _deletedAt,
        _deletedBy,
        ...data
    } = entity;
    return data;
}

function withSystemProperties(
    entityTypeId: string,
    input: Record<string, unknown>,
    actorId: string,
): Record<string, unknown> {
    const existing = Array.isArray(input.properties) ? input.properties : [];
    const ids = new Set(
        existing.map((value) =>
            typeof value === 'string'
                ? value
                : typeof value === 'object' && value !== null && 'id' in value
                  ? value.id
                  : undefined,
        ),
    );
    const system = createSystemProperties(entityTypeId, {
        systemUserId: actorId,
        now: new Date(),
    })
        .filter((property) => !ids.has(property._id))
        .map((property) => ({ id: property._id, data: entityData(property) }));
    return { ...input, properties: [...existing, ...system] };
}

function retainSystemProperties(
    entityTypeId: string,
    current: Entity,
    input: Record<string, unknown>,
): Record<string, unknown> {
    if (!Array.isArray(input.properties)) return input;
    const declared = new Set(Array.isArray(current.properties) ? current.properties : []);
    const supplied = new Set(
        input.properties.map((value) =>
            typeof value === 'string'
                ? value
                : typeof value === 'object' && value !== null && 'id' in value
                  ? value.id
                  : undefined,
        ),
    );
    const retained = createSystemProperties(entityTypeId, {
        systemUserId: current._createdBy,
        now: new Date(current._createdAt),
    })
        .map((property) => property._id)
        .filter((id) => declared.has(id) && !supplied.has(id));
    return { ...input, properties: [...input.properties, ...retained] };
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
