import { FullEntityType } from "./models/full-entity-type";
import { EntityType, LinkedProperty } from "../src/models";
import { PropertyTypes } from "../src/constants";
import { BuiltInEntries } from "../src";
import { SimpleAbstractEntityType } from "./models/simple-abstract-entity-type";
import { SimpleLinkedEntityType } from "./models/simple-linked-entity-type";
import { ComplexLinkedEntityType } from "./models/complex-linked-entity-type";
import { ComplexAbstractEntityType } from "./models/complex-abstract-entity-type";
import { ComplexLinkedEntityTypeRef } from "./models/references/complex-linked-entity-type-ref";
import { SimpleLinkedEntityTypeRef } from "./models/references/simple-linked-entity-type-ref";

/**
 * Support tests with some entity types and entities.
 * @class
 */
export class TestEntities {

    builtIn: BuiltInEntries;
    constructor() {
        this.builtIn = new BuiltInEntries();
    }

    /**
     * An entity type that exposes all possible property scenarios.
     * @prop
     * @readonly
     */
    public get fullEntityType(): EntityType {
        return {
            _id: "FullEntityType",
            name: "FullEntityType",
            abstract: false,
            props: [
                this.builtIn.idPropertyDefinition,
                this.builtIn.createdAtPropertyDefinition,
                this.builtIn.createdByPropertyDefinition,
                this.builtIn.changedAtPropertyDefinition,
                this.builtIn.changedByPropertyDefinition,
                {
                    name: "stringProp",
                    validation: {
                        type: PropertyTypes.string,
                        required: true,
                        min: 2,
                        max: 3,
                        pattern: "^[A-Z]*$"
                    }
                },
                {
                    name: "intProp",
                    validation: {
                        type: PropertyTypes.int,
                        min: 10,
                        max: 30,
                        multipleOf: 10
                    }
                },
                {
                    name: "numberProp",
                    validation: {
                        type: PropertyTypes.number,
                        min: 10,
                        max: 30,
                        multipleOf: 0.0000000001
                    }
                },
                {
                    name: "dateTimeProp",
                    validation: {
                        type: PropertyTypes.dateTime
                    }
                },
                {
                    name: "booleanProp",
                    validation: {
                        type: PropertyTypes.boolean
                    }
                },
                {
                    name: "arrayOfSimpleTypeProp",
                    validation: {
                        type: PropertyTypes.array,
                        items: {
                            type: PropertyTypes.string,
                            min: 2,
                            max: 3
                        },
                        min: 1,
                        max: 2
                    }
                },
                {
                    name: "arrayOfAbstractEntityProp",
                    validation: {
                        type: PropertyTypes.array,
                        items: {
                            type: PropertyTypes.abstractEntity,
                            ref: {
                                _id: this.complexAbstractEntityType._id,
                                name: this.complexAbstractEntityType.name
                            }
                        },
                        min: 1,
                        max: 2
                    }
                },
                {
                    name: "arrayOfLinkedEntityProp",
                    validation: {
                        type: PropertyTypes.array,
                        items: {
                            type: PropertyTypes.linkedEntity,
                            ref: {
                                _id: this.complexLinkedEntityType._id,
                                name: this.complexLinkedEntityType.name
                            },
                            linkedProperties: this.complexLinkedEntityTypeLinkedProps
                        },
                        min: 1,
                        max: 2
                    }
                },
                {
                    name: "abstractEntityProp",
                    validation: {
                        type: PropertyTypes.abstractEntity,
                        ref: {
                            _id: this.complexAbstractEntityType._id,
                            name: this.complexAbstractEntityType.name
                        }
                    }
                },
                {
                    name: "linkedEntityProp",
                    validation: {
                        type: PropertyTypes.linkedEntity,
                        ref: {
                            _id: this.complexLinkedEntityType._id,
                            name: this.complexLinkedEntityType.name
                        },
                        linkedProperties: this.complexLinkedEntityTypeLinkedProps
                    }
                }
            ],
            createdAt: new Date(2018, 6, 25),
            createdBy: this.builtIn.rootUserRef
        };
    }

    /**
     * A simple abstract entity type used inside a more complex abstract entity type / linked entity.
     * {@link abstractEntityType} and {@link linkedEntityType}
     * @prop
     * @readonly
     */
    public get simpleAbstractEntityType(): EntityType {
        return {
            _id: "SimpleAbstractEntityType",
            name: "SimpleAbstractEntityType",
            abstract: true,
            props: [
                {
                    name: "stringProp",
                    validation: {
                        type: PropertyTypes.string,
                        required: true,
                        min: 2,
                        max: 3,
                        pattern: "^[A-Z]*$"
                    }
                }
            ],
            createdAt: new Date(2018, 6, 25),
            createdBy: this.builtIn.rootUserRef
        };
    }

    /**
     * A simple entity type to be linked inside a more complex abstract entity type / entity type.
     * {@link abstractEntityType} and {@link linkedEntityType}
     * @prop
     * @readonly
     */
    public get simpleLinkedEntityType(): EntityType {
        return {
            _id: "SimpleLinkedEntityType",
            name: "SimpleLinkedEntityType",
            abstract: false,
            props: [
                this.builtIn.idPropertyDefinition,
                this.builtIn.createdAtPropertyDefinition,
                this.builtIn.createdByPropertyDefinition,
                this.builtIn.changedAtPropertyDefinition,
                this.builtIn.changedByPropertyDefinition,
                {
                    name: "stringProp",
                    validation: {
                        type: PropertyTypes.string,
                        required: true,
                        min: 2,
                        max: 3,
                        pattern: "^[A-Z]*$"
                    }
                }
            ],
            createdAt: new Date(2018, 6, 25),
            createdBy: this.builtIn.rootUserRef
        };
    }

    /**
     * A complex abstract entity type to be a property of {@link fullEntityType}.
     * @prop
     * @readonly
     */
    public get complexAbstractEntityType(): EntityType {
        return {
            _id: "ComplexAbstractEntityType",
            name: "ComplexAbstractEntityType",
            abstract: true,
            props: [
                {
                    name: "stringProp",
                    validation: {
                        type: PropertyTypes.string,
                        required: true,
                        min: 2,
                        max: 3,
                        pattern: "^[A-Z]*$"
                    }
                },
                {
                    name: "intProp",
                    validation: {
                        type: PropertyTypes.int,
                        min: 10,
                        max: 30,
                        multipleOf: 10
                    }
                },
                {
                    name: "numberProp",
                    validation: {
                        type: PropertyTypes.number,
                        min: 10,
                        max: 30,
                        multipleOf: 0.0000000001
                    }
                },
                {
                    name: "dateTimeProp",
                    validation: {
                        type: PropertyTypes.dateTime
                    }
                },
                {
                    name: "booleanProp",
                    validation: {
                        type: PropertyTypes.boolean
                    }
                },
                {
                    name: "arrayOfSimpleTypeProp",
                    validation: {
                        type: PropertyTypes.array,
                        items: {
                            type: PropertyTypes.string,
                            min: 2,
                            max: 3
                        },
                        min: 1,
                        max: 2
                    }
                },
                {
                    name: "arrayOfAbstractEntityProp",
                    validation: {
                        type: PropertyTypes.array,
                        items: {
                            type: PropertyTypes.abstractEntity,
                            ref: {
                                _id: this.simpleAbstractEntityType._id,
                                name: this.simpleAbstractEntityType.name,
                            }
                        },
                        min: 1,
                        max: 2
                    }
                },
                {
                    name: "arrayOfLinkedEntityProp",
                    validation: {
                        type: PropertyTypes.array,
                        items: {
                            type: PropertyTypes.linkedEntity,
                            ref: {
                                _id: this.simpleLinkedEntityType._id,
                                name: this.simpleLinkedEntityType.name
                            },
                            linkedProperties: this.simpleLinkedEntityTypeLinkedProps
                        },
                        min: 1,
                        max: 2
                    }
                },
                {
                    name: "abstractEntityProp",
                    validation: {
                        type: PropertyTypes.abstractEntity,
                        ref: {
                            _id: this.simpleAbstractEntityType._id,
                            name: this.simpleAbstractEntityType.name,
                        }
                    }
                },
                {
                    name: "linkedEntityProp",
                    validation: {
                        type: PropertyTypes.linkedEntity,
                        ref: {
                            _id: this.simpleLinkedEntityType._id,
                            name: this.simpleLinkedEntityType.name,
                        },
                        linkedProperties: this.simpleLinkedEntityTypeLinkedProps
                    }
                }
            ],
            createdAt: new Date(2018, 6, 25),
            createdBy: this.builtIn.rootUserRef
        };
    }

    /**
     * A complex entity type to be a property of {@link fullEntityType}.
     * @prop
     * @readonly
     */
    public get complexLinkedEntityType(): EntityType {
        return {
            _id: "ComplexLinkedEntityType",
            name: "ComplexLinkedEntityType",
            abstract: false,
            props: [
                this.builtIn.idPropertyDefinition,
                this.builtIn.createdAtPropertyDefinition,
                this.builtIn.createdByPropertyDefinition,
                this.builtIn.changedAtPropertyDefinition,
                this.builtIn.changedByPropertyDefinition,
                {
                    name: "stringProp",
                    validation: {
                        type: PropertyTypes.string,
                        required: true,
                        min: 2,
                        max: 3,
                        pattern: "^[A-Z]*$"
                    }
                },
                {
                    name: "intProp",
                    validation: {
                        type: PropertyTypes.int,
                        min: 10,
                        max: 30,
                        multipleOf: 10
                    }
                },
                {
                    name: "numberProp",
                    validation: {
                        type: PropertyTypes.number,
                        min: 10,
                        max: 30,
                        multipleOf: 0.0000000001
                    }
                },
                {
                    name: "dateTimeProp",
                    validation: {
                        type: PropertyTypes.dateTime
                    }
                },
                {
                    name: "booleanProp",
                    validation: {
                        type: PropertyTypes.boolean
                    }
                },
                {
                    name: "arrayOfSimpleTypeProp",
                    validation: {
                        type: PropertyTypes.array,
                        items: {
                            type: PropertyTypes.string,
                            min: 2,
                            max: 3
                        },
                        min: 1,
                        max: 2
                    }
                },
                {
                    name: "arrayOfAbstractEntityProp",
                    validation: {
                        type: PropertyTypes.array,
                        items: {
                            type: PropertyTypes.abstractEntity,
                            ref: {
                                _id: this.simpleAbstractEntityType._id,
                                name: this.simpleAbstractEntityType.name,
                            }
                        },
                        min: 1,
                        max: 2
                    }
                },
                {
                    name: "arrayOfLinkedEntityProp",
                    validation: {
                        type: PropertyTypes.array,
                        items: {
                            type: PropertyTypes.linkedEntity,
                            ref: {
                                _id: this.simpleLinkedEntityType._id,
                                name: this.simpleLinkedEntityType.name
                            },
                            linkedProperties: this.simpleLinkedEntityTypeLinkedProps
                        },
                        min: 1,
                        max: 2
                    }
                },
                {
                    name: "abstractEntityProp",
                    validation: {
                        type: PropertyTypes.abstractEntity,
                        ref: {
                            _id: this.simpleAbstractEntityType._id,
                            name: this.simpleAbstractEntityType.name,
                        }
                    }
                },
                {
                    name: "linkedEntityProp",
                    validation: {
                        type: PropertyTypes.linkedEntity,
                        ref: {
                            _id: this.simpleLinkedEntityType._id,
                            name: this.simpleLinkedEntityType.name,
                        },
                        linkedProperties: this.simpleLinkedEntityTypeLinkedProps
                    }
                }
            ],
            createdAt: new Date(2018, 6, 25),
            createdBy: this.builtIn.rootUserRef
        };
    }

    /**
     * An instance of the entity type {@link fullEntityType} with all possible property options.
     * @prop
     * @readonly
     */
    public get fullEntityEntry(): FullEntityType {
        return {
            _id: "fullEntityEntry",
            stringProp: "AAA",
            intProp: 20,
            numberProp: 10.0000000001,
            dateTimeProp: new Date(2018, 6, 25),
            booleanProp: true,
            arrayOfSimpleTypeProp: [
                "AAA",
                "BBB"
            ],
            arrayOfAbstractEntityProp: [this.complexAbstractEntityEntry],
            arrayOfLinkedEntityProp: [this.complexLinkedEntityRef],
            abstractEntityProp: this.complexAbstractEntityEntry,
            linkedEntityProp: this.complexLinkedEntityRef,
            createdAt: new Date(2018, 6, 25),
            createdBy: this.builtIn.rootUserRef
        };
    }

    /**
     * An instance of the entity type {@link simpleLinkedEntityType},
     * used inside {@link complexAbstractEntityType} and {@link complexLinkedEntityType}
     * @prop
     * @readonly
     */
    public get simpleLinkedEntityEntry(): SimpleLinkedEntityType {
        return {
            _id: "simpleLinkedEntityEntry1",
            stringProp: "AAA",
            createdAt: new Date(2018, 6, 25),
            createdBy: this.builtIn.rootUserRef
        };
    }

    /**
     * An instance of the entity type {@link complexLinkedEntityType}, used inside {@link fullEntityType}
     * @prop
     * @readonly
     */
    public get complexLinkedEntityEntry(): ComplexLinkedEntityType {
        return {
            _id: "simpleLinkedEntityEntry1",
            stringProp: "AAA",
            intProp: 20,
            numberProp: 10.0000000001,
            dateTimeProp: new Date(2018, 6, 25),
            booleanProp: true,
            arrayOfSimpleTypeProp: [
                "AAA",
                "BBB"
            ],
            arrayOfAbstractEntityProp: [
                this.simpleAbstractEntityEntry
            ],
            arrayOfLinkedEntityProp: [
                this.simpleLinkedEntityRef
            ],
            abstractEntityProp: this.simpleAbstractEntityEntry,
            linkedEntityProp: this.simpleLinkedEntityRef,
            createdAt: new Date(2018, 6, 25),
            createdBy: this.builtIn.rootUserRef
        };
    }

    /**
     * An array containing the linked properties of {@link simpleLinkedEntityType}
     * @prop
     * @readonly
     */
    private get simpleLinkedEntityTypeLinkedProps(): LinkedProperty[] {
        return [
            { name: "_id" },
            { name: "stringProp" }
        ];
    }

    /**
     * An array containing the linked properties of {@link complexLinkedEntityTypeLinkedProps}
     * @prop
     * @readonly
     */
    private get complexLinkedEntityTypeLinkedProps(): LinkedProperty[] {
        return [
            { name: "_id" },
            { name: "stringProp" },
            { name: "intProp" },
            { name: "numberProp" },
            { name: "dateTimeProp" },
            { name: "booleanProp" },
            { name: "arrayOfSimpleTypeProp" },
            { name: "arrayOfAbstractEntityProp" },
            { name: "arrayOfLinkedEntityProp" },
            { name: "abstractEntityProp" },
            { name: "linkedEntityProp" }
        ];
    }

    /**
     * An instance of the abstract entity type {@link simpleAbstractEntityType},
     * used inside {@link complexAbstractEntityType} and {@link complexLinkedEntityType}
     * @prop
     * @readonly
     */
    private get simpleAbstractEntityEntry(): SimpleAbstractEntityType {
        return {
            stringProp: "AAA"
        };
    }

    /**
     * An instance of the abstract entity type {@link complexAbstractEntityEntry}, used inside {@link fullEntityType}
     * @prop
     * @readonly
     */
    private get complexAbstractEntityEntry(): ComplexAbstractEntityType {
        const splLkdRef = this.simpleLinkedEntityRef;
        return {
            stringProp: "AAA",
            intProp: 20,
            numberProp: 10.0000000001,
            dateTimeProp: new Date(2018, 6, 25),
            booleanProp: true,
            arrayOfSimpleTypeProp: [
                "AAA",
                "BBB"
            ],
            arrayOfAbstractEntityProp: [
                this.simpleAbstractEntityEntry
            ],
            arrayOfLinkedEntityProp: [
                splLkdRef
            ],
            abstractEntityProp: this.simpleAbstractEntityEntry,
            linkedEntityProp: splLkdRef,
        };
    }

    private get complexLinkedEntityRef(): ComplexLinkedEntityTypeRef {
        const linkedEntityEntry = this.complexLinkedEntityEntry;
        delete (linkedEntityEntry.createdAt);
        delete (linkedEntityEntry.createdBy);

        return linkedEntityEntry;
    }

    private get simpleLinkedEntityRef(): SimpleLinkedEntityTypeRef {
        const splLkd = this.simpleLinkedEntityEntry;
        return {
            _id: splLkd._id,
            stringProp: splLkd.stringProp
        };
    }
}