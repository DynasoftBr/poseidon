import { AbstractRepository } from "./abstract-repository";
import { EntityType } from "../../models";
import { ValidationProblem, EntityFactory } from "../validation";
import { Db } from "mongodb";
import { SysEntities, SysProperties } from "../../constants";
import { DatabaseError } from "../";
import { SysMsgs } from "../..";
import _ = require("lodash");
import { ENTITY_TYPE_CHANGED } from "./events";

export class EntityTypeRepository extends AbstractRepository<EntityType> {


    constructor(private _db: Db, entityType: EntityType) {
        super(_db.collection(SysEntities.entityType), entityType);
    }

    static async init(db: Db): Promise<EntityTypeRepository> {

        // Load the entity type.
        var entityType = await db.collection(SysEntities.entityType)
            .findOne({ name: SysEntities.entityType });

        // If Entity Type is not on Db it's probability a database inconsistency.
        if (entityType === null)
            throw new DatabaseError(SysMsgs.error.entityTypeNotFound, SysEntities.entityType);

        return new EntityTypeRepository(db, entityType);
    }

    private requireReservedProperties(entity: EntityType): ValidationProblem[] {
        let problems: ValidationProblem[] = [];

        _.forOwn(SysProperties, (reqProp, key) => {
            let props = _.filter(entity.props, { name: reqProp.name });

            if (props.length == 0)
                problems.push(new ValidationProblem(reqProp.name, "missingRequiredEntityProperty",
                    SysMsgs.validation.missingRequiredEntityProperty, reqProp.name));

            else if (!_.isEqual(props[0], reqProp))
                problems.push(new ValidationProblem(reqProp.name, "invalidRequiredEntityProperty",
                    SysMsgs.validation.invalidRequiredEntityProperty, reqProp.name));

        });

        return problems;
    }

    private async beforeValidateUpdate(entity: EntityType): Promise<EntityType> {
        
    }

    private async beforeValidateInsert(entity: EntityType): Promise<EntityType> {
        let factory = new EntityFactory(this.entityType, entity);
        factory.ensureIdProperty();
        factory.applyDefaults();
        factory.applyConvention();
        factory.parseDateTimeProperties();
        factory.addReserverdPropsEtType();

        return entity;
    }

    async beforeValidation(entity: EntityType, isNew: boolean): Promise<EntityType> {
        if (isNew)
            return this.beforeValidateInsert(entity);
        else
            return this.beforeValidateUpdate(entity);
    }

    async validating(entity: EntityType, isNew: boolean): Promise<ValidationProblem[]> {
        return this.requireReservedProperties(entity);
    }

    async beforeSave(entity: EntityType, isNew: boolean): Promise<boolean> {
        return true;
    }

    async afterSave(entity: EntityType, isNew: boolean): Promise<void> {

        // On an entity type changes, notify all listeners.
        if (!isNew)
            this.emit(ENTITY_TYPE_CHANGED, entity);
    }

    // Not used yet.
    async beforeDelete(entity: EntityType): Promise<boolean> { return true; }

    async afterDelete(entity: EntityType): Promise<void> { }
}