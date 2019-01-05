import { EntityValidator } from "../entity-validator";
import { ValidationProblem } from "../../validation/validation-problem";
import { EntityType, ConcreteEntity, EntityProperty } from "../../models";
import { PropertyTypes } from "../../constants";
import { EnumPropertyValidationStrategy } from "./enum-property-validation-strategy";

export class EntityTypeValidator implements EntityValidator {

    async validate(entity: ConcreteEntity): Promise<ValidationProblem[]> {
        const problems: ValidationProblem[] = [];

        const propsLength = entity.props.length;
        for (let idx = 0; idx < propsLength; idx++) {
            const prop = entity.props[idx];
            this.validateProp(prop, problems);
        }

        return problems;
    }

    async validateProp(prop: EntityProperty, problems: ValidationProblem[]): Promise<ValidationProblem[]> {
        switch (prop.validation.type) {
            // Handle enum.
            case PropertyTypes.enum:
                return new EnumPropertyValidationStrategy()
                    .validate(prop, problems);

            default:
                return problems;
        }
    }

}