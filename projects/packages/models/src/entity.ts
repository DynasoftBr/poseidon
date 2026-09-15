export type EntityId = string;
export type EntityData = Record<string, unknown>;

export interface Entity extends EntityData {
    _id: EntityId;
    _entityTypeId: EntityId;
    _version: number;
    _createdAt: string;
    _createdBy: EntityId;
    _changedAt?: string;
    _changedBy?: EntityId;
    _deletedAt?: string;
    _deletedBy?: EntityId;
}
