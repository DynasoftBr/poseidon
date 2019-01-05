import { DataStorage } from "../data/storage/data-storage";
import { AbstractRepositoryFactory } from "../data";
import { EntityType, Entity, ConcreteEntity } from "../models";
import { Service } from "./service";
import { ConcreteEntityService } from "./concrete-entity-service";
import { EntityTypeService } from "./entity-type-service";
import { SysEntities } from "../constants";
import { AbstractService } from "./abstract-service";

export class ServiceFactory {

    private services = new Map<string, AbstractService<ConcreteEntity>>();
    constructor(private repoFactory: AbstractRepositoryFactory) { }

    async getServiceByName(entityTypeName: string): Promise<AbstractService<ConcreteEntity>> {
        // try to find an existent instance, and return it.
        let service = this.services.get(entityTypeName);
        if (service) return service;

        // As there is no instance for this entity type yet, create one and store it on cache.
        service = await this.createServiceByName(entityTypeName);
        this.services.set(entityTypeName, service);

        return service;
    }

    private async createServiceByName(entityTypeName: string): Promise<AbstractService<ConcreteEntity>> {
        switch (entityTypeName) {
            case SysEntities.entityType:
                return this.createEntityTypeService();
            default:
                return this.createDefaultService(entityTypeName);
        }
    }

    private async createDefaultService(entityTypeName: string): Promise<AbstractService<ConcreteEntity>> {
        const entityRepo = await this.repoFactory.createByName(entityTypeName);
        return new ConcreteEntityService(entityRepo, this.repoFactory);
    }

    private async createEntityTypeService(): Promise<EntityTypeService> {
        const repo = await this.repoFactory.entityType();
        return new EntityTypeService(repo, this.repoFactory);
    }

}