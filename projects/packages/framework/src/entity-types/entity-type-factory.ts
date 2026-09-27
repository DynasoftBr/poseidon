import { EntityType } from './entity-type';
import { Entity } from './entity';
import { Identity } from './identity';
import { User } from './user';

/**
 * Returns callable entity-type facades by API name.
 */
export class EntityTypeFactory {
    private readonly entityTypes = new Map<string, typeof Entity>([
        ['entity-type', EntityType],
        ['identity', Identity],
        ['user', User],
    ]);

    /**
     * Returns an entity-type facade.
     * @param {string} name - Entity type name.
     * @returns {typeof Entity} The callable entity-type facade.
     */
    public create(name: string): typeof Entity {
        return this.entityTypes.get(name) ?? this.dynamicEntityType(name);
    }

    private dynamicEntityType(name: string): typeof Entity {
        class DynamicEntityType extends Entity {
            static override entityTypeName = name;
        }

        return DynamicEntityType;
    }
}
