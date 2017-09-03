import * as moment from "moment";
import * as _ from "lodash";

import {
    SysProperties, EntityType, Entity,
    PropertyType, PropertyConvention
} from "../../models";
import { SysError } from "../../";

/**
 * Prepare an entity to be inserted to data base.
 */
export class EntityFactory {

    constructor(private entityType: EntityType, public entity: Entity) {
    }

    /**
     * Apply defaults for properties that have one.
     */
    public applyDefaults(): Entity {
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
    public applyConvention(): Entity {
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
    public parseDateTimeProperties(): Entity {
        let length = this.entityType.props.length;

        for (let idx = 0; idx < length; idx++) {
            let p = this.entityType.props[idx];
            // Parse date-time.
            if (p.validation.type === PropertyType.dateTime
                && this.entity[p.name] && typeof this.entity[p.name] === "string")
                this.entity[p.name] = this.parseDateTime(this.entity[p.name]);
        }

        return this.entity;
    }

    public addReserverdPropsEtType(): Entity {

        if (_.filter((<EntityType>this.entity).props, { name: SysProperties.changedAt.name })
            .length === 0)
            (<EntityType>this.entity).props.push(SysProperties.changedAt);

        if (_.filter((<EntityType>this.entity).props, { name: SysProperties.changedBy.name })
            .length === 0)
            (<EntityType>this.entity).props.push(SysProperties.changedBy);

        if (_.filter((<EntityType>this.entity).props, { name: SysProperties.createdAt.name })
            .length === 0)
            (<EntityType>this.entity).props.push(SysProperties.createdAt);

        if (_.filter((<EntityType>this.entity).props, { name: SysProperties.createdBy.name })
            .length === 0)
            (<EntityType>this.entity).props.push(SysProperties.createdBy);

        if (_.filter((<EntityType>this.entity).props, { name: SysProperties._id.name })
            .length === 0)
            (<EntityType>this.entity).props.push(SysProperties._id);

        return this.entity;
    }

    public ensureIdProperty(): Entity {
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
    private parseDefault(d: string, type: PropertyType): any {
        let parsed: string = this.handleConstants(d);

        switch (type) {
            case PropertyType.string || type === PropertyType.enum:
                return parsed;
            case PropertyType.boolean:
                return new Boolean(parsed);
            case PropertyType.array:
                return [parsed];
            case PropertyType.dateTime:
                return new Date(parsed);
            case PropertyType.number:
                return Number.parseFloat(parsed);
            case PropertyType.int:
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
    private handleConstants(text: string) {
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
    private toConvention(v: string, convention: PropertyConvention): string {
        if (convention === PropertyConvention.lowerCase)
            return v.toLowerCase();
        else if (convention === PropertyConvention.uppercase)
            return v.toUpperCase();
        else if (convention === PropertyConvention.capitalizeFirstLetter) {
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
    private parseDateTime(date: string): Date {
        return new Date(date);
    }
}