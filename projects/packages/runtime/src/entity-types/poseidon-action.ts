import { EntityTypeDef } from '@poseidon/framework';
import { PoseidonOperation } from './poseidon-operation';

@EntityTypeDef({
    label: 'Poseidon action',
    description: 'Defines an action.',
    structure: true,
})
export class PoseidonAction extends PoseidonOperation {}
