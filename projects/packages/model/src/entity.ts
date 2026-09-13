export type EntityId = string;

export interface Entity {
    id: EntityId;
    createdAt: Date;
    createdById: EntityId;
    changedAt?: Date;
    changedById?: EntityId;
}
