import {
    Action,
    EntityTypeDef,
    Property,
    entityTypeNameOf,
    type EntityClass,
} from '../model/decorators';
import { poseidon } from '../poseidon';
import { Entity, type EntityId } from './entity';

/**
 * Person represented by a user identity.
 * @extends {Entity}
 */
@EntityTypeDef({ label: 'User', description: 'Represents a person with an identity.' })
export class User extends Entity {
    /**
     * Identity used to authorize this user.
     */
    @Property({
        type: 'string',
        required: true,
        description: 'Identity used to authorize this user.',
    })
    identityId!: EntityId;

    /**
     * Creates or updates a user.
     * @template TResult - Action result.
     * @param {object} payload - User data to save.
     * @returns {Promise<TResult>} Resolves to the saved user.
     * @throws If the action fails.
     */
    @Action({ description: 'Creates or updates a user.', permissions: () => [] })
    static override save<TResult = unknown>(payload: object): Promise<TResult> {
        return poseidon.context().execute<TResult>({
            entityType: entityTypeNameOf(this as EntityClass),
            action: 'save',
            payload,
        });
    }
}
