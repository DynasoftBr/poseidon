import { AbstractRepository } from "./abstract-repository";
import { EntitySchema, EntityType } from "../../models";
import { Db } from "mongodb";
import { SysEntities } from "../../constants";
import { EntityTypeRepository } from "./entity-type-repository";
import { SysMsgs, DatabaseError } from "../..";
import { ENTITY_TYPE_CHANGED } from "./events";
import _ = require("lodash");
import { AbstractRepositoryFactory } from "./factories/abstract-repository-factory";
import { EntityHelpers } from "./entity-helpers";
import { ValidationProblem } from "./validation-problem";

export class EntityRepository extends AbstractRepository<EntitySchema> {

    constructor(private _db: Db,
        entityType: EntityType,
        repoFactory: AbstractRepositoryFactory) {

        super(_db.collection(SysEntities.entityType), entityType, repoFactory);
    }

    private async beforeValidateUpdate(entity: EntitySchema, old: EntitySchema): Promise<EntitySchema> {
        EntityHelpers.applyConvention(entity, this.entityType);
        EntityHelpers.parseDateTimeProperties(entity, this.entityType);

        return entity;
    }

    private async beforeValidateInsert(entity: EntitySchema, old?: EntitySchema): Promise<EntitySchema> {
        EntityHelpers.ensureIdProperty(entity);
        EntityHelpers.applyDefaults(entity, this.entityType);
        EntityHelpers.applyConvention(entity, this.entityType);
        EntityHelpers.parseDateTimeProperties(entity, this.entityType);

        return entity;
    }

    async beforeValidation(entity: EntitySchema, isNew: boolean, old?: EntitySchema): Promise<EntitySchema> {
        if (isNew)
            return this.beforeValidateInsert(entity);
        else
            return this.beforeValidateUpdate(entity, old);
    }

    async validating(entity: EntitySchema, isNew: boolean, old?: EntitySchema): Promise<ValidationProblem[]> {
        return null;
    }

    async beforeSave(entity: EntitySchema, isNew: boolean, old?: EntitySchema): Promise<boolean> {
        return true;
    }

    async afterSave(entity: EntitySchema, isNew: boolean, old?: EntitySchema): Promise<void> { }

    // Not used yet.
    async beforeDelete(entity: EntitySchema): Promise<boolean> { return true; }

    async afterDelete(entity: EntitySchema): Promise<void> { }
}