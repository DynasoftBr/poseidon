import { validateSpecification } from './specification';
/* eslint-disable complexity, max-lines, max-lines-per-function, max-params */
import {
    entityEventTypes,
    entityMutationErrorCodes,
    type CreateEntityAction,
    type DeleteEntityAction,
    type EntityEvent,
    type Entity,
    type EntityProperty,
    type QueryEntitiesAction,
    type UpdateEntityAction,
} from '@poseidon/models';
import type { EventPublisher } from './event-publisher';
import { applyEntityRules } from './entity-rule-engine';
import {
    getActions,
    getProperties,
    requireConcreteEntityType,
    toProperty,
} from './entity-model-utils';
import { createRelationEvents, deleteRelationEvents } from './relation-events';
import { validateEntity } from './entity-validator';
import { applyDefaultsAndConventions, applyConventions } from './entity-preparation';
import { createSystemProperties } from './bootstrap-model';
import {
    EntityAlreadyExistsError,
    EntityNotFoundError,
    EntityTypeNotFoundError,
    EntityVersionConflictError,
    ValidationError,
} from './poseidon-error';

export interface EntityStore {
    hasEntity(entityTypeName: string, id: string): Promise<boolean>;
    findProjection(entityTypeName: string, id: string): Promise<Entity | null>;
    findEntityTypeByName?(name: string): Promise<Entity | null>;
    commit(events: EntityEvent[]): Promise<void>;
    findByEntityType?(
        entityTypeName: string,
        action: QueryEntitiesAction,
        propertyNames: ReadonlyMap<string, string>,
    ): Promise<Entity[]>;
}

/** Creates records for any EntityType through the same event/projection path. */
export class EntityService {
    public constructor(
        private readonly store: EntityStore,
        private readonly publisher: EventPublisher,
    ) {}

    public async create(action: CreateEntityAction, actorId: string): Promise<Entity> {
        const entityType = await this.requireEntityTypeByName(action.entityTypeId);

        if (!entityType || entityType._entityTypeId !== 'entity-type') {
            throw new EntityTypeNotFoundError(action.entityTypeId);
        }
        if (await this.store.hasEntity(action.entityTypeId, action.id)) {
            throw new EntityAlreadyExistsError(action.id);
        }
        action = { ...action, entityTypeId: entityType._id };

        const properties = await this.getProperties(entityType);
        const input =
            action.entityTypeId === 'entity-type'
                ? withSystemProperties(action.id, action.data, actorId)
                : action.data;
        if (action.entityTypeId === 'entity-type') validateEntityTypeName(input.name);
        const prepared = await this.prepareNestedMutations(
            action.entityTypeId,
            input,
            actorId,
            new Map([[action.id, { entityTypeId: action.entityTypeId, data: input }]]),
            new Set([action.id]),
        );
        const data = applyEntityRules(
            getActions(entityType),
            'create',
            properties,
            applyDefaultsAndConventions(prepared.data, properties),
        );
        const eventTime = new Date();
        const candidate = projection(action.id, action.entityTypeId, data, actorId, eventTime);
        const problems = validateEntity(properties, candidate);

        if (problems.length > 0) throw new ValidationError(problems);
        await this.validateReferences(properties, candidate, prepared.staged);

        const event: EntityEvent = {
            id: `entity-created:${action.entityTypeId}:${action.id}`,
            type: entityEventTypes.created,
            entityTypeId: action.entityTypeId,
            entityId: action.id,
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
        await this.commit(events, action.id);
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
        const entityType = await this.requireEntityTypeByName(entityTypeId);
        const projection = await this.store.findProjection(entityTypeId, id);

        if (!projection || projection._entityTypeId !== entityType._id || projection._deletedAt) {
            throw new EntityNotFoundError(id);
        }

        return projection;
    }

    public async query(action: QueryEntitiesAction): Promise<Entity[]> {
        const entityTypeName = action.entityTypeId;
        const entityType = await this.requireEntityTypeByName(entityTypeName);
        action = { ...action, entityTypeId: entityType._id };
        if (!this.store.findByEntityType) {
            throw new Error('Entity queries are not configured.');
        }
        if (action.limit !== undefined && (!Number.isInteger(action.limit) || action.limit < 1)) {
            throw new ValidationError([
                { property: 'limit', message: 'Limit must be a positive integer.' },
            ]);
        }
        if (
            action.offset !== undefined &&
            (!Number.isInteger(action.offset) || action.offset < 0)
        ) {
            throw new ValidationError([
                { property: 'offset', message: 'Offset must be a non-negative integer.' },
            ]);
        }

        const properties = await this.getProperties(entityType);
        const propertyNames = new Map(properties.map((property) => [property._id, property.name]));
        if (action.filter !== undefined) validateSpecification(action.filter, propertyNames);
        return this.store.findByEntityType(entityTypeName, action, propertyNames);
    }

    public async update(action: UpdateEntityAction, actorId: string): Promise<Entity> {
        const entityType = await this.requireEntityTypeByName(action.entityTypeId);
        action = { ...action, entityTypeId: entityType._id };
        const current = await this.requireCurrent(action.entityTypeId, action.id);
        if (
            action.entityTypeId === 'entity-type' &&
            action.data.name !== undefined &&
            action.data.name !== current.name
        ) {
            throw new ValidationError([
                { property: 'name', message: 'Entity type names cannot be changed.' },
            ]);
        }
        const properties = await this.getProperties(entityType);
        const input =
            action.entityTypeId === 'entity-type'
                ? retainSystemProperties(action.id, current, action.data)
                : action.data;
        const prepared = await this.prepareNestedMutations(
            action.entityTypeId,
            input,
            actorId,
            new Map([
                [action.id, { entityTypeId: action.entityTypeId, data: entityData(current) }],
            ]),
            new Set([action.id]),
        );
        const data = applyEntityRules(
            getActions(entityType),
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
            id: `entity-updated:${action.entityTypeId}:${action.id}:${action.expectedVersion + 1}`,
            type: entityEventTypes.updated,
            entityTypeId: action.entityTypeId,
            entityId: action.id,
            data,
            actorId,
            occurredAt: new Date(),
            expectedVersion: action.expectedVersion,
        };

        const events = [
            ...prepared.events,
            event,
            ...createRelationEvents(event, properties, data, {
                previousData: entityData(current),
                reverseProperties: await this.getReverseProperties(properties),
            }),
        ];
        await this.commit(events, action.id);
        this.publisher.publish(events);

        return {
            ...current,
            ...data,
            _version: current._version + 1,
            _changedAt: event.occurredAt.toISOString(),
            _changedBy: actorId,
        };
    }

    public async delete(action: DeleteEntityAction, actorId: string): Promise<void> {
        const entityType = await this.requireEntityTypeByName(action.entityTypeId);
        action = { ...action, entityTypeId: entityType._id };
        const current = await this.requireCurrent(action.entityTypeId, action.id);
        const event: EntityEvent = {
            id: `entity-deleted:${action.entityTypeId}:${action.id}:${action.expectedVersion + 1}`,
            type: entityEventTypes.deleted,
            entityTypeId: action.entityTypeId,
            entityId: action.id,
            data: entityData(current),
            actorId,
            occurredAt: new Date(),
            expectedVersion: action.expectedVersion,
        };

        const properties = await this.getProperties(entityType);
        const events = [
            event,
            ...deleteRelationEvents(event, properties, entityData(current), {
                reverseProperties: await this.getReverseProperties(properties),
            }),
        ];
        await this.commit(events, action.id);
        this.publisher.publish(events);
    }

    private async requireEntityType(entityTypeId: string): Promise<Entity> {
        const entityType = await this.store.findProjection('entity-type', entityTypeId);

        if (!entityType || entityType._entityTypeId !== 'entity-type') {
            throw new EntityTypeNotFoundError(entityTypeId);
        }

        return entityType;
    }

    private async requireEntityTypeByName(name: string): Promise<Entity> {
        const entityType = this.store.findEntityTypeByName
            ? await this.store.findEntityTypeByName(name)
            : await this.store.findProjection('entity-type', name);
        if (!entityType || entityType._entityTypeId !== 'entity-type' || entityType.name !== name) {
            throw new EntityTypeNotFoundError(name);
        }
        requireConcreteEntityType(entityType);
        return entityType;
    }

    private async requireCurrent(entityTypeId: string, id: string): Promise<Entity> {
        const entityType = await this.requireEntityType(entityTypeId);
        const current = await this.store.findProjection(String(entityType.name), id);

        if (!current || current._entityTypeId !== entityTypeId || current._deletedAt) {
            throw new EntityTypeNotFoundError(id);
        }

        return current;
    }

    private async getProperties(entityType: Entity): Promise<EntityProperty[]> {
        return getProperties(entityType);
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

        for (const property of properties) {
            if (
                !property.relatedEntityTypeId ||
                isReference(property) ||
                data[property.name] === undefined
            )
                continue;
            const structure = await this.requireEntityType(property.relatedEntityTypeId);
            if (structure.structure !== true) continue;
            const values = Array.isArray(data[property.name])
                ? (data[property.name] as unknown[])
                : [data[property.name]];
            const embedded = [];
            for (const value of values) {
                if (!value || typeof value !== 'object' || Array.isArray(value)) {
                    throw new ValidationError([
                        { property: property.name, message: 'Structure values must be objects.' },
                    ]);
                }
                const nested = await this.prepareNestedMutations(
                    structure._id,
                    value as Record<string, unknown>,
                    actorId,
                    staged,
                    definitions,
                );
                const fields = getProperties(structure);
                const prepared = applyDefaultsAndConventions(nested.data, fields);
                const problems = validateEntity(fields, prepared);
                if (problems.length) throw new ValidationError(problems);
                await this.validateReferences(fields, prepared, staged);
                embedded.push(prepared);
                events.push(...nested.events);
            }
            if (property.uniqueBy && !hasUniqueReferenceValues(embedded, property.uniqueBy)) {
                throw new ValidationError([
                    {
                        property: property.name,
                        message: `Structure values must be unique by '${property.uniqueBy}'.`,
                    },
                ]);
            }
            data[property.name] = Array.isArray(data[property.name]) ? embedded : embedded[0];
        }

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
                    const nestedType = await this.requireEntityType(
                        property.relatedEntityTypeId ?? '',
                    );
                    requireConcreteEntityType(nestedType);
                    const existing = await this.store.findProjection(
                        String(nestedType.name),
                        reference.id,
                    );
                    if (!existing && reference.expectedVersion !== undefined) {
                        throw new ValidationError([
                            {
                                property: property.name,
                                message: 'New nested entities cannot specify an expected version.',
                            },
                        ]);
                    }
                    const nestedProperties = await this.getProperties(nestedType);
                    const nextData = existing
                        ? applyEntityRules(
                              getActions(nestedType),
                              'update',
                              nestedProperties,
                              applyConventions(
                                  { ...entityData(existing), ...nested.data },
                                  nestedProperties,
                              ),
                          )
                        : applyEntityRules(
                              getActions(nestedType),
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
                    const relatedType = await this.requireEntityType(
                        property.relatedEntityTypeId ?? '',
                    );
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
                                : this.store.findProjection(String(relatedType.name), String(id));
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
        const reverse = new Map<string, EntityProperty>();
        for (const property of properties) {
            if (!property.reversePropertyId) continue;
            const relatedType = await this.requireEntityType(property.relatedEntityTypeId ?? '');
            const match = getProperties(relatedType).find(
                (candidate) => candidate._id === property.reversePropertyId,
            );
            reverse.set(
                property.reversePropertyId,
                toProperty(match ?? null, property.reversePropertyId),
            );
        }
        return reverse;
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

function hasUniqueReferenceValues(
    projections: Record<string, unknown>[],
    property: string,
): boolean {
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
    if (input.structure === true) return input;
    const ids = new Set(existing.map((property: EntityProperty) => property._id));
    const system = createSystemProperties(entityTypeId, {
        systemUserId: actorId,
        now: new Date(),
    }).filter((property) => !ids.has(property._id));
    return { ...input, properties: [...existing, ...system] };
}

function validateEntityTypeName(name: unknown): void {
    if (
        typeof name !== 'string' ||
        !/^[A-Za-z][A-Za-z0-9-]*$/.test(name) ||
        name.toLowerCase() === 'entities' ||
        name.toLowerCase() === 'events'
    ) {
        throw new ValidationError([
            {
                property: 'name',
                message: 'Entity type name must be a valid, unused collection name.',
            },
        ]);
    }
}

function retainSystemProperties(
    _entityTypeId: string,
    current: Entity,
    input: Record<string, unknown>,
): Record<string, unknown> {
    if (!Array.isArray(input.properties)) return input;
    if (current.structure === true || input.structure === true) return input;
    const supplied = new Set(input.properties.map((property: EntityProperty) => property._id));
    const retained = getProperties(current).filter(
        (property) => property.name.startsWith('_') && !supplied.has(property._id),
    );
    return { ...input, properties: [...input.properties, ...retained] };
}
