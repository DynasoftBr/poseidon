import { IEntityType, IConcreteEntity } from "@poseidon/core-models";
import { IRepository } from "../irepository";

export interface IRepositoryFactory {
  entityType(): Promise<IRepository<IEntityType>>;

  createById<TEntity extends IConcreteEntity = IConcreteEntity>(entityTypeId: string): Promise<IRepository<TEntity>>;
}
