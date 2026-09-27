import { Action, Property, Query, entityTypeNameOf, type EntityClass } from '../model/decorators';
import { currentContext } from '../poseidon';
import { Structure } from './structure';

export type EntityId = string;

/**
 * Base class for persisted entity data and operations.
 * @extends {Structure}
 */
export class Entity extends Structure {
    static entityTypeName?: string;

    @Property({ type: 'string', required: true, description: 'Identifier of the entity.' })
    _id!: EntityId;

    @Property({ type: 'integer', description: 'Version of the persisted entity.' })
    _version!: number;

    /**
     * Reads an entity.
     * @template TResult - Query result.
     * @param {{ _id: EntityId }} payload - Identifier of the entity to read.
     * @returns {Promise<TResult>} The entity returned by the query.
     * @throws If the query fails.
     */
    @Query({ description: 'Reads an entity by ID.', permissions: [] })
    static get<TResult = unknown>(payload: { _id: EntityId }): Promise<TResult> {
        return currentContext().execute<TResult>({
            entityType: entityTypeNameOf(this as EntityClass),
            action: 'get',
            payload,
        });
    }

    /**
     * Saves entity data.
     * @template TResult - Action result.
     * @param {object} payload - Entity data to save.
     * @returns {Promise<TResult>} Resolves to the saved entity.
     * @throws If the action fails.
     */
    @Action({ description: 'Creates or updates an entity.', permissions: [] })
    static save<TResult = unknown>(payload: object): Promise<TResult> {
        return currentContext().execute<TResult>({
            entityType: entityTypeNameOf(this as EntityClass),
            action: 'save',
            payload,
        });
    }

    /**
     * Applies declared property defaults.
     * @template TResult - Action result.
     * @param {object} payload - Entity data to prepare.
     * @returns {Promise<TResult>} Resolves when defaults are applied.
     * @throws If the action fails.
     */
    @Action({ description: 'Applies declared property defaults.', permissions: [] })
    protected static applyDefaults<TResult = unknown>(payload: object): Promise<TResult> {
        return currentContext().execute<TResult>({
            entityType: entityTypeNameOf(this as EntityClass),
            action: 'applyDefaults',
            payload,
        });
    }

    /**
     * Applies declared property conventions.
     * @template TResult - Action result.
     * @param {object} payload - Entity data to prepare.
     * @returns {Promise<TResult>} Resolves when conventions are applied.
     * @throws If the action fails.
     */
    @Action({ description: 'Applies declared property conventions.', permissions: [] })
    protected static applyConventions<TResult = unknown>(payload: object): Promise<TResult> {
        return currentContext().execute<TResult>({
            entityType: entityTypeNameOf(this as EntityClass),
            action: 'applyConventions',
            payload,
        });
    }

    /**
     * Validates entity data against its declared properties.
     * @template TResult - Action result.
     * @param {object} payload - Entity data to validate.
     * @returns {Promise<TResult>} Resolves when the entity is valid.
     * @throws If validation fails.
     */
    @Action({ description: 'Validates entity data against declared properties.', permissions: [] })
    static validate<TResult = unknown>(payload: object): Promise<TResult> {
        return currentContext().execute<TResult>({
            entityType: entityTypeNameOf(this as EntityClass),
            action: 'validate',
            payload,
        });
    }

    /**
     * Deletes an entity.
     * @template TResult - Action result.
     * @param {{ _id: EntityId; _version: number }} payload - Identifier and version to delete.
     * @returns {Promise<TResult>} Resolves when deletion finishes.
     * @throws If the action fails.
     */
    @Action({ description: 'Deletes an entity.', permissions: [] })
    static delete<TResult = unknown>(payload: {
        _id: EntityId;
        _version: number;
    }): Promise<TResult> {
        return currentContext().execute<TResult>({
            entityType: entityTypeNameOf(this as EntityClass),
            action: 'delete',
            payload,
        });
    }
}
