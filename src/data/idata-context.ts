import { IEntityType, IConcreteEntity } from "@poseidon/core-models/src";

export interface IDataContext {
    query<T extends IConcreteEntity = IConcreteEntity>(entityType: string): T[];
    findMany<T extends IConcreteEntity = IConcreteEntity>(filter: object, skip?: number, limit?: number, sort?: object): Promise<T[]>;
    findOne<T extends IConcreteEntity = IConcreteEntity>(filter: object): Promise<T>;
}