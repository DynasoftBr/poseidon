import { AbstractService } from "./abstract-service";
import { ConcreteEntity } from "../models";
import { EntityHelpers } from "../data/repositories/entity-helpers";
import { ok } from "assert";

export class ConcreteEntityService<T extends ConcreteEntity> extends AbstractService<T> {

    protected async beforeValidateUpdate(entity: T, old: T): Promise<T> {
        EntityHelpers.applyConvention(entity, this.entityType);
        EntityHelpers.parseDateTimeProperties(entity, this.entityType);
        EntityHelpers.addUpdateInfo(entity);

        return entity;
    }

    protected async beforeValidateInsert(entity: T): Promise<T> {
        EntityHelpers.ensureIdProperty(entity);
        EntityHelpers.applyDefaults(entity, this.entityType);
        EntityHelpers.applyConvention(entity, this.entityType);
        EntityHelpers.parseDateTimeProperties(entity, this.entityType);
        EntityHelpers.addCreationInfo(entity);
        EntityHelpers.setBranchInfo(entity);

        return entity;
    }

    protected async beforeValidation(entity: T, isNew: boolean, old?: T): Promise<T> {
        super.beforeValidation(entity, isNew, old);

        if (isNew)
            return this.beforeValidateInsert(entity);
        else
            return this.beforeValidateUpdate(entity, old);
    }

}