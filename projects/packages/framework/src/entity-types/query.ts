import { EntityTypeDef } from '../model/decorators';
import { Operation } from './operation';

/** Query declared by an entity type. */
@EntityTypeDef({ label: 'Query', description: 'Defines a query available for an entity type.' })
export class Query extends Operation {}
