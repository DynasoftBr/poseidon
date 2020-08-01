import {
  EntityType,
  PropertyTypes,
  RelationKind,
  SysProperties,
  SysEntities,
  EntityProperty,
  Entity,
  Entity2,
} from "@poseidon/core-models";
import * as knex from "knex";
import { BuiltInEntries } from "../../builtin-entries";
import { Pool, Client, ClientConfig, PoolClient } from "pg";
import { PostgresConnOptions } from "./postgres-conn-options";
import { IDataStorage } from "../idata-storage";
import { Queryable } from "../../../query-builder/queryable";
import { PostgresQueryBuilder } from "./postgres-query-builder";
import { MutationCollection } from "../mutation-collection";
import { ObservedEntity } from "../../mutation/observed-entity";
import { EntityMutationState } from "../../mutation/entity-mutation-state";
import { v4 } from "uuid";
export class PostgresStorage implements IDataStorage {
  private knex: knex<any, unknown>;
  private readonly clientConfig: ClientConfig;
  private readonly postgresDbConfig: ClientConfig;
  private readonly pool: Pool;

  public entityTypesByName = new Map<string, EntityType>();
  public entityTypesById = new Map<string, EntityType>();

  constructor(connOptions: Readonly<PostgresConnOptions>) {
    this.knex = knex({ client: "pg" });
    this.clientConfig = {
      database: "poseidon",
      host: connOptions.host,
      password: connOptions.pass,
      user: connOptions.user,
    };

    this.postgresDbConfig = {
      database: "postgres",
      host: connOptions.host,
      password: connOptions.pass,
      user: connOptions.user,
    };

    this.pool = new Pool(this.clientConfig);
  }

  _client: PoolClient;
  public async insert() {
    if (this._client == null) this._client = await this.pool.connect();
    const sql = 'INSERT INTO "Relation" ("_id", "_createdAt", "relationId", "this", "that") VALUES ($1, $2, $3, $4, $5);';

    await this._client.query(sql, [v4(), new Date(), v4(), v4(), v4()]);
  }
  public static async init(connOptions: Readonly<PostgresConnOptions>): Promise<PostgresStorage> {
    const storage = new PostgresStorage(connOptions);
    // await storage.feed();

    // var entityTypes = await storage
    //   .query<EntityType>(new BuiltInEntries().entityType)
    //   .include("props", (p) => p.include("relatedEntityType"))
    //   .toArray();

    // entityTypes.forEach((e) => {
    //   e.props.map((p) => {
    //     p.relatedEntityType = entityTypes.find((e) => e._id === p.relatedEntityType._id);
    //   });

    //   storage.entityTypesByName.set(e.name, e);
    //   storage.entityTypesById.set(e._id, e);
    // });

    return storage;
  }

  query<T>(entityType: EntityType, callback?: (res: T | T[]) => T | T[]): Queryable<T>;
  query<T>(entityType: string, callback?: (res: T | T[]) => T | T[]): Queryable<T>;
  query<T>(entityType: EntityType | string, callback?: (res: T | T[]) => T | T[]): Queryable<T> {
    const etType = typeof entityType === "string" ? this.entityTypesByName.get(entityType) : entityType;

    return new Queryable<T>(
      async (query): Promise<any> => {
        const builder = new PostgresQueryBuilder();
        const sql = await builder.buildQuery(etType, query);
        const client = await this.pool.connect();
        const result = await client.query(sql, builder.paramsList);

        if (query.$first) {
          return callback ? callback(result.rows[0]) : result.rows[0];
        } else {
          return callback ? callback(result.rows) : result.rows;
        }
      }
    );
  }

  public async testConnection() {
    var client = new Client(this.postgresDbConfig);
    await client.query<{ value: boolean }>("SELECT 1 as value");
  }

  public async feed() {
    var databaseExists = !(await this.createDatabaseIfNotExists());
    if (databaseExists) return;

    const builtIn = new BuiltInEntries();
    const entityTypes = [builtIn.entityType, builtIn.entityTypeEntityProperty, builtIn.entityTypeUser, builtIn.entityTypeRelation];

    const client = await this.pool.connect();
    try {
      await this.beginTran(client);

      const createdTables: string[] = [];
      for (const entityType of entityTypes) {
        if (createdTables.some((t) => t === entityType.name)) continue;

        const cmd = await this.generateCmdsForNewEntityType(entityType, createdTables);

        await client.query(cmd);
      }

      const toMutate = new MutationCollection();
      entityTypes.map((e) => toMutate.add(e as any, builtIn.entityType, EntityMutationState.added));

      for (const entry of toMutate.toArray()) {
        await this.mutateInternal(entry, "Feed", client);
        // const relations = entry.entityType.props.filter((p) => p.type === PropertyTypes.relation);

        // for (const relation of relations) {
        //   const related = entry.__entity[relation.name];
        //   if (related == null) return;

        //   await this.mutateInternal(entry, "Feed", client);
        // }
      }

      await this.commit(client);
      console.log("Commited");
    } catch (error) {
      await this.rollback(client);
      console.log(error);
      throw error;
    } finally {
      client.release();
    }
  }

  public async mutate(items: MutationCollection, event: string) {
    const client = await this.pool.connect();
    await this.beginTran(client);
    try {
      for (const entry of items.toArray()) {
        await this.mutateInternal(entry, event, client);

        entry.__state = EntityMutationState.unchanged;
      }

      await this.commit(client);
    } catch (error) {
      await this.rollback(client);
      throw error;
    }
  }

  private async mutateInternal(observed: ObservedEntity, event: string, client: PoolClient) {
    const [cmd, values] =
      observed.__state === EntityMutationState.added
        ? this.generateInsertCmd(observed, observed.entityType)
        : this.generateUpdateCmd(observed, observed.entityType);

    await client.query(cmd, values);
  }

  public async migrate(entityType: EntityType) {
    const oldEntityType = await this.knex<EntityType>(SysEntities.entityType).select("*").first();
    if (oldEntityType == null) {
      await this.generateCmdsForNewEntityType(entityType);
    } else {
      await this.migrateOldEntityType(entityType, oldEntityType);
    }
  }

  private async migrateOldEntityType(entityType: EntityType, oldEntityType: EntityType) {
    throw new Error("Method not implemented.");
  }

  private async generateCmdsForNewEntityType(entityType: EntityType, alreadyCreated: string[] = []): Promise<string> {
    alreadyCreated.push(entityType.name);

    const columns = entityType.props.filter((c) => c.type !== PropertyTypes.relation);
    const relations = entityType.props.filter((c) => c.type === PropertyTypes.relation);

    let cmds = [
      this.knex.schema
        .createTable(entityType.name, (table) => {
          columns.forEach((col) => {
            let column: knex.ColumnBuilder;

            if (col.name === SysProperties._id) {
              column = table.uuid(col.name);
              column.primary();
            } else if (col.type === PropertyTypes.string) {
              column = table.string(col.name, col.max || 250);
            } else if (col.type === PropertyTypes.number) {
              column = table.decimal(col.name, col.multipleOf);
            } else if (col.type === PropertyTypes.boolean) {
              column = table.boolean(col.name);
            } else if (col.type === PropertyTypes.date) {
              column = table.date(col.name);
            } else if (col.type === PropertyTypes.dateTime) {
              column = table.dateTime(col.name, { useTz: true });
            }

            if (col.required) column = column.notNullable();
          });
        })
        .toQuery(),
    ];

    for (const relation of relations) {
      if (!alreadyCreated.some((c) => c === relation.relatedEntityType.name))
        cmds.push(await this.generateCmdsForNewEntityType(relation.relatedEntityType as EntityType, alreadyCreated));
    }

    return cmds.reduce((prev, curr) => {
      return prev + (curr.endsWith(";") ? "\n" : ";\n") + curr;
    });
  }

  private generateInsertCmd(entity: Entity, entityType: EntityType): [string, any[]] {
    const values: any[] = [];
    const valuesVars: string[] = [];
    const colsToInsert = entityType.props.filter((c) => c.type !== PropertyTypes.relation && entity[c.name] != null).map((p) => p.name);

    let varCount = 1;

    for (const col of colsToInsert) {
      const value = entity[col];

      valuesVars.push(`$${varCount++}`);
      values.push(value);
    }

    const cmd = `INSERT INTO "${entityType.name}" (${colsToInsert.map((p) => `"${p}"`).join(", ")}) VALUES (${valuesVars.join(", ")});`;
    console.log(cmd, values);
    return [cmd, values];
  }

  private generateUpdateCmd(entity: Entity, entityType: EntityType): [string, any[]] {
    const colsInEntityType = entityType.props
      .filter((c) => c.type !== PropertyTypes.relation && entity[c.name] != null)
      .map((p) => p.name);
    const values: any[] = [];
    const valuesVars: string[] = [];
    let varCount = 1;

    for (const col of colsInEntityType) {
      const value = entity[col];

      valuesVars.push(`"${col}" = $${varCount++}`);
      values.push(value);
    }

    const cmd = `UPDATE "${entityType.name}" SET (${valuesVars.join(", ")}) WHERE _id = $${varCount++};`;
    values.push(entity._id);

    return [cmd, values];
  }

  private async createDatabaseIfNotExists(): Promise<boolean> {
    const client = new Client(this.postgresDbConfig);
    await client.connect();

    const sql = this.knex.table("pg_database").whereRaw("datname = 'poseidon'").toSQL().sql;
    const result = await client.query(sql);

    if (result.rows.length === 0) {
      console.log("Creating poseidon database.");

      await client.query(`
        CREATE DATABASE poseidon
        WITH 
        OWNER = postgres
        ENCODING = 'UTF8'
        CONNECTION LIMIT = -1; 
      `);

      console.log("Database created.");
    }

    await client.end();

    return result.rows.length === 0;
  }

  private async tableExistis(tableName: string, client: PoolClient): Promise<boolean> {
    const result = await client.query<{ exists: boolean }>(`
      SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = '${tableName}') as exists;
    `);

    return result.rows[0].exists;
  }

  //#region transactions
  private async beginTran(client: PoolClient) {
    await client.query("BEGIN");
  }

  private async commit(client: PoolClient) {
    await client.query("COMMIT");
  }

  private async rollback(client: PoolClient) {
    await client.query("ROLLBACK");
  }

  //#endregion
}
