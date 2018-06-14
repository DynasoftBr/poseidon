import { expect, assert } from "chai";
import { describe } from "mocha";
import { EntityType, Entity } from "../../../src/models";
import { PropertyTypes, SysEntities } from "../../../src/constants";
import { EntityValidator } from "../../../src/data/repositories/entity-validator";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { EntitySchemaBuilder } from "../../../src/data/schema-builder/entity-schema-builder";
import { TestRepositoryFactory } from "./test-repository-factory";
import { BuiltInEntries } from "../../../src/data/";

describe("Entity Validator Test", () => {
    it("String doesn't accept othe value types", async () => {
        let entityType: EntityType = <EntityType>{
            name: "EntityTypeTest",
            props: [
                {
                    name: "prop1",
                    validation: {
                        type: PropertyTypes.string
                    }
                }
            ]
        };

        // Has all builtin entities.
        let builtinEntries = new BuiltInEntries();

        let repoFactory = new TestRepositoryFactory();
        let entityTypeRepo = await repoFactory.entityType();

        // create the schema for entity type.
        let schema = (await new EntitySchemaBuilder(entityTypeRepo).buildSchema(entityType)).getSchema();

        // entitySchema.schema = JSON.stringify(schema);

        // let schemaRepo = await repoFactory.createByName(SysEntities.entitySchema);

        // schemaRepo.insertOne(schema);

        let entity: Entity = <any>{
            prop1: 1
        };

        let problems = await EntityValidator.validate(entityType, entity, repoFactory);

        expect(problems.length).eqls(1);
    });
});
