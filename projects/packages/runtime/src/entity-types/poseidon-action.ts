import { EntityTypeDef, Property } from '@poseidon/framework';
import { PoseidonOperation } from './poseidon-operation';

@EntityTypeDef({
    label: 'Poseidon action',
    description: 'Defines an action and the actions that run before it.',
    structure: true,
})
export class PoseidonAction extends PoseidonOperation {
    @Property({
        type: 'array',
        itemsType: PoseidonAction,
        required: true,
        description: 'Actions executed in order before this action.',
    })
    before!: PoseidonAction[];
}
