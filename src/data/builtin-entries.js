"use strict";
exports.__esModule = true;
exports.BuiltInEntries = void 0;
var core_models_1 = require("@poseidon/core-models");
var BuiltInEntries = /** @class */ (function () {
    function BuiltInEntries() {
        this.entityType = {
            _state: "alive",
            name: core_models_1.SysEntities.entityType,
            abstract: false,
            _createdAt: new Date()
        };
        this.entityTypeEntityProperty = {
            _state: "alive",
            name: core_models_1.SysEntities.entityProperty,
            abstract: true,
            _createdAt: new Date()
        };
        this.entityTypeEntitySchema = {
            _state: "alive",
            name: core_models_1.SysEntities.entitySchema,
            abstract: false,
            _createdAt: new Date()
        };
        this.entityTypeUser = {
            _state: "alive",
            name: core_models_1.SysEntities.user,
            abstract: false,
            _createdAt: new Date()
        };
        this.idProperty = {
            name: core_models_1.SysProperties._id,
            type: core_models_1.PropertyTypes.string,
            required: true
        };
        this.userNameProperty = {
            name: core_models_1.SysProperties.name,
            type: core_models_1.PropertyTypes.string,
            required: true,
            max: 50,
            min: 2
        };
        this.propsProperty = {
            name: core_models_1.SysProperties.props,
            type: core_models_1.PropertyTypes.relation,
            relatedEntityType: this.entityTypeEntityProperty,
            relation: core_models_1.RelationKind.hasMany
        };
        this.nameProperty = {
            name: core_models_1.SysProperties.name,
            type: core_models_1.PropertyTypes.string,
            required: true,
            max: 50,
            min: 1,
            pattern: "^[A-Z][A-Za-z0-9]*$"
        };
        this.entityPropertyNameProperty = {
            name: core_models_1.SysProperties.name,
            type: core_models_1.PropertyTypes.string,
            required: true,
            max: 50,
            min: 1,
            pattern: "^[a-z_][A-Za-z0-9_]*$"
        };
        this.createdAtProperty = {
            name: core_models_1.SysProperties.createdAt,
            type: core_models_1.PropertyTypes.dateTime,
            required: true
        };
        this.changedAtProperty = {
            name: core_models_1.SysProperties.changedAt,
            type: core_models_1.PropertyTypes.dateTime
        };
        this.changedByProperty = {
            name: core_models_1.SysProperties.changedBy,
            type: core_models_1.PropertyTypes.relation,
            relatedEntityType: this.entityType,
            relation: core_models_1.RelationKind.belongsToOne
        };
        this.createdByProperty = {
            name: core_models_1.SysProperties.createdBy,
            type: core_models_1.PropertyTypes.relation,
            relatedEntityType: this.entityTypeUser,
            relation: core_models_1.RelationKind.belongsToOne
        };
        this.schemaProperty = {
            name: core_models_1.SysProperties.schema,
            type: core_models_1.PropertyTypes.string,
            required: true
        };
        this.loginProperty = {
            name: core_models_1.SysProperties.login,
            type: core_models_1.PropertyTypes.string,
            required: true
        };
        this.typeProperty = {
            name: core_models_1.SysProperties.type,
            type: core_models_1.PropertyTypes.string,
            required: true
        };
        this.requiredProperty = {
            name: core_models_1.SysProperties.required,
            type: core_models_1.PropertyTypes.boolean
        };
        this.minProperty = {
            name: core_models_1.SysProperties.min,
            type: core_models_1.PropertyTypes.number
        };
        this.maxProperty = {
            name: core_models_1.SysProperties.max,
            type: core_models_1.PropertyTypes.number
        };
        this.patternProperty = {
            name: core_models_1.SysProperties.pattern,
            type: core_models_1.PropertyTypes.string
        };
        this.enumProperty = {
            name: core_models_1.SysProperties["enum"],
            type: core_models_1.PropertyTypes.array,
            items: core_models_1.PropertyTypes.string
        };
        this.itemsProperty = {
            name: core_models_1.SysProperties.items,
            type: core_models_1.PropertyTypes.string
        };
        this.uniqueItemsProperty = {
            name: core_models_1.SysProperties.uniqueItems,
            type: core_models_1.PropertyTypes.boolean
        };
        this.multipleOfProperty = {
            name: core_models_1.SysProperties.multipleOf,
            type: core_models_1.PropertyTypes.number
        };
        this.defaultProperty = {
            name: core_models_1.SysProperties["default"],
            type: core_models_1.PropertyTypes.string
        };
        this.conventionProperty = {
            name: core_models_1.SysProperties.convention,
            type: core_models_1.PropertyTypes.string
        };
        this.rootUser = {
            _state: "alive",
            name: core_models_1.SysUsers.root,
            login: core_models_1.SysUsers.root,
            pass: core_models_1.SysUsers.root,
            _createdAt: new Date()
        };
    }
    BuiltInEntries.build = function () {
        var entities = new BuiltInEntries();
        entities.entityType._createdBy = entities.rootUser;
        entities.entityType.props = [
            entities.idProperty,
            entities.propsProperty,
            entities.nameProperty,
            entities.createdAtProperty,
            entities.changedAtProperty,
            entities.createdByProperty,
            entities.changedByProperty,
        ];
        var etTypePropsRelation = {
            owner: entities.entityType,
            relation: "HasMany",
            related: entities.entityTypeEntityProperty,
            field: "props",
            _createdBy: entities.rootUser,
            _createdAt: new Date(),
            _state: "alive"
        };
        entities.entityType.relationships = [etTypePropsRelation];
        // Entity Type Property
        entities.entityTypeEntityProperty._createdBy = entities.rootUser;
        entities.entityTypeEntityProperty.props = [
            entities.idProperty,
            entities.entityPropertyNameProperty,
            entities.createdAtProperty,
            entities.changedAtProperty,
            entities.requiredProperty,
            entities.minProperty,
            entities.maxProperty,
            entities.patternProperty,
            entities.enumProperty,
            entities.itemsProperty,
            entities.uniqueItemsProperty,
            entities.multipleOfProperty,
            entities.defaultProperty,
            entities.conventionProperty,
        ];
        entities.entityTypeEntityProperty.relationships = [
            {
                owner: entities.entityTypeEntityProperty,
                relation: "BelongsTo",
                related: entities.entityType,
                parentRelation: etTypePropsRelation,
                field: "entityType",
                _createdBy: entities.rootUser,
                _createdAt: new Date(),
                _state: "alive"
            },
        ];
        // Entity Type Schema
        entities.entityTypeEntitySchema._createdBy = entities.rootUser;
        entities.entityTypeEntitySchema.props = [
            entities.idProperty,
            entities.schemaProperty,
            entities.createdAtProperty,
            entities.changedAtProperty,
        ];
        // Entity Type User
        entities.entityTypeUser._createdBy = entities.rootUser;
        entities.entityTypeUser.props = [
            entities.idProperty,
            entities.userNameProperty,
            entities.loginProperty,
            entities.createdAtProperty,
            entities.changedAtProperty,
        ];
        // Properties
        entities.idProperty._createdBy = entities.rootUser;
        entities.userNameProperty._createdBy = entities.rootUser;
        entities.nameProperty._createdBy = entities.rootUser;
        entities.entityPropertyNameProperty._createdBy = entities.rootUser;
        entities.createdAtProperty._createdBy = entities.rootUser;
        entities.changedAtProperty._createdBy = entities.rootUser;
        entities.loginProperty._createdBy = entities.rootUser;
        entities.typeProperty._createdBy = entities.rootUser;
        entities.requiredProperty._createdBy = entities.rootUser;
        entities.minProperty._createdBy = entities.rootUser;
        entities.maxProperty._createdBy = entities.rootUser;
        entities.patternProperty._createdBy = entities.rootUser;
        entities.enumProperty._createdBy = entities.rootUser;
        entities.itemsProperty._createdBy = entities.rootUser;
        entities.uniqueItemsProperty._createdBy = entities.rootUser;
        entities.multipleOfProperty._createdBy = entities.rootUser;
        entities.defaultProperty._createdBy = entities.rootUser;
        entities.conventionProperty._createdBy = entities.rootUser;
        // Root user
        entities.rootUser._createdBy = entities.rootUser;
        return entities;
    };
    return BuiltInEntries;
}());
exports.BuiltInEntries = BuiltInEntries;
