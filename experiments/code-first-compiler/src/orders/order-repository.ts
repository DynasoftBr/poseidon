import { Repository, type CreateInput } from '../sdk/repository.js';
import { Order } from './order.js';
import { Action, Rules } from '../sdk/decorators.js';
import { requireApprovalForLargeOrders, requestOrderApproval } from './order-rules.js';

export class OrderRepository extends Repository<Order> {
    @Rules({ before: [requireApprovalForLargeOrders], after: [requestOrderApproval] })
    override create(input: CreateInput<Order>): Promise<Order> {
        return super.create(input);
    }

    @Action({ label: 'Mark order for approval', description: 'Set the candidate order status before persistence.' })
    markPendingApproval(input: { order: Order }): Order {
        input.order.status = 'pending-approval';
        return input.order;
    }
}
