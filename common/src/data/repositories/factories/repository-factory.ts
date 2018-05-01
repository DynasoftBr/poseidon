import { AbstractRepositoryFactory } from "./abstract-repository-factory";
import { RepositoryInterface, GenericRepositoryInterface } from "../repository-interface";
import { SysEntities } from "../../../constants";
import { EntityTypeRepository } from "../entity-type-repository";
import { EntityType } from "../../../models";
import { Db } from "mongodb";
import { EntityRepository } from "../entity-repository";
import { ENTITY_TYPE_DELETED } from "../events";
import { AbstractRepository } from "../abstract-repository";
import _ = require("lodash");

export class RepositoryFactory extends AbstractRepositoryFactory {

    private repositories: Array<RepositoryInterface> = [];
    private constructor(private db: Db, private entityTypeRepository: EntityTypeRepository) {
        super();

        entityTypeRepository.on(ENTITY_TYPE_DELETED, (entityType: EntityType) => {
            _.remove(this.repositories, (el) => el.entityType.name === entityType.name);
        });
    }

    static async initialize(db: Db) {
        let entityTypeRepo = await EntityTypeRepository.init(db);

        return new RepositoryFactory(db, entityTypeRepo);
    }

    async createRepository(entityTypeName: string): Promise<RepositoryInterface> {
        if (entityTypeName === SysEntities.entityType)
            return this.entityTypeRepository;

        // try to find an existent instance, and return it.
        var repo = _.find(this.repositories, (el) => el.entityType.name === entityTypeName);
        if (repo)
            return repo;

        repo = await this.createStandardEntityRepository(entityTypeName);
        return repo;
    }

    async createStandardEntityRepository(entityTypeName: string) {
        var repo = await EntityRepository.init(this.db, this.entityTypeRepository);

        this.repositories.push(repo);

        return repo;
    }
}