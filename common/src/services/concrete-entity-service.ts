import { AbstractService } from "./abstract-service";
import { ConcreteEntity } from "../models";
import { EntityHelpers } from "../data/repositories/entity-helpers";
import { SchemaValidator } from "../validation/general/schema-validator";
import { AbstractRepositoryFactory, Repository } from "../data";
import { LinkedEntitiesValidator } from "../validation/general/linked-entities-validator";

export class ConcreteEntityService<T extends ConcreteEntity> extends AbstractService<T> {

    constructor(protected repo: Repository<T>, protected repoFactory: AbstractRepositoryFactory) {
        super(repo, repoFactory);

        super.addValidator(new SchemaValidator(this.entityType, repoFactory));
        super.addValidator(new LinkedEntitiesValidator(this.entityType, repoFactory));
    }
    protected async beforeValidation(entity: T, isNew: boolean, old?: T): Promise<T> {
        super.beforeValidation(entity, isNew, old);

        if (isNew)
            return this.beforeValidateInsert(entity);
        else
            return this.beforeValidateUpdate(entity, old);
    }

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

}