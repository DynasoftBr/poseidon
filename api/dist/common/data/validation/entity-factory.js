"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const models_1 = require("../../models");
/**
 * Prepare an entity to be inserted to data base.
 */
class EntityFactory {
    constructor(entityType, entity) {
        this.entityType = entityType;
        this.entity = entity;
    }
    /**
     * Apply defaults for properties that have one.
     */
    applyDefaults() {
        let length = this.entityType.props.length;
        for (let idx = 0; idx < length; idx++) {
            let p = this.entityType.props[idx];
            // Apply defaults.
            if (p.validation.default && !this.entity[p.name])
                this.entity[p.name] = this.parseDefault(p.validation.default, p.validation.type);
        }
        return this.entity;
    }
    /**
     * Apply convention to properties that have one specified.
     * e.g. "lowercase" or "UPPERCASE".
     */
    applyConvention() {
        let length = this.entityType.props.length;
        for (let idx = 0; idx < length; idx++) {
            let p = this.entityType.props[idx];
            // Apply convention.
            if (p.validation.convention && this.entity[p.name])
                this.entity[p.name] = this.toConvention(this.entity[p.name], p.validation.convention);
        }
        return this.entity;
    }
    /**
     * Look for date-time properties in the object and parse it if is a string.
     */
    parseDateTimeProperties() {
        let length = this.entityType.props.length;
        for (let idx = 0; idx < length; idx++) {
            let p = this.entityType.props[idx];
            // Parse date-time.
            if (p.validation.type === models_1.PropertyType.dateTime
                && this.entity[p.name] && typeof this.entity[p.name] === "string")
                this.entity[p.name] = this.parseDateTime(this.entity[p.name]);
        }
        return this.entity;
    }
    addReserverdPropsEtType() {
        if (_.filter(this.entity.props, { name: models_1.SysProperties.changedAt.name })
            .length === 0)
            this.entity.props.push(models_1.SysProperties.changedAt);
        if (_.filter(this.entity.props, { name: models_1.SysProperties.changedBy.name })
            .length === 0)
            this.entity.props.push(models_1.SysProperties.changedBy);
        if (_.filter(this.entity.props, { name: models_1.SysProperties.createdAt.name })
            .length === 0)
            this.entity.props.push(models_1.SysProperties.createdAt);
        if (_.filter(this.entity.props, { name: models_1.SysProperties.createdBy.name })
            .length === 0)
            this.entity.props.push(models_1.SysProperties.createdBy);
        if (_.filter(this.entity.props, { name: models_1.SysProperties._id.name })
            .length === 0)
            this.entity.props.push(models_1.SysProperties._id);
        return this.entity;
    }
    ensureIdProperty() {
        if (!this.entity._id)
            this.entity._id = null;
        return this.entity;
    }
    /**
     * Parses the default value for an property.
     * @param d The actual value os the object
     * @param type The type specified in validation of the entity type.
     * @return The parsed default value according the property type.
     */
    parseDefault(d, type) {
        let parsed = this.handleConstants(d);
        switch (type) {
            case models_1.PropertyType.string || type === models_1.PropertyType.enum:
                return parsed;
            case models_1.PropertyType.boolean:
                return new Boolean(parsed);
            case models_1.PropertyType.array:
                return [parsed];
            case models_1.PropertyType.dateTime:
                return new Date(parsed);
            case models_1.PropertyType.number:
                return Number.parseFloat(parsed);
            case models_1.PropertyType.int:
                return Number.parseInt(parsed);
            default:
                throw new Error(""); // TODO: Error.
        }
    }
    /**
     * Lookup constants in a text.
     * @param text Text to lookup for constants.
     * @return The text replaced the found constants.
     */
    handleConstants(text) {
        let matches = text.match(/\[\[(\w*)\]\]/);
        let totalMatches = matches.length;
        if (!matches)
            return text;
        for (let idx = 0; idx < totalMatches; idx++) {
            if (matches[idx] === "[[NOW]]")
                text = text.replace(matches[idx], new Date().toISOString());
        }
        return text;
    }
    /**
     * Applys a convention to the specified value.
     * @param v Current property's value.
     * @param convention The convention.
     * @return A string with the convention applied.
     */
    toConvention(v, convention) {
        if (convention === models_1.PropertyConvention.lowerCase)
            return v.toLowerCase();
        else if (convention === models_1.PropertyConvention.uppercase)
            return v.toUpperCase();
        else if (convention === models_1.PropertyConvention.capitalizeFirstLetter) {
            return v.replace(/\w\S*/g, function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        }
    }
    /**
     * Parse an string to Date.
     * @param date A string representing a date-time.
     * @return An Date object.
     */
    parseDateTime(date) {
        return new Date(date);
    }
}
exports.EntityFactory = EntityFactory;
//# sourceMappingURL=entity-factory.js.map