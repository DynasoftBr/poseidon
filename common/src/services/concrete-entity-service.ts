import { AbstractService } from "./abstract-service";
import { ConcreteEntity } from "../models";
import { EntityHelpers } from "../data/repositories/entity-helpers";

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

        return entity;
    }

    protected async beforeValidation(entity: T, isNew: boolean, old?: T): Promise<T> {
        if (isNew)
            return this.beforeValidateInsert(entity);
        else
            return this.beforeValidateUpdate(entity, old);
    }

}