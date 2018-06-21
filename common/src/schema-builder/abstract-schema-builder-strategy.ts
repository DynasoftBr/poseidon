import { FluentSchemaBuilder } from "json-schema-fluent-builder";
import { Validation } from "../models";

export abstract class AbstractSchamaBuilderStrategy {
    abstract async build(rootSchema: FluentSchemaBuilder, validation: Validation): Promise<FluentSchemaBuilder>;
}