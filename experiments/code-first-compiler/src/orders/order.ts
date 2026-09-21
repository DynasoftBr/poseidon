import { Entity } from '../sdk/entity.js';
import { EntityType, Integer, Length, References } from '../sdk/decorators.js';
import { Customer } from '../customers/customer.js';
import { Money } from '../money/money.js';
import type { EntityReference } from '../sdk/entity-reference.js';

@EntityType({ label: 'Order' })
export class Order extends Entity {
    @References(Customer)
    customer!: EntityReference<Customer>;

    @Length({ min: 1, max: 100 })
    reference!: string;

    @Integer({ min: 1, max: 100 })
    quantity!: number;

    total!: Money;

    status!: 'draft' | 'confirmed' | 'pending-approval';
}
