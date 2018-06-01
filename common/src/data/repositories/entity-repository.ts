import { AbstractRepository } from "./abstract-repository";
import { Entity, EntityType } from "../../models";
import { Db } from "mongodb";
import { SysEntities } from "../../constants";
import { EntityTypeRepository } from "./entity-type-repository";
import { SysMsgs, DatabaseError } from "../..";
import { ENTITY_TYPE_CHANGED } from "./events";
import _ = require("lodash");
import { AbstractRepositoryFactory } from "./factories/abstract-repository-factory";
import { EntityValidatorInterface } from "../validation/entity-validator-interface";

export class EntityRepository extends AbstractRepository<Entity> {

    constructor(private _db: Db,
        entityType: EntityType,
        repoFactory: AbstractRepositoryFactory) {

        super(_db.collection(SysEntities.entityType), entityType, repoFactory);
    }

    private async beforeValidateInsert(entity: Entity): Promise<Entity> {
        let factory = new EntityFactory(this.entityType, entity);
        factory.ensureIdProperty();
        factory.applyDefaults();
        factory.applyConvention();
        factory.parseDateTimeProperties();

        return entity;
    }

    async beforeValidation(entity: Entity, isNew: boolean): Promise<Entity> {
        if (isNew)
            return this.beforeValidateInsert(entity);
        else
            return this.beforeValidateUpdate(entity);
    }

    async validating(entity: Entity, isNew: boolean): Promise<ValidationProblem[]> {
        return null;
    }

    async beforeSave(entity: EntityType, isNew: boolean): Promise<boolean> {
        return true;
    }

    async afterSave(entity: EntityType, isNew: boolean): Promise<void> { }

    // Not used yet.
    async beforeDelete(entity: EntityType): Promise<boolean> { return true; }

    async afterDelete(entity: EntityType): Promise<void> { }
}