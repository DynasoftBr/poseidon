import { IEntityType, IConcreteEntity } from "@poseidon/core-models";
import { IRepository } from "../irepository";

export interface IRepositoryFactory {
    entityType(): Promise<IRepository<IEntityType>>;
    createByName<TEntity extends IConcreteEntity>(entityTypeName: string): Promise<IRepository<TEntity>>;
    createByName(entityTypeName: string): Promise<IRepository>;
}