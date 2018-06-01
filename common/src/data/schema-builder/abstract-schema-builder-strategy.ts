import { SchemaBuilderGeneric, SchemaBuilderCore } from "json-schema-fluent-builder/lib/builders";
import { Validation } from "../../models";

export abstract class AbstractSchamaBuilderStrategy {
    abstract async build(rootSchema: SchemaBuilderCore<any>, validation: Validation): Promise<SchemaBuilderGeneric>;
}