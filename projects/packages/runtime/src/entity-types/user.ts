import { Action, definitionOf, User as FrameworkUser } from '@poseidon/framework';
import type { RuntimeOperationContext } from '../actions/runtime-operation-context';
import { Identity } from './identity';

/**
 * Person represented by a user identity.
 * @extends {FrameworkUser}
 */
export class User extends FrameworkUser {
    /**
     * Creates an identity and persists the user linked to it.
     * @template TResult - Result shape returned by the operation.
     * @param {object} context - {@link RuntimeOperationContext} containing the input and runtime services.
     * @returns {Promise<TResult>} Promise resolving to the persisted entity.
     */
    @Action({ description: 'Creates a user and its identity.', permissions: () => [] })
    static override async save<TResult = unknown>(context: object): Promise<TResult> {
        const runtimeContext = context as RuntimeOperationContext;
        const identity = await runtimeContext.runtime.save(definitionOf(Identity), {
            kind: 'user',
            permissions: () => [],
        });
        const user = await runtimeContext.runtime.save(runtimeContext.entityType, {
            ...runtimeContext.input,
            identityId: identity._id,
        });
        return user as TResult;
    }
}
