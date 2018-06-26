import { AbstractSchamaBuilderStrategy } from "./abstract-schema-builder-strategy";
import { FluentSchemaBuilder } from "json-schema-fluent-builder";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { Validation, EntityProperty } from "../models";
import { EntitySchemaBuilder } from "./entity-schema-builder";
import _ = require("lodash");
import { EntityTypeRepository } from "../data/repositories/entity-type-repository";

/**
 * Build JSON schama validation for linked entities.
 * @class
 */
export class LinkedEntitySchemaBuilder extends AbstractSchamaBuilderStrategy {

    constructor(
        private readonly entityTypeRepository: EntityTypeRepository,
        private readonly entitySchemaBuilder: EntitySchemaBuilder) {
        super();
    }

    async build(rootSchema: FluentSchemaBuilder, validation: Validation): Promise<FluentSchemaBuilder> {
        const propSchema = new SchemaBuilder().object();
        propSchema.additionalProperties(false);

        // Try find the linked entity type.
        const lkdEntityType = await this.entityTypeRepository.findById(validation.ref._id);

        // Iterate only the LINKED PROPERTIES and build it's schema.
        const propsLength = validation.linkedProperties.length;
        for (let idx = 0; idx < propsLength; idx++) {
            const lkdProp = validation.linkedProperties[idx];

            // Find's the linked property in the linked entity type.
            const foundProp: EntityProperty = _.find(lkdEntityType.props, { name: lkdProp.name });

            // Call buildSchemaValidation recursively to build schema.
            const schema = await this.entitySchemaBuilder.buildSchemaValidation(rootSchema, foundProp.validation);

            propSchema.prop(foundProp.name, schema, foundProp.validation.required);
        }

        return propSchema;
    }
}