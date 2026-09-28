import type { EntityRef } from '@poseidon/utilities';
import {
    Action,
    EntityTypeDef,
    entityTypeNameOf,
    Property,
    type EntityClass,
} from '../model/decorators';
import { poseidon } from '../poseidon';
import type { Action as EntityAction } from './action';
import { Entity } from './entity';
import type { EntityProperty } from './entity-property';
import type { Query as EntityQuery } from './query';

/**
 * Typed client facade for entity-type actions.
 * @extends {Entity}
 */
@EntityTypeDef({
    label: 'Entity type',
    description: 'Defines the properties and actions of an entity type.',
})
export class EntityType extends Entity {
    static override entityTypeName = 'entity-type';

    /** Name used to address this entity type in the API. */
    @Property({
        type: 'string',
        required: true,
        description: 'Name used to address this type in the API.',
    })
    name!: string;

    /** Display name of this entity type. */
    @Property({ type: 'string', required: true, description: 'Display name of the entity type.' })
    label!: string;

    /** Explains what this entity type represents. */
    @Property({ type: 'string', description: 'Explains what this entity type represents.' })
    description?: string;

    /** Whether values are embedded rather than stored independently. */
    @Property({
        type: 'boolean',
        description: 'Whether values are embedded rather than stored independently.',
    })
    structure?: boolean;

    /** Property definitions and their constraints. */
    @Property({
        type: 'array',
        itemsType: 'reference',
        required: true,
        description: 'Property definitions and their constraints.',
    })
    properties!: EntityRef<EntityProperty>[];

    /** Actions available for this entity type. */
    @Property({
        type: 'array',
        itemsType: 'reference',
        description: 'Actions available for this entity type.',
    })
    actions?: EntityRef<EntityAction>[];

    /** Queries available for this entity type. */
    @Property({
        type: 'array',
        itemsType: 'reference',
        description: 'Queries available for this entity type.',
    })
    queries?: EntityRef<EntityQuery>[];

    /**
     * Applies EntityType definitions.
     * @template TResult - Action result.
     * @param {object} payload - Submitted EntityType definitions.
     * @returns {Promise<TResult>} Resolves to the action result.
     * @throws If the action fails.
     */
    @Action({ description: 'Applies submitted entity type definitions.', permissions: [] })
    static applyDefinitions<TResult = unknown>(payload: object): Promise<TResult> {
        return poseidon.context().execute<TResult>({
            entityType: entityTypeNameOf(this as EntityClass),
            action: 'applyDefinitions',
            payload,
        });
    }

    /**
     * Saves an entity type definition.
     * @template TResult - Action result.
     * @param {object} payload - Entity type definition to save.
     * @returns {Promise<TResult>} Resolves to the saved entity type definition.
     * @throws If the action fails.
     */
    @Action({ description: 'Creates or updates an entity type.', permissions: [] })
    static override save<TResult = unknown>(payload: object): Promise<TResult> {
        return poseidon.context().execute<TResult>({
            entityType: entityTypeNameOf(this as EntityClass),
            action: 'save',
            payload,
        });
    }
}
