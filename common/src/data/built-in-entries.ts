import { PropertyTypes, SysEntities, SysProperties } from "../constants";
import { SysUsers } from "../constants/sys-users";
import { EntityProperty, EntitySchema, EntityType, LinkedProperty, User } from "../models";
import { EntityTypeRef, UserRef } from "../models/helpers";

export class BuiltInEntries {
    public get entityType(): EntityType {
        return {
            _id: SysEntities.entityType,
            name: SysEntities.entityType,
            abstract: false,
            props: [
                this.idPropertyDefinition,
                this.nameProperty,
                this.labelProperty,
                this.abstractProperty,
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
            abstract: false,
            props: [
                this.idPropertyDefinition,
                this.nameProperty,
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
                this.nameProperty,
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
                required: true,
                unique: true
            }
        };
    }

    public get labelProperty(): EntityProperty {
        return {
            name: SysProperties.label,
            validation: {
                type: PropertyTypes.string,
                required: true
            }
        };
    }

    public get nameProperty(): EntityProperty {
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

    public get abstractProperty(): EntityProperty {
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
                ref: this.entityTypeRef,
                linkedProperties: this.entityTypeRefLinkedProps,
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
                ref: {
                    _id: SysEntities.user,
                    name: SysEntities.user
                },
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
                required: false,
                ref: {
                    _id: SysEntities.user,
                    name: SysEntities.user
                },
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
                required: false
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

    public get entityTypeRefLinkedProps(): LinkedProperty[] {
        return [
            {
                keepUpToDate: true,
                label: SysProperties.name,
                name: SysProperties.name
            },
            {
                keepUpToDate: true,
                label: SysProperties.label,
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