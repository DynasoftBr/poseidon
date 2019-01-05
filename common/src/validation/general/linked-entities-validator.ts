import { EntityValidator } from "../entity-validator";
import { ConcreteEntity, EntityType, Entity } from "../../models";
import { ValidationProblem } from "../../validation/validation-problem";
import { AbstractRepositoryFactory } from "../../data";
import { PropertyTypes, ProblemKeywords } from "../../constants";
import { SysMsgs } from "@/sys-msgs";
import *  as _ from "lodash";

export class LinkedEntitiesValidator implements EntityValidator {
    constructor(private readonly entityType: EntityType,
        private readonly repoFactory: AbstractRepositoryFactory) { }

    /**
     * Validates if linked entities has valid references and if its linked property values match the referenced entity values.
     * @param entity The entity to be validated.
     * @param entityType The entity type of the to be validated.
     * @param repoFactory A repository factory
     */
    async validate(entity: ConcreteEntity): Promise<ValidationProblem[]> {
        const problems: ValidationProblem[] = [];
        const propsLength = this.entityType.props.length;

        // Iterate entity properties.
        for (let idx = 0; idx < propsLength; idx++) {
            const prop = this.entityType.props[idx];
            const propValidation = prop.validation;

            // Validate only if the entity has a value for this property, the required constraint is validated by json schema.
            if (propValidation.type === PropertyTypes.linkedEntity && entity[prop.name] && entity[prop.name]._id) {

                // Get the repository for the linked entity and try find it.
                const lkdEntity = await (await this.repoFactory.createByName(propValidation.ref.name)).findById(entity[prop.name]._id);

                // If we can't find an entity with the linked id, add a validation problem.
                if (lkdEntity == null) {
                    problems.push(new ValidationProblem(prop.name, ProblemKeywords.invalidLinkedEntityId,
                        SysMsgs.validation.linkedEntityDoesNotExist, propValidation.ref.name, entity[prop.name]._id));
                } else {
                    // Iterate the linked properties and check if it equals the lineked entity values.
                    propValidation.linkedProperties.forEach(lkdProp => {

                        // Check if the value provided in linked properties equals linked entity values.
                        if (!_.isEqual(entity[prop.name][lkdProp.name], lkdEntity[lkdProp.name])) {
                            const composedName = prop.name + "." + lkdProp.name;
                            problems.push(new ValidationProblem(composedName, ProblemKeywords.invalidLinkedValue,
                                SysMsgs.validation.divergentLinkedValue, composedName, lkdEntity[lkdProp.name]));
                        }
                    });
                }
            }
        }

        return problems;
    }
}