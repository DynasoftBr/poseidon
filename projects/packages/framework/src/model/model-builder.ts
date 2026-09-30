import { definitionOf, type EntityClass } from './decorators';
import type { EntityTypeDefinition } from './entity-type-definition';
import { EntityType } from '../entity-types/entity-type';

/**
 * Collects decorated definitions for one execution context.
 */
export class ModelBuilder {
    private readonly entities = new Map<
        string,
        { entityClass: EntityClass; definition: EntityTypeDefinition }
    >();

    /**
     * Adds a decorated class and returns this builder; repeated classes are ignored.
     * @param {EntityClass} entityClass - {@link EntityClass} containing entity and property decorators.
     * @returns {this} This {@link ModelBuilder} for chaining.
     * @throws {@link Error} — If metadata is missing or another class uses the same entity name.
     */
    public entity(entityClass: EntityClass): this {
        const definition = definitionOf(entityClass);
        const existing = this.entities.get(definition.name);
        if (existing && existing.entityClass !== entityClass) {
            throw new Error(
                `Entity type '${definition.name}' is already declared by another class.`,
            );
        }

        this.entities.set(definition.name, { entityClass, definition });
        return this;
    }

    /**
     * Applies collected definitions through one {@link EntityType} action.
     * @returns {Promise<void>} Resolves when the action finishes.
     * @throws {@link Error} — If the current operation fails.
     */
    public async apply(): Promise<void> {
        if (this.entities.size === 0) return;
        await EntityType.applyDefinitions({
            definitions: [...this.entities.values()].map(({ definition }) => definition),
        });
    }
}
