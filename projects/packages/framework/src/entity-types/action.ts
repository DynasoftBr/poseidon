import { EntityTypeDef } from '../model/decorators';
import { Operation } from './operation';

/**
 * {@link Action} declared by an entity type.
 * @extends {Operation}
 */
@EntityTypeDef({ label: 'Action', description: 'Defines an action.' })
export class Action extends Operation {}
