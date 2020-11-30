import * as Server from "./server";
import { DataStorage } from "./data";
import { MongoDbStorage } from "./data/storage/mongodb/mongodb-storage";
import { env } from "./env.config";
import { Context } from "./data/context";
import { SysEntities, EntityType, IUser } from "@poseidon/core-models";

Server.init();

async function run() {
  const storage: DataStorage = await MongoDbStorage.init({ dbName: env.storage.db, url: env.storage.host }, null);
  const context = await Context.create("", "", storage);

  const et = (await context
    .query<EntityType>(SysEntities.entityType)
    .include("_createdBy")
    .filter((f) => f.where("name", "$eq", SysEntities.entityType))
    .first());

  // var newUser = context.newEntity<IUser>(SysEntities.user);
  // et._createdBy = newUser;
  et._createdBy.name = "teste3";

  storage.persist(context.observedEntities());
}

// run().then((r) => console.log("done"));
