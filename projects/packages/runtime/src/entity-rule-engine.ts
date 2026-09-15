import type {
    EntityCommand,
    EntityCommandOperation,
    EntityProperty,
    RuleConsequence,
} from '@poseidon/models';
import { ValidationError } from './poseidon-error';
import { matchesSpecification, validateSpecification } from './specification';

/** Evaluates model-defined rules without evaluating code stored in the model. */
export function applyEntityRules(
    commands: EntityCommand[] | undefined,
    operation: EntityCommandOperation,
    properties: EntityProperty[],
    input: Record<string, unknown>,
): Record<string, unknown> {
    const data = { ...input };
    const propertyNames = new Map(properties.map((property) => [property._id, property.name]));

    commands
        ?.filter((command) => command.operation === operation)
        .flatMap((command) => command.rules ?? [])
        .forEach((rule) => {
            validateSpecification(rule.specification, propertyNames);
            if (matchesSpecification(rule.specification, data, propertyNames)) {
                applyConsequence(rule.consequence, data, propertyNames);
            }
        });

    return data;
}

function applyConsequence(
    consequence: RuleConsequence,
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
                property: 'commands',
                message: `Rule references missing property '${consequence.propertyId}'.`,
            },
        ]);
    }

    data[propertyName] = consequence.value;
}
