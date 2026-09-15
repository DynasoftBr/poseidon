import {
    entityEventTypes,
    propertyConventions,
    propertyTypes,
    relationKinds,
    type BootstrapModel,
    type Entity,
    type EntityEvent,
    type EntityId,
    type EntityProperty,
    type EntityPropertyData,
    type EntityType,
    type IndexDefinition,
    type PropertyType,
    type SystemUser,
} from '@poseidon/models';
import type { EventPublisher } from './event-publisher';

export interface BootstrapStore {
    hasEntity(id: string): Promise<boolean>;
    commit(events: EntityEvent[]): Promise<void>;
}

export function createBootstrapModel(systemUserId: EntityId, now: Date): BootstrapModel {
    const context = { systemUserId, now };
    const users: SystemUser[] = [
        {
            ...systemFields(systemUserId, 'user', context),
            name: 'System',
            login: 'system',
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
    return [...model.users, ...model.entityTypes, ...model.entityProperties, ...model.indexes].map(
        createEvent,
    );
}

function createCoreEntityTypes(
    context: BootstrapContext,
    properties: EntityProperty[],
): EntityType[] {
    return ['entity-type', 'entity-property', 'index', 'user', 'identity', 'relation-link'].map(
        (name) => ({
            ...systemFields(name, 'entity-type', context),
            name,
            ...coreEntityTypeMetadata[name],
            properties: properties
                .filter((property) => property.entityTypeId === name)
                .map((property) => property._id),
        }),
    );
}

function createCoreProperties(context: BootstrapContext): EntityProperty[] {
    return [
        ...Object.keys(coreEntityTypeMetadata).flatMap((entityTypeId) =>
            createSystemProperties(entityTypeId, context),
        ),
        ...createCoreBusinessProperties(context),
    ];
}

function createCoreBusinessProperties(context: BootstrapContext): EntityProperty[] {
    return [
        createProperty(['entity-type', 'name', 'string', true], context),
        createProperty(['entity-type', 'label', 'string', true], context),
        createProperty(['entity-type', 'pluralLabel', 'string', false], context),
        createProperty(['entity-type', 'description', 'string', false], context),
        createProperty(['entity-type', 'menuLocation', 'string', false], context),
        createProperty(['entity-type', 'properties', 'array', true], context, {
            itemsType: 'reference',
            relatedEntityTypeId: 'entity-property',
            uniqueBy: 'name',
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
        ...createIdentityProperties(context),
        createProperty(['relation-link', 'relationPropertyId', 'string', true], context),
        createProperty(['relation-link', 'thisId', 'string', true], context),
        createProperty(['relation-link', 'thatId', 'string', true], context),
    ];
}

export function createSystemProperties(
    entityTypeId: EntityId,
    context: BootstrapContext,
): EntityProperty[] {
    return [
        createProperty([entityTypeId, '_id', 'string', true], context),
        createProperty([entityTypeId, '_entityTypeId', 'reference', true], context, {
            relatedEntityTypeId: 'entity-type',
        }),
        createProperty([entityTypeId, '_version', 'integer', true], context),
        createProperty([entityTypeId, '_createdAt', 'date-time', true], context),
        createProperty([entityTypeId, '_createdBy', 'reference', true], context, {
            relatedEntityTypeId: 'user',
        }),
        createProperty([entityTypeId, '_changedAt', 'date-time', false], context),
        createProperty([entityTypeId, '_changedBy', 'reference', false], context, {
            relatedEntityTypeId: 'user',
        }),
        createProperty([entityTypeId, '_deletedAt', 'date-time', false], context),
        createProperty([entityTypeId, '_deletedBy', 'reference', false], context, {
            relatedEntityTypeId: 'user',
        }),
    ];
}

function createIdentityProperties(context: BootstrapContext): EntityProperty[] {
    return [
        createProperty(['identity', 'name', 'string', true], context),
        createProperty(['identity', 'owner', 'reference', true], context, {
            relatedEntityTypeId: 'user',
            relationKind: 'belongs-to-one',
        }),
        createProperty(['identity', 'members', 'array', true], context, {
            itemsType: 'reference',
            relatedEntityTypeId: 'identity',
            relationKind: 'has-many',
            reversePropertyId: 'identity:memberOf',
            uniqueItems: true,
        }),
        createProperty(['identity', 'memberOf', 'array', true], context, {
            itemsType: 'reference',
            relatedEntityTypeId: 'identity',
            relationKind: 'belongs-to-many',
            reversePropertyId: 'identity:members',
            uniqueItems: true,
        }),
    ];
}

function createProperty(
    [entityTypeId, name, type, required]: [EntityId, string, PropertyType, boolean],
    context: BootstrapContext,
    options: Partial<EntityPropertyData> = {},
): EntityProperty {
    return {
        ...systemFields(`${entityTypeId}:${name}`, 'entity-property', context),
        entityTypeId,
        name,
        type,
        required,
        ...options,
    };
}

function createIndex(
    name: string,
    entityTypeId: EntityId,
    propertyIds: EntityId[],
    context: BootstrapContext,
): IndexDefinition {
    return {
        ...systemFields(name, 'index', context),
        entityTypeId,
        name,
        propertyIds,
        unique: true,
    };
}

interface BootstrapContext {
    systemUserId: EntityId;
    now: Date;
}

const coreEntityTypeMetadata: Record<
    string,
    { label: string; pluralLabel: string; description: string; menuLocation: string }
> = {
    'entity-type': {
        label: 'Entity type',
        pluralLabel: 'Entity types',
        description: 'Defines the structure and behaviour of an entity.',
        menuLocation: 'Platform',
    },
    'entity-property': {
        label: 'Entity property',
        pluralLabel: 'Entity properties',
        description: 'Defines a property on an entity type.',
        menuLocation: 'Platform',
    },
    index: {
        label: 'Index',
        pluralLabel: 'Indexes',
        description: 'Defines an index over entity properties.',
        menuLocation: 'Platform',
    },
    user: {
        label: 'User',
        pluralLabel: 'Users',
        description: 'Represents a user of the platform.',
        menuLocation: 'Platform',
    },
    identity: {
        label: 'Identity',
        pluralLabel: 'Identities',
        description: 'Represents an identity and its memberships.',
        menuLocation: 'Platform',
    },
    'relation-link': {
        label: 'Relation link',
        pluralLabel: 'Relation links',
        description: 'Records a relationship between entities.',
        menuLocation: 'Platform',
    },
};

function createEvent(entity: Entity): EntityEvent {
    const { _id, _entityTypeId, _createdAt, _createdBy, _version, ...data } = entity;
    return {
        id: `bootstrap:${_entityTypeId}:${_id}`,
        type: entityEventTypes.created,
        entityTypeId: _entityTypeId,
        entityId: _id,
        data,
        occurredAt: new Date(_createdAt),
        actorId: _createdBy,
    };
}

function systemFields(id: EntityId, entityTypeId: EntityId, context: BootstrapContext): Entity {
    return {
        _id: id,
        _entityTypeId: entityTypeId,
        _version: 1,
        _createdAt: context.now.toISOString(),
        _createdBy: context.systemUserId,
    };
}
