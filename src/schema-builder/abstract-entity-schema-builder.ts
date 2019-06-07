import { ISchamaBuilderStrategy } from "./abstract-schema-builder-strategy";
import { FluentSchemaBuilder } from "json-schema-fluent-builder";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { EntitySchemaBuilder } from "./entity-schema-builder";
import { IRepository } from "../data";
import { IEntityType, IValidation } from "@poseidon/core-models";

/**
 * Build JSON schama validation for Abstract Entities.
 * @class
 */
export class AbstractEntitySchamBuilder implements ISchamaBuilderStrategy {

    constructor(
        private readonly entityTypeRepository: IRepository<IEntityType>,
        private readonly entitySchemaBuilder: EntitySchemaBuilder) { }

    async build(rootSchema: FluentSchemaBuilder, validation: IValidation): Promise<FluentSchemaBuilder> {

        const ref = validation.ref;
        const definitions: any = (rootSchema.getSchema().definitions);

        // If the root schema has a definition for this entity type, just return a refernce to that definition.
        if (definitions && definitions[ref.name])
            return new FluentSchemaBuilder({}).$ref("#/definitions/" + ref.name);

        // If the root schema doesn't have a definition for this entity type, we build one.
        else {
            const definition = new SchemaBuilder().object();

            // First of all we add the new definition to the root schema to allow recursive calls know that it already exist
            rootSchema.definitions(ref.name, definition);

            const abstractEtType = await this.entityTypeRepository.findById(ref._id);

            // The abstract also can not have additional properties.
            definition.additionalProperties(false);

            const propsLength = abstractEtType.props.length;

            // Iterate abstract entity's properties and build the schema for each one.
            for (let idx = 0; idx < propsLength; idx++) {
                const absProp = abstractEtType.props[idx];
                const schema = await this.entitySchemaBuilder.buildSchemaValidation(rootSchema, absProp.validation);

                definition.prop(absProp.name, schema, absProp.validation.required);
            }

            return new FluentSchemaBuilder({}).$ref("#/definitions/" + ref.name);
        }
    }
}