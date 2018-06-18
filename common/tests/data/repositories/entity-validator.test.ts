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
        it("String doesn't accept other value types", async () => {
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
                name: "VeryVeryLoooooooooooooooooooooooooooooooooongEntityTypeName",
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

    describe("Int properties validation", () => {
        it("Int doesn't accept float values", async () => {
            let newEntityType: any = {
                _id: "newId",
                name: "Name",
                label: "",
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.int
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
            entityTypeRepo.insertOne(newEntityType);

            let newEntity = {
                prop1: 1.1
            };

            let problems = await EntityValidator.validate(newEntityType, newEntity, repositoryFactory);

            expect(problems[0].property).eqls("prop1");
        });

        it("Int can't be greater than 'max'.", async () => {
            let newEntityType: EntityType = {
                _id: "newId",
                name: "Name",
                label: "",
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.int,
                            max: 25
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
            entityTypeRepo.insertOne(newEntityType);

            let newEntity = {
                prop1: 26
            };

            let problems = await EntityValidator.validate(newEntityType, newEntity, repositoryFactory);

            expect(problems[0].property).eqls("prop1");
        });

        it("Int can't be lower than 'min'.", async () => {
            let newEntityType: EntityType = {
                _id: "newId",
                name: "Name",
                label: "",
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.int,
                            max: 25,
                            min: 10
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
            entityTypeRepo.insertOne(newEntityType);

            let newEntity = {
                prop1: 9
            };

            let problems = await EntityValidator.validate(newEntityType, newEntity, repositoryFactory);

            expect(problems[0].property).eqls("prop1");
        });

        it("Int must respect 'multipleOf'.", async () => {
            let newEntityType: EntityType = {
                _id: "newId",
                name: "Name",
                label: "",
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.int,
                            max: 25,
                            min: 10,
                            multipleOf: 5
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
            entityTypeRepo.insertOne(newEntityType);

            let newEntity = {
                prop1: 1
            };

            let problems = await EntityValidator.validate(newEntityType, newEntity, repositoryFactory);

            expect(problems[0].property).eqls("prop1");
        });
    });

    describe("Number properties validation", () => {
        it("Number accept decimal/float values", async () => {
            let newEntityType: any = {
                _id: "newId",
                name: "Name",
                label: "",
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.number
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
            entityTypeRepo.insertOne(newEntityType);

            let newEntity = {
                prop1: 1.1
            };

            let problems = await EntityValidator.validate(newEntityType, newEntity, repositoryFactory);

            expect(problems.length).eqls(0);
        });

        it("Number can't be greater than 'max'.", async () => {
            let newEntityType: EntityType = {
                _id: "newId",
                name: "Name",
                label: "",
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.number,
                            max: 25
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
            entityTypeRepo.insertOne(newEntityType);

            let newEntity = {
                prop1: 25.1
            };

            let problems = await EntityValidator.validate(newEntityType, newEntity, repositoryFactory);

            expect(problems[0].property).eqls("prop1");
        });

        it("Int can't be lower than 'min'.", async () => {
            let newEntityType: EntityType = {
                _id: "newId",
                name: "Name",
                label: "",
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.number,
                            max: 25,
                            min: 10
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
            entityTypeRepo.insertOne(newEntityType);

            let newEntity = {
                prop1: 9.9
            };

            let problems = await EntityValidator.validate(newEntityType, newEntity, repositoryFactory);

            expect(problems[0].property).eqls("prop1");
        });

        it("Int must respect 'multipleOf'.", async () => {
            let newEntityType: EntityType = {
                _id: "newId",
                name: "Name",
                label: "",
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.number,
                            max: 25,
                            min: 10,
                            multipleOf: 0.01
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
            entityTypeRepo.insertOne(newEntityType);

            let newEntity = {
                prop1: 10.001
            };

            let problems = await EntityValidator.validate(newEntityType, newEntity, repositoryFactory);

            expect(problems[0].property).eqls("prop1");
        });
    });

    describe("DateTime properties validation", () => {
        it("DateTime property doesn't accept other values", async () => {
            let newEntityType: any = {
                _id: "newId",
                name: "Name",
                label: "",
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.dateTime
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
            entityTypeRepo.insertOne(newEntityType);

            let newEntity = {
                prop1: "teste"
            };

            let problems = await EntityValidator.validate(newEntityType, newEntity, repositoryFactory);

            expect(problems.length).eqls(1);
        });

        it("DateTime property accept Date javascript object", async () => {
            let newEntityType: any = {
                _id: "newId",
                name: "Name",
                label: "",
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.dateTime
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
            entityTypeRepo.insertOne(newEntityType);

            let newEntity = {
                prop1: new Date()
            };

            let problems = await EntityValidator.validate(newEntityType, newEntity, repositoryFactory);

            expect(problems.length).eqls(0);
        });
    });
});
