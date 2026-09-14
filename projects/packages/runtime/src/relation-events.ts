import { entityEventTypes, type EntityEvent, type EntityProperty } from '@poseidon/models';

export function createRelationEvents(
    sourceEvent: EntityEvent,
    properties: EntityProperty[],
    data: Record<string, unknown>,
    options: RelationEventOptions = {},
): EntityEvent[] {
    const previousData = options.previousData ?? {};
    const reverseProperties = options.reverseProperties ?? new Map();
    const events: EntityEvent[] = [];

    relationEntries(properties, data).forEach(([property, thatId]) => {
        if (
            relationEntries([property], previousData).some(
                ([, previousId]) => previousId === thatId,
            )
        ) {
            return;
        }

        events.push(...createLinkEvents(sourceEvent, property, sourceEvent.entityId, thatId));

        const reverseProperty = property.data.reversePropertyId
            ? reverseProperties.get(property.data.reversePropertyId)
            : undefined;
        if (reverseProperty) {
            events.push(
                ...createLinkEvents(sourceEvent, reverseProperty, thatId, sourceEvent.entityId),
            );
        }
    });

    return [
        ...events,
        ...deleteRelationEvents(sourceEvent, properties, previousData, {
            retainedData: data,
            reverseProperties,
        }),
    ];
}

export function deleteRelationEvents(
    sourceEvent: EntityEvent,
    properties: EntityProperty[],
    data: Record<string, unknown>,
    options: RelationEventOptions = {},
): EntityEvent[] {
    const retainedData = options.retainedData ?? {};
    const reverseProperties = options.reverseProperties ?? new Map();
    return relationEntries(properties, data)
        .filter(
            ([property, thatId]) =>
                !relationEntries([property], retainedData).some(
                    ([, retainedId]) => retainedId === thatId,
                ),
        )
        .flatMap(([property, thatId]) => {
            const events = deleteLinkEvents(sourceEvent, property, sourceEvent.entityId, thatId);
            const reverseProperty = property.data.reversePropertyId
                ? reverseProperties.get(property.data.reversePropertyId)
                : undefined;
            return reverseProperty
                ? [
                      ...events,
                      ...deleteLinkEvents(
                          sourceEvent,
                          reverseProperty,
                          thatId,
                          sourceEvent.entityId,
                      ),
                  ]
                : events;
        });
}

interface RelationEventOptions {
    previousData?: Record<string, unknown>;
    retainedData?: Record<string, unknown>;
    reverseProperties?: Map<string, EntityProperty>;
}

function createLinkEvents(
    sourceEvent: EntityEvent,
    property: EntityProperty,
    thisId: string,
    thatId: string,
): EntityEvent[] {
    const id = relationLinkId(property.id, thisId, thatId);
    return [
        {
            id,
            type: entityEventTypes.created,
            entityTypeId: 'relation-link',
            entityId: id,
            data: { relationPropertyId: property.id, thisId, thatId },
            actorId: sourceEvent.actorId,
            occurredAt: sourceEvent.occurredAt,
        },
    ];
}

function deleteLinkEvents(
    sourceEvent: EntityEvent,
    property: EntityProperty,
    thisId: string,
    thatId: string,
): EntityEvent[] {
    const id = relationLinkId(property.id, thisId, thatId);
    return [
        {
            id: `entity-deleted:relation-link:${id}:2`,
            type: entityEventTypes.deleted,
            entityTypeId: 'relation-link',
            entityId: id,
            data: { relationPropertyId: property.id, thisId, thatId },
            actorId: sourceEvent.actorId,
            occurredAt: sourceEvent.occurredAt,
            expectedVersion: 1,
        },
    ];
}

function relationEntries(
    properties: EntityProperty[],
    data: Record<string, unknown>,
): [EntityProperty, string][] {
    return properties
        .filter((property) => property.data.relationKind && data[property.data.name] !== undefined)
        .flatMap((property) => {
            const value = data[property.data.name];
            const ids = Array.isArray(value) ? value : [value];
            return ids
                .filter((id): id is string => typeof id === 'string')
                .map((id) => [property, id] as [EntityProperty, string]);
        });
}

function relationLinkId(propertyId: string, thisId: string, thatId: string): string {
    return `relation-link:${propertyId}:${thisId}:${thatId}`;
}
