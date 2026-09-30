import {
    Action,
    EntityType as FrameworkEntityType,
    type EntityTypeDefinition,
} from '@poseidon/framework';
import { addMandatoryProperties as addMandatoryPropertiesTo } from '../actions/add-mandatory-properties';
import type { RuntimeOperationContext } from '../actions/runtime-operation-context';

/**
 * Defines the properties and operations of an entity type.
 * @extends {FrameworkEntityType}
 */
export class EntityType extends FrameworkEntityType {
    /**
     * Persists submitted {@link EntityType} definitions and their child records.
     * @template TResult - Result shape returned by the operation.
     * @param {object} context - {@link RuntimeOperationContext} containing the input and runtime services.
     * @returns {Promise<TResult>} Promise resolving after the definitions have been persisted.
     */
    @Action({ description: 'Applies submitted entity type definitions.', permissions: () => [] })
    static override async applyDefinitions<TResult = unknown>(context: object): Promise<TResult> {
        const runtimeContext = context as RuntimeOperationContext;
        await runtimeContext.runtime.applyDefinitions(
            runtimeContext.entityType,
            runtimeContext.input.definitions as EntityTypeDefinition[],
        );
        return undefined as TResult;
    }

    /**
     * Adds mandatory properties to the submitted {@link EntityType} definition.
     * @template TResult - Prepared operation input shape.
     * @param {object} context - {@link RuntimeOperationContext} containing the submitted definition.
     * @returns {Promise<TResult>} Promise resolving to the prepared input.
     * @throws {@link Error} — If submitted properties do not have an entity type ID.
     */
    protected static async addMandatoryProperties<TResult = unknown>(
        context: object,
    ): Promise<TResult> {
        const runtimeContext = context as RuntimeOperationContext;
        await addMandatoryPropertiesTo(
            { input: runtimeContext.input, outputs: runtimeContext.outputs },
            runtimeContext.runtime,
        );
        return runtimeContext.input as TResult;
    }
}
