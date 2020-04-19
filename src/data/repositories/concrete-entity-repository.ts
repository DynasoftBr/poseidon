import { IDataStorage, IStorageCollection } from "../storage";
import { IEntity, IEntityType } from "@poseidon/core-models";
import { IRepository } from "./irepository";

export class ConcreteEntityRepository<T extends IEntity = IEntity> implements IRepository<T> {
  protected readonly collection: IStorageCollection<T>;
  constructor(protected readonly storage: IDataStorage, public readonly entityType: IEntityType) {
    this.collection = storage.collection<T>(entityType.name);
  }

  async deleteOne(id: string): Promise<boolean> {
    return await this.collection.deleteOne(id);
  }

  async updateOne(id: string, entity: T): Promise<boolean> {
    return this.collection.updateOne(id, entity);
  }

  async upsert(entity: T): Promise<boolean> {
    return this.collection.upsert(entity);
  }

  async insertOne(entity: T): Promise<boolean> {
    return this.collection.insertOne(entity);
  }

  async findById(id: string): Promise<T> {
    return await this.collection.findOne({ _id: id });
  }

  async findMany(query: object[]): Promise<T[]> {
    return await this.collection.findMany(query);
  }

  async findOne(query: object) {
    return await this.collection.findOne(query);
  }
}
