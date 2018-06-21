import { AbstractRepository } from "./abstract-repository";
import { EntityType } from "../../models";
import { Db } from "mongodb";
import { SysEntities, SysProperties } from "../../constants";
import { SysMsgs } from "../..";
import _ = require("lodash");
import { ENTITY_TYPE_CHANGED } from "./events";
import { AbstractRepositoryFactory } from "./factories/abstract-repository-factory";
import { ValidationProblem } from "../validation/validation-problem";
import { EntityHelpers } from "./entity-helpers";
import { DataStorage } from "../storage";

export class EntityTypeRepository extends AbstractRepository<EntityType> {

    cacheByName: Map<string, EntityType> = new Map();
    cacheById: Map<string, EntityType> = new Map();
    constructor(storage: DataStorage,
        entityType: EntityType) {
        super(storage.collection<EntityType>(SysEntities.entityType), storage, entityType);
    }

    async findById(id: string): Promise<EntityType> {
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

    async findByName(entityTypeName: string): Promise<EntityType> {
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