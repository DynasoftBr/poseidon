import { IStorageCollection } from "../istorage-collection";
import { Db, Collection } from "mongodb";
import { IEntity } from "@poseidon/core-models";

export class MongoDbStorageCollection<T extends IEntity = IEntity> implements IStorageCollection<T> {
  private collection: Collection<T>;
  constructor(private readonly db: Db, collectionName: string) {
    this.collection = db.collection<T>(collectionName);
  }

  ensureIndex(indexName: string, field: string, unique: boolean): void {
    throw new Error("Method not implemented.");
  }

  dropIndex(indexName: string): void {
    throw new Error("Method not implemented.");
  }

  drop(): void {
    throw new Error("Method not implemented.");
  }

  async findMany(query: object[]): Promise<T[]> {
    const result = await this.collection.aggregate(query).toArray();
    return result;
  }

  async findOne(query: object): Promise<T> {
    try {
      return await this.collection.findOne(query);
    } catch (error) {
      /// this.handleError(error);
    }
  }

  public async upsert(doc: T): Promise<boolean> {
    const result = (await this.collection.updateOne({ _id: doc._id } as any, { $set: doc }, { upsert: true })).result;
    return result.ok === 1;
  }

  async insertOne(doc: T): Promise<boolean> {
    try {
      const result = await this.collection.insertOne(doc as any);
      return result.insertedCount === 1;
    } catch (error) {
      /// this.handleError(error);
    }
  }

  async deleteOne(id: string): Promise<boolean> {
    try {
      const result = await this.collection.findOneAndDelete({ _id: id } as any);
      return result.ok === 1;
    } catch (error) {
      /// this.handleError(error);
    }
  }

  async updateOne(id: string, updateObj: T): Promise<boolean> {
    try {
      const result = await this.collection.findOneAndUpdate({ _id: id } as any, updateObj);
      return result.ok === 1;
    } catch (error) {
      /// this.handleError(error);
    }
  }
}
