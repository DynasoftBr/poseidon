import {
    Action,
    Identity as FrameworkIdentity,
    type AuthenticateInput,
    type AuthenticateResult,
    type EntityId,
    type IdentityKind,
} from '@poseidon/framework';
import type { RuntimeOperationContext } from '../actions/runtime-operation-context';
import { issueDevelopmentToken } from '../authentication/development-token';

type StoredIdentity = Record<string, unknown> & {
    _id: EntityId;
    kind: IdentityKind;
    permissions: string[];
};

export class Identity extends FrameworkIdentity {
    /**
     * Authenticates an identity and issues its development token.
     * @template TResult - Authentication result.
     * @param {object} context - Runtime operation context.
     * @returns {Promise<TResult>} Resolves to the signed authentication result.
     * @throws If the identity is a group.
     */
    @Action({ description: 'Authenticates a user or application identity.', permissions: [] })
    static override async authenticate<TResult = AuthenticateResult>(
        context: object,
    ): Promise<TResult> {
        const runtimeContext = context as RuntimeOperationContext;
        const input = runtimeContext.input as AuthenticateInput;
        const identity = await runtimeContext.runtime.get<StoredIdentity>(
            'identity',
            input.identityId,
            true,
        );
        if (identity.kind === 'group') throw new Error('Group identities cannot authenticate.');

        return {
            token: issueDevelopmentToken({ sub: identity._id, permissions: identity.permissions }),
        } as TResult;
    }
}
