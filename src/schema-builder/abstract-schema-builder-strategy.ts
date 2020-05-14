import { FluentSchemaBuilder } from "json-schema-fluent-builder";
import { EntityProperty } from "@poseidon/core-models";

export interface ISchamaBuilderStrategy {
    build(rootSchema: FluentSchemaBuilder, prop?: EntityProperty): Promise<FluentSchemaBuilder>;
}