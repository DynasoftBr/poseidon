import { EntityType, Entity } from "../..";
import { SysProperties, PropertyTypes, PropertyConvention } from "../../constants";
import _ = require("lodash");
import { BuiltInEntries } from "../built-in-entries";

export class EntityHelpers {

    /**
     * Apply defaults for properties that have one.
     */
    public static applyDefaults(entity: Entity, entityType: EntityType): Entity {
        entityType.props.forEach(p => {

            // Apply defaults.
            if (p.validation.default && !entity[p.name])
                entity[p.name] = this.parseDefault(p.validation.default, p.validation.type);

        });

        return entity;
    }

    /**
     * Apply convention to properties that have one specified.
     * e.g. "lowercase" or "UPPERCASE".
     */
    public static applyConvention(entity: Entity, entityType: EntityType): Entity {
        entityType.props.forEach(p => {
            // Apply convention.
            if (p.validation.convention && entity[p.name])
                entity[p.name] = this.toConvention(entity[p.name], p.validation.convention);

        });
        return entity;
    }

    /**
     * Look for date-time properties in the object and parse it if is a string.
     */
    public static parseDateTimeProperties(entity: Entity, entityType: EntityType): Entity {
        entityType.props.forEach(p => {
            // Parse date-time.
            if (p.validation.type === PropertyTypes.dateTime
                && entity[p.name] && typeof entity[p.name] === "string")
                entity[p.name] = this.parseDateTime(entity[p.name]);
        });

        return entity;
    }

    public static addReserverdPropsEtType(entity: Entity, entityType: EntityType): Entity {

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

    public static ensureIdProperty(entity: Entity): Entity {
        if (!entity._id)
            entity._id = null;

        return entity;
    }

    /**
     * Parses the default value for an property.
     * @param d The actual value os the object
     * @param type The type specified in validation of the entity type.
     * @return The parsed default value according the property type.
     */
    private static parseDefault(d: string, type: PropertyTypes): any {
        const parsed: string = this.handleConstants(d);

        if (type === PropertyTypes.string || type === PropertyTypes.enum)
            return parsed;
        else if (type === PropertyTypes.boolean)
            return new Boolean(parsed);
        else if (type === PropertyTypes.array)
            return [parsed];
        else if (type === PropertyTypes.dateTime)
            return new Date(parsed);
        else if (type === PropertyTypes.number)
            return Number.parseFloat(parsed);
        else if (type === PropertyTypes.int)
            return Number.parseInt(parsed);
        else
            throw Error("");
    }

    /**
     * Lookup constants in a text.
     * @param text Text to lookup for constants.
     * @return The text replaced the found constants.
     */
    private static handleConstants(text: string) {
        const matches = text.match(/\[\[(\w*)\]\]/);

        if (!matches)
            return text;

        matches.forEach((key, idx) => {
            if (key === "[[NOW]]")
                text = text.replace(key, new Date().toISOString());
        });

        return text;
    }

    /**
     * Applys a convention to the specified value.
     * @param v Current property's value.
     * @param convention The convention.
     * @return A string with the convention applied.
     */
    private static toConvention(v: string, convention: PropertyConvention): string {
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
    private static parseDateTime(date: string): Date {
        return new Date(date);
    }
}