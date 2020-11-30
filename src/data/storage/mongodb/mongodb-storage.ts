import { DataStorage } from "../data-storage";
import { Queryable } from "../../../query-builder/queryable";
import { Entity, EntityType, SysDatabases, SysEntities, RelationLink, SimpleTypes } from "@poseidon/core-models";
import { MongoQueryBuilder } from "./mongo-query-builder";
import { MongoDbStorageConnectionOptions } from "./mongodb-connection-options";
import { MongoClient, Db, Collection, UnorderedBulkOperation, ObjectId } from "mongodb";
import { Paginated } from "@poseidon/core-models";
import { Mutation } from "../../mutation/mutation";
import { CacheLayer } from "../../cache/cache-layer";
import { Query } from "../../../query-builder/interfaces/query";
import { MongoDbDatabaseFeed } from "./mongodb-database-feed";
import { builtInEntries } from "../../builtin-entries";
import { ObservedEntity } from "../../mutation/observed-entity";
import { MutationState } from "../../mutation/mutation-state";
import { omit } from "lodash";

export class MongoDbStorage implements DataStorage {
  #entityTypes = new Map<string, EntityType>();

  private constructor(private client: MongoClient, private cacheLayer: CacheLayer) {}

  public static async init(options: MongoDbStorageConnectionOptions, cacheLayer: CacheLayer): Promise<MongoDbStorage> {
    const client = await MongoClient.connect(`mongodb://${options.url}/${options.dbName}`, { useUnifiedTopology: true });

    // If poseidon database does not exist let's populate one.
    const databases: { name: string }[] = (await client.db(SysDatabases.poseidon).admin().listDatabases({ nameOnly: true })).databases;
    const poseidonDbExist = databases.some((f) => f.name == SysDatabases.poseidon);
    if (!poseidonDbExist) {
      const mongoFeed = new MongoDbDatabaseFeed(client);
      await mongoFeed.feed();
    }

    const storage = new MongoDbStorage(client, cacheLayer);
    await storage.buildEntityTypeGraph();

    return storage;
  }

  public getEntityTypeByName(name: string): EntityType {
    const entityType = this.#entityTypes.get(name);
    if (entityType) return entityType;

    return builtInEntries.entityTypes.find((e) => e.name == name);
  }

  public async query<T = any>(entityTypeName: string, query: Query<T>): Promise<T | T[] | Paginated<T>> {
    const entityType: EntityType = await this.getEntityTypeByName(entityTypeName);
    const builder = new MongoQueryBuilder();
    const mongoQuery = await builder.buildQuery(entityType, query);
    const result: Paginated<T> = <any>(
      await this.client
        .db(entityType.database, { returnNonCachedInstance: true })
        .collection(entityType.name)
        .aggregate(mongoQuery)
        .toArray()
    );

    return result;
  }

  public async getById<T = Entity>(entityTypeName: string, id: string): Promise<T> {
    const entityType = this.getEntityTypeByName(entityTypeName);
    const result = await this.client
      .db(entityType.database, { returnNonCachedInstance: true })
      .collection(entityTypeName)
      .findOne<T>({ _id: id });

    return result;
  }

  public async persist(mutationList: ObservedEntity<Entity>[]): Promise<void> {
    const session = this.client.startSession();
    const simpleTypes = Object.keys(SimpleTypes);
    const pickSimple = (e: Entity, et: EntityType) => {
      const simpleProps = et.props.filter((p) => simpleTypes.indexOf(p.type) == -1).map((p) => p.name);
      return omit(e, simpleProps);
    };

    try {
      await session.withTransaction(async () => {
        const bulkOpMap = new Map<string, UnorderedBulkOperation>();

        for (const mutation of mutationList.filter((i) => i.__mutationState !== MutationState.unchanged)) {
          const database = mutation.__entityType.database ?? SysDatabases.poseidon;
          const mapKey = `${database}.${mutation.__entityType.name}`;
          let bulkOp: UnorderedBulkOperation = bulkOpMap.get(mapKey);

          if (!bulkOp) {
            const coll = this.client.db(mutation.__entityType.database).collection(mutation.__entityType.name);
            bulkOp = coll.initializeUnorderedBulkOp();
            bulkOpMap.set(mapKey, bulkOp);
          }

          if (mutation.__mutationState === MutationState.added) {
            bulkOp.insert(pickSimple(mutation, mutation.__entityType));
          } else if (mutation.__mutationState === MutationState.changed) {
            bulkOp.find({ _id: mutation._id, _changedAt: mutation._changedAt }).replaceOne(pickSimple(mutation, mutation.__entityType));
          } else if (mutation.__mutationState === MutationState.deleted) {
            if (mutation.__entityType.name !== SysEntities.relationLink) throw new Error("Only relation links can be deleted");

            const link: RelationLink = mutation as RelationLink;
            bulkOp.find({ thisId: link.thisId, thatId: link.thatId, relationPropId: link.relationPropId }).removeOne();
          }
        }

        for (const [name, op] of bulkOpMap) {
          var result = await op.execute();
          result.nInserted + result.nModified + result.nRemoved;
          // As we want to guarantee everything was correctly saved to the database,
          // let's check if we got the correct number of insertions an updates,
          // if not we throw an exception so the operations are rolled back.
        }
      });
    } finally {
      session.endSession();
    }
  }

  public newId(): string {
    return new ObjectId().toHexString();
  }

  private async buildEntityTypeGraph() {
    const queryable = new Queryable<EntityType>(async (query) => {
      return await this.query(SysEntities.entityType, query);
    });

    const entityTypes = await queryable
      .include("props", (pf) => pf.include("relatedEntityType"))
      .include("_createdBy")
      .include("_changedBy")
      .toArray();

    for (const et of entityTypes) {
      this.#entityTypes.set(et.name, et);
      et.props.forEach((prop) => {
        if (prop.relatedEntityType) {
          prop.relatedEntityType = entityTypes.find((e) => e.name === prop.relatedEntityType.name);
        }
      });
    }
  }
}
