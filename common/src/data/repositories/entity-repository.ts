import { AbstractRepository } from "./abstract-repository";
import { Entity, EntityType } from "../../models";
import { ValidationProblem, EntityFactory } from "../validation";
import { Db } from "mongodb";
import { SysEntities } from "../../constants";
import { EntityTypeRepository } from "./entity-type-repository";
import { SysMsgs, DatabaseError } from "../..";
import { ENTITY_TYPE_CHANGED } from "./events";
import _ = require("lodash");

export class EntityRepository extends AbstractRepository<Entity> {


    private constructor(private _db: Db, entityType: EntityType) {
        super(_db.collection(SysEntities.entityType), entityType);
    }

    static async init(db: Db, entityTypeRepository: AbstractRepository<EntityType>): Promise<EntityRepository> {
        // Load the entity type.
        var entityType = await entityTypeRepository.findOne(SysEntities.entityType);

        // If Entity Type is not on Db it's probability a database inconsistency.
        if (entityType === null)
            throw new DatabaseError(SysMsgs.error.entityTypeNotFound, SysEntities.entityType);

        var newRepo = new EntityRepository(db, entityType);

        // Listen to entity type changes.
        entityTypeRepository.on(ENTITY_TYPE_CHANGED, (newEntityType: EntityType) => {
            if (newEntityType.name == newRepo.entityType.name)
                newRepo.entityType = newEntityType;
        });

        return new EntityRepository(db, entityType);
    }

    private async beforeValidateUpdate(entity: Entity): Promise<Entity> {
        let oldEntity: Entity = await this.findOne(entity._id);

        if (!oldEntity)
            throw new DatabaseError(SysMsgs.error.entityNotFound, entity._id, this.entityType.name);

        entity = _.assignIn(oldEntity, entity); // Overwrite old values with new ones.

        let factory = new EntityFactory(this.entityType, entity);
        factory.applyConvention();
        factory.parseDateTimeProperties();

        return entity;
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