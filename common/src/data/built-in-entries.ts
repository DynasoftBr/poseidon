import { PropertyTypes, SysEntities, SysProperties } from "../constants";
import { SysUsers } from "../constants/sys-users";
import { EntityProperty, EntitySchema, EntityType, LinkedProperty, User } from "../models";
import { EntityTypeRef, UserRef } from "../models/references";

export class BuiltInEntries {
    public get entityType(): EntityType {
        return {
            _id: SysEntities.entityType,
            name: SysEntities.entityType,
            abstract: false,
            props: [
                this.idPropertyDefinition,
                this.namePropertyDefinition,
                this.labelPropertyDefinition,
                this.abstractPropertyDefinition,
                this.propsPropertyDefinition,
                this.createdByPropertyDefinition,
                this.createdAtPropertyDefinition,
                this.changedByPropertyDefinition,
                this.changedAtPropertyDefinition
            ],
            createdBy: this.rootUserRef,
            createdAt: new Date()
        };
    }

    public get entityTypeEntityProperty(): EntityType {
        return {
            _id: SysEntities.entityProperty,
            name: SysEntities.entityProperty,
            abstract: true,
            props: [
                this.entityPropertyNamePropertyDefinition,
                this.validationPropertyDefinition
            ],
            createdBy: this.rootUserRef,
            createdAt: new Date()
        };
    }

    public get entityTypeEntitySchema(): EntityType {
        return {
            _id: SysEntities.entitySchema,
            name: SysEntities.entitySchema,
            abstract: false,
            props: [
                this.idPropertyDefinition,
                this.entityTypePropertyDefinition,
                this.schemaPropertyDefinition,
                this.changedByPropertyDefinition,
                this.createdAtPropertyDefinition,
                this.changedByPropertyDefinition,
                this.changedAtPropertyDefinition
            ],
            createdBy: this.rootUserRef,
            createdAt: new Date()
        };
    }

    public get entityTypeUser(): EntityType {
        return {
            _id: SysEntities.user,
            name: SysEntities.user,
            abstract: false,
            props: [
                this.idPropertyDefinition,
                this.userNamePropertyDefinition,
                this.loginPropertyDefinition,
                this.createdByPropertyDefinition,
                this.createdAtPropertyDefinition,
                this.changedByPropertyDefinition,
                this.changedAtPropertyDefinition
            ],
            createdAt: new Date(),
            createdBy: this.rootUserRef
        };
    }

    public get entityTypeValidation(): EntityType {
        return {
            _id: SysEntities.validation,
            name: SysEntities.validation,
            abstract: false,
            props: [
                this.typePropertyDefinition,
                this.requiredPropertyDefinition,
                this.minPropertyDefinition,
                this.maxPropertyDefinition,
                this.patternPropertyDefinition,
                this.enumPropertyDefinition,
                this.refPropertyDefinition,
                this.linkedPropertiesPropertyDefinition,
                this.itemsPropertyDefinition,
                this.uniqueItemsPropertyDefinition,
                this.multipleOfPropertyDefinition,
                this.defaultPropertyDefinition,
                this.conventionPropertyDefinition
            ],
            createdAt: new Date(),
            createdBy: this.rootUserRef
        };
    }

    public get entityTypeLinkedProperty(): EntityType {
        return {
            _id: SysEntities.linkedProperty,
            name: SysEntities.linkedProperty,
            abstract: false,
            props: [
                this.entityPropertyNamePropertyDefinition,
                this.keepUpToDatePropertyDefinition,
                this.labelPropertyDefinition
            ],
            createdAt: new Date(),
            createdBy: this.rootUserRef
        };
    }

    public get entitySchemaForEntityType(): EntitySchema {
        return {
            _id: SysEntities.entityType,
            createdAt: new Date(),
            createdBy: this.rootUserRef,
            schema: "",
            entityType: this.entityTypeRef
        };
    }

    public get entitySchemaForEntityProperty(): EntitySchema {
        return {
            _id: SysEntities.entityProperty,
            createdAt: new Date(),
            createdBy: this.rootUserRef,
            schema: null,
            entityType: this.entityTypeRef
        };
    }

    public get idPropertyDefinition(): EntityProperty {
        return {
            name: SysProperties._id,
            validation: {
                type: PropertyTypes.string,
                required: true
            }
        };
    }

    public get labelPropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.label,
            validation: {
                type: PropertyTypes.string,
                required: false
            }
        };
    }

    public get userNamePropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.name,
            validation: {
                type: PropertyTypes.string,
                required: true,
                max: 50,
                min: 2,
            }
        };
    }

    public get namePropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.name,
            validation: {
                type: PropertyTypes.string,
                required: true,
                max: 50,
                min: 1,
                pattern: "^[A-Z][A-Za-z0-9]*$"
            }
        };
    }

    public get entityPropertyNamePropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.name,
            validation: {
                type: PropertyTypes.string,
                required: true,
                max: 50,
                min: 1,
                pattern: "^[a-z_][A-Za-z0-9_]*$"
            }
        };
    }

    public get keepUpToDatePropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.keepUpToDate,
            validation: {
                type: PropertyTypes.boolean,
                required: false
            }
        };
    }

    public get validationPropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.validation,
            validation: {
                type: PropertyTypes.abstractEntity,
                required: true,
                ref: this.validationRef
            }
        };
    }

    public get abstractPropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.abstract,
            validation: {
                type: PropertyTypes.boolean
            }
        };
    }

    public get propsPropertyDefinition(): EntityProperty {

        return {
            name: SysProperties.props,
            validation: {
                type: PropertyTypes.array,
                required: true,
                items: {
                    type: PropertyTypes.abstractEntity,
                    ref: this.entityPropertyRef
                }
            }
        };
    }

    public get createdByPropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.createdBy,
            validation: {
                type: PropertyTypes.linkedEntity,
                required: true,
                ref: this.entityTypeUserRef,
                linkedProperties: [
                    {
                        name: SysProperties._id,
                        keepUpToDate: true
                    },
                    {
                        name: SysProperties.name,
                        keepUpToDate: true
                    }
                ]
            }
        };
    }

    public get createdAtPropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.createdAt,
            validation: {
                type: PropertyTypes.dateTime,
                required: true
            }
        };
    }

    public get changedByPropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.changedBy,
            validation: {
                type: PropertyTypes.linkedEntity,
                ref: this.entityTypeUserRef,
                linkedProperties: [
                    {
                        name: SysProperties._id,
                        label: SysProperties._id,
                        keepUpToDate: true
                    },
                    {
                        name: SysProperties.name,
                        label: SysProperties.name,
                        keepUpToDate: true
                    }
                ]
            }
        };
    }

    public get changedAtPropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.changedAt,
            validation: {
                type: PropertyTypes.dateTime,
            }
        };
    }

    public get entityTypePropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.entityType,
            validation: {
                type: PropertyTypes.linkedEntity,
                required: true,
                ref: this.entityTypeRef,
                linkedProperties: this.entityTypeRefLinkedProps
            }
        };
    }

    public get schemaPropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.schema,
            validation: {
                type: PropertyTypes.string,
                required: true
            }
        };
    }

    public get loginPropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.login,
            validation: {
                type: PropertyTypes.string
            }
        };
    }

    public get typePropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.type,
            validation: {
                type: PropertyTypes.string,
                required: true
            }
        };
    }

    public get requiredPropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.required,
            validation: {
                type: PropertyTypes.boolean
            }
        };
    }

    public get minPropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.min,
            validation: {
                type: PropertyTypes.number,
            }
        };
    }

    public get maxPropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.max,
            validation: {
                type: PropertyTypes.number,
            }
        };
    }

    public get patternPropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.pattern,
            validation: {
                type: PropertyTypes.string,
            }
        };
    }

    public get enumPropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.enum,
            validation: {
                type: PropertyTypes.array,
                items: {
                    type: PropertyTypes.string
                }
            }
        };
    }

    public get refPropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.ref,
            validation: {
                type: PropertyTypes.linkedEntity,
                ref: this.entityTypeRef,
                linkedProperties: this.entityTypeRefLinkedProps
            }
        };
    }

    public get linkedPropertiesPropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.linkedProperties,
            validation: {
                type: PropertyTypes.array,
                items: {
                    type: PropertyTypes.abstractEntity,
                    ref: this.linkedPropertyRef
                }
            }
        };
    }

    public get itemsPropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.items,
            validation: {
                type: PropertyTypes.abstractEntity,
                ref: this.validationRef
            }
        };
    }

    public get uniqueItemsPropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.uniqueItems,
            validation: {
                type: PropertyTypes.boolean,
                ref: this.validationRef
            }
        };
    }

    public get multipleOfPropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.multipleOf,
            validation: {
                type: PropertyTypes.number,
            }
        };
    }

    public get defaultPropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.default,
            validation: {
                type: PropertyTypes.string,
            }
        };
    }

    public get conventionPropertyDefinition(): EntityProperty {
        return {
            name: SysProperties.convention,
            validation: {
                type: PropertyTypes.string,
            }
        };
    }

    public get rootUserRef(): UserRef {
        return {
            _id: SysUsers.root,
            name: SysUsers.root
        };
    }

    public get entityTypeRef(): EntityTypeRef {
        return {
            _id: SysEntities.entityType,
            label: SysEntities.entityType,
            name: SysEntities.entityType
        };
    }

    public get entityPropertyRef(): EntityTypeRef {
        return {
            _id: SysEntities.entityProperty,
            label: SysEntities.entityProperty,
            name: SysEntities.entityProperty
        };
    }

    public get validationRef(): EntityTypeRef {
        return {
            _id: SysEntities.validation,
            label: SysEntities.validation,
            name: SysEntities.validation
        };
    }

    public get linkedPropertyRef(): EntityTypeRef {
        return {
            _id: SysEntities.linkedProperty,
            label: SysEntities.linkedProperty,
            name: SysEntities.linkedProperty
        };
    }

    public get entityTypeUserRef(): EntityTypeRef {
        return {
            _id: SysEntities.user,
            name: SysEntities.user,
            label: SysEntities.user
        };
    }

    public get entityTypeRefLinkedProps(): LinkedProperty[] {
        return [
            {
                keepUpToDate: true,
                name: SysProperties._id
            },
            {
                keepUpToDate: true,
                name: SysProperties.name
            },
            {
                keepUpToDate: true,
                name: SysProperties.label
            }
        ];
    }

    public get rootUser(): User {
        return {
            _id: SysUsers.root,
            name: SysUsers.root,
            login: SysUsers.root,
            createdAt: new Date(),
            createdBy: this.rootUserRef,
            pass: SysUsers.root
        };
    }
}