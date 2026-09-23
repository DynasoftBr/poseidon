import {
    PoseidonOperation as FrameworkPoseidonOperation,
    EntityTypeDef,
    Property,
} from '@poseidon/framework';

@EntityTypeDef({
    label: 'Poseidon operation',
    description: 'Defines an action or query available for an entity type.',
    structure: true,
})
export class PoseidonOperation extends FrameworkPoseidonOperation {
    @Property({ type: 'string', required: true, description: 'Identifier of the operation.' })
    override id!: string;

    @Property({ type: 'string', required: true, description: 'Name of the operation to execute.' })
    override name!: string;

    @Property({ type: 'string', required: true, description: 'Display name of the operation.' })
    override label!: string;

    @Property({ type: 'string', required: true, description: 'Explains what the operation does.' })
    override description!: string;

    @Property({ type: 'boolean', required: true, description: 'Whether the operation runs.' })
    override enabled!: boolean;
}
