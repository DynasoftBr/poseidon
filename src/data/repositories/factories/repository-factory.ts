import { EntityTypeRepository } from "../entity-type-repository";
import { ConcreteEntityRepository } from "../concrete-entity-repository";
import { IRepositoryFactory } from "./irepository-factory";
import { IConcreteEntity, SysEntities, IEntityType } from "@poseidon/core-models";
import { IDataStorage } from "../../../data";
import { DatabaseError, SysMsgs } from "../../../exceptions";
import { IRepository } from "../irepository";

export class RepositoryFactory implements IRepositoryFactory {
  private reposById: Map<string, IRepository<IConcreteEntity>> = new Map();

  public constructor(private storage: IDataStorage) {}

  async createById<TEntity extends IConcreteEntity = IConcreteEntity>(
    entityTypeId: string
  ): Promise<IRepository<TEntity>> {
    // try to find an existent instance, and return it.
    let repo = this.reposById.get(entityTypeId) as IRepository<TEntity>;
    if (repo) return repo as IRepository<TEntity>;

    if (entityTypeId === SysEntities.entityType) return ((await this.entityType()) as unknown) as IRepository<TEntity>;

    // As there is no repository instance for this entity type yet, create one and store it on cache.
    repo = (await this.createConcreteEntityRepository(entityTypeId)) as IRepository<TEntity>;
    this.reposById.set(entityTypeId, repo);

    return repo;
  }

  private async createConcreteEntityRepository(entityTypeId: string): Promise<IRepository<IConcreteEntity>> {
    const entityTypeRepo = await this.entityType();
    const entityType = await entityTypeRepo.findById(entityTypeId);

    if (entityType == null) throw new DatabaseError(SysMsgs.error.entityTypeNotFound, entityTypeId);

    if (entityType.abstract === true) throw new DatabaseError(SysMsgs.error.abstractEntityType, entityTypeId);

    return new ConcreteEntityRepository(this.storage, entityType);
  }

  entityTypeRepo: EntityTypeRepository;
  async entityType(): Promise<EntityTypeRepository> {
    if (this.entityTypeRepo != null) return this.entityTypeRepo;

    const entityType = await this.storage
      .collection<IEntityType>(SysEntities.entityType)
      .findOne({ name: SysEntities.entityType });

    this.entityTypeRepo = new EntityTypeRepository(this.storage, entityType);
    this.reposById.set(entityType._id, this.entityTypeRepo);

    return this.entityTypeRepo;
  }
}
