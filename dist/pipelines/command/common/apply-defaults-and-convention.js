"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_models_1 = require("@poseidon/core-models");
function applyDefaultsAndConvention(request, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const { entity, entityType } = request;
        entityType.props.forEach(p => {
            const { validation, name } = p;
            // Apply defaults just on insert operations.
            if (request.operation == "insert" && validation.default && !entity[name])
                entity[name] = parseDefault(validation.default, validation.type);
            // Apply convention.
            if (validation.convention && entity[name])
                entity[name] = toConvention(entity[name], validation.convention);
        });
        next(request);
    });
}
exports.applyDefaultsAndConvention = applyDefaultsAndConvention;
/**
 * Applys a convention to the specified value.
 * @param propVal Current property's value.
 * @param convention The convention to apply.
 * @return A string with the convention applied.
 */
function toConvention(propVal, convention) {
    if (convention === core_models_1.PropertyConventions.lowerCase)
        return propVal.toLowerCase();
    else if (convention === core_models_1.PropertyConventions.uppercase)
        return propVal.toUpperCase();
    else if (convention === core_models_1.PropertyConventions.capitalizeFirstLetter) {
        return propVal.replace(/\w\S*/g, function (txt) {
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
function parseDefault(defaultVal, type) {
    const parsed = handleConstants(defaultVal);
    if (type === core_models_1.PropertyTypes.string || type === core_models_1.PropertyTypes.enum)
        return parsed;
    else if (type === core_models_1.PropertyTypes.boolean)
        return new Boolean(parsed);
    else if (type === core_models_1.PropertyTypes.array)
        return [parsed];
    else if (type === core_models_1.PropertyTypes.dateTime)
        return new Date(parsed);
    else if (type === core_models_1.PropertyTypes.number)
        return Number.parseFloat(parsed);
    else if (type === core_models_1.PropertyTypes.int)
        return Number.parseInt(parsed);
    else
        throw Error("");
}
/**
 * Lookup constants in a text.
 * @param text Text to lookup for constants.
 * @return The text replaced the found constants.
 */
function handleConstants(text) {
    const matches = text.match(/\[\[(\w*)\]\]/);
    if (!matches)
        return text;
    matches.forEach((key, idx) => {
        if (key === "[[NOW]]")
            text = text.replace(key, new Date().toISOString());
    });
    return text;
}
//# sourceMappingURL=apply-defaults-and-convention.js.map