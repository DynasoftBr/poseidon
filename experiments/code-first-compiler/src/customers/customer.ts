import { Entity } from '../sdk/entity.js';
import { Email, EntityType, Length, References } from '../sdk/decorators.js';
import { Order } from '../orders/order.js';
import type { PaginatedResult } from '../sdk/paginated-result.js';

@EntityType({ label: 'Customer' })
export class Customer extends Entity {
    @Length({ min: 1, max: 100 })
    name!: string;

    @Email()
    email!: string;

    notes!: string | null;

    @Length({ min: 0, max: 10 })
    tags!: string[];

    @References(Order, { through: 'customer' })
    readonly orders!: PaginatedResult<Order>;
}
