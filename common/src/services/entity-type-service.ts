import { EntityTypeRepository } from "../data/repositories/entity-type-repository";
import { AbstractRepositoryFactory, BuiltInEntries } from "../data";
import { EntityType, Validation } from "../models";
import { SysProperties, PropertyTypes, ProblemKeywords } from "../constants";
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

        const problems = await super.validating(entity, isNew, old);

        problems.push(...this.validatePatternProperties(entity));

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

        requiredProps.forEach((reqProp) => {
            const prop = _.find(entity.props, { name: reqProp.name });

            if (prop == null)
                problems.push(new ValidationProblem(reqProp.name, "missingRequiredEntityProperty",
                    SysMsgs.validation.missingRequiredEntityProperty, reqProp.name));

            else if (!_.isEqual(prop, reqProp))
                problems.push(new ValidationProblem(reqProp.name, "invalidRequiredEntityProperty",
                    SysMsgs.validation.invalidRequiredEntityProperty, reqProp.name));
        });

        return problems;
    }

    private validatePatternProperties(entity: EntityType)
        : ValidationProblem[] {

        const problems: ValidationProblem[] = [];
        const props = entity.props;

        for (let idx = 0; idx < props.length; idx++) {
            const prop = props[idx];

            problems.push(...this.validatePattern(prop.name, prop.validation));
        }

        return problems;
    }

    private validatePattern(propName: string, validation: Validation) {
        const problems: ValidationProblem[] = [];
        if (validation.type === PropertyTypes.string
            && validation.pattern) {
            try {
                new RegExp(validation.pattern);
            } catch (e) {
                problems.push(new ValidationProblem(propName,
                    ProblemKeywords.pattern, SysMsgs.validation.invalidPattern));
            }
        } else if (validation.type === PropertyTypes.array
            && validation.items.type === PropertyTypes.string
            && validation.items.pattern) {

            problems.push(...this.validatePattern(propName, validation));
        }

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