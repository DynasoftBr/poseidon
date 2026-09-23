import { Action, Query, entityTypeNameOf, type EntityClass } from '../model/decorators';
import { poseidon } from '../index';
import { Structure } from './structure';

export type EntityId = string;

/**
 * Base class for persisted entity data and operations.
 * @extends {Structure}
 */
export class Entity extends Structure {
    static entityTypeName?: string;

    _id!: EntityId;
    _version!: number;

    /**
     * Reads an entity.
     * @template TResult - Query result.
     * @param {{ _id: EntityId }} payload - Identifier of the entity to read.
     * @returns {Promise<TResult>} The entity returned by the query.
     * @throws If the query fails.
     */
    @Query({ description: 'Reads an entity by ID.' })
    static get<TResult = unknown>(
        this: typeof Entity,
        payload: { _id: EntityId },
    ): Promise<TResult> {
        return poseidon.context().execute<TResult>({
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
    @Action({
        description: 'Creates or updates an entity.',
        before: () => [Entity.applyDefaults, Entity.applyConventions],
    })
    static save<TResult = unknown>(this: typeof Entity, payload: object): Promise<TResult> {
        return poseidon.context().execute<TResult>({
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
    @Action({ description: 'Applies declared property defaults.' })
    protected static applyDefaults<TResult = unknown>(
        this: typeof Entity,
        payload: object,
    ): Promise<TResult> {
        return poseidon.context().execute<TResult>({
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
    @Action({ description: 'Applies declared property conventions.' })
    protected static applyConventions<TResult = unknown>(
        this: typeof Entity,
        payload: object,
    ): Promise<TResult> {
        return poseidon.context().execute<TResult>({
            entityType: entityTypeNameOf(this as EntityClass),
            action: 'applyConventions',
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
    @Action({ description: 'Deletes an entity.' })
    static delete<TResult = unknown>(
        this: typeof Entity,
        payload: { _id: EntityId; _version: number },
    ): Promise<TResult> {
        return poseidon.context().execute<TResult>({
            entityType: entityTypeNameOf(this as EntityClass),
            action: 'delete',
            payload,
        });
    }
}
