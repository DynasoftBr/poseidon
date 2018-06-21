import { ConcreteEntityRepository } from "../concrete-entity-repository";
import { EntityTypeRepository } from "../entity-type-repository";

export abstract class AbstractRepositoryFactory {
    abstract async entityType(): Promise<EntityTypeRepository>;
    abstract async createByName(entityTypeName: string): Promise<ConcreteEntityRepository>;
}