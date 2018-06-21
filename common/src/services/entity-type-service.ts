import { AbstractService } from "./abstract-service";
import { EntityTypeRepository } from "../data/repositories/entity-type-repository";
import { AbstractRepositoryFactory } from "../data";
import { EntityType } from "../models";

export class EntityTypeService extends AbstractService<EntityType> {

    constructor(protected repo: EntityTypeRepository, repoFactory: AbstractRepositoryFactory) {
        super(repo, repoFactory);
    }
}