import { IEntityType, IEntity } from "@poseidon/core-models";
import { IRepository } from "../irepository";

export interface IRepositoryFactory {
  entityType(): Promise<IRepository<IEntityType>>;

  createById<TEntity extends IEntity = IEntity>(entityTypeId: string): Promise<IRepository<TEntity>>;
}
