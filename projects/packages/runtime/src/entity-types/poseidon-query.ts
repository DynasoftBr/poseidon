import { EntityTypeDef } from '@poseidon/framework';
import { PoseidonOperation } from './poseidon-operation';

@EntityTypeDef({
    label: 'Poseidon query',
    description: 'Defines a query available for an entity type.',
    structure: true,
})
export class PoseidonQuery extends PoseidonOperation {}
