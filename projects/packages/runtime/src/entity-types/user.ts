import { Action, definitionOf, User as FrameworkUser } from '@poseidon/framework';
import type { RuntimeOperationContext } from '../actions/runtime-operation-context';
import { Identity } from './identity';

export class User extends FrameworkUser {
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
