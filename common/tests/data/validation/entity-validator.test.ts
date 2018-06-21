import { expect } from "chai";
import { describe } from "mocha";
import { EntityType } from "../../../src/models";
import { PropertyTypes, SysEntities, SysProperties } from "../../../src/constants";
import { EntityValidator } from "../../../src/data/validation/entity-validator";
import { SysUsers } from "../../../src/constants/sys-users";
import { ValidationProblem } from "../../../src/data/validation/validation-problem";
import { RepositoryFactory } from "../../../src";
import { InMemoryStorage } from "../../../src/data/storage/in-memory";
import { DatabasePopulator } from "../../../src/data/database-populator";

describe("Entity Validator Test", () => {

    let repositoryFactory: RepositoryFactory;

    before(async () => {
        const storage = new InMemoryStorage();
        await storage.connect();

        const populator = new DatabasePopulator(storage);
        await populator.populate();

        repositoryFactory = new RepositoryFactory(storage);
    });

    describe("String properties validation", () => {
        it("String doesn't accept other value types", async () => {
            const newEntityType: any = {
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

            const entityTypeRepo = await repositoryFactory.entityType();
            const entityType = await entityTypeRepo.findByName(SysEntities.entityType);

            const problems = await EntityValidator.validate(entityType, newEntityType, repositoryFactory);

            expect(problems[0].property).eqls(SysProperties.name);
        });

        it("String can't be longer then expecified 'max'", async () => {
            const newEntityType: any = {
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

            const entityTypeRepo = await repositoryFactory.entityType();
            const entityType = await entityTypeRepo.findByName(SysEntities.entityType);

            const problems = await EntityValidator.validate(entityType, newEntityType, repositoryFactory);

            expect(problems[0].property).eqls(SysProperties.name);
        });

        it("String can't be shorter then expecified 'min'", async () => {
            const newEntityType: any = {
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

            const entityTypeRepo = await repositoryFactory.entityType();
            const entityType = await entityTypeRepo.findByName(SysEntities.entityType);

            const problems = await EntityValidator.validate(entityType, newEntityType, repositoryFactory);

            expect(problems[0].property).eqls(SysProperties.name);
        });

        it("String must match 'pattern'", async () => {
            const newEntityType: any = {
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

            const entityTypeRepo = await repositoryFactory.entityType();
            const entityType = await entityTypeRepo.findByName(SysEntities.entityType);

            const problems = await EntityValidator.validate(entityType, newEntityType, repositoryFactory);

            expect(problems[0]).contains(<ValidationProblem>{ property: SysProperties.name, keyword: "pattern" });
        });
    });

    describe("Int properties validation", () => {
        it("Int doesn't accept float values", async () => {
            const newEntityType: any = {
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

            const entityTypeRepo = await repositoryFactory.entityType();
            entityTypeRepo.insertOne(newEntityType);

            const newEntity = {
                prop1: 1.1
            };

            const problems = await EntityValidator.validate(newEntityType, newEntity, repositoryFactory);

            expect(problems[0].property).eqls("prop1");
        });

        it("Int can't be greater than 'max'.", async () => {
            const newEntityType: EntityType = {
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

            const entityTypeRepo = await repositoryFactory.entityType();
            entityTypeRepo.insertOne(newEntityType);

            const newEntity = {
                prop1: 26
            };

            const problems = await EntityValidator.validate(newEntityType, newEntity, repositoryFactory);

            expect(problems[0].property).eqls("prop1");
        });

        it("Int can't be lower than 'min'.", async () => {
            const newEntityType: EntityType = {
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

            const entityTypeRepo = await repositoryFactory.entityType();
            entityTypeRepo.insertOne(newEntityType);

            const newEntity = {
                prop1: 9
            };

            const problems = await EntityValidator.validate(newEntityType, newEntity, repositoryFactory);

            expect(problems[0].property).eqls("prop1");
        });

        it("Int must respect 'multipleOf'.", async () => {
            const newEntityType: EntityType = {
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

            const entityTypeRepo = await repositoryFactory.entityType();
            entityTypeRepo.insertOne(newEntityType);

            const newEntity = {
                prop1: 1
            };

            const problems = await EntityValidator.validate(newEntityType, newEntity, repositoryFactory);

            expect(problems[0].property).eqls("prop1");
        });
    });

    describe("Number properties validation", () => {
        it("Number accept decimal/float values", async () => {
            const newEntityType: any = {
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

            const entityTypeRepo = await repositoryFactory.entityType();
            entityTypeRepo.insertOne(newEntityType);

            const newEntity = {
                prop1: 1.1
            };

            const problems = await EntityValidator.validate(newEntityType, newEntity, repositoryFactory);

            expect(problems.length).eqls(0);
        });

        it("Number can't be greater than 'max'.", async () => {
            const newEntityType: EntityType = {
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

            const entityTypeRepo = await repositoryFactory.entityType();
            entityTypeRepo.insertOne(newEntityType);

            const newEntity = {
                prop1: 25.1
            };

            const problems = await EntityValidator.validate(newEntityType, newEntity, repositoryFactory);

            expect(problems[0].property).eqls("prop1");
        });

        it("Int can't be lower than 'min'.", async () => {
            const newEntityType: EntityType = {
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

            const entityTypeRepo = await repositoryFactory.entityType();
            entityTypeRepo.insertOne(newEntityType);

            const newEntity = {
                prop1: 9.9
            };

            const problems = await EntityValidator.validate(newEntityType, newEntity, repositoryFactory);

            expect(problems[0].property).eqls("prop1");
        });

        it("Int must respect 'multipleOf'.", async () => {
            const newEntityType: EntityType = {
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

            const entityTypeRepo = await repositoryFactory.entityType();
            entityTypeRepo.insertOne(newEntityType);

            const newEntity = {
                prop1: 10.001
            };

            const problems = await EntityValidator.validate(newEntityType, newEntity, repositoryFactory);

            expect(problems[0].property).eqls("prop1");
        });
    });

    describe("DateTime properties validation", () => {
        it("DateTime property doesn't accept other values", async () => {
            const newEntityType: any = {
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

            const entityTypeRepo = await repositoryFactory.entityType();
            entityTypeRepo.insertOne(newEntityType);

            const newEntity = {
                prop1: "teste"
            };

            const problems = await EntityValidator.validate(newEntityType, newEntity, repositoryFactory);

            expect(problems.length).eqls(1);
        });

        it("DateTime property accept Date javascript object", async () => {
            const newEntityType: any = {
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

            const entityTypeRepo = await repositoryFactory.entityType();
            entityTypeRepo.insertOne(newEntityType);

            const newEntity = {
                prop1: new Date()
            };

            const problems = await EntityValidator.validate(newEntityType, newEntity, repositoryFactory);

            expect(problems.length).eqls(0);
        });
    });
});
