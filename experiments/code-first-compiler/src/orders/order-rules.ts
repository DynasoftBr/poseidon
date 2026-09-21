import { defineBusinessRule, pipeline, setting, specification } from '../sdk/rules.js';
import { Order } from './order.js';
import { Money } from '../money/money.js';
import { OrderRepository } from './order-repository.js';
import { ApprovalRequestRepository } from '../approval-requests/approval-request-repository.js';
import { NotificationRepository } from '../notifications/notification-repository.js';

const order = specification<Order>();

export const requireApprovalForLargeOrders = defineBusinessRule<Order>({
    label: 'Large orders require approval',
    description: 'Large orders require approval before fulfillment.',
    when: order.field('total').greaterThan(setting<Money>('orderApprovalThreshold')),
    then: pipeline<Order>().step('pendingOrder', {
        action: () => OrderRepository.prototype.markPendingApproval,
        input: ({ input }) => ({ order: input }),
    }),
});

export const requestOrderApproval = defineBusinessRule<Order>({
    label: 'Request order approval',
    description: 'Create an approval request and notify approvers after the order is saved.',
    when: order.field('status').equals('pending-approval'),
    then: pipeline<Order>()
        .step('approval', {
            action: () => ApprovalRequestRepository.prototype.create,
            input: ({ input }) => ({ order: { _id: input._id }, amount: input.total, status: 'pending' as const }),
        })
        .step('notification', {
            action: () => NotificationRepository.prototype.notifyApprovers,
            input: ({ results }) => ({ approvalRequest: { _id: results.approval._id } }),
        }),
});
