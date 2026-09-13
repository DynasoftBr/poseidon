export type EntityId = string;
export type EntityData = Record<string, unknown>;

export interface Entity<TData extends object = EntityData> {
    id: EntityId;
    entityTypeId: EntityId;
    data: TData;
    version: number;
    createdAt: Date;
    createdById: EntityId;
    changedAt?: Date;
    changedById?: EntityId;
    deletedAt?: Date;
    deletedById?: EntityId;
}
