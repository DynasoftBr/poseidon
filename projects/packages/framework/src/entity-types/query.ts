import { EntityTypeDef } from '../model/decorators';
import { Operation } from './operation';

/**
 * {@link Query} declared by an entity type.
 * @extends {Operation}
 */
@EntityTypeDef({ label: 'Query', description: 'Defines a query available for an entity type.' })
export class Query extends Operation {}
