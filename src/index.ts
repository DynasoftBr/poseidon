import * as Server from "./server";
import { Sequelize, UUIDV4 } from "sequelize";
import { BuiltInEntries } from "./data";
import { OrmModelGraphBuilder } from "./data/orm/orm-model-graph-builder";
import { IEntityProperty, PropertyTypes, SysEntities, IEntityType } from "@poseidon/core-models/src";

// Server.init();

async function test() {
  var builtinEntries = BuiltInEntries.build();
  const entityTypes = [builtinEntries.entityType, builtinEntries.entityTypeEntityProperty, builtinEntries.entityTypeUser];
  const sequelize = new Sequelize("poseidon", "postgres", "admin", {
    host: "localhost",
    dialect: "postgres"
  });
  await sequelize.authenticate();
  new OrmModelGraphBuilder(sequelize, entityTypes).build();

  await sequelize.sync({ force: true });

  var result = await sequelize.models.EntityType.create(builtinEntries.entityType);

  const prop: IEntityProperty = {
    name: "Teste",
    type: PropertyTypes.string,
    EntityType_props_Ref: (result as any)._id
  };
  await sequelize.models.EntityProperty.create(prop);

  var items = await sequelize.models.EntityType.findAll({
    where: {
      name: SysEntities.entityType
    },
    include: [
      {
        association: "props",
        required: false,
        where: {
          name: "Teste2"
        },
        include: [{ association: "entityType" }]
      }
    ]
  });

  console.log(JSON.stringify(items));
  console.log("All models were synchronized successfully.");
}

test().then(e => {
  console.log("connected");
});
