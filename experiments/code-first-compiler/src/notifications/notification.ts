import { Entity } from '../sdk/entity.js';
import { EntityType, References } from '../sdk/decorators.js';
import { ApprovalRequest } from '../approval-requests/approval-request.js';
import type { EntityReference } from '../sdk/entity-reference.js';

@EntityType({ label: 'Notification' })
export class Notification extends Entity {
    @References(ApprovalRequest)
    approvalRequest!: EntityReference<ApprovalRequest>;
}
