import { Repository } from '../sdk/repository.js';
import { Action } from '../sdk/decorators.js';
import { Notification } from './notification.js';
import type { EntityReference } from '../sdk/entity-reference.js';
import type { ApprovalRequest } from '../approval-requests/approval-request.js';
export class NotificationRepository extends Repository<Notification> {
    @Action({ label: 'Notify approvers', description: 'Record an approval notification for delivery.' })
    async notifyApprovers(input: { approvalRequest: EntityReference<ApprovalRequest> }): Promise<Notification> {
        return this.create(input);
    }
}
