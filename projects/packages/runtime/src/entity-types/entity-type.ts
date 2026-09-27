import {
    Action,
    EntityTypeDef,
    EntityType as FrameworkEntityType,
    Property,
    type EntityTypeDefinition,
} from '@poseidon/framework';
import { addMandatoryProperties as addMandatoryPropertiesTo } from '../actions/add-mandatory-properties';
import type { RuntimeOperationContext } from '../actions/runtime-operation-context';
import { PoseidonAction } from './poseidon-action';
import { EntityProperty } from './entity-property';
import { PoseidonQuery } from './poseidon-query';

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

    @Action({ description: 'Applies submitted entity type definitions.' })
    static override async applyDefinitions<TResult = unknown>(context: object): Promise<TResult> {
        const runtimeContext = context as RuntimeOperationContext;
        await runtimeContext.runtime.applyDefinitions(
            runtimeContext.entityType,
            runtimeContext.input.definitions as EntityTypeDefinition[],
        );
        return undefined as TResult;
    }

    @Action({ description: 'Adds mandatory properties to an entity type.' })
    protected static override async addMandatoryProperties<TResult = unknown>(
        context: object,
    ): Promise<TResult> {
        const runtimeContext = context as RuntimeOperationContext;
        await addMandatoryPropertiesTo(
            { input: runtimeContext.input, outputs: runtimeContext.outputs },
            runtimeContext.runtime,
        );
        return runtimeContext.input as TResult;
    }
}
