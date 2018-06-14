import { AbstractSchamaBuilderStrategy } from "./abstract-schema-builder-strategy";
import { FluentSchemaBuilder } from "json-schema-fluent-builder";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { EntityType, Validation, EntityProperty } from "../..";
import { SysEntities } from "../../constants";
import { EntitySchemaBuilder } from "./entity-schema-builder";
import { EntityTypeRepository } from "../repositories/entity-type-repository";
import { GenericRepositoryInterface } from "../repositories/repository-interface";

/**
 * Build JSON schama validation for Abstract Entities.
 * @class
 */
export class AbstractEntitySchamBuilder extends AbstractSchamaBuilderStrategy {

    constructor(
        private readonly entityTypeRepository: GenericRepositoryInterface<EntityType>,
        private readonly entitySchemaBuilder: EntitySchemaBuilder) {
        super();

    }
    async build(rootSchema: FluentSchemaBuilder, validation: Validation): Promise<FluentSchemaBuilder> {

        let propSchema = new FluentSchemaBuilder({}).$ref("#/definitions/" + validation.ref.name);

        let definitions = (<any>rootSchema.getSchema().definitions);

        if (definitions && definitions[validation.ref.name])
            return propSchema;

        else {
            let definition = new SchemaBuilder().object();
            rootSchema.definitions(validation.ref.name, definition);

            definition.additionalProperties(false);

            let abstractEtType = await this.entityTypeRepository.findById(validation.ref._id);

            abstractEtType.props.forEach(async (absProp) => {
                let schema = await this.entitySchemaBuilder.buildSchemaValidation(rootSchema, absProp.validation);

                definition.prop(absProp.name, schema, absProp.validation.required);
            });
        }
    }
}