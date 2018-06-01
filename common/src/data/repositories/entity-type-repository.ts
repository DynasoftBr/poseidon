import { AbstractRepository } from "./abstract-repository";
import { EntityType } from "../../models";
import { Db } from "mongodb";
import { SysEntities, SysProperties } from "../../constants";
import { DatabaseError } from "../";
import { SysMsgs } from "../..";
import _ = require("lodash");
import { ENTITY_TYPE_CHANGED } from "./events";
import { AbstractRepositoryFactory } from "./factories/abstract-repository-factory";
import { ValidationProblem } from "./validation-problem";
import { EntityHelpers } from "./entity-helpers";

export class EntityTypeRepository extends AbstractRepository<EntityType> {


    constructor(private _db: Db,
        entityType: EntityType,
        repoFactory: AbstractRepositoryFactory) {
        super(_db.collection(SysEntities.entityType), entityType, repoFactory);
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
        return null;
    }

    private async beforeValidateInsert(entity: EntityType): Promise<EntityType> {
        EntityHelpers.ensureIdProperty(entity);
        EntityHelpers.applyDefaults(entity, this.entityType);
        EntityHelpers.applyConvention(entity, this.entityType);
        EntityHelpers.parseDateTimeProperties(entity, this.entityType);
        EntityHelpers.addReserverdPropsEtType(entity, this.entityType);

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