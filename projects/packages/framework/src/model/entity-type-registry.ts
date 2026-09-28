import type { EntityId } from '../entity-types/entity';
import type { EntityClass } from './decorators';
import type { EntityTypeDefinition } from './entity-type-definition';

/** Identifies an Action or Query within an EntityType definition. */
export type OperationReference = {
    entityTypeId: EntityId;
    operationId: EntityId;
};

/** Resolves decorated operations to references from loaded EntityType definitions. */
export class EntityTypeRegistry {
    private readonly operations = new WeakMap<EntityClass, Map<string, OperationReference>>();

    /**
     * Binds a decorated class to its loaded definition.
     * @param {EntityClass} entityClass - Decorated entity class.
     * @param {EntityTypeDefinition} definition - Registered EntityType definition.
     * @returns {void} Nothing.
     */
    public register(entityClass: EntityClass, definition: EntityTypeDefinition): void {
        const operations = new Map<string, OperationReference>();
        for (const operation of definition.actions ?? []) {
            operations.set(operation.name, {
                entityTypeId: definition._id,
                operationId: operation._id,
            });
        }
        for (const operation of definition.queries ?? []) {
            operations.set(operation.name, {
                entityTypeId: definition._id,
                operationId: operation._id,
            });
        }
        this.operations.set(entityClass, operations);
    }

    /**
     * Gets an operation reference for a decorated class.
     * @param {EntityClass} entityClass - Decorated entity class.
     * @param {string} name - Declared Action or Query name.
     * @returns {OperationReference | undefined} Registered reference, or undefined when missing.
     */
    public operationOf(entityClass: EntityClass, name: string): OperationReference | undefined {
        return this.operations.get(entityClass)?.get(name);
    }
}
