import { EntityType, Entity } from "../../models";
/**
 * Prepare an entity to be inserted to data base.
 */
export declare class EntityFactory {
    private entityType;
    entity: Entity;
    constructor(entityType: EntityType, entity: Entity);
    /**
     * Apply defaults for properties that have one.
     */
    applyDefaults(): Entity;
    /**
     * Apply convention to properties that have one specified.
     * e.g. "lowercase" or "UPPERCASE".
     */
    applyConvention(): Entity;
    /**
     * Look for date-time properties in the object and parse it if is a string.
     */
    parseDateTimeProperties(): Entity;
    addReserverdPropsEtType(): Entity;
    ensureIdProperty(): Entity;
    /**
     * Parses the default value for an property.
     * @param d The actual value os the object
     * @param type The type specified in validation of the entity type.
     * @return The parsed default value according the property type.
     */
    private parseDefault(d, type);
    /**
     * Lookup constants in a text.
     * @param text Text to lookup for constants.
     * @return The text replaced the found constants.
     */
    private handleConstants(text);
    /**
     * Applys a convention to the specified value.
     * @param v Current property's value.
     * @param convention The convention.
     * @return A string with the convention applied.
     */
    private toConvention(v, convention);
    /**
     * Parse an string to Date.
     * @param date A string representing a date-time.
     * @return An Date object.
     */
    private parseDateTime(date);
}
