import {
    entityEventTypes,
    propertyConventions,
    propertyTypes,
    relationKinds,
    type CreateEntityTypeCommand,
    type EntityEvent,
    type EntityProjection,
} from '@poseidon/model';
import type { EventPublisher } from './event-publisher';
import {
    EntityAlreadyExistsError,
    EntityTypeNotFoundError,
    ValidationError,
    type ValidationProblem,
} from './poseidon-error';

export interface EntityTypeStore {
    hasEntity(id: string): Promise<boolean>;
    findProjection(id: string): Promise<EntityProjection | null>;
    commit(events: EntityEvent[]): Promise<void>;
}

export class EntityTypeService {
    public constructor(
        private readonly store: EntityTypeStore,
        private readonly publisher: EventPublisher,
    ) {}

    public async create(
        command: CreateEntityTypeCommand,
        actorId: string,
    ): Promise<EntityProjection> {
        const problems = validate(command);

        if (problems.length > 0) {
            throw new ValidationError(problems);
        }

        if (await this.store.hasEntity(command.id)) {
            throw new EntityAlreadyExistsError(command.id);
        }

        const occurredAt = new Date();
        const events = createEvents(command, actorId, occurredAt);

        await this.store.commit(events);
        this.publisher.publish(events);

        return project(events[0]);
    }

    public async get(id: string): Promise<EntityProjection> {
        const projection = await this.store.findProjection(id);

        if (!projection || projection.entityTypeId !== 'entity-type') {
            throw new EntityTypeNotFoundError(id);
        }

        return projection;
    }
}

function validate(command: CreateEntityTypeCommand): ValidationProblem[] {
    const problems: ValidationProblem[] = [];

    if (!command.id) problems.push({ property: 'id', message: 'Id is required.' });
    if (!command.name) problems.push({ property: 'name', message: 'Name is required.' });
    if (!command.label) problems.push({ property: 'label', message: 'Label is required.' });

    const propertyNames = new Set<string>();

    command.properties.forEach((property) => {
        if (!property.id) {
            problems.push({ property: 'properties.id', message: 'Property id is required.' });
        }
        if (!property.name) {
            problems.push({ property: 'properties.name', message: 'Property name is required.' });
        }
        if (propertyNames.has(property.name)) {
            problems.push({
                property: 'properties.name',
                message: 'Property names must be unique.',
            });
        }

        propertyNames.add(property.name);

        validateProperty(property, problems);
    });

    return problems;
}

function validateProperty(
    property: CreateEntityTypeCommand['properties'][number],
    problems: ValidationProblem[],
): void {
    if (!propertyTypes.includes(property.type)) {
        problems.push({ property: 'properties.type', message: 'Property type is invalid.' });
    }
    if (property.convention && !propertyConventions.includes(property.convention)) {
        problems.push({
            property: 'properties.convention',
            message: 'Property convention is invalid.',
        });
    }
    if (property.relationKind && !relationKinds.includes(property.relationKind)) {
        problems.push({
            property: 'properties.relationKind',
            message: 'Relation kind is invalid.',
        });
    }
    if (property.type === 'reference' && !property.relatedEntityTypeId) {
        problems.push({
            property: 'properties.relatedEntityTypeId',
            message: 'Reference properties require a related entity type.',
        });
    }
    if (property.relationKind && property.type !== 'reference') {
        problems.push({
            property: 'properties.relationKind',
            message: 'Relation kind requires a reference property.',
        });
    }
}

function createEvents(
    command: CreateEntityTypeCommand,
    actorId: string,
    occurredAt: Date,
): EntityEvent[] {
    const entityTypeEvent = createEvent({
        entityTypeId: 'entity-type',
        entityId: command.id,
        data: {
            name: command.name,
            label: command.label,
            abstract: command.abstract,
            superTypeId: command.superTypeId,
            commands: command.commands,
            properties: command.properties.map((property) => property.id),
        },
        actorId,
        occurredAt,
    });
    const propertyEvents = command.properties.map((property) =>
        createEvent({
            entityTypeId: 'entity-property',
            entityId: property.id,
            data: { entityTypeId: command.id, ...property },
            actorId,
            occurredAt,
        }),
    );

    return [entityTypeEvent, ...propertyEvents];
}

function createEvent(input: CreateEventInput): EntityEvent {
    return {
        id: `entity-created:${input.entityTypeId}:${input.entityId}`,
        type: entityEventTypes.created,
        entityTypeId: input.entityTypeId,
        entityId: input.entityId,
        data: input.data,
        actorId: input.actorId,
        occurredAt: input.occurredAt,
    };
}

interface CreateEventInput {
    entityTypeId: string;
    entityId: string;
    data: Record<string, unknown>;
    actorId: string;
    occurredAt: Date;
}

function project(event: EntityEvent): EntityProjection {
    return {
        id: event.entityId,
        entityTypeId: event.entityTypeId,
        data: event.data,
        version: 1,
        createdAt: event.occurredAt,
        createdById: event.actorId,
    };
}
