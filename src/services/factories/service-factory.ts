import { IConcreteEntity, SysEntities } from "@poseidon/core-models";
import { IService } from "../iservice";
import { ConcreteEntityService } from "../concrete-entity-service";
import { EntityTypeService } from "../entity-type-service";
import { IServiceFactory } from "./iservice-factory";
import { IRepositoryFactory } from "../../data/repositories/factories/irepository-factory";

export class ServiceFactory implements IServiceFactory {

    private services = new Map<string, IService<IConcreteEntity>>();
    constructor(private repoFactory: IRepositoryFactory) { }

    public async getByName<T extends IConcreteEntity = IConcreteEntity>(entityTypeName: string): Promise<IService<T>> {

        // try to find an existent instance, and return it.
        let service = this.services.get(entityTypeName);

        if (service)
            return service as IService<T>;

        // As there is no instance for this entity type yet, create one and store it on cache.
        service = await this.createServiceByName(entityTypeName);
        this.services.set(entityTypeName, service);

        return service as IService<T>;
    }

    private async createServiceByName(entityTypeName: string): Promise<IService<IConcreteEntity>> {
        switch (entityTypeName) {
            case SysEntities.entityType:
                return this.createEntityTypeService();
            default:
                return this.createDefaultService(entityTypeName);
        }
    }

    private async createDefaultService(entityTypeName: string): Promise<IService<IConcreteEntity>> {
        const entityRepo = await this.repoFactory.createByName(entityTypeName);
        return new ConcreteEntityService(entityRepo, this.repoFactory);
    }

    private async createEntityTypeService(): Promise<EntityTypeService> {
        const repo = await this.repoFactory.entityType();
        return new EntityTypeService(repo, this.repoFactory);
    }

}