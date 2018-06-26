import { PropertyTypes, SysEntities } from "../../src/constants";
import { EntityType } from "../../src/models";
import { BuiltInEntries, RepositoryFactory, DataStorage } from "../../src/data";
import { SysUsers } from "../../src/constants/sys-users";
import { EntityValidator } from "../../src/data/validation/entity-validator";

export class TestDatabasePopulator {

    constructor(private readonly storage: DataStorage) { }
    async populate() {
        const builtIn = new BuiltInEntries();

        const countryEntityType: EntityType = {
            _id: "country",
            name: "country",
            abstract: false,
            props: [
                {
                    name: "name",
                    validation: {
                        type: PropertyTypes.string,
                        required: true,
                        min: 2,
                        max: 150
                    }
                },
                {
                    name: "code",
                    validation: {
                        type: PropertyTypes.string,
                        required: true,
                        min: 2,
                        max: 3
                    }
                },
                builtIn.idPropertyDefinition,
                builtIn.createdAtPropertyDefinition,
                builtIn.createdByPropertyDefinition,
                builtIn.changedAtPropertyDefinition,
                builtIn.changedByPropertyDefinition
            ],
            createdAt: new Date(),
            createdBy: {
                _id: SysUsers.root,
                name: SysUsers.root
            }
        };

        const communicationChannelEntityType: EntityType = {
            _id: "communicationChannel",
            name: "communicationChannel",
            abstract: true,
            props: [
                {
                    name: "email",
                    validation: {
                        type: PropertyTypes.string,
                        required: true,
                        min: 5,
                        max: 150
                    }
                },
                {
                    name: "type",
                    validation: {
                        type: PropertyTypes.enum,
                        required: true,
                        enum: ["personal", "business"]
                    }
                }
            ],
            createdAt: new Date(),
            createdBy: {
                _id: SysUsers.root,
                name: SysUsers.root
            }
        };

        const legalEntityAccountEntityType: EntityType = {
            _id: "LegalEntityAccount",
            name: "LegalEntityAccount",
            abstract: true,
            props: [
                {
                    name: "name",
                    validation: {
                        type: PropertyTypes.string,
                        required: true,
                        min: 2,
                        max: 4
                    }
                },
                {
                    name: "communicationChannel",
                    validation: {
                        type: PropertyTypes.array,
                        max: 4,
                        items: {
                            type: PropertyTypes.abstractEntity,
                            ref: {
                                _id: communicationChannelEntityType._id,
                                name: communicationChannelEntityType.name,
                                label: communicationChannelEntityType.label
                            }
                        }
                    }
                }
            ],
            createdAt: new Date(),
            createdBy: {
                _id: SysUsers.root,
                name: SysUsers.root
            }
        };

        const legalEntityEntityType: EntityType = {
            _id: "legalEntityEntityType",
            name: "LegalEntityEntityType",
            abstract: false,
            props: [
                {
                    name: "name",
                    validation: {
                        type: PropertyTypes.string,
                        required: true,
                        min: 5,
                        max: 20
                    }
                },
                {
                    name: "age",
                    validation: {
                        type: PropertyTypes.int,
                        required: true,
                        min: 18,
                        max: 130
                    }
                },
                {
                    name: "gender",
                    validation: {
                        type: PropertyTypes.enum,
                        required: true,
                        enum: ["male", "female"]
                    }
                },
                {
                    name: "dateOfBirth",
                    validation: {
                        type: PropertyTypes.dateTime,
                        required: true
                    }
                },
                {
                    name: "isActive",
                    validation: {
                        type: PropertyTypes.boolean
                    }
                },
                {
                    name: "roles",
                    validation: {
                        type: PropertyTypes.array,
                        required: true,
                        min: 1,
                        max: 2,
                        items: {
                            type: PropertyTypes.enum,
                            enum: ["client", "company"]
                        }
                    }
                },
                {
                    name: "accounts",
                    validation: {
                        type: PropertyTypes.array,
                        required: true,
                        min: 1,
                        max: 2,
                        items: {
                            type: PropertyTypes.abstractEntity,
                            ref: {
                                _id: legalEntityAccountEntityType._id,
                                name: legalEntityAccountEntityType.name,
                                label: legalEntityAccountEntityType.name
                            },

                        }
                    }
                },
                {
                    name: "country",
                    validation: {
                        type: PropertyTypes.linkedEntity,
                        ref: {
                            _id: countryEntityType._id,
                            name: countryEntityType.name,
                            label: countryEntityType.name
                        }
                    }
                },
                builtIn.idPropertyDefinition,
                builtIn.createdAtPropertyDefinition,
                builtIn.createdByPropertyDefinition,
                builtIn.changedAtPropertyDefinition,
                builtIn.changedByPropertyDefinition
            ],
            createdAt: new Date(),
            createdBy: {
                _id: SysUsers.root,
                name: SysUsers.root
            }
        };

        const repoFactory = new RepositoryFactory(this.storage);
        const entityTypeRepo = await repoFactory.entityType();

        entityTypeRepo.insertOne(countryEntityType);
        entityTypeRepo.insertOne(communicationChannelEntityType);
        entityTypeRepo.insertOne(legalEntityAccountEntityType);
        entityTypeRepo.insertOne(legalEntityEntityType);

        const entityType = await entityTypeRepo.findById(SysEntities.entityType);
        let problems = await EntityValidator.validate(entityType, countryEntityType, repoFactory);
        problems = await EntityValidator.validate(entityType, communicationChannelEntityType, repoFactory);
        problems = await EntityValidator.validate(entityType, legalEntityAccountEntityType, repoFactory);
        problems = await EntityValidator.validate(entityType, legalEntityEntityType, repoFactory);

        console.log(problems);
    }
}