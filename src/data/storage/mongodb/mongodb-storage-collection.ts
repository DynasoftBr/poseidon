import { IStorageCollection } from "../istorage-collection";
import { Db, Collection } from "mongodb";
import { IConcreteEntity } from "@poseidon/core-models";

export class MongoDbStorageCollection<
  T extends IConcreteEntity = IConcreteEntity
> implements IStorageCollection<T> {
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

  async findMany(
    filter: object,
    skip?: number,
    limit?: number,
    sort?: object
  ): Promise<T[]> {
    throw new Error("Method not implemented.");
  }

  async findOne(filter: object): Promise<T> {
    try {
      return await this.collection.findOne(filter);
    } catch (error) {
      /// this.handleError(error);
    }
  }

  async insertOne(doc: T): Promise<boolean> {
    try {
      const result = await this.collection.insertOne(doc);
      return result.insertedCount === 1;
    } catch (error) {
      /// this.handleError(error);
    }
  }

  async deleteOne(id: string): Promise<boolean> {
    try {
      const result = await this.collection.findOneAndDelete({ _id: (id as any) });
      return result.ok === 1;
    } catch (error) {
      /// this.handleError(error);
    }
  }

  async updateOne(id: string, updateObj: T): Promise<boolean> {
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: id as any },
        updateObj
      );
      return result.ok === 1;
    } catch (error) {
      /// this.handleError(error);
    }
  }
}
