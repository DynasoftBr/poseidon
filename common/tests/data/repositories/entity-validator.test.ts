import { expect, assert } from "chai";
import { describe } from "mocha";
import { EntityType, Entity } from "../../../src/models";
import { PropertyTypes, SysEntities, SysProperties } from "../../../src/constants";
import { EntityValidator } from "../../../src/data/repositories/entity-validator";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { EntitySchemaBuilder } from "../../../src/data/schema-builder/entity-schema-builder";
import { TestRepositoryFactory } from "./test-repository-factory";
import { BuiltInEntries } from "../../../src/data/";
import { SysUsers } from "../../../src/constants/sys-users";
import { ValidationProblem } from "../../../src/data/repositories/validation-problem";

describe("Entity Validator Test", () => {

    let repositoryFactory: TestRepositoryFactory;

    before(async () => {
        repositoryFactory = new TestRepositoryFactory();
        await repositoryFactory.initDatabase();
    });

    describe("String properties validation", () => {
        it("String doesn't accept othe value types", async () => {
            let newEntityType: any = {
                _id: "newId",
                name: 1,
                label: "",
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.string
                        }
                    }
                ],
                createdAt: new Date(),
                createdBy: {
                    _id: SysUsers.root,
                    name: SysUsers.root
                }
            };

            let entityTypeRepo = await repositoryFactory.entityType();
            let entityType = await entityTypeRepo.findOne({ name: SysEntities.entityType });

            let problems = await EntityValidator.validate(entityType, newEntityType, repositoryFactory);

            expect(problems[0].property).eqls(SysProperties.name);
        });

        it("String can't be longer then expecified 'max'", async () => {
            let newEntityType: any = {
                _id: "newId",
                name: "very very loooooooooooooooooooooooong entity type name",
                label: "",
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.string
                        }
                    }
                ],
                createdAt: new Date(),
                createdBy: {
                    _id: SysUsers.root,
                    name: SysUsers.root
                }
            };

            let entityTypeRepo = await repositoryFactory.entityType();
            let entityType = await entityTypeRepo.findOne({ name: SysEntities.entityType });

            let problems = await EntityValidator.validate(entityType, newEntityType, repositoryFactory);

            expect(problems[0].property).eqls(SysProperties.name);
        });

        it("String can't be shorter then expecified 'min'", async () => {
            let newEntityType: any = {
                _id: "newId",
                name: "",
                label: "",
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.string
                        }
                    }
                ],
                createdAt: new Date(),
                createdBy: {
                    _id: SysUsers.root,
                    name: SysUsers.root
                }
            };

            let entityTypeRepo = await repositoryFactory.entityType();
            let entityType = await entityTypeRepo.findOne({ name: SysEntities.entityType });

            let problems = await EntityValidator.validate(entityType, newEntityType, repositoryFactory);

            expect(problems[0].property).eqls(SysProperties.name);
        });

        it("String must match 'pattern'", async () => {
            let newEntityType: any = {
                _id: "newId",
                name: "a",
                label: "",
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.string
                        }
                    }
                ],
                createdAt: new Date(),
                createdBy: {
                    _id: SysUsers.root,
                    name: SysUsers.root
                }
            };

            let entityTypeRepo = await repositoryFactory.entityType();
            let entityType = await entityTypeRepo.findOne({ name: SysEntities.entityType });

            let problems = await EntityValidator.validate(entityType, newEntityType, repositoryFactory);

            expect(problems[0]).contains(<ValidationProblem>{ property: SysProperties.name, keyword: "pattern" });
        });
    });
});
