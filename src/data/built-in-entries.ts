import { IEntityType, SysEntities, IEntitySchema, IEntityProperty, SysProperties, PropertyTypes, UserRef, SysUsers, EntityTypeRef, ILinkedProperty, IUser } from "@poseidon/core-models";

export class BuiltInEntries {
    public get entityType(): IEntityType {
        return {
            _id: SysEntities.entityType,
            name: SysEntities.entityType,
            abstract: false,
            props: [
                this.idPropertyDefinition,
                this.namePropertyDefinition,
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

    public get entityTypeEntityProperty(): IEntityType {
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

    public get entityTypeEntitySchema(): IEntityType {
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

    public get entityTypeUser(): IEntityType {
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

    public get entityTypeValidation(): IEntityType {
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

    public get entityTypeLinkedProperty(): IEntityType {
        return {
            _id: SysEntities.linkedProperty,
            name: SysEntities.linkedProperty,
            abstract: false,
            props: [
                this.entityPropertyNamePropertyDefinition,
                this.keepUpToDatePropertyDefinition
            ],
            createdAt: new Date(),
            createdBy: this.rootUserRef
        };
    }

    public get entitySchemaForEntityType(): IEntitySchema {
        return {
            _id: SysEntities.entityType,
            createdAt: new Date(),
            createdBy: this.rootUserRef,
            schema: "",
            entityType: this.entityTypeRef
        };
    }

    public get entitySchemaForEntityProperty(): IEntitySchema {
        return {
            _id: SysEntities.entityProperty,
            createdAt: new Date(),
            createdBy: this.rootUserRef,
            schema: null,
            entityType: this.entityTypeRef
        };
    }

    public get idPropertyDefinition(): IEntityProperty {
        return {
            name: SysProperties._id,
            validation: {
                type: PropertyTypes.string,
                required: true
            }
        };
    }
    public get userNamePropertyDefinition(): IEntityProperty {
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

    public get namePropertyDefinition(): IEntityProperty {
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

    public get entityPropertyNamePropertyDefinition(): IEntityProperty {
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

    public get keepUpToDatePropertyDefinition(): IEntityProperty {
        return {
            name: SysProperties.keepUpToDate,
            validation: {
                type: PropertyTypes.boolean,
                required: false
            }
        };
    }

    public get validationPropertyDefinition(): IEntityProperty {
        return {
            name: SysProperties.validation,
            validation: {
                type: PropertyTypes.abstractEntity,
                required: true,
                ref: this.validationRef
            }
        };
    }

    public get abstractPropertyDefinition(): IEntityProperty {
        return {
            name: SysProperties.abstract,
            validation: {
                type: PropertyTypes.boolean
            }
        };
    }

    public get propsPropertyDefinition(): IEntityProperty {

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

    public get createdByPropertyDefinition(): IEntityProperty {
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

    public get createdAtPropertyDefinition(): IEntityProperty {
        return {
            name: SysProperties.createdAt,
            validation: {
                type: PropertyTypes.dateTime,
                required: true
            }
        };
    }

    public get changedByPropertyDefinition(): IEntityProperty {
        return {
            name: SysProperties.changedBy,
            validation: {
                type: PropertyTypes.linkedEntity,
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

    public get changedAtPropertyDefinition(): IEntityProperty {
        return {
            name: SysProperties.changedAt,
            validation: {
                type: PropertyTypes.dateTime,
            }
        };
    }

    public get entityTypePropertyDefinition(): IEntityProperty {
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

    public get schemaPropertyDefinition(): IEntityProperty {
        return {
            name: SysProperties.schema,
            validation: {
                type: PropertyTypes.string,
                required: true
            }
        };
    }

    public get loginPropertyDefinition(): IEntityProperty {
        return {
            name: SysProperties.login,
            validation: {
                type: PropertyTypes.string
            }
        };
    }

    public get typePropertyDefinition(): IEntityProperty {
        return {
            name: SysProperties.type,
            validation: {
                type: PropertyTypes.string,
                required: true
            }
        };
    }

    public get requiredPropertyDefinition(): IEntityProperty {
        return {
            name: SysProperties.required,
            validation: {
                type: PropertyTypes.boolean
            }
        };
    }

    public get minPropertyDefinition(): IEntityProperty {
        return {
            name: SysProperties.min,
            validation: {
                type: PropertyTypes.number,
            }
        };
    }

    public get maxPropertyDefinition(): IEntityProperty {
        return {
            name: SysProperties.max,
            validation: {
                type: PropertyTypes.number,
            }
        };
    }

    public get patternPropertyDefinition(): IEntityProperty {
        return {
            name: SysProperties.pattern,
            validation: {
                type: PropertyTypes.string,
            }
        };
    }

    public get enumPropertyDefinition(): IEntityProperty {
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

    public get refPropertyDefinition(): IEntityProperty {
        return {
            name: SysProperties.ref,
            validation: {
                type: PropertyTypes.linkedEntity,
                ref: this.entityTypeRef,
                linkedProperties: this.entityTypeRefLinkedProps
            }
        };
    }

    public get linkedPropertiesPropertyDefinition(): IEntityProperty {
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

    public get itemsPropertyDefinition(): IEntityProperty {
        return {
            name: SysProperties.items,
            validation: {
                type: PropertyTypes.abstractEntity,
                ref: this.validationRef
            }
        };
    }

    public get uniqueItemsPropertyDefinition(): IEntityProperty {
        return {
            name: SysProperties.uniqueItems,
            validation: {
                type: PropertyTypes.boolean,
                ref: this.validationRef
            }
        };
    }

    public get multipleOfPropertyDefinition(): IEntityProperty {
        return {
            name: SysProperties.multipleOf,
            validation: {
                type: PropertyTypes.number,
            }
        };
    }

    public get defaultPropertyDefinition(): IEntityProperty {
        return {
            name: SysProperties.default,
            validation: {
                type: PropertyTypes.string,
            }
        };
    }

    public get conventionPropertyDefinition(): IEntityProperty {
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
            name: SysEntities.entityType
        };
    }

    public get entityPropertyRef(): EntityTypeRef {
        return {
            _id: SysEntities.entityProperty,
            name: SysEntities.entityProperty
        };
    }

    public get validationRef(): EntityTypeRef {
        return {
            _id: SysEntities.validation,
            name: SysEntities.validation
        };
    }

    public get linkedPropertyRef(): EntityTypeRef {
        return {
            _id: SysEntities.linkedProperty,
            name: SysEntities.linkedProperty
        };
    }

    public get entityTypeUserRef(): EntityTypeRef {
        return {
            _id: SysEntities.user,
            name: SysEntities.user
        };
    }

    public get entityTypeRefLinkedProps(): ILinkedProperty[] {
        return [
            {
                keepUpToDate: true,
                name: SysProperties._id
            },
            {
                keepUpToDate: true,
                name: SysProperties.name
            }
        ];
    }

    public get rootUser(): IUser {
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