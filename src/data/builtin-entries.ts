import {
  IEntityType,
  SysEntities,
  IEntityProperty,
  SysProperties,
  PropertyTypes,
  SysUsers,
  IUser,
  Relationship,
  RelationKind,
} from "@poseidon/core-models";

export class BuiltInEntries {
  private constructor() {}

  public static build(): BuiltInEntries {
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

    const etTypePropsRelation: Relationship = {
      owner: entities.entityType,
      relation: "HasMany",
      related: entities.entityTypeEntityProperty,
      field: "props",
      _createdBy: entities.rootUser,
      _createdAt: new Date(),
      _state: "alive",
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
        _state: "alive",
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
  }

  public entityType: IEntityType = {
    _state: "alive",
    name: SysEntities.entityType,
    abstract: false,
    _createdAt: new Date(),
  };

  public entityTypeEntityProperty: IEntityType = {
    _state: "alive",
    name: SysEntities.entityProperty,
    abstract: true,
    _createdAt: new Date(),
  };

  public entityTypeEntitySchema: IEntityType = {
    _state: "alive",
    name: SysEntities.entitySchema,
    abstract: false,
    _createdAt: new Date(),
  };

  public entityTypeUser: IEntityType = {
    _state: "alive",
    name: SysEntities.user,
    abstract: false,
    _createdAt: new Date(),
  };

  public idProperty: IEntityProperty = {
    name: SysProperties._id,
    type: PropertyTypes.string,
    required: true,
  };

  public userNameProperty: IEntityProperty = {
    name: SysProperties.name,
    type: PropertyTypes.string,
    required: true,
    max: 50,
    min: 2,
  };

  public propsProperty: IEntityProperty = {
    name: SysProperties.props,
    type: PropertyTypes.relation,
    relatedEntityType: this.entityTypeEntityProperty,
    relation: RelationKind.hasMany
  };

  public nameProperty: IEntityProperty = {
    name: SysProperties.name,
    type: PropertyTypes.string,
    required: true,
    max: 50,
    min: 1,
    pattern: "^[A-Z][A-Za-z0-9]*$",
  };

  public entityPropertyNameProperty: IEntityProperty = {
    name: SysProperties.name,
    type: PropertyTypes.string,
    required: true,
    max: 50,
    min: 1,
    pattern: "^[a-z_][A-Za-z0-9_]*$",
  };

  public createdAtProperty: IEntityProperty = {
    name: SysProperties.createdAt,
    type: PropertyTypes.dateTime,
    required: true,
  };

  public changedAtProperty: IEntityProperty = {
    name: SysProperties.changedAt,
    type: PropertyTypes.dateTime,
  };

  public changedByProperty: IEntityProperty = {
    name: SysProperties.changedBy,
    type: PropertyTypes.relation,
    relatedEntityType: this.entityType,
    relation: RelationKind.belongsToOne,
  };

  public createdByProperty: IEntityProperty = {
    name: SysProperties.createdBy,
    type: PropertyTypes.relation,
    relatedEntityType: this.entityTypeUser,
    relation: RelationKind.belongsToOne,
  };

  public schemaProperty: IEntityProperty = {
    name: SysProperties.schema,
    type: PropertyTypes.string,
    required: true,
  };

  public loginProperty: IEntityProperty = {
    name: SysProperties.login,
    type: PropertyTypes.string,
    required: true,
  };

  public typeProperty: IEntityProperty = {
    name: SysProperties.type,
    type: PropertyTypes.string,
    required: true,
  };

  public requiredProperty: IEntityProperty = {
    name: SysProperties.required,
    type: PropertyTypes.boolean,
  };

  public minProperty: IEntityProperty = {
    name: SysProperties.min,
    type: PropertyTypes.number,
  };

  public maxProperty: IEntityProperty = {
    name: SysProperties.max,
    type: PropertyTypes.number,
  };

  public patternProperty: IEntityProperty = {
    name: SysProperties.pattern,
    type: PropertyTypes.string,
  };

  public enumProperty: IEntityProperty = {
    name: SysProperties.enum,
    type: PropertyTypes.array,
    items: PropertyTypes.string,
  };

  public itemsProperty: IEntityProperty = {
    name: SysProperties.items,
    type: PropertyTypes.string,
  };

  public uniqueItemsProperty: IEntityProperty = {
    name: SysProperties.uniqueItems,
    type: PropertyTypes.boolean,
  };

  public multipleOfProperty: IEntityProperty = {
    name: SysProperties.multipleOf,
    type: PropertyTypes.number,
  };

  public defaultProperty: IEntityProperty = {
    name: SysProperties.default,
    type: PropertyTypes.string,
  };

  public conventionProperty: IEntityProperty = {
    name: SysProperties.convention,
    type: PropertyTypes.string,
  };

  public rootUser: IUser = {
    _state: "alive",
    name: SysUsers.root,
    login: SysUsers.root,
    pass: SysUsers.root,
    _createdAt: new Date(),
  };
}
