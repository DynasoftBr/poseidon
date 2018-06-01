import { GenericRepositoryInterface, RepositoryInterface } from "../repository-interface";
import { Entity, EntityType } from "../../..";

export abstract class AbstractRepositoryFactory {
    abstract async entityType(): Promise<GenericRepositoryInterface<EntityType>>;
    abstract async createByName(entityTypeName: string): Promise<RepositoryInterface>;
}