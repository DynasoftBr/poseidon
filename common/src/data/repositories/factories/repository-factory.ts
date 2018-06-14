import { AbstractRepositoryFactory } from "./abstract-repository-factory";
import { RepositoryInterface, GenericRepositoryInterface } from "../repository-interface";
import { SysEntities } from "../../../constants";
import { EntityTypeRepository } from "../entity-type-repository";
import { EntityType } from "../../../models";
import { Db } from "mongodb";
import { ENTITY_TYPE_DELETED } from "../events";
import { AbstractRepository } from "../abstract-repository";
import _ = require("lodash");
import { DatabaseError } from "../..";
import { SysMsgs } from "../../..";
import { EntityRepository } from "../entity-repository";

export class RepositoryFactory extends AbstractRepositoryFactory {

    private repositories: Array<RepositoryInterface> = [];
    public constructor(
        private db: Db) {
        super();
    }

    async createByName(entityTypeName: string): Promise<RepositoryInterface> {
        if (entityTypeName === SysEntities.entityType)
            return this.entityType();

        // try to find an existent instance, and return it.
        let repo = _.find(this.repositories, (el) => el.entityType.name === entityTypeName);
        if (repo) return repo;

        // As there is no repository instance for this entity type yet, create one.
        repo = await this.createStandardEntityRepository(entityTypeName);
        return repo;
    }

    private async createStandardEntityRepository(entityTypeName: string) {
        let entityTypeRepo = await this.entityType();
        let entityType = await entityTypeRepo.findOne({ name: entityTypeName });

        if (entityType == null)
            throw new DatabaseError(SysMsgs.error.entityTypeNotFound, SysEntities.entityType);

        let repo = new EntityRepository(this.db, entityType, this);

        this.repositories.push(repo);

        return repo;
    }

    entityTypeRepo: EntityTypeRepository;
    async entityType(): Promise<GenericRepositoryInterface<EntityType>> {

        if (this.entityTypeRepo == null) {
            let entityType = await this.db.collection(SysEntities.entityType).findOne({ name: SysEntities.entityType });
            this.entityTypeRepo = new EntityTypeRepository(this.db, entityType, this);
        }

        return this.entityTypeRepo;
    }
}