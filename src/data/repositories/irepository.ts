import { IConcreteEntity, IEntityType } from "@poseidon/core-models";

export interface IRepository<T extends IConcreteEntity = IConcreteEntity> {
  entityType: IEntityType;
  findMany(query: object, skip?: number, limit?: number, sort?: object): Promise<T[]>;
  findOne(query: object): Promise<T>;
  findById(id: string): Promise<T>;
  insertOne(doc: T): Promise<boolean>;
  deleteOne(id: string): Promise<boolean>;
  updateOne(id: string, updateObj: T): Promise<boolean>;
  upsert(doc: T): Promise<boolean>;
}
