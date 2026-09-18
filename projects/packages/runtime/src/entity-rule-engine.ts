import type {
    APIAction,
    APIActionOperation,
    EntityProperty,
    BusinessRuleConsequence,
    BusinessRule,
} from '@poseidon/models';
import { ValidationError } from './poseidon-error';
import { matchesSpecification, validateSpecification } from './specification';

/** Evaluates model-defined rules without evaluating code stored in the model. */
export function applyEntityRules(
    actions: APIAction[] | undefined,
    operation: APIActionOperation,
    properties: EntityProperty[],
    input: Record<string, unknown>,
): Record<string, unknown> {
    return applyBusinessRules(
        actions
            ?.filter((action) => action.operation === operation)
            .flatMap((action) => action.rules ?? []) ?? [],
        properties,
        input,
    );
}

export function applyBusinessRules(
    rules: BusinessRule[],
    properties: EntityProperty[],
    input: Record<string, unknown>,
): Record<string, unknown> {
    const data = { ...input };
    const propertyNames = new Map(properties.map((property) => [property._id, property.name]));
    rules.forEach((rule) => {
        validateSpecification(rule.specification, propertyNames);
        if (matchesSpecification(rule.specification, data, propertyNames)) {
            applyConsequence(rule.consequence, data, propertyNames);
        }
    });
    return data;
}

function applyConsequence(
    consequence: BusinessRuleConsequence,
    data: Record<string, unknown>,
    propertyNames: Map<string, string>,
): void {
    if (consequence.kind === 'reject') {
        throw new ValidationError([{ property: 'entity', message: consequence.message }]);
    }

    const propertyName = propertyNames.get(consequence.propertyId);

    if (!propertyName) {
        throw new ValidationError([
            {
                property: 'actions',
                message: `Rule references missing property '${consequence.propertyId}'.`,
            },
        ]);
    }

    data[propertyName] = consequence.value;
}
