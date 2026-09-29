import { EntityTypeDef, Property } from '../model/decorators';
import { Structure } from './structure';
import type { EntityId } from './entity';

/** Stable reference to an Action or Query. */
@EntityTypeDef({
    label: 'Operation reference',
    description: 'Identifies an action or query by its entity type and operation IDs.',
    structure: true,
})
export class OperationReference extends Structure {
    @Property({ type: 'string', required: true, description: 'Identifier of the entity type.' })
    entityTypeId!: EntityId;

    @Property({ type: 'string', required: true, description: 'Identifier of the operation.' })
    operationId!: EntityId;
}
