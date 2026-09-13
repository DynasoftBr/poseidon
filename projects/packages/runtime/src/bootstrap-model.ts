import {
    entityEventTypes,
    propertyConventions,
    propertyTypes,
    relationKinds,
    type BootstrapModel,
    type EntityData,
    type EntityEvent,
    type EntityId,
    type EntityProperty,
    type EntityType,
    type IndexDefinition,
    type PropertyType,
    type SystemUser,
} from '@poseidon/model';
import type { EventPublisher } from './event-publisher';

export interface BootstrapStore {
    hasEntity(id: string): Promise<boolean>;
    commit(events: EntityEvent[]): Promise<void>;
}

export function createBootstrapModel(systemUserId: EntityId, now: Date): BootstrapModel {
    const context = { systemUserId, now };
    const users: SystemUser[] = [
        {
            id: systemUserId,
            name: 'System',
            login: 'system',
            createdAt: now,
            createdById: systemUserId,
        },
    ];
    const entityProperties = createCoreProperties(context);
    const entityTypes = createCoreEntityTypes(context, entityProperties);
    const indexes: IndexDefinition[] = [
        createIndex('entity-type-name', 'entity-type', ['entity-type:name'], context),
        createIndex('user-login', 'user', ['user:login'], context),
    ];

    return {
        users,
        entityTypes,
        entityProperties,
        indexes,
    };
}

export async function ensureBootstrapModel(
    store: BootstrapStore,
    publisher: EventPublisher,
    model: BootstrapModel,
): Promise<boolean> {
    const events = (
        await Promise.all(
            createBootstrapEvents(model).map(async (event) =>
                (await store.hasEntity(event.entityId)) ? undefined : event,
            ),
        )
    ).filter((event): event is EntityEvent => event !== undefined);

    if (events.length === 0) return false;

    await store.commit(events);
    publisher.publish(events);

    return true;
}

export function createBootstrapEvents(model: BootstrapModel): EntityEvent[] {
    return [
        ...model.users.map((user) => createEvent('user', user)),
        ...model.entityTypes.map((entityType) => createEvent('entity-type', entityType)),
        ...model.entityProperties.map((property) => createEvent('entity-property', property)),
        ...model.indexes.map((index) => createEvent('index', index)),
    ];
}

function createCoreEntityTypes(
    context: BootstrapContext,
    properties: EntityProperty[],
): EntityType[] {
    return ['entity-type', 'entity-property', 'index', 'user', 'relation-link'].map((name) => ({
        id: name,
        name,
        label: name,
        properties: properties
            .filter((property) => property.entityTypeId === name)
            .map((property) => property.id),
        createdAt: context.now,
        createdById: context.systemUserId,
    }));
}

function createCoreProperties(context: BootstrapContext): EntityProperty[] {
    return [
        createProperty(['entity-type', 'name', 'string', true], context),
        createProperty(['entity-type', 'label', 'string', true], context),
        createProperty(['entity-type', 'properties', 'array', true], context, {
            itemsType: 'reference',
            relatedEntityTypeId: 'entity-property',
            uniqueBy: 'name',
        }),
        createProperty(['entity-type', 'abstract', 'boolean', false], context),
        createProperty(['entity-type', 'superTypeId', 'reference', false], context, {
            relatedEntityTypeId: 'entity-type',
        }),
        createProperty(['entity-type', 'commands', 'json', false], context),
        createProperty(['entity-property', 'entityTypeId', 'reference', true], context, {
            relatedEntityTypeId: 'entity-type',
        }),
        createProperty(['entity-property', 'name', 'string', true], context),
        createProperty(['entity-property', 'type', 'string', true], context, {
            enum: [...propertyTypes],
        }),
        createProperty(['entity-property', 'required', 'boolean', false], context),
        createProperty(['entity-property', 'minimum', 'number', false], context),
        createProperty(['entity-property', 'maximum', 'number', false], context),
        createProperty(['entity-property', 'minLength', 'integer', false], context),
        createProperty(['entity-property', 'maxLength', 'integer', false], context),
        createProperty(['entity-property', 'pattern', 'string', false], context),
        createProperty(['entity-property', 'enum', 'array', false], context, {
            itemsType: 'string',
        }),
        createProperty(['entity-property', 'default', 'json', false], context),
        createProperty(['entity-property', 'convention', 'string', false], context, {
            enum: [...propertyConventions],
        }),
        createProperty(['entity-property', 'relatedEntityTypeId', 'reference', false], context, {
            relatedEntityTypeId: 'entity-type',
        }),
        createProperty(['entity-property', 'relationKind', 'string', false], context, {
            enum: [...relationKinds],
        }),
        createProperty(['entity-property', 'reversePropertyId', 'reference', false], context, {
            relatedEntityTypeId: 'entity-property',
        }),
        createProperty(['entity-property', 'itemsType', 'string', false], context, {
            enum: [...propertyTypes],
        }),
        createProperty(['entity-property', 'uniqueItems', 'boolean', false], context),
        createProperty(['entity-property', 'uniqueBy', 'string', false], context),
        createProperty(['entity-property', 'multipleOf', 'number', false], context),
        createProperty(['index', 'entityTypeId', 'reference', true], context),
        createProperty(['index', 'name', 'string', true], context),
        createProperty(['index', 'propertyIds', 'array', true], context),
        createProperty(['user', 'name', 'string', true], context),
        createProperty(['user', 'login', 'string', true], context),
        createProperty(['relation-link', 'relationPropertyId', 'string', true], context),
        createProperty(['relation-link', 'thisId', 'string', true], context),
        createProperty(['relation-link', 'thatId', 'string', true], context),
    ];
}

function createProperty(
    [entityTypeId, name, type, required]: [EntityId, string, PropertyType, boolean],
    context: BootstrapContext,
    options: Partial<EntityProperty> = {},
): EntityProperty {
    return {
        id: `${entityTypeId}:${name}`,
        entityTypeId,
        name,
        type,
        required,
        ...options,
        createdAt: context.now,
        createdById: context.systemUserId,
    };
}

function createIndex(
    name: string,
    entityTypeId: EntityId,
    propertyIds: EntityId[],
    context: BootstrapContext,
): IndexDefinition {
    return {
        id: name,
        entityTypeId,
        name,
        propertyIds,
        unique: true,
        createdAt: context.now,
        createdById: context.systemUserId,
    };
}

interface BootstrapContext {
    systemUserId: EntityId;
    now: Date;
}

function createEvent(
    entityTypeId: EntityId,
    entity: { id: EntityId; createdAt: Date; createdById: EntityId },
): EntityEvent {
    const { createdAt: _createdAt, createdById: _createdById, id: _id, ...data } = entity;

    return {
        id: `bootstrap:${entityTypeId}:${entity.id}`,
        type: entityEventTypes.created,
        entityTypeId,
        entityId: entity.id,
        data: data as EntityData,
        occurredAt: entity.createdAt,
        actorId: entity.createdById,
    };
}
