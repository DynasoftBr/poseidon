import { expect, assert } from "chai";
import { describe } from "mocha";
import { EntityType } from "../../../src/models";
import { PropertyTypes } from "../../../src/constants";
import { EntitySchemaBuilder } from "../../../src/data/schema-builder/entity-schema-builder";
import { EntityTypeRepository } from "../../../src/data/repositories/entity-type-repository";
import { DataAccess } from "../../../src";
import { TestRepositoryFactory } from "../repositories/test-repository-factory";
import { GenericRepositoryInterface } from "../../../src/data/repositories/repository-interface";

describe("Schema Builder Test", () => {

    describe("Integer test", () => {
        it("Can set an integer property", async () => {
            let entityType: EntityType = <EntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.int
                        }
                    }
                ]
            };

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.type, "integer");
        });

        it("Integer property can have max value", async () => {
            let entityType: EntityType = <EntityType>{
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

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.maximum, 50);
        });

        it("Integer property can have min value", async () => {
            let entityType: EntityType = <EntityType>{
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

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.minimum, 30);
        });

        it("Integer property can be multiple of a value", async () => {
            let entityType: EntityType = <EntityType>{
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

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.multipleOf, 10);
        });

        it("Integer property can be required", async () => {
            let entityType: EntityType = <EntityType>{
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

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            expect(schemaB.getSchema().required).to.have.members(["prop1"]);
        });
    });

    describe("Number test", () => {
        it("Can set an mumber property", async () => {
            let entityType: EntityType = <EntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.number
                        }
                    }
                ]
            };

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.type, "number");
        });

        it("Number property can have max value", async () => {
            let entityType: EntityType = <EntityType>{
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

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.maximum, 50);
        });

        it("Number property can have min value", async () => {
            let entityType: EntityType = <EntityType>{
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

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.minimum, 30);
        });

        it("Number property can be multiple of a value", async () => {
            let entityType: EntityType = <EntityType>{
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

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.multipleOf, 10.5);
        });

        it("Number property can be required", async () => {
            let entityType: EntityType = <EntityType>{
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

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            expect(schemaB.getSchema().required).to.have.members(["prop1"]);
        });
    });

    describe("String test", () => {
        it("Can set an string property", async () => {
            let entityType: EntityType = <EntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.string
                        }
                    }
                ]
            };

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.type, "string");
        });

        it("String property can have max length", async () => {
            let entityType: EntityType = <EntityType>{
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

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.maxLength, 50);
        });

        it("Number property can have min length", async () => {
            let entityType: EntityType = <EntityType>{
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

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.minLength, 30);
        });

        it("String property can be required", async () => {
            let entityType: EntityType = <EntityType>{
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

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            expect(schemaB.getSchema().required).to.have.members(["prop1"]);
        });

        it("String property can have a pattern", async () => {
            let entityType: EntityType = <EntityType>{
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

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            expect((<any>schemaB.getSchema().properties).prop1.pattern, "^(\\([0-9]{3}\\))?[0-9]{3}-[0-9]{4}$");
        });
    });

    describe("Date and time test", () => {
        it("DateTime property has format automatically set to 'date-time'", async () => {
            let entityType: EntityType = <EntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.dateTime
                        }
                    }
                ]
            };

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.format, "date-time");
        });

        it("DateTime property can be required", async () => {
            let entityType: EntityType = <EntityType>{
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

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            expect(schemaB.getSchema().required).to.have.members(["prop1"]);
        });
    });

    describe("Enum test", () => {
        it("Enum property has 'string' type set in the schema", async () => {
            let entityType: EntityType = <EntityType>{
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

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.type, "string");
        });

        it("Enum property must have an array of valid strings", async () => {
            let entityType: EntityType = <EntityType>{
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

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            expect((<any>schemaB.getSchema().properties).prop1.enum).to.eql(["teste", "teste2"]);
        });

        it("Enum property can be required", async () => {
            let entityType: EntityType = <EntityType>{
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

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            expect(schemaB.getSchema().required).to.have.members(["prop1"]);
        });
    });

    describe("Boolean test", () => {
        it("Can set an boolean property", async () => {
            let entityType: EntityType = <EntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.boolean
                        }
                    }
                ]
            };

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.type, "boolean");
        });

        it("Boolean property can be required", async () => {
            let entityType: EntityType = <EntityType>{
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

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            expect(schemaB.getSchema().required).to.have.members(["prop1"]);
        });
    });

    describe("Array test", () => {
        it("Can set an array of int", async () => {
            let entityType: EntityType = <EntityType>{
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

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.type, "array");
        });

        it("Can set an array of number", async () => {
            let entityType: EntityType = <EntityType>{
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

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

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
            let entityType: EntityType = <EntityType>{
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

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

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
            let entityType: EntityType = <EntityType>{
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

            let schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

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
    });
});