import { FluentSchemaBuilder } from "json-schema-fluent-builder";
import { IEntityProperty } from "@poseidon/core-models";

export interface ISchamaBuilderStrategy {
    build(rootSchema: FluentSchemaBuilder, prop?: IEntityProperty): Promise<FluentSchemaBuilder>;
}