import { Entity, EntityType, ConcreteEntity } from "../models";
import { Service } from "./service";
import { AbstractRepositoryFactory, Repository } from "../data";

export abstract class AbstractService<T extends ConcreteEntity> implements Service<T> {

    constructor(protected repo: Repository<T>, protected repoFactory: AbstractRepositoryFactory) { }

    async findMany(filter: object, skip?: number, limit?: number, sort?: object): Promise<T[]> {
        return await this.repo.findMany(filter, skip, limit, sort);
    }

    async findOne(filter: object): Promise<T> {
        return await this.repo.findOne(filter);
    }

    async insertOne(doc: T): Promise<T> {
        await this.repo.insertOne(doc);
        return doc;
    }

    async deleteOne(id: string): Promise<boolean> {
        return await this.repo.deleteOne(id);
    }

    async updateOne(id: string, updateObj: T): Promise<T> {
        await this.repo.updateOne(id, updateObj);
        return updateObj;
    }
}