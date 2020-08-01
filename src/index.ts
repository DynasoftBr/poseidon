import { BuiltInEntries } from "./data";
import { EntityType } from "@poseidon/core-models/src";
import { PostgresStorage } from "./data/storage/postgres/postgres-storage";
import { env } from "./env.config";
import { Cluster } from "couchbase";
import { v4 } from "uuid";

async function test() {
  var storage = await PostgresStorage.init(env.storage);



  console.time();
  for (let index = 0; index < 200000; index++) {
    await storage.insert();
  }
  console.timeEnd();
}
test().then(() => console.log("End"));

// Server.init();

// console.log("teste");
