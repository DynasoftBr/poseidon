import { Entity } from '../sdk/entity.js';
import { EntityType, References } from '../sdk/decorators.js';
import { Order } from '../orders/order.js';
import { Money } from '../money/money.js';
import type { EntityReference } from '../sdk/entity-reference.js';

@EntityType({ label: 'Approval request' })
export class ApprovalRequest extends Entity {
    @References(Order)
    order!: EntityReference<Order>;
    amount!: Money;
    status!: 'pending' | 'approved' | 'rejected';
}
