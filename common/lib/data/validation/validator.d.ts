import { EntityType, Entity } from "../../models";
/**
 * Class responsible for validating the object.
 * @class
 */
export declare class Validator {
    private entityType;
    private entity;
    private constructor();
    /**
     * Validates an entity against an entity type specification.
     * @param entitytype Entity type to validate against.
     * @param entity Object to be validated
     * @static
     * @func
     */
    static validate(entitytype: EntityType, entity: Entity, isNew: boolean): Promise<void>;
    /**
     * Builds the schema for the specified entity type.
     */
    private buildSchema();
    /**
     * Builds a sub schema for an property using its validation specification.
     * @param rootSchema The root schema.
     * @param validation A validation object that is used to build the schema.
     */
    private buildSchemaValidation(rootSchema, validation);
    /**
     * Validates the entity against the specified schema.
     * @param schema The schema to validate the entity against.
     */
    private validateJsonSchema(schema);
    private validateLinkedEntities();
    private requireReservedProperties();
}
