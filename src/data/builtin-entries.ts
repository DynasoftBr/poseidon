import {
  EntityType,
  SysEntities,
  EntityProperty,
  SysProperties,
  PropertyTypes,
  SysUsers,
  IUser,
  RelationKind,
  CommandOperations,
  EntityTypeCommands,
  EntityTypePipelineItems,
  Entity,
} from "@poseidon/core-models";
import { v4 as uuidv4 } from "uuid";

export class BuiltInEntries {
  private _entityType: EntityType;
  public get entityType(): EntityType {
    if (!this._entityType) {
      this._entityType = {
        ...this.createDefaultEntity,
        name: SysEntities.entityType,
        commands: [
          {
            name: EntityTypeCommands.create,
            _createdAt: new Date(),
            pipeline: [
              {
                code: "// ommitted",
                name: EntityTypePipelineItems.AddMandatoryPropeties,
              },
              {
                code: "// ommitted",
                name: EntityTypePipelineItems.ValidateMandatoryPropeties,
              },
              {
                code: "// ommitted",
                name: EntityTypePipelineItems.ApplyMigrations,
              },
            ],
          },
        ],
      };

      this._entityType.props = [...this.internalProperties(SysEntities.entityType), this.entityPropertyNameProperty, this.propsProperty];
    }
    return this._entityType;
  }

  private _entityTypeEntityProperty: EntityType;
  public get entityTypeEntityProperty(): EntityType {
    if (!this._entityTypeEntityProperty) {
      this._entityTypeEntityProperty = {
        ...this.createDefaultEntity,
        name: SysEntities.entityProperty,
      };
      this.entityTypeEntityProperty.props = [
        ...this.internalProperties(SysEntities.entityProperty),
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
        this.relatedEntityProperty,
      ];
    }

    return this._entityTypeEntityProperty;
  }

  public get entityTypeEntitySchema(): EntityType {
    return {
      ...this.createDefaultEntity,
      name: SysEntities.entitySchema,
      props: [...this.internalProperties(SysEntities.entitySchema), this.schemaProperty],
    };
  }

  private _entityTypeUser: EntityType;
  public get entityTypeUser(): EntityType {
    if (this._entityTypeUser == null) {
      this._entityTypeUser = {
        ...this.createDefaultEntity,
        name: SysEntities.user,
      };
      this._entityTypeUser.props = [...this.internalProperties(SysEntities.user), this.userNameProperty, this.loginProperty];
    }

    return this._entityTypeUser;
  }

  private _entityTypeRelation: EntityType;
  public get entityTypeRelation(): EntityType {
    if (this._entityTypeRelation == null) {
      this._entityTypeRelation = {
        ...this.createDefaultEntity,
        name: SysEntities.relation,
      };
      this._entityTypeRelation.props = [...this.internalProperties(SysEntities.user), this.relationId, this.this, this.that];
    }

    return this._entityTypeRelation;
  }

  private _idProperty: EntityProperty;
  public get idProperty(): EntityProperty {
    if (this._idProperty == null)
      this._idProperty = {
        ...this.createDefaultEntity,
        name: SysProperties._id,
        type: PropertyTypes.string,
        required: true,
      };

    this._idProperty._id = uuidv4();
    return this._idProperty;
  }

  private _userNameProperty: EntityProperty;
  public get userNameProperty(): EntityProperty {
    if (!this._userNameProperty) {
      this._userNameProperty = {
        ...this.createDefaultEntity,
        name: SysProperties.name,
        type: PropertyTypes.string,
        required: true,
        max: 100,
        min: 2,
      };
    }

    this._userNameProperty._id = uuidv4();
    return this._userNameProperty;
  }

  private _propsProperty: EntityProperty;
  public get propsProperty(): EntityProperty {
    if (!this._propsProperty) {
      this._propsProperty = {
        ...this.createDefaultEntity,
        name: SysProperties.props,
        type: PropertyTypes.relation,
        relatedEntityType: this.entityTypeEntityProperty,
        kind: RelationKind.hasMany,
        _primary: true,
      };
    }

    this._propsProperty._id = uuidv4();
    return this._propsProperty;
  }

  private _propNameProperty: EntityProperty;
  public get propNameProperty(): EntityProperty {
    if (!this._propsProperty) {
      this._propNameProperty = {
        ...this.createDefaultEntity,
        name: SysProperties.name,
        type: PropertyTypes.string,
        required: true,
        max: 40,
        min: 1,
        pattern: "^[A-Z][A-Za-z0-9]*$",
      };
    }

    this._propNameProperty._id = uuidv4();
    return this._propNameProperty;
  }

  private _entityPropertyNameProperty: EntityProperty;
  public get entityPropertyNameProperty(): EntityProperty {
    if (!this._entityPropertyNameProperty) {
      this._entityPropertyNameProperty = {
        ...this.createDefaultEntity,
        name: SysProperties.name,
        type: PropertyTypes.string,
        required: true,
        max: 40,
        min: 1,
        pattern: "^[a-z_][A-Za-z0-9_]*$",
      };
    }

    this._entityPropertyNameProperty._id = uuidv4();
    return this._entityPropertyNameProperty;
  }

  private _createdAtProperty: EntityProperty;
  public get createdAtProperty(): EntityProperty {
    if (!this._createdAtProperty) {
      this._createdAtProperty = {
        ...this.createDefaultEntity,
        name: SysProperties.createdAt,
        type: PropertyTypes.dateTime,
        required: true,
      };
    }

    this._createdAtProperty._id = uuidv4();
    return this._createdAtProperty;
  }

  private _changedAtProperty: EntityProperty;
  public get changedAtProperty(): EntityProperty {
    if (!this._changedAtProperty) {
      this._changedAtProperty = {
        ...this.createDefaultEntity,
        name: SysProperties.changedAt,
        type: PropertyTypes.dateTime,
      };
    }

    this._changedAtProperty._id = uuidv4();
    return this._changedAtProperty;
  }

  private _changedByProperty: EntityProperty;
  public get changedByProperty(): EntityProperty {
    if (!this._changedByProperty) {
      this._changedByProperty = {
        ...this.createDefaultEntity,
        name: SysProperties.changedBy,
        type: PropertyTypes.relation,
        kind: RelationKind.belongsToOne,
        _relationTable: "",
      };
    }

    this._changedByProperty._id = uuidv4();
    return this._changedByProperty;
  }

  private _createdByProperty: EntityProperty;
  public get createdByProperty(): EntityProperty {
    if (!this._createdByProperty) {
      this._createdByProperty = {
        ...this.createDefaultEntity,
        name: SysProperties.createdBy,
        type: PropertyTypes.relation,
        kind: RelationKind.belongsToOne,
        _relationTable: "",
      };
    }

    this._createdByProperty._id = uuidv4();
    return this._createdByProperty;
  }

  private _schemaProperty: EntityProperty;
  public get schemaProperty(): EntityProperty {
    if (!this._schemaProperty) {
      this._schemaProperty = {
        ...this.createDefaultEntity,
        name: SysProperties.schema,
        type: PropertyTypes.string,
        required: true,
      };
    }

    this._schemaProperty._id = uuidv4();
    return this._schemaProperty;
  }

  private _loginProperty: EntityProperty;
  public get loginProperty(): EntityProperty {
    if (!this._loginProperty) {
      this._loginProperty = {
        ...this.createDefaultEntity,
        name: SysProperties.login,
        type: PropertyTypes.string,
        required: true,
      };
    }

    this._loginProperty._id = uuidv4();
    return this._loginProperty;
  }

  private _typeProperty: EntityProperty;
  public get typeProperty(): EntityProperty {
    if (!this._typeProperty) {
      this._typeProperty = {
        ...this.createDefaultEntity,
        name: SysProperties.type,
        type: PropertyTypes.string,
        required: true,
      };
    }

    this._typeProperty._id = uuidv4();
    return this._typeProperty;
  }

  private _requiredProperty: EntityProperty;
  public get requiredProperty(): EntityProperty {
    if (!this._requiredProperty) {
      this._requiredProperty = {
        ...this.createDefaultEntity,
        name: SysProperties.required,
        type: PropertyTypes.boolean,
      };
    }

    this._requiredProperty._id = uuidv4();
    return this._requiredProperty;
  }

  private _minProperty: EntityProperty;
  public get minProperty(): EntityProperty {
    if (!this._minProperty) {
      this._minProperty = {
        ...this.createDefaultEntity,
        name: SysProperties.min,
        type: PropertyTypes.number,
      };
    }

    this._minProperty._id = uuidv4();
    return this._minProperty;
  }

  private _maxProperty: EntityProperty;
  public get maxProperty(): EntityProperty {
    if (!this._maxProperty) {
      this._maxProperty = {
        ...this.createDefaultEntity,
        name: SysProperties.max,
        type: PropertyTypes.number,
      };
    }

    this._maxProperty._id = uuidv4();
    return this._maxProperty;
  }

  private _patternProperty: EntityProperty;
  public get patternProperty(): EntityProperty {
    if (!this._patternProperty) {
      this._patternProperty = {
        ...this.createDefaultEntity,
        name: SysProperties.pattern,
        type: PropertyTypes.string,
      };
    }

    this._patternProperty._id = uuidv4();
    return this._patternProperty;
  }

  private _enumProperty: EntityProperty;
  public get enumProperty(): EntityProperty {
    if (!this._enumProperty) {
      this._enumProperty = {
        ...this.createDefaultEntity,
        name: SysProperties.enum,
        type: PropertyTypes.array,
        items: PropertyTypes.string,
      };
    }

    this._enumProperty._id = uuidv4();
    return this._enumProperty;
  }

  private _itemsProperty: EntityProperty;
  public get itemsProperty(): EntityProperty {
    if (!this._itemsProperty) {
      this._itemsProperty = {
        ...this.createDefaultEntity,
        name: SysProperties.items,
        type: PropertyTypes.string,
      };
    }

    this._itemsProperty._id = uuidv4();
    return this._itemsProperty;
  }

  private _uniqueItemsProperty: EntityProperty;
  public get uniqueItemsProperty(): EntityProperty {
    if (!this._uniqueItemsProperty) {
      this._uniqueItemsProperty = {
        ...this.createDefaultEntity,
        name: SysProperties.uniqueItems,
        type: PropertyTypes.boolean,
      };
    }

    this._uniqueItemsProperty._id = uuidv4();
    return this._uniqueItemsProperty;
  }

  private _multipleOfProperty: EntityProperty;
  public get multipleOfProperty(): EntityProperty {
    if (!this._multipleOfProperty) {
      this._multipleOfProperty = {
        ...this.createDefaultEntity,
        name: SysProperties.multipleOf,
        type: PropertyTypes.number,
      };
    }

    this._multipleOfProperty._id = uuidv4();
    return this._multipleOfProperty;
  }

  private _defaultProperty: EntityProperty;
  public get defaultProperty(): EntityProperty {
    if (!this._defaultProperty) {
      this._defaultProperty = {
        ...this.createDefaultEntity,
        name: SysProperties.default,
        type: PropertyTypes.string,
      };
    }

    this._defaultProperty._id = uuidv4();
    return this._defaultProperty;
  }

  private _conventionProperty: EntityProperty;
  public get conventionProperty(): EntityProperty {
    if (!this._conventionProperty) {
      this._conventionProperty = {
        ...this.createDefaultEntity,
        name: SysProperties.convention,
        type: PropertyTypes.string,
      };
    }

    this._conventionProperty._id = uuidv4();
    return this._conventionProperty;
  }

  private _relatedEntityProperty: EntityProperty;
  public get relatedEntityProperty(): EntityProperty {
    if (!this._relatedEntityProperty) {
      this._relatedEntityProperty = {
        ...this.createDefaultEntity,
        name: SysProperties.relatedEntityType,
        type: PropertyTypes.relation,
      };

      this._relatedEntityProperty.relatedEntityType = this.entityType;
    }

    this._relatedEntityProperty._id = uuidv4();
    return this._relatedEntityProperty;
  }

  private _relationId: EntityProperty;
  public get relationId(): EntityProperty {
    if (this._relationId == null)
      this._relationId = {
        ...this.createDefaultEntity,
        name: SysProperties.relationId,
        type: PropertyTypes.string,
        required: true,
      };

    this._relationId._id = uuidv4();
    return this._relationId;
  }

  private _this: EntityProperty;
  public get this(): EntityProperty {
    if (this._this == null)
      this._this = {
        ...this.createDefaultEntity,
        name: SysProperties.this,
        type: PropertyTypes.string,
        required: true,
      };

    this._this._id = uuidv4();
    return this._this;
  }

  private _that: EntityProperty;
  public get that(): EntityProperty {
    if (this._that == null)
      this._that = {
        ...this.createDefaultEntity,
        name: SysProperties.that,
        type: PropertyTypes.string,
        required: true,
      };

    this._that._id = uuidv4();
    return this._that;
  }

  private _rootUser: IUser;
  public get rootUser(): IUser {
    if (!this._rootUser) {
      this._rootUser = {
        _id: uuidv4(),
        _createdAt: new Date(),
        name: SysUsers.root,
        login: SysUsers.root,
        pass: SysUsers.root,
      } as IUser;

      this._rootUser._createdBy = this._rootUser;
    }

    return this._rootUser;
  }

  private internalProperties(name: string): EntityProperty[] {
    const createdBy = { ...this.createdByProperty };
    const changedBy = { ...this.changedByProperty };
    const id = { ...this.idProperty };
    const createdAt = { ...this.createdAtProperty };
    const changedAt = { ...this.changedAtProperty };

    createdBy._id = uuidv4();
    createdBy.relatedEntityType = this.entityTypeUser;
    createdBy._relationTable = `${name}_${RelationKind.belongsToOne}_${SysEntities.user}_As_${SysProperties.createdBy}`;

    changedBy._id = uuidv4();
    changedBy.relatedEntityType = this.entityTypeUser;
    changedBy._relationTable = `${name}_${RelationKind.belongsToOne}_${SysEntities.user}_As_${SysProperties.changedBy}`;

    id._id = uuidv4();
    createdAt._id = uuidv4();
    changedAt._id = uuidv4();

    return [id, createdAt, createdBy, changedAt, changedBy];
  }

  private get createDefaultEntity(): Entity {
    return {
      _createdAt: new Date(),
      _createdBy: this.rootUser,
      _id: uuidv4(),
    };
  }
}
