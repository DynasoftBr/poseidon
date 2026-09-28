import {
    Action,
    EntityType as FrameworkEntityType,
    type EntityTypeDefinition,
} from '@poseidon/framework';
import { addMandatoryProperties as addMandatoryPropertiesTo } from '../actions/add-mandatory-properties';
import type { RuntimeOperationContext } from '../actions/runtime-operation-context';

export class EntityType extends FrameworkEntityType {
    @Action({ description: 'Applies submitted entity type definitions.', permissions: [] })
    static override async applyDefinitions<TResult = unknown>(context: object): Promise<TResult> {
        const runtimeContext = context as RuntimeOperationContext;
        await runtimeContext.runtime.applyDefinitions(
            runtimeContext.entityType,
            runtimeContext.input.definitions as EntityTypeDefinition[],
        );
        return undefined as TResult;
    }

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
