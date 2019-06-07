import { EntityTypeRepository } from "../entity-type-repository";
import { ConcreteEntityRepository } from "../concrete-entity-repository";
import { AbstractRepository } from "../abstract-repository";
import { IRepositoryFactory } from "./irepository-factory";
import { IConcreteEntity, SysEntities, IEntityType } from "@poseidon/core-models";
import { IDataStorage } from "../../../data";
import { DatabaseError, SysMsgs } from "../../../exceptions";

export class RepositoryFactory implements IRepositoryFactory {

    private repositories: Map<string, AbstractRepository<IConcreteEntity>> = new Map();
    public constructor(
        private storage: IDataStorage) { }

    async createByName(entityTypeName: string): Promise<ConcreteEntityRepository> {
        if (entityTypeName === SysEntities.entityType)
            return await this.entityType();

        // try to find an existent instance, and return it.
        let repo = this.repositories.get(entityTypeName);
        if (repo) return repo;

        // As there is no repository instance for this entity type yet, create one and store it on cache.
        repo = await this.createConcreteEntityRepository(entityTypeName);
        this.repositories.set(entityTypeName, repo);

        return repo;
    }

    private async createConcreteEntityRepository(entityTypeName: string):
        Promise<ConcreteEntityRepository> {

        const entityTypeRepo = await this.entityType();
        const entityType = await entityTypeRepo.findByName(entityTypeName);

        if (entityType == null)
            throw new DatabaseError(SysMsgs.error.entityTypeNotFound, entityTypeName);

        if (entityType.abstract === true)
            throw new DatabaseError(SysMsgs.error.abstractEntityType, entityTypeName);

        return new ConcreteEntityRepository(this.storage, entityType);
    }

    entityTypeRepo: EntityTypeRepository;
    async entityType(): Promise<EntityTypeRepository> {

        if (this.entityTypeRepo != null)
            return this.entityTypeRepo;

        const entityType = await this.storage.collection<IEntityType>(SysEntities.entityType)
            .findOne({ name: SysEntities.entityType });

        return this.entityTypeRepo = new EntityTypeRepository(this.storage, entityType);
    }
}