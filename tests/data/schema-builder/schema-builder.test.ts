import { expect, assert } from "chai";
import { IEntityType, PropertyTypes } from "@poseidon/core-models";
import { EntitySchemaBuilder } from "../../../src/schema-builder/entity-schema-builder";
import { InMemoryStorage } from "../../../src/data/storage";
import { DatabasePopulator, RepositoryFactory, BuiltInEntries } from "../../../src/data";
import { TestDatabasePopulator } from "../test-database-populator";
import { TestEntities } from "../../test-entities";

describe("Schema Builder Test", () => {

    let repositoryFactory: RepositoryFactory;
    let entitySchemaBuilder: EntitySchemaBuilder;
    let testEntities: TestEntities;

    before(async () => {
        const storage = new InMemoryStorage();
        await storage.connect();

        const populator = new DatabasePopulator(storage);
        const testPopulator = new TestDatabasePopulator(storage);

        await populator.populate();
        await testPopulator.populate();

        repositoryFactory = new RepositoryFactory(storage);
        entitySchemaBuilder = new EntitySchemaBuilder(await repositoryFactory.entityType());

        // builtIn = new BuiltInEntries();
        testEntities = new TestEntities();
    });

    describe("Integer test", () => {
        it("Can set an integer property", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.int
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.type, "integer");
        });

        it("Integer property can have max value", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.int,
                            max: 50
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.maximum, 50);
        });

        it("Integer property can have min value", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.int,
                            min: 30
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.minimum, 30);
        });

        it("Integer property can be multiple of a value", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.int,
                            multipleOf: 10
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.multipleOf, 10);
        });

        it("Integer property can be required", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.int,
                            required: true
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            expect(schemaB.getSchema().required).to.have.members(["prop1"]);
        });
    });

    describe("Number test", () => {
        it("Can set an mumber property", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.number
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.type, "number");
        });

        it("Number property can have max value", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.number,
                            max: 50
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.maximum, 50);
        });

        it("Number property can have min value", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.number,
                            min: 30
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.minimum, 30);
        });

        it("Number property can be multiple of a value", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.number,
                            multipleOf: 10.5
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.multipleOf, 10.5);
        });

        it("Number property can be required", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.number,
                            required: true
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            expect(schemaB.getSchema().required).to.have.members(["prop1"]);
        });
    });

    describe("String test", () => {
        it("Can set an string property", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.string
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.type, "string");
        });

        it("String property can have max length", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.string,
                            max: 50
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.maxLength, 50);
        });

        it("Number property can have min length", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.string,
                            min: 30
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.minLength, 30);
        });

        it("String property can be required", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.string,
                            required: true
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            expect(schemaB.getSchema().required).to.have.members(["prop1"]);
        });

        it("String property can have a pattern", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.string,
                            pattern: "^(\\([0-9]{3}\\))?[0-9]{3}-[0-9]{4}$"
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            expect((<any>schemaB.getSchema().properties).prop1.pattern, "^(\\([0-9]{3}\\))?[0-9]{3}-[0-9]{4}$");
        });
    });

    describe("Date and time test", () => {
        it("DateTime property has format automatically set to 'date-time'", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.dateTime
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.format, "date-time");
        });

        it("DateTime property can be required", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.dateTime,
                            required: true
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            expect(schemaB.getSchema().required).to.have.members(["prop1"]);
        });
    });

    describe("Enum test", () => {
        it("Enum property has 'string' type set in the schema", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.enum,
                            enum: ["teste"]
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.type, "string");
        });

        it("Enum property must have an array of valid strings", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.enum,
                            enum: ["teste", "teste2"]
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            expect((<any>schemaB.getSchema().properties).prop1.enum).to.eql(["teste", "teste2"]);
        });

        it("Enum property can be required", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.enum,
                            enum: ["teste", "teste2"],
                            required: true
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            expect(schemaB.getSchema().required).to.have.members(["prop1"]);
        });
    });

    describe("Boolean test", () => {
        it("Can set an boolean property", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.boolean
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.type, "boolean");
        });

        it("Boolean property can be required", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.boolean,
                            required: true
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            expect(schemaB.getSchema().required).to.have.members(["prop1"]);
        });
    });

    describe("Array test", () => {
        it("Can set an array of int", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.array,
                            items: {
                                type: PropertyTypes.int
                            }
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.type, "array");
        });

        it("Can set an array of number", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.array,
                            items: {
                                type: PropertyTypes.number
                            }
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            expect(schemaB.getSchema())
                .deep.include(
                    {
                        type: "object",
                        properties: {
                            prop1: {
                                additionalItems: false,
                                type: "array",
                                items: { type: "number" }
                            }
                        }
                    });
        });

        it("Array can have unique items", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.array,
                            uniqueItems: true,
                            items: {
                                type: PropertyTypes.number
                            }
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            expect(schemaB.getSchema())
                .deep.include(
                    {
                        type: "object",
                        properties: {
                            prop1: {
                                additionalItems: false,
                                type: "array",
                                uniqueItems: true,
                                items: { type: "number" }
                            }
                        }
                    });
        });

        it("Array property does't accept aditional items", async () => {
            const entityType: IEntityType = <IEntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.array,
                            items: {
                                type: PropertyTypes.number
                            }
                        }
                    }
                ]
            };

            const schemaB = await entitySchemaBuilder.buildSchema(entityType);

            expect(schemaB.getSchema())
                .deep.include(
                    {
                        type: "object",
                        properties: {
                            prop1: {
                                type: "array",
                                additionalItems: false,
                                items: { type: "number" }
                            }
                        }
                    });
        });

        it("Array property of abstract type are defined in ", async () => {
            const complex = testEntities.complexLinkedEntityType;
            const schemaB = await entitySchemaBuilder.buildSchema(complex);

            expect((<any>schemaB.getSchema().properties).arrayOfAbstractEntityProp.items.$ref)
                .to.equals("#/definitions/" + testEntities.simpleAbstractEntityType.name);
        });
    });

    describe("Full entity type schema test", () => {
        it("Entity type has the expected schema.", async () => {
            const schema = await entitySchemaBuilder.buildSchema(testEntities.fullEntityType);

            expect(schema).to.not.be.null;
        });
    });

    describe("Entity type extend another entity type test", () => {
        it("Schema has parent's properties.", async () => {
            const schema = await entitySchemaBuilder.buildSchema(testEntities.fullEntityType);

            expect(schema).to.not.be.null;
        });
    });
});