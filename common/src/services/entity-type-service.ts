import { EntityTypeRepository } from "../data/repositories/entity-type-repository";
import { AbstractRepositoryFactory, BuiltInEntries } from "../data";
import { EntityType } from "../models";
import { SysProperties, PropertyTypes, ProblemKeywords } from "../constants";
import *  as _ from "lodash";
import { ConcreteEntityService } from "./concrete-entity-service";
import { ValidationProblem } from "../validation/validation-problem";
import { SysMsgs } from "..";
import { EntityTypeValidator } from "../validation/entity-type/entity-type-validator";
import { MandatoryEntityPropertiesValidator } from "../validation/entity-type/mandatory-entity-properties-validator";

export class EntityTypeService extends ConcreteEntityService<EntityType> {

    constructor(protected repo: EntityTypeRepository, repoFactory: AbstractRepositoryFactory) {
        super(repo, repoFactory);

        super.addValidator(new EntityTypeValidator());
        super.addValidator(new MandatoryEntityPropertiesValidator());
    }

    protected async beforeValidateInsert(entity: EntityType): Promise<EntityType> {
        await super.beforeValidateInsert(entity);

        this.addReserverdPropsEtType(entity);

        return entity;
    }

    private addReserverdPropsEtType(entity: EntityType): EntityType {

        const builtin = new BuiltInEntries();

        if (_.filter((<EntityType>entity).props, { name: SysProperties.changedAt })
            .length == 0)
            (<EntityType>entity).props.push(builtin.changedAtPropertyDefinition);

        if (_.filter((<EntityType>entity).props, { name: SysProperties.changedBy })
            .length == 0)
            (<EntityType>entity).props.push(builtin.changedByPropertyDefinition);

        if (_.filter((<EntityType>entity).props, { name: SysProperties.createdAt })
            .length == 0)
            (<EntityType>entity).props.push(builtin.createdAtPropertyDefinition);

        if (_.filter((<EntityType>entity).props, { name: SysProperties.createdBy })
            .length == 0)
            (<EntityType>entity).props.push(builtin.createdByPropertyDefinition);

        if (_.filter((<EntityType>entity).props, { name: SysProperties._id })
            .length == 0)
            (<EntityType>entity).props.push(builtin.idPropertyDefinition);

        return entity;
    }
}