import type { PoseidonAction } from './poseidon-action';
import type { PoseidonQuery } from './poseidon-query';
import { Action, entityTypeNameOf, type EntityClass } from '../model/decorators';
import { currentContext } from '../poseidon';
import { Entity } from './entity';
import type { EntityProperty } from './entity-property';

/**
 * Typed client facade for entity-type actions.
 * @extends {Entity}
 */
export class EntityType extends Entity {
    static override entityTypeName = 'entity-type';

    /**
     * Name used to address this entity type in the API.
     */
    name!: string;

    /**
     * Display name of this entity type.
     */
    label!: string;

    /**
     * Explains what this entity type represents.
     */
    description?: string;

    /**
     * Whether values are embedded rather than stored independently.
     */
    structure?: boolean;

    /**
     * Property definitions and their constraints.
     */
    properties!: EntityProperty[];

    /**
     * Actions available for this entity type.
     */
    actions?: PoseidonAction[];

    /**
     * Queries available for this entity type.
     */
    queries?: PoseidonQuery[];

    /**
     * Adds mandatory properties to an entity type.
     * @template TResult - Action result.
     * @param {object} payload - Entity type definition to prepare.
     * @returns {Promise<TResult>} Resolves when mandatory properties are added.
     * @throws If the action fails.
     */
    @Action({ description: 'Adds mandatory properties to an entity type.' })
    protected static addMandatoryProperties<TResult = unknown>(payload: object): Promise<TResult> {
        return currentContext().execute<TResult>({
            entityType: entityTypeNameOf(this as EntityClass),
            action: 'addMandatoryProperties',
            payload,
        });
    }

    /**
     * Applies EntityType definitions.
     * @template TResult - Action result.
     * @param {object} payload - Submitted EntityType definitions.
     * @returns {Promise<TResult>} Resolves to the action result.
     * @throws If the action fails.
     */
    @Action({ description: 'Applies submitted entity type definitions.' })
    static applyDefinitions<TResult = unknown>(payload: object): Promise<TResult> {
        return currentContext().execute<TResult>({
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
    @Action({ description: 'Creates or updates an entity type.' })
    static override save<TResult = unknown>(payload: object): Promise<TResult> {
        return currentContext().execute<TResult>({
            entityType: entityTypeNameOf(this as EntityClass),
            action: 'save',
            payload,
        });
    }
}
