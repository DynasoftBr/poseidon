import { PropertyTypes, IEntityProperty, SysProperties, IEntity, IEntityType } from "@poseidon/core-models/src";
import {
  DataTypes,
  ModelAttributeColumnOptions,
  ModelAttributes,
  Sequelize,
  Model,
  ModelCtor,
  AssociationOptions,
  AbstractDataTypeConstructor,
  UUIDV4
} from "sequelize";
import { Relationship } from "@poseidon/core-models/src/relationship";

export class OrmModelGraphBuilder {
  constructor(private readonly sequelize: Sequelize, private readonly entityTypes: IEntityType[]) {}

  public build() {
    for (const entityType of this.entityTypes) {
      if (this.sequelize.models[entityType.name] == null) {
        this.buildForEntityType(entityType);
      }
    }
  }

  public buildForEntityType(entityType: IEntityType) {
    const modelAttr: ModelAttributes = {};

    for (const prop of entityType.props) {
      let sequelizeType = this.typeMapping.get(prop.type);
      if (sequelizeType == null) continue;
      modelAttr[prop.name] = this.buildModelAttr(prop);
    }

    const model = this.sequelize.define(entityType.name, modelAttr, {
      freezeTableName: true,
      createdAt: SysProperties.createdAt,
      updatedAt: SysProperties.changedAt
    }) as ModelCtor<Model>;

    console.log(entityType.name, entityType.relationships);
    if (entityType.relationships) {
      for (const relationship of entityType.relationships) {
        this.addAssociation(model, relationship);
      }
    }
    return model;
  }

  private typeMapping = new Map<PropertyTypes, DataTypes.DataType>([
    [PropertyTypes.string, DataTypes.STRING],
    [PropertyTypes.int, DataTypes.INTEGER],
    [PropertyTypes.number, DataTypes.DECIMAL],
    [PropertyTypes.boolean, DataTypes.BOOLEAN],
    [PropertyTypes.dateTime, DataTypes.DATE],
    [PropertyTypes.date, DataTypes.DATEONLY],
    [PropertyTypes.array, DataTypes.ARRAY]
  ]);
  private buildModelAttr(prop: IEntityProperty): ModelAttributeColumnOptions {
    let sequelizeType = this.typeMapping.get(prop.type);
    if (sequelizeType == null) return undefined;
    switch (prop.type) {
      case PropertyTypes.string:
        sequelizeType = (sequelizeType as DataTypes.StringDataTypeConstructor)(prop.max);
        break;
      case PropertyTypes.number:
        sequelizeType = (sequelizeType as DataTypes.DecimalDataTypeConstructor)(5);
        break;
      case PropertyTypes.array:
        sequelizeType = (sequelizeType as DataTypes.ArrayDataTypeConstructor)(
          this.typeMapping.get(prop.items) as AbstractDataTypeConstructor
        );
        break;
    }
    const attrs: ModelAttributeColumnOptions = {
      type: sequelizeType
    };
    if (prop.name === SysProperties._id) {
      attrs.primaryKey = true;
      attrs.type = DataTypes.UUID;
      attrs.defaultValue = UUIDV4;
    }

    return attrs;
  }

  private addAssociation(model: ModelCtor<Model>, relationship: Relationship) {
    let relatedModel = this.sequelize.models[relationship.related.name] || this.buildForEntityType(relationship.related);

    const options: AssociationOptions = {
      as: relationship.field,
      foreignKey: !relationship.parentRelation
        ? `${relationship.owner.name}_${relationship.field}_Ref`
        : `${relationship.parentRelation.owner.name}_${relationship.parentRelation.field}_Ref`
    };

    if (relationship.relation === "BelongsTo") {
      model.belongsTo(relatedModel, options);
    } else if (relationship.relation === "HasMany") {
      console.log(model.tableName, relatedModel.tableName, options);
      model.hasMany(relatedModel, options);
    }
  }
}
