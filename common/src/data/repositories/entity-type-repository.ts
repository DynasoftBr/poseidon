import { AbstractRepository } from "./abstract-repository";
import { EntityType, Entity } from "../../models";
import { Db } from "mongodb";
import { SysEntities, SysProperties } from "../../constants";
import { DatabaseError } from "../";
import { SysMsgs } from "../..";
import _ = require("lodash");
import { ENTITY_TYPE_CHANGED } from "./events";
import { AbstractRepositoryFactory } from "./factories/abstract-repository-factory";
import { ValidationProblem } from "./validation-problem";
import { EntityHelpers } from "./entity-helpers";
import { EWOULDBLOCK } from "constants";

export class EntityTypeRepository extends AbstractRepository<EntityType> {

    constructor(private _db: Db,
        entityType: EntityType,
        repoFactory: AbstractRepositoryFactory) {
        super(_db.collection(SysEntities.entityType), entityType, repoFactory);
    }

    private requireReservedProperties(entity: EntityType): ValidationProblem[] {
        let problems: ValidationProblem[] = [];

        _.forOwn(SysProperties, (reqProp, key) => {
            let props = _.filter(entity.props, { name: reqProp });

            if (props.length == 0)
                problems.push(new ValidationProblem(reqProp, "missingRequiredEntityProperty",
                    SysMsgs.validation.missingRequiredEntityProperty, reqProp));

            else if (!_.isEqual(props[0], reqProp))
                problems.push(new ValidationProblem(reqProp, "invalidRequiredEntityProperty",
                    SysMsgs.validation.invalidRequiredEntityProperty, reqProp));

        });

        return problems;
    }

    private async beforeValidateUpdate(entity: EntityType, old: EntityType): Promise<EntityType> {
        EntityHelpers.applyConvention(entity, this.entityType);
        EntityHelpers.parseDateTimeProperties(entity, this.entityType);

        return entity;
    }

    private async beforeValidateInsert(entity: EntityType, old?: EntityType): Promise<EntityType> {
        EntityHelpers.ensureIdProperty(entity);
        EntityHelpers.applyDefaults(entity, this.entityType);
        EntityHelpers.applyConvention(entity, this.entityType);
        EntityHelpers.parseDateTimeProperties(entity, this.entityType);
        EntityHelpers.addReserverdPropsEtType(entity, this.entityType);

        return entity;
    }

    async beforeValidation(entity: EntityType, isNew: boolean, old?: EntityType): Promise<EntityType> {
        if (isNew)
            return this.beforeValidateInsert(entity);
        else
            return this.beforeValidateUpdate(entity, old);
    }

    async validating(entity: EntityType, isNew: boolean, old?: EntityType): Promise<ValidationProblem[]> {
        return this.requireReservedProperties(entity);
    }

    async beforeSave(entity: EntityType, isNew: boolean, old?: EntityType): Promise<boolean> {
        return true;
    }

    async afterSave(entity: EntityType, isNew: boolean, old?: EntityType): Promise<void> {

        if (!isNew) {
            // On an entity type changes, notify all listeners.
            this.emit(ENTITY_TYPE_CHANGED, entity);

            await this.updateCollectionName(old.name, entity.name);
            await this.updateIndexes(entity);
        }
    }

    // Not used yet.
    async beforeDelete(entity: EntityType): Promise<boolean> { return true; }

    async afterDelete(entity: EntityType): Promise<void> {
        // TODO: Move items to bin, update history, drop collection...
    }

    private async updateCollectionName(oldName: string, newName: string) {
        // TODO: implement
    }

    private async updateIndexes(entity: EntityType) {
        // TODO: implement
    }
}