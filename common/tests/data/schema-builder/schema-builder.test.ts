import { expect, assert } from "chai";
import { describe } from "mocha";
import { EntityType } from "../../../src/models";
import { PropertyTypes } from "../../../src/constants";
import { EntitySchemaBuilder } from "../../../src/schema-builder/entity-schema-builder";

describe("Schema Builder Test", () => {

    describe("Integer test", () => {
        it("Can set an integer property", async () => {
            const entityType: EntityType = <EntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.int
                        }
                    }
                ]
            };

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.type, "integer");
        });

        it("Integer property can have max value", async () => {
            const entityType: EntityType = <EntityType>{
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

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.maximum, 50);
        });

        it("Integer property can have min value", async () => {
            const entityType: EntityType = <EntityType>{
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

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.minimum, 30);
        });

        it("Integer property can be multiple of a value", async () => {
            const entityType: EntityType = <EntityType>{
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

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.multipleOf, 10);
        });

        it("Integer property can be required", async () => {
            const entityType: EntityType = <EntityType>{
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

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            expect(schemaB.getSchema().required).to.have.members(["prop1"]);
        });
    });

    describe("Number test", () => {
        it("Can set an mumber property", async () => {
            const entityType: EntityType = <EntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.number
                        }
                    }
                ]
            };

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.type, "number");
        });

        it("Number property can have max value", async () => {
            const entityType: EntityType = <EntityType>{
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

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.maximum, 50);
        });

        it("Number property can have min value", async () => {
            const entityType: EntityType = <EntityType>{
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

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.minimum, 30);
        });

        it("Number property can be multiple of a value", async () => {
            const entityType: EntityType = <EntityType>{
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

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.multipleOf, 10.5);
        });

        it("Number property can be required", async () => {
            const entityType: EntityType = <EntityType>{
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

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            expect(schemaB.getSchema().required).to.have.members(["prop1"]);
        });
    });

    describe("String test", () => {
        it("Can set an string property", async () => {
            const entityType: EntityType = <EntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.string
                        }
                    }
                ]
            };

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.type, "string");
        });

        it("String property can have max length", async () => {
            const entityType: EntityType = <EntityType>{
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

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.maxLength, 50);
        });

        it("Number property can have min length", async () => {
            const entityType: EntityType = <EntityType>{
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

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.minLength, 30);
        });

        it("String property can be required", async () => {
            const entityType: EntityType = <EntityType>{
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

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            expect(schemaB.getSchema().required).to.have.members(["prop1"]);
        });

        it("String property can have a pattern", async () => {
            const entityType: EntityType = <EntityType>{
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

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            expect((<any>schemaB.getSchema().properties).prop1.pattern, "^(\\([0-9]{3}\\))?[0-9]{3}-[0-9]{4}$");
        });
    });

    describe("Date and time test", () => {
        it("DateTime property has format automatically set to 'date-time'", async () => {
            const entityType: EntityType = <EntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.dateTime
                        }
                    }
                ]
            };

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.format, "date-time");
        });

        it("DateTime property can be required", async () => {
            const entityType: EntityType = <EntityType>{
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

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            expect(schemaB.getSchema().required).to.have.members(["prop1"]);
        });
    });

    describe("Enum test", () => {
        it("Enum property has 'string' type set in the schema", async () => {
            const entityType: EntityType = <EntityType>{
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

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.type, "string");
        });

        it("Enum property must have an array of valid strings", async () => {
            const entityType: EntityType = <EntityType>{
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

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            expect((<any>schemaB.getSchema().properties).prop1.enum).to.eql(["teste", "teste2"]);
        });

        it("Enum property can be required", async () => {
            const entityType: EntityType = <EntityType>{
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

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            expect(schemaB.getSchema().required).to.have.members(["prop1"]);
        });
    });

    describe("Boolean test", () => {
        it("Can set an boolean property", async () => {
            const entityType: EntityType = <EntityType>{
                props: [
                    {
                        name: "prop1",
                        validation: {
                            type: PropertyTypes.boolean
                        }
                    }
                ]
            };

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.type, "boolean");
        });

        it("Boolean property can be required", async () => {
            const entityType: EntityType = <EntityType>{
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

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            expect(schemaB.getSchema().required).to.have.members(["prop1"]);
        });
    });

    describe("Array test", () => {
        it("Can set an array of int", async () => {
            const entityType: EntityType = <EntityType>{
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

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

            assert.equal((<any>schemaB.getSchema().properties).prop1.type, "array");
        });

        it("Can set an array of number", async () => {
            const entityType: EntityType = <EntityType>{
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

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

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
            const entityType: EntityType = <EntityType>{
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

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

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
            const entityType: EntityType = <EntityType>{
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

            const schemaB = await (new EntitySchemaBuilder(null)).buildSchema(entityType);

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