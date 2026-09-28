import { EntityTypeDef } from '../model/decorators';
import { Operation } from './operation';

/** Action declared by an entity type. */
@EntityTypeDef({ label: 'Action', description: 'Defines an action.' })
export class Action extends Operation {}
