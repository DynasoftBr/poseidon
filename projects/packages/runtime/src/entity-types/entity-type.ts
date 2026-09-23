import {
    Action,
    EntityTypeDef,
    EntityType as FrameworkEntityType,
    Property,
    Query,
    type EntityTypeDefinition,
} from '@poseidon/framework';
import { addMandatoryProperties as addMandatoryPropertiesTo } from '../actions/add-mandatory-properties';
import type { RuntimeOperationContext } from '../actions/runtime-operation-context';
import { PoseidonAction } from './poseidon-action';
import { EntityProperty } from './entity-property';
import { PoseidonQuery } from './poseidon-query';
import { ValidationError, type ValidationProblem } from '../poseidon-error';
import { validateEntity } from '../validation/entity-validator';

@EntityTypeDef({
    label: 'Entity type',
    description: 'Defines the properties and actions of an entity type.',
})
export class EntityType extends FrameworkEntityType {
    @Property({ type: 'string', required: true, description: 'Identifier of the entity.' })
    override _id!: string;

    @Property({ type: 'integer', description: 'Version of the persisted entity.' })
    override _version!: number;

    @Property({
        type: 'string',
        required: true,
        description: 'Name used to address this type in the API.',
    })
    override name!: string;

    @Property({ type: 'string', required: true, description: 'Display name of the entity type.' })
    override label!: string;

    @Property({ type: 'string', description: 'Explains what this entity type represents.' })
    override description?: string;

    @Property({
        type: 'boolean',
        description: 'Whether values are embedded rather than stored independently.',
    })
    override structure?: boolean;

    @Property({
        type: 'array',
        itemsType: EntityProperty,
        required: true,
        description: 'Property definitions and their constraints.',
    })
    override properties!: EntityProperty[];

    @Property({
        type: 'array',
        itemsType: PoseidonAction,
        description: 'Actions available for this entity type.',
    })
    override actions?: PoseidonAction[];

    @Property({
        type: 'array',
        itemsType: PoseidonQuery,
        description: 'Queries available for this entity type.',
    })
    override queries?: PoseidonQuery[];

    @Query({ description: 'Reads an entity type by ID.' })
    static override get<TResult = unknown>(payload: { _id: string }): Promise<TResult> {
        return super.get<TResult>(payload);
    }

    @Action({ description: 'Applies submitted entity type definitions.' })
    static async applyDefinitions(context: RuntimeOperationContext): Promise<void> {
        await context.runtime.applyDefinitions(
            context.entityType,
            context.input.definitions as EntityTypeDefinition[],
        );
    }

    @Action({ description: 'Adds mandatory properties to an entity type.' })
    static async addMandatoryProperties(
        context: RuntimeOperationContext,
    ): Promise<Record<string, unknown>> {
        await addMandatoryPropertiesTo(
            { input: context.input, outputs: context.outputs },
            context.runtime,
        );
        return context.input;
    }

    @Action({ description: 'Validates an entity type definition.' })
    static async validate(
        context: RuntimeOperationContext,
    ): Promise<{ valid: boolean; problems: ValidationProblem[] }> {
        try {
            const fields = context.entityType.properties.filter(
                (field) => !field.name.startsWith('_'),
            );
            const problems = await validateEntity(
                fields,
                Object.fromEntries(
                    Object.entries(context.input).filter(([key]) => !key.startsWith('_')),
                ),
                (id) => context.runtime.get<EntityTypeDefinition>('entity-type', id, true),
            );
            return { valid: problems.length === 0, problems };
        } catch (error) {
            if (!(error instanceof ValidationError)) throw error;
            return { valid: false, problems: error.problems };
        }
    }

    @Action({
        description: 'Creates or updates an entity type.',
        before: () => [
            EntityType.addMandatoryProperties,
            EntityType.applyDefaults,
            EntityType.applyConventions,
        ],
    })
    static override save<TResult = unknown>(payload: object): Promise<TResult> {
        return super.save<TResult>(payload);
    }
}
