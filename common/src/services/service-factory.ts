import { DataStorage } from "../data/storage/data-storage";
import { AbstractRepositoryFactory } from "../data";
import { EntityType, Entity, ConcreteEntity } from "../models";
import { Service } from "./service";
import { ConcreteEntityService } from "./concrete-entity-service";
import { EntityTypeService } from "./entity-type-service";
import { SysEntities } from "../constants";

export class ServiceFactory {

    constructor(private repoFactory: AbstractRepositoryFactory) { }

    async getEntityTypeService(): Promise<EntityTypeService> {
        const repo = await this.repoFactory.entityType();

        return new EntityTypeService(repo, this.repoFactory);
    }

    async getServiceByName(entityTypeName: string): Promise<Service> {
        if (entityTypeName === SysEntities.entityType)
            return this.getEntityTypeService();

        const repo = await this.repoFactory.createByName(entityTypeName);

        return new ConcreteEntityService(repo, this.repoFactory);
    }
}