import type { PoseidonAction } from './poseidon-action';
import type { PoseidonQuery } from './poseidon-query';
import { Entity } from './entity';
import type { EntityProperty } from './entity-property';

/**
 * Typed client facade for entity-type actions.
 * @extends {Entity}
 */
export class EntityType extends Entity {
    static override entityTypeName = 'entity-type';

    /**
     * Name used to address this entity type in the API.
     */
    name!: string;

    /**
     * Display name of this entity type.
     */
    label!: string;

    /**
     * Explains what this entity type represents.
     */
    description?: string;

    /**
     * Whether values are embedded rather than stored independently.
     */
    structure?: boolean;

    /**
     * Property definitions and their constraints.
     */
    properties!: EntityProperty[];

    /**
     * Actions available for this entity type.
     */
    actions?: PoseidonAction[];

    /**
     * Queries available for this entity type.
     */
    queries?: PoseidonQuery[];
}
