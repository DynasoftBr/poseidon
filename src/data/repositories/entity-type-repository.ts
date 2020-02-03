import { IDataStorage } from "../storage";
import { IEntityType, SysEntities } from "@poseidon/core-models";
import { ConcreteEntityRepository } from "./concrete-entity-repository";

export class EntityTypeRepository extends ConcreteEntityRepository<IEntityType> {
  cacheByName: Map<string, IEntityType> = new Map();
  cacheById: Map<string, IEntityType> = new Map();

  constructor(storage: IDataStorage, entityType: IEntityType) {
    super(storage, entityType);
  }

  async findById(id: string): Promise<IEntityType> {
    // Fist try to get from cache.
    const cache = this.cacheById.get(id);
    if (cache != null) return cache;

    // If we could not find it on the cache, try find on the storage and than add it to the cache.
    const result = await this.collection.findOne({ _id: id });
    if (result != null) {
      this.cacheByName.set(result.name, result);
      this.cacheById.set(id, result);
    }

    return result;
  }

  async findByName(entityTypeName: string): Promise<IEntityType> {
    // Fist try to get from cache.
    const cache = this.cacheByName.get(entityTypeName);
    if (cache != null) return cache;

    // If we could not find it on the cache, try find on the storage and than add it to the cache.
    const result = await this.collection.findOne({ name: entityTypeName });
    if (result != null) {
      this.cacheByName.set(entityTypeName, result);
      this.cacheById.set(result._id, result);
    }

    return result;
  }
}
