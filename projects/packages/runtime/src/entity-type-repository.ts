import type { EntityType } from '@poseidon/models';
import type { RuntimeContext } from './runtime-context';
import { RuntimeRepository } from './runtime-repository';

export class EntityTypeRepository extends RuntimeRepository<EntityType> {
    public constructor(entityType: EntityType, context: RuntimeContext) {
        super(entityType, context);
    }

    public async findByName(name: string): Promise<EntityType | null> {
        const matches = await this.query({
            entityTypeId: this.entityTypeName,
            filter: {
                kind: 'comparison',
                propertyId: 'entity-type:name',
                operator: 'equals',
                value: name,
            },
            limit: 1,
        });
        return matches[0] ?? null;
    }
}
