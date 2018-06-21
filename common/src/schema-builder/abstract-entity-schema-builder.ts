import { AbstractSchamaBuilderStrategy } from "./abstract-schema-builder-strategy";
import { FluentSchemaBuilder } from "json-schema-fluent-builder";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { Validation } from "../..";
import { EntitySchemaBuilder } from "./entity-schema-builder";
import { EntityTypeRepository } from "../data/repositories/entity-type-repository";

/**
 * Build JSON schama validation for Abstract Entities.
 * @class
 */
export class AbstractEntitySchamBuilder extends AbstractSchamaBuilderStrategy {

    constructor(
        private readonly entityTypeRepository: EntityTypeRepository,
        private readonly entitySchemaBuilder: EntitySchemaBuilder) {
        super();

    }

    async build(rootSchema: FluentSchemaBuilder, validation: Validation): Promise<FluentSchemaBuilder> {

        const ref = validation.ref;
        const propSchema = new FluentSchemaBuilder({}).$ref("#/definitions/" + ref.name);

        const definitions = (<any>rootSchema.getSchema().definitions);

        if (definitions && definitions[ref.name])
            return propSchema;

        else {
            const definition = new SchemaBuilder().object();
            rootSchema.definitions(ref.name, definition);

            definition.additionalProperties(false);

            const abstractEtType = await this.entityTypeRepository.findById(ref._id);

            abstractEtType.props.forEach(async (absProp) => {
                const schema = await this.entitySchemaBuilder.buildSchemaValidation(rootSchema, absProp.validation);

                definition.prop(absProp.name, schema, absProp.validation.required);
            });
        }
    }
}