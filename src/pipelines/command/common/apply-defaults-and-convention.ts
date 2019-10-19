import { IConcreteEntity, PropertyConventions, PropertyTypes } from "@poseidon/core-models";
import { ICommandRequest } from "../command-request";
import { NextPipelineItem } from "../command-pipeline-item";

export async function applyDefaultsAndConvention<T extends IConcreteEntity>(
    request: ICommandRequest<T>,
    next?: NextPipelineItem
) {
    const { entity, entityType } = request;

    entityType.props.forEach(p => {
        const { validation, name } = p;

        // Apply defaults just on insert operations.
        if (request.operation == "insert" && validation.default && !entity[name])
            entity[name as keyof T] = parseDefault(validation.default, validation.type);

        // Apply convention.
        if (validation.convention && entity[name])
            entity[name as keyof T] = toConvention(entity[name], validation.convention) as any;
    });

    next(request);
}

/**
 * Applys a convention to the specified value.
 * @param propVal Current property's value.
 * @param convention The convention to apply.
 * @return A string with the convention applied.
 */
function toConvention(propVal: string, convention: PropertyConventions): string {
    if (convention === PropertyConventions.lowerCase) return propVal.toLowerCase();
    else if (convention === PropertyConventions.uppercase) return propVal.toUpperCase();
    else if (convention === PropertyConventions.capitalizeFirstLetter) {
        return propVal.replace(/\w\S*/g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }
}

/**
 * Parses the default value for an property.
 * @param defaultVal The actual value os the object
 * @param type The property type.
 * @return The parsed default value according the property type.
 */
function parseDefault(defaultVal: string, type: PropertyTypes): any {
    const parsed: string = handleConstants(defaultVal);

    if (type === PropertyTypes.string || type === PropertyTypes.enum) return parsed;
    else if (type === PropertyTypes.boolean) return new Boolean(parsed);
    else if (type === PropertyTypes.array) return [parsed];
    else if (type === PropertyTypes.dateTime) return new Date(parsed);
    else if (type === PropertyTypes.number) return Number.parseFloat(parsed);
    else if (type === PropertyTypes.int) return Number.parseInt(parsed);
    else throw Error("");
}

/**
 * Lookup constants in a text.
 * @param text Text to lookup for constants.
 * @return The text replaced the found constants.
 */
function handleConstants(text: string) {
    const matches = text.match(/\[\[(\w*)\]\]/);

    if (!matches) return text;

    matches.forEach((key, idx) => {
        if (key === "[[NOW]]") text = text.replace(key, new Date().toISOString());
    });

    return text;
}
