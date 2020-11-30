import {
  EntityType,
  SysEntities,
  EntityProperty,
  SysProperties,
  PropertyTypes,
  SysUsers,
  IUser,
  RelationKind,
  Entity,
  SysDatabases,
} from "@poseidon/core-models";

class BuiltInEntries {
  public entityTypes = [this.entityType, this.entityTypeEntityProperty, this.entityTypeUser, this.entityTypeRelationLink];

  private _entityType: EntityType;
  public get entityType(): EntityType {
    if (!this._entityType) {
      this._entityType = {
        _id: "5f304db8c7678bea21ea1f84",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysEntities.entityType,
        database: SysDatabases.poseidon,
      };

      const idProp = { ...this.idProperty, _id: "5f304ae9c7678bea21ea1f6a" };
      const createdAtProp = { ...this.createdAtProperty, _id: "5f304b07c7678bea21ea1f6b" };
      const createdByProp = { ...this.createdByProperty, _id: "5f304b1ac7678bea21ea1f6c" };
      const changedAtProp = { ...this.changedAtProperty, _id: "5f304b34c7678bea21ea1f6d" };
      const changedByProp = { ...this.changedByProperty, _id: "5f304b44c7678bea21ea1f6e" };

      this._entityType.props = [
        idProp,
        createdAtProp,
        changedAtProp,
        createdByProp,
        changedByProp,
        this.entityPropertyNameProperty,
        this.propsProperty,
      ];
    }
    return this._entityType;
  }

  private _entityTypeEntityProperty: EntityType;
  public get entityTypeEntityProperty(): EntityType {
    if (!this._entityTypeEntityProperty) {
      this._entityTypeEntityProperty = {
        _id: "5f304de9c7678bea21ea1f85",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysEntities.entityProperty,
        database: SysDatabases.poseidon,
      };

      const idProp = { ...this.idProperty, _id: "5f304ba8c7678bea21ea1f6f" };
      const createdAtProp = { ...this.createdAtProperty, _id: "5f304bafc7678bea21ea1f70" };
      const createdByProp = { ...this.createdByProperty, _id: "5f304bb6c7678bea21ea1f71" };
      const changedAtProp = { ...this.changedAtProperty, _id: "5f304bbcc7678bea21ea1f72" };
      const changedByProp = { ...this.changedByProperty, _id: "5f304bc1c7678bea21ea1f73" };

      this.entityTypeEntityProperty.props = [
        idProp,
        createdAtProp,
        changedAtProp,
        createdByProp,
        changedByProp,
        this.propNameProperty,
        this.typeProperty,
        this.requiredProperty,
        this.minProperty,
        this.maxProperty,
        this.patternProperty,
        this.enumProperty,
        this.multipleOfProperty,
        this.defaultProperty,
        this.conventionProperty,
        this.relatedEntityTypeProperty,
        this.kindProperty,
      ];
    }

    return this._entityTypeEntityProperty;
  }

  private _entityTypeEntitySchema: EntityType;
  public get entityTypeEntitySchema(): EntityType {
    if (!this._entityTypeEntitySchema) {
      this._entityTypeEntitySchema = {
        _id: "5f304e71c7678bea21ea1f86",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysEntities.entitySchema,
        database: SysDatabases.poseidon,
      };

      const idProp = { ...this.idProperty, _id: "5f304c54c7678bea21ea1f74" };
      const createdAtProp = { ...this.createdAtProperty, _id: "5f304c5ac7678bea21ea1f75" };
      const createdByProp = { ...this.createdByProperty, _id: "5f304c5ec7678bea21ea1f76" };
      const changedAtProp = { ...this.changedAtProperty, _id: "5f304c63c7678bea21ea1f77" };
      const changedByProp = { ...this.changedByProperty, _id: "5f304c68c7678bea21ea1f78" };

      this.entityTypeEntitySchema.props = [idProp, createdAtProp, changedAtProp, createdByProp, changedByProp, this.schemaProperty];
    }

    return this._entityTypeEntitySchema;
  }

  private _entityTypeUser: EntityType;
  public get entityTypeUser(): EntityType {
    if (this._entityTypeUser == null) {
      this._entityTypeUser = {
        _id: "5f304ea0c7678bea21ea1f87",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        database: SysDatabases.poseidon,
        name: SysEntities.user,
      };

      const idProp = { ...this.idProperty, _id: "5f304cb3c7678bea21ea1f79" };
      const createdAtProp = { ...this.createdAtProperty, _id: "5f304cbbc7678bea21ea1f7a" };
      const createdByProp = { ...this.createdByProperty, _id: "5f304cc0c7678bea21ea1f7b" };
      const changedAtProp = { ...this.changedAtProperty, _id: "5f304cc6c7678bea21ea1f7c" };
      const changedByProp = { ...this.changedByProperty, _id: "5f304ccdc7678bea21ea1f7d" };

      this._entityTypeUser.props = [
        idProp,
        createdAtProp,
        changedAtProp,
        createdByProp,
        changedByProp,
        this.userNameProperty,
        this.loginProperty,
      ];
    }

    return this._entityTypeUser;
  }

  private _entityTypeRelationLink: EntityType;
  public get entityTypeRelationLink(): EntityType {
    if (this._entityTypeRelationLink == null) {
      this._entityTypeRelationLink = {
        _id: "5f304ea9c7678bea21ea1f88",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        database: SysDatabases.poseidon,
        name: SysEntities.relationLink,
      };

      const idProp = { ...this.idProperty, _id: "5f304d17c7678bea21ea1f7e" };
      const createdAtProp = { ...this.createdAtProperty, _id: "5f304d1dc7678bea21ea1f7f" };
      const createdByProp = { ...this.createdByProperty, _id: "5f304d22c7678bea21ea1f80" };
      const changedAtProp = { ...this.changedAtProperty, _id: "5f304d26c7678bea21ea1f81" };
      const changedByProp = { ...this.changedByProperty, _id: "5f304d2bc7678bea21ea1f82" };

      this._entityTypeRelationLink.props = [
        idProp,
        createdAtProp,
        changedAtProp,
        createdByProp,
        changedByProp,
        this.relationPropId,
        this.thisId,
        this.thatId,
      ];
    }

    return this._entityTypeRelationLink;
  }

  private _idProperty: EntityProperty;
  public get idProperty(): EntityProperty {
    if (this._idProperty == null)
      this._idProperty = {
        _id: "5f304eb0c7678bea21ea1f89",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties._id,
        type: PropertyTypes.string,
        required: true,
      };

    return this._idProperty;
  }

  private _userNameProperty: EntityProperty;
  public get userNameProperty(): EntityProperty {
    if (!this._userNameProperty) {
      this._userNameProperty = {
        _id: "5f304eb7c7678bea21ea1f8a",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.name,
        type: PropertyTypes.string,
        required: true,
        max: 100,
        min: 2,
      };
    }

    return this._userNameProperty;
  }

  private _propsProperty: EntityProperty;
  public get propsProperty(): EntityProperty {
    if (!this._propsProperty) {
      this._propsProperty = {
        _id: "5f304ebdc7678bea21ea1f8b",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.props,
        type: PropertyTypes.relation,
        relatedEntityType: this.entityTypeEntityProperty,
        relationKind: RelationKind.hasMany
      };
    }

    return this._propsProperty;
  }

  private _propNameProperty: EntityProperty;
  public get propNameProperty(): EntityProperty {
    if (!this._propsProperty) {
      this._propNameProperty = {
        _id: "5f304ec5c7678bea21ea1f8c",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.name,
        type: PropertyTypes.string,
        required: true,
        max: 40,
        min: 1,
        pattern: "^[A-Z][A-Za-z0-9]*$",
      };
    }

    return this._propNameProperty;
  }

  private _entityPropertyNameProperty: EntityProperty;
  public get entityPropertyNameProperty(): EntityProperty {
    if (!this._entityPropertyNameProperty) {
      this._entityPropertyNameProperty = {
        _id: "5f304ec8c7678bea21ea1f8d",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.name,
        type: PropertyTypes.string,
        required: true,
        max: 40,
        min: 1,
        pattern: "^[a-z_][A-Za-z0-9_]*$",
      };
    }

    return this._entityPropertyNameProperty;
  }

  private _createdAtProperty: EntityProperty;
  public get createdAtProperty(): EntityProperty {
    if (!this._createdAtProperty) {
      this._createdAtProperty = {
        _id: "5f304ecec7678bea21ea1f8e",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.createdAt,
        type: PropertyTypes.dateTime,
        required: true,
      };
    }

    return this._createdAtProperty;
  }

  private _changedAtProperty: EntityProperty;
  public get changedAtProperty(): EntityProperty {
    if (!this._changedAtProperty) {
      this._changedAtProperty = {
        _id: "5f304ed3c7678bea21ea1f8f",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.changedAt,
        type: PropertyTypes.dateTime,
      };
    }

    return this._changedAtProperty;
  }

  private _changedByProperty: EntityProperty;
  public get changedByProperty(): EntityProperty {
    if (!this._changedByProperty) {
      this._changedByProperty = {
        _id: "5f304ed7c7678bea21ea1f90",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.changedBy,
        type: PropertyTypes.relation,
        relationKind: RelationKind.belongsToOne,
        relatedEntityType: this.entityTypeUser
      };
    }

    return this._changedByProperty;
  }

  private _createdByProperty: EntityProperty;
  public get createdByProperty(): EntityProperty {
    if (!this._createdByProperty) {
      this._createdByProperty = {
        _id: "5f304edcc7678bea21ea1f91",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.createdBy,
        type: PropertyTypes.relation,
        relationKind: RelationKind.belongsToOne,
        relatedEntityType: this.entityTypeUser
      };
    }

    return this._createdByProperty;
  }

  private _schemaProperty: EntityProperty;
  public get schemaProperty(): EntityProperty {
    if (!this._schemaProperty) {
      this._schemaProperty = {
        _id: "5f304ee1c7678bea21ea1f92",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.schema,
        type: PropertyTypes.string,
        required: true,
      };
    }

    return this._schemaProperty;
  }

  private _loginProperty: EntityProperty;
  public get loginProperty(): EntityProperty {
    if (!this._loginProperty) {
      this._loginProperty = {
        _id: "5f304efcc7678bea21ea1f93",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.login,
        type: PropertyTypes.string,
        required: true,
      };
    }

    return this._loginProperty;
  }

  private _typeProperty: EntityProperty;
  public get typeProperty(): EntityProperty {
    if (!this._typeProperty) {
      this._typeProperty = {
        _id: "5f304f02c7678bea21ea1f94",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.type,
        type: PropertyTypes.string,
        required: true,
      };
    }

    return this._typeProperty;
  }

  private _requiredProperty: EntityProperty;
  public get requiredProperty(): EntityProperty {
    if (!this._requiredProperty) {
      this._requiredProperty = {
        _id: "5f304f08c7678bea21ea1f95",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.required,
        type: PropertyTypes.boolean,
      };
    }

    return this._requiredProperty;
  }

  private _minProperty: EntityProperty;
  public get minProperty(): EntityProperty {
    if (!this._minProperty) {
      this._minProperty = {
        _id: "5f304f0cc7678bea21ea1f96",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.min,
        type: PropertyTypes.number,
      };
    }

    return this._minProperty;
  }

  private _maxProperty: EntityProperty;
  public get maxProperty(): EntityProperty {
    if (!this._maxProperty) {
      this._maxProperty = {
        _id: "5f304f10c7678bea21ea1f97",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.max,
        type: PropertyTypes.number,
      };
    }

    return this._maxProperty;
  }

  private _patternProperty: EntityProperty;
  public get patternProperty(): EntityProperty {
    if (!this._patternProperty) {
      this._patternProperty = {
        _id: "5f304f15c7678bea21ea1f98",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.pattern,
        type: PropertyTypes.string,
      };
    }

    return this._patternProperty;
  }

  private _enumProperty: EntityProperty;
  public get enumProperty(): EntityProperty {
    if (!this._enumProperty) {
      this._enumProperty = {
        _id: "5f304f1ec7678bea21ea1f99",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.enum,
        type: PropertyTypes.array,
        items: PropertyTypes.string,
      };
    }

    return this._enumProperty;
  }

  private _itemsProperty: EntityProperty;
  public get itemsProperty(): EntityProperty {
    if (!this._itemsProperty) {
      this._itemsProperty = {
        _id: "5f304f25c7678bea21ea1f9a",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.items,
        type: PropertyTypes.string,
      };
    }

    return this._itemsProperty;
  }

  private _uniqueItemsProperty: EntityProperty;
  public get uniqueItemsProperty(): EntityProperty {
    if (!this._uniqueItemsProperty) {
      this._uniqueItemsProperty = {
        _id: "5f304f29c7678bea21ea1f9b",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.uniqueItems,
        type: PropertyTypes.boolean,
      };
    }

    return this._uniqueItemsProperty;
  }

  private _multipleOfProperty: EntityProperty;
  public get multipleOfProperty(): EntityProperty {
    if (!this._multipleOfProperty) {
      this._multipleOfProperty = {
        _id: "5f304f2ec7678bea21ea1f9c",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.multipleOf,
        type: PropertyTypes.number,
      };
    }

    return this._multipleOfProperty;
  }

  private _defaultProperty: EntityProperty;
  public get defaultProperty(): EntityProperty {
    if (!this._defaultProperty) {
      this._defaultProperty = {
        _id: "5f304f32c7678bea21ea1f9d",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.default,
        type: PropertyTypes.string,
      };
    }

    return this._defaultProperty;
  }

  private _conventionProperty: EntityProperty;
  public get conventionProperty(): EntityProperty {
    if (!this._conventionProperty) {
      this._conventionProperty = {
        _id: "5f304f37c7678bea21ea1f9e",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.convention,
        type: PropertyTypes.string,
      };
    }

    return this._conventionProperty;
  }

  private _relatedEntityTypeProperty: EntityProperty;
  public get relatedEntityTypeProperty(): EntityProperty {
    if (!this._relatedEntityTypeProperty) {
      this._relatedEntityTypeProperty = {
        _id: "5f304f4cc7678bea21ea1f9f",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.relatedEntityType,
        type: PropertyTypes.relation,
        relatedEntityType: this._entityType,
        relationKind: RelationKind.hasOne,
      };

      this._relatedEntityTypeProperty.relatedEntityType = this.entityType;
    }

    return this._relatedEntityTypeProperty;
  }

  private _kindProperty: EntityProperty;
  public get kindProperty(): EntityProperty {
    if (!this._kindProperty) {
      this._kindProperty = {
        _id: "5f304f54c7678bea21ea1fa0",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.relationKind,
        type: PropertyTypes.string,
      };
    }

    return this._kindProperty;
  }

  private _relationPropId: EntityProperty;
  public get relationPropId(): EntityProperty {
    if (this._relationPropId == null)
      this._relationPropId = {
        _id: "5f304f59c7678bea21ea1fa1",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.relationPropId,
        type: PropertyTypes.string,
        required: true,
      };

    return this._relationPropId;
  }

  private _thisId: EntityProperty;
  public get thisId(): EntityProperty {
    if (this._thisId == null)
      this._thisId = {
        _id: "5f304f6ec7678bea21ea1fa3",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.thisId,
        type: PropertyTypes.string,
        required: true,
      };

    return this._thisId;
  }

  private _thatId: EntityProperty;
  public get thatId(): EntityProperty {
    if (this._thatId == null)
      this._thatId = {
        _id: "5f304f60c7678bea21ea1fa2",
        _createdAt: new Date(),
        _createdBy: this.rootUser,
        name: SysProperties.thatId,
        type: PropertyTypes.string,
        required: true,
      };

    return this._thatId;
  }

  private _rootUser: IUser;
  public get rootUser(): IUser {
    if (!this._rootUser) {
      this._rootUser = {
        _id: "5f304dabc7678bea21ea1f83",
        _createdAt: new Date(),
        name: SysUsers.root,
        login: SysUsers.root,
        pass: SysUsers.root,
      } as IUser;

      this._rootUser._createdBy = this._rootUser;
    }

    return this._rootUser;
  }
}

export const builtInEntries = new BuiltInEntries();
