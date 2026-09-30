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

/** Kinds of principals that can hold permissions. */
export type IdentityKind = 'user' | 'application' | 'group';

/** Credentials used to authenticate an identity. */
export type AuthenticateInput = {
    /** {@link Identity} to authenticate. */
    identityId: EntityId;
    /** Plaintext credential supplied for authentication. */
    secret: string;
};

/** Token issued after successful authentication. */
export type AuthenticateResult = {
    /** Signed token returned to the caller. */
    token: string;
};

/** Operation for which an invocation token is requested. */
export type AuthorizeInput = {
    /** Operation address to authorize. */
    operation: string;
};

/** Token scoped to an authorized operation invocation. */
export type AuthorizeResult = {
    /** Signed token returned to the caller. */
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
     * {@link IdentityKind} classifying the principal.
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
     * {@link OperationReference} values identifying the permissions granted to this identity.
     */
    @Property({
        type: 'array',
        itemsType: OperationReference,
        required: true,
        description: 'Direct permissions granted to this identity.',
    })
    permissions!: OperationReference[];

    /**
     * {@link EntityId} values of identities included when this identity is a group.
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
     * @param {AuthenticateInput} payload - {@link AuthenticateInput} supplied by the caller.
     * @returns {Promise<TResult>} Resolves to the authentication result.
     * @throws {@link Error} — If authentication fails.
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
     * @param {AuthorizeInput} payload - {@link AuthorizeInput}.
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
