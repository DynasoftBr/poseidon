import {
    Action,
    EntityTypeDef,
    Property,
    entityTypeNameOf,
    type EntityClass,
} from '../model/decorators';
import { poseidon } from '../poseidon';
import { Entity, type EntityId } from './entity';
import { OperationReference } from './operation-reference';

export type IdentityKind = 'user' | 'application' | 'group';

export type AuthenticateInput = {
    identityId: EntityId;
    secret: string;
};

export type AuthenticateResult = {
    token: string;
};

export type AuthorizeInput = {
    operation: string;
};

export type AuthorizeResult = {
    token: string;
};

/**
 * Authorization principal for a user, application, or group.
 * @extends {Entity}
 */
@EntityTypeDef({
    label: 'Identity',
    description: 'Authorizes a user, application, or group.',
})
export class Identity extends Entity {
    /**
     * Classifies the principal.
     */
    @Property({
        type: 'string',
        required: true,
        enum: ['user', 'application', 'group'],
        description: 'Classifies the identity.',
    })
    kind!: IdentityKind;

    /**
     * Hash of the secret credential (password or application secret) used to authenticate this identity.
     */
    @Property({
        type: 'string',
        description:
            'Hash of the secret credential (password or application secret) used to authenticate this identity.',
    })
    credentialHash?: string;

    /**
     * Direct permissions granted to this identity.
     */
    @Property({
        type: 'array',
        itemsType: OperationReference,
        required: true,
        description: 'Direct permissions granted to this identity.',
    })
    permissions!: OperationReference[];

    /**
     * Identities included when this identity is a group.
     */
    @Property({
        type: 'array',
        itemsType: 'string',
        description: 'Identities included when this identity is a group.',
    })
    members?: EntityId[];

    /**
     * Authenticates a user or application identity.
     * @template TResult - Authentication result.
     * @param {AuthenticateInput} payload - Identity credential supplied by the caller.
     * @returns {Promise<TResult>} Resolves to the authentication result.
     * @throws If authentication fails.
     */
    @Action({
        description: 'Authenticates a user or application identity.',
        allows: [],
        permissions: () => [],
    })
    static authenticate<TResult = AuthenticateResult>(
        payload: AuthenticateInput,
    ): Promise<TResult> {
        return poseidon.context().execute<TResult>({
            entityType: entityTypeNameOf(this as EntityClass),
            action: 'authenticate',
            payload,
        });
    }
    /**
     * Authorizes one operation and returns its scoped invocation token.
     * @template TResult - Authorization result.
     * @param {AuthorizeInput} payload - Requested operation address.
     * @returns {Promise<TResult>} Resolves to the invocation token.
     */
    @Action({
        description: 'Authorizes an operation invocation.',
        allows: [],
        permissions: () => [],
    })
    static authorize<TResult = AuthorizeResult>(payload: AuthorizeInput): Promise<TResult> {
        return poseidon.context().execute<TResult>({
            entityType: entityTypeNameOf(this as EntityClass),
            action: 'authorize',
            payload,
        });
    }
}
