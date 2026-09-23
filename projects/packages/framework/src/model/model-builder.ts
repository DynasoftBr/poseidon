import { definitionOf, type EntityClass } from './decorators';
import type { PoseidonContext } from '../context/poseidon-context';
import { applyDefinitions } from './apply-definitions';
import type { EntityTypeDefinition } from './entity-type-definition';

/**
 * Collects decorated definitions for one execution context.
 */
export class ModelBuilder {
    private readonly entities = new Map<
        string,
        { entityClass: EntityClass; definition: EntityTypeDefinition }
    >();

    /**
     * Captures the context required by apply().
     * @param {PoseidonContext} [context] - Context retained by this builder.
     */
    public constructor(private readonly context?: PoseidonContext) {}

    /**
     * Adds a decorated class and returns this builder; repeated classes are ignored.
     * @param {EntityClass} entityClass - Class containing entity and property decorators.
     * @returns {this} This builder for chaining.
     * @throws If metadata is missing or another class uses the same entity name.
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
     * Applies collected definitions through one EntityType action.
     * @returns {Promise<void>} Resolves when the action finishes.
     * @throws If no context is configured or an operation fails.
     */
    public async apply(): Promise<void> {
        if (!this.context) {
            throw new Error('Initialize Poseidon with a context before creating a model.');
        }
        await applyDefinitions(
            this.context,
            [...this.entities.values()].map(({ definition }) => definition),
        );
    }
}
