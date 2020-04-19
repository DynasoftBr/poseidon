import { IEntity, PropertyConventions, PropertyTypes } from "@poseidon/core-models";
import { ICommandRequest } from "../command-request";
import { PipelineItem } from "../../pipeline-item";
import { IResponse } from "../../response";

export async function applyDefaultsAndConvention<T extends IEntity>(
  request: ICommandRequest<T>,
  next: PipelineItem
): Promise<IResponse> {
  const { payload: content, entityType } = request;

  entityType.props.forEach(p => {
    const { convention, name } = p;

    // Apply defaults just on insert operations.
    // if (request.operation == "insert" && validation.default && !content[name])
    //   (content as any)[name] = parseDefault(validation.default, validation.type);

    // Apply convention.
    if (convention && content[name]) (content as any)[name] = toConvention(content[name], convention);
  });

  return await next(request);
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
