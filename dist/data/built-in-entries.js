"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_models_1 = require("@poseidon/core-models");
class BuiltInEntries {
    get entityType() {
        return {
            _id: core_models_1.SysEntities.entityType,
            name: core_models_1.SysEntities.entityType,
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
    get entityTypeEntityProperty() {
        return {
            _id: core_models_1.SysEntities.entityProperty,
            name: core_models_1.SysEntities.entityProperty,
            abstract: true,
            props: [
                this.entityPropertyNamePropertyDefinition,
                this.validationPropertyDefinition
            ],
            createdBy: this.rootUserRef,
            createdAt: new Date()
        };
    }
    get entityTypeEntitySchema() {
        return {
            _id: core_models_1.SysEntities.entitySchema,
            name: core_models_1.SysEntities.entitySchema,
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
    get entityTypeUser() {
        return {
            _id: core_models_1.SysEntities.user,
            name: core_models_1.SysEntities.user,
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
    get entityTypeValidation() {
        return {
            _id: core_models_1.SysEntities.validation,
            name: core_models_1.SysEntities.validation,
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
    get entityTypeLinkedProperty() {
        return {
            _id: core_models_1.SysEntities.linkedProperty,
            name: core_models_1.SysEntities.linkedProperty,
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
    get entitySchemaForEntityType() {
        return {
            _id: core_models_1.SysEntities.entityType,
            createdAt: new Date(),
            createdBy: this.rootUserRef,
            schema: "",
            entityType: this.entityTypeRef
        };
    }
    get entitySchemaForEntityProperty() {
        return {
            _id: core_models_1.SysEntities.entityProperty,
            createdAt: new Date(),
            createdBy: this.rootUserRef,
            schema: null,
            entityType: this.entityTypeRef
        };
    }
    get idPropertyDefinition() {
        return {
            name: core_models_1.SysProperties._id,
            validation: {
                type: core_models_1.PropertyTypes.string,
                required: true
            }
        };
    }
    get labelPropertyDefinition() {
        return {
            name: core_models_1.SysProperties.label,
            validation: {
                type: core_models_1.PropertyTypes.string,
                required: false
            }
        };
    }
    get userNamePropertyDefinition() {
        return {
            name: core_models_1.SysProperties.name,
            validation: {
                type: core_models_1.PropertyTypes.string,
                required: true,
                max: 50,
                min: 2,
            }
        };
    }
    get namePropertyDefinition() {
        return {
            name: core_models_1.SysProperties.name,
            validation: {
                type: core_models_1.PropertyTypes.string,
                required: true,
                max: 50,
                min: 1,
                pattern: "^[A-Z][A-Za-z0-9]*$"
            }
        };
    }
    get entityPropertyNamePropertyDefinition() {
        return {
            name: core_models_1.SysProperties.name,
            validation: {
                type: core_models_1.PropertyTypes.string,
                required: true,
                max: 50,
                min: 1,
                pattern: "^[a-z_][A-Za-z0-9_]*$"
            }
        };
    }
    get keepUpToDatePropertyDefinition() {
        return {
            name: core_models_1.SysProperties.keepUpToDate,
            validation: {
                type: core_models_1.PropertyTypes.boolean,
                required: false
            }
        };
    }
    get validationPropertyDefinition() {
        return {
            name: core_models_1.SysProperties.validation,
            validation: {
                type: core_models_1.PropertyTypes.abstractEntity,
                required: true,
                ref: this.validationRef
            }
        };
    }
    get abstractPropertyDefinition() {
        return {
            name: core_models_1.SysProperties.abstract,
            validation: {
                type: core_models_1.PropertyTypes.boolean
            }
        };
    }
    get propsPropertyDefinition() {
        return {
            name: core_models_1.SysProperties.props,
            validation: {
                type: core_models_1.PropertyTypes.array,
                required: true,
                items: {
                    type: core_models_1.PropertyTypes.abstractEntity,
                    ref: this.entityPropertyRef
                }
            }
        };
    }
    get createdByPropertyDefinition() {
        return {
            name: core_models_1.SysProperties.createdBy,
            validation: {
                type: core_models_1.PropertyTypes.linkedEntity,
                required: true,
                ref: this.entityTypeUserRef,
                linkedProperties: [
                    {
                        name: core_models_1.SysProperties._id,
                        keepUpToDate: true
                    },
                    {
                        name: core_models_1.SysProperties.name,
                        keepUpToDate: true
                    }
                ]
            }
        };
    }
    get createdAtPropertyDefinition() {
        return {
            name: core_models_1.SysProperties.createdAt,
            validation: {
                type: core_models_1.PropertyTypes.dateTime,
                required: true
            }
        };
    }
    get changedByPropertyDefinition() {
        return {
            name: core_models_1.SysProperties.changedBy,
            validation: {
                type: core_models_1.PropertyTypes.linkedEntity,
                ref: this.entityTypeUserRef,
                linkedProperties: [
                    {
                        name: core_models_1.SysProperties._id,
                        label: core_models_1.SysProperties._id,
                        keepUpToDate: true
                    },
                    {
                        name: core_models_1.SysProperties.name,
                        label: core_models_1.SysProperties.name,
                        keepUpToDate: true
                    }
                ]
            }
        };
    }
    get changedAtPropertyDefinition() {
        return {
            name: core_models_1.SysProperties.changedAt,
            validation: {
                type: core_models_1.PropertyTypes.dateTime,
            }
        };
    }
    get entityTypePropertyDefinition() {
        return {
            name: core_models_1.SysProperties.entityType,
            validation: {
                type: core_models_1.PropertyTypes.linkedEntity,
                required: true,
                ref: this.entityTypeRef,
                linkedProperties: this.entityTypeRefLinkedProps
            }
        };
    }
    get schemaPropertyDefinition() {
        return {
            name: core_models_1.SysProperties.schema,
            validation: {
                type: core_models_1.PropertyTypes.string,
                required: true
            }
        };
    }
    get loginPropertyDefinition() {
        return {
            name: core_models_1.SysProperties.login,
            validation: {
                type: core_models_1.PropertyTypes.string
            }
        };
    }
    get typePropertyDefinition() {
        return {
            name: core_models_1.SysProperties.type,
            validation: {
                type: core_models_1.PropertyTypes.string,
                required: true
            }
        };
    }
    get requiredPropertyDefinition() {
        return {
            name: core_models_1.SysProperties.required,
            validation: {
                type: core_models_1.PropertyTypes.boolean
            }
        };
    }
    get minPropertyDefinition() {
        return {
            name: core_models_1.SysProperties.min,
            validation: {
                type: core_models_1.PropertyTypes.number,
            }
        };
    }
    get maxPropertyDefinition() {
        return {
            name: core_models_1.SysProperties.max,
            validation: {
                type: core_models_1.PropertyTypes.number,
            }
        };
    }
    get patternPropertyDefinition() {
        return {
            name: core_models_1.SysProperties.pattern,
            validation: {
                type: core_models_1.PropertyTypes.string,
            }
        };
    }
    get enumPropertyDefinition() {
        return {
            name: core_models_1.SysProperties.enum,
            validation: {
                type: core_models_1.PropertyTypes.array,
                items: {
                    type: core_models_1.PropertyTypes.string
                }
            }
        };
    }
    get refPropertyDefinition() {
        return {
            name: core_models_1.SysProperties.ref,
            validation: {
                type: core_models_1.PropertyTypes.linkedEntity,
                ref: this.entityTypeRef,
                linkedProperties: this.entityTypeRefLinkedProps
            }
        };
    }
    get linkedPropertiesPropertyDefinition() {
        return {
            name: core_models_1.SysProperties.linkedProperties,
            validation: {
                type: core_models_1.PropertyTypes.array,
                items: {
                    type: core_models_1.PropertyTypes.abstractEntity,
                    ref: this.linkedPropertyRef
                }
            }
        };
    }
    get itemsPropertyDefinition() {
        return {
            name: core_models_1.SysProperties.items,
            validation: {
                type: core_models_1.PropertyTypes.abstractEntity,
                ref: this.validationRef
            }
        };
    }
    get uniqueItemsPropertyDefinition() {
        return {
            name: core_models_1.SysProperties.uniqueItems,
            validation: {
                type: core_models_1.PropertyTypes.boolean,
                ref: this.validationRef
            }
        };
    }
    get multipleOfPropertyDefinition() {
        return {
            name: core_models_1.SysProperties.multipleOf,
            validation: {
                type: core_models_1.PropertyTypes.number,
            }
        };
    }
    get defaultPropertyDefinition() {
        return {
            name: core_models_1.SysProperties.default,
            validation: {
                type: core_models_1.PropertyTypes.string,
            }
        };
    }
    get conventionPropertyDefinition() {
        return {
            name: core_models_1.SysProperties.convention,
            validation: {
                type: core_models_1.PropertyTypes.string,
            }
        };
    }
    get rootUserRef() {
        return {
            _id: core_models_1.SysUsers.root,
            name: core_models_1.SysUsers.root
        };
    }
    get entityTypeRef() {
        return {
            _id: core_models_1.SysEntities.entityType,
            label: core_models_1.SysEntities.entityType,
            name: core_models_1.SysEntities.entityType
        };
    }
    get entityPropertyRef() {
        return {
            _id: core_models_1.SysEntities.entityProperty,
            label: core_models_1.SysEntities.entityProperty,
            name: core_models_1.SysEntities.entityProperty
        };
    }
    get validationRef() {
        return {
            _id: core_models_1.SysEntities.validation,
            label: core_models_1.SysEntities.validation,
            name: core_models_1.SysEntities.validation
        };
    }
    get linkedPropertyRef() {
        return {
            _id: core_models_1.SysEntities.linkedProperty,
            label: core_models_1.SysEntities.linkedProperty,
            name: core_models_1.SysEntities.linkedProperty
        };
    }
    get entityTypeUserRef() {
        return {
            _id: core_models_1.SysEntities.user,
            name: core_models_1.SysEntities.user,
            label: core_models_1.SysEntities.user
        };
    }
    get entityTypeRefLinkedProps() {
        return [
            {
                keepUpToDate: true,
                name: core_models_1.SysProperties._id
            },
            {
                keepUpToDate: true,
                name: core_models_1.SysProperties.name
            },
            {
                keepUpToDate: true,
                name: core_models_1.SysProperties.label
            }
        ];
    }
    get rootUser() {
        return {
            _id: core_models_1.SysUsers.root,
            name: core_models_1.SysUsers.root,
            login: core_models_1.SysUsers.root,
            createdAt: new Date(),
            createdBy: this.rootUserRef,
            pass: core_models_1.SysUsers.root
        };
    }
}
exports.BuiltInEntries = BuiltInEntries;
//# sourceMappingURL=built-in-entries.js.map