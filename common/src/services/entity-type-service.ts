import { EntityTypeRepository } from "../data/repositories/entity-type-repository";
import { AbstractRepositoryFactory, BuiltInEntries } from "../data";
import { EntityType } from "../models";
import { SysProperties } from "../constants";
import _ = require("lodash");
import { ConcreteEntityService } from "./concrete-entity-service";
import { ValidationProblem } from "../data/validation/validation-problem";
import { SysMsgs } from "..";

export class EntityTypeService extends ConcreteEntityService<EntityType> {

    constructor(protected repo: EntityTypeRepository, repoFactory: AbstractRepositoryFactory) {
        super(repo, repoFactory);
    }

    protected async beforeValidateInsert(entity: EntityType): Promise<EntityType> {
        super.beforeValidateInsert(entity);
        this.addReserverdPropsEtType(entity);
        return entity;
    }

    protected async validating(entity: EntityType, isNew: boolean, old?: EntityType)
        : Promise<ValidationProblem[]> {

        super.validating(entity, isNew, old);

        if (!isNew) return this.requireReservedProperties(entity);
        else return [];
    }

    private requireReservedProperties(entity: EntityType): ValidationProblem[] {
        const problems: ValidationProblem[] = [];
        const buildIn = new BuiltInEntries();
        const requiredProps = [
            buildIn.idPropertyDefinition,
            buildIn.createdAtPropertyDefinition,
            buildIn.createdByPropertyDefinition,
            buildIn.changedAtPropertyDefinition,
            buildIn.changedByPropertyDefinition
        ];

        requiredProps.forEach(reqProp => {
            const prop = _.find(entity.props, { name: reqProp.name });

            if (prop != null)
                problems.push(new ValidationProblem(reqProp.name, "missingRequiredEntityProperty",
                    SysMsgs.validation.missingRequiredEntityProperty, reqProp));

            else if (!_.isEqual(prop[0], reqProp))
                problems.push(new ValidationProblem(reqProp.name, "invalidRequiredEntityProperty",
                    SysMsgs.validation.invalidRequiredEntityProperty, reqProp));
        });

        return problems;
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