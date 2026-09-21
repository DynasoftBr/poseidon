export type EntityId = string;
export type EntityData = Record<string, unknown>;

export interface Entity extends EntityData {
    _id: EntityId;
}
