import {
    Action,
    Identity as FrameworkIdentity,
    type AuthenticateInput,
    type AuthenticateResult,
    type AuthorizeInput,
    type AuthorizeResult,
    type DevelopmentUserToken,
    type EntityId,
    type IdentityKind,
    type OperationReference,
} from '@poseidon/framework';
import type { RuntimeOperationContext } from '../actions/runtime-operation-context';
import {
    issueDevelopmentInvocationToken,
    issueDevelopmentToken,
} from '../authentication/development-token';

type StoredIdentity = Record<string, unknown> & {
    _id: EntityId;
    kind: IdentityKind;
    permissions: OperationReference[];
};

export class Identity extends FrameworkIdentity {
    /**
     * Authenticates an identity and issues its development token.
     * @template TResult - Result type.
     * @param {object} context - Runtime operation context.
     * @returns {Promise<TResult>} Resolves to the signed authentication result.
     * @throws If the identity is a group.
     */
    @Action({
        description: 'Authenticates a user or application identity.',
        allows: [],
        permissions: () => [],
    })
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
            token: issueDevelopmentToken({
                sub: identity._id,
                permissions: await Promise.all(
                    identity.permissions.map((permission) =>
                        runtimeContext.runtime.operationAddress(permission),
                    ),
                ),
            }),
        } as TResult;
    }

    /**
     * Authorizes one user operation and issues its scoped invocation token.
     * @template TResult - Result type.
     * @param {object} context - Runtime operation context.
     * @returns {Promise<TResult>} Resolves to the signed invocation token.
     */
    @Action({
        description: 'Authorizes an operation invocation.',
        allows: [],
        permissions: () => [],
    })
    static override async authorize<TResult = AuthorizeResult>(context: object): Promise<TResult> {
        const runtimeContext = context as RuntimeOperationContext;
        const token = runtimeContext.token as DevelopmentUserToken;
        const input = runtimeContext.input as AuthorizeInput;
        if (!token.permissions.includes(input.operation)) {
            throw new Error(`Operation '${input.operation}' is not authorized.`);
        }
        return {
            token: issueDevelopmentInvocationToken({
                sub: token.sub,
                origin: input.operation,
                permissions: [
                    input.operation,
                    ...(await runtimeContext.runtime.resolveAllOperationPermissions(
                        input.operation,
                    )),
                ],
            }),
        } as TResult;
    }
}
