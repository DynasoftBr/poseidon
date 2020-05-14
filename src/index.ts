import { BuiltInEntries } from "./data";
import { EntityType } from "@poseidon/core-models/src";
import { PostgresStorage } from "./data/storage/postgres/postgres-storage";
import { env } from "./env.config";
import { Cluster } from "couchbase";
import { v4 } from "uuid";

async function test() {
  var storage = await PostgresStorage.init(env.storage);

  // storage
  //   .query<EntityType>(new BuiltInEntries().entityType.name)
  //   .filter((q) => q.where("name", "$eq", "EntityType"))
  //   .include("props")
  //   .toArray()
  //   .then((r) => {
  //     console.log(JSON.stringify(r, null, 4));
  //   });
}
test().then(() => console.log("End"));

// Server.init();

// console.log("teste");



