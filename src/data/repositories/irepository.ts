import { IEntity, IEntityType } from "@poseidon/core-models";

export interface IRepository<T extends IEntity = IEntity> {
  entityType: IEntityType;
  findMany(query: object[]): Promise<T[]>;
  findOne(query: object): Promise<T>;
  findById(id: string): Promise<T>;
  insertOne(doc: T): Promise<boolean>;
  deleteOne(id: string): Promise<boolean>;
  updateOne(id: string, updateObj: T): Promise<boolean>;
  upsert(doc: T): Promise<boolean>;
}