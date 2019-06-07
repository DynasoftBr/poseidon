import { FluentSchemaBuilder } from "json-schema-fluent-builder";
import { IValidation } from "@poseidon/core-models";

export interface ISchamaBuilderStrategy {
    build(rootSchema: FluentSchemaBuilder, validation: IValidation): Promise<FluentSchemaBuilder>;
}