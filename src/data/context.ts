import { Entity, IUser, EntityType, EntityTypeCommands, Paginated, SysEntities } from "@poseidon/core-models";
import { IResponse } from "../pipelines/response";
import { IQueryResponse } from "../pipelines/query/query-response";
import { QueryRequestPipeline } from "../pipelines/query/query-request-pipeline";
import { Query } from "../query-builder/interfaces/query";
import { DataStorage } from ".";
import { Queryable } from "../query-builder/queryable";
import { ObservedEntityCollection } from "./mutation/observed-entity-collection";
import { PaginatedResult, SimpleKeys } from "../query-builder/interfaces/utility-types";
import { MutationState } from "./mutation/mutation-state";
import { builtInEntries } from "./builtin-entries";
import { UserInfo } from "os";

export type Test = {
  name: string;
  test: number;
  [key: string]: any;
};

export class Context {
  #storage: DataStorage;
  #observedEntities: ObservedEntityCollection;
  #loggedUser: IUser;

  private constructor(storage: DataStorage) {
    this.#storage = storage;
    this.#observedEntities = new ObservedEntityCollection(this);
  }

  public static async create(userName: string, pass: string, storage: DataStorage): Promise<Context> {
    // const userRepo = await repoFac.createById<IUser>(SysEntities.user);
    // const user = await userRepo.findById(SysUsers.root);
    // return new Context(repoFac, user);

    var ctx = new Context(storage);
    const user = await ctx.getById<IUser>(SysEntities.user, builtInEntries.rootUser._id);

    ctx.#loggedUser = user;

    return ctx;
  }

  public getEntityTypeByName(name: string): EntityType {
    return this.#storage.getEntityTypeByName(name);
  }

  public async getById<T extends Entity = Entity>(entityTypeName: string, id: string): Promise<T> {
    var entity = (await (this.query<Entity>(entityTypeName)
      .filter((f) => f.where("_id", "$eq", id))
      .first() as unknown)) as T;

    return entity;
  }

  public query<T extends Entity>(entityTypeName: string): Queryable<T> {
    return new Queryable<T>(
      async (query): Promise<any> => {
        const result = await this.#storage.query<T>(entityTypeName, query);
        const entityType = await this.#storage.getEntityTypeByName(entityTypeName);
        const observedItems: T[] = [];
        const dataArr: T[] = query.$take ? [...(<Paginated<T>>result).items] : <T[]>result;

        for (const item of dataArr) {
          const observed = this.#observedEntities.attach(item, entityType);
          observedItems.push(observed);
        }

        if (query.$first) {
          return observedItems[0];
        } else if (query.$take) {
          const page = <PaginatedResult<T>>result;
          return <PaginatedResult<T>>{ items: observedItems, total: page.total, page: page.page };
        } else {
          return observedItems;
        }
      }
    );
  }

  public async command(name: string, entityTypeName: string, payload: any) {
    // const entityType = await (await this.repoFac.entityType()).findOne({ name: entityTypeName });
    // const command = await CommandPipeline.create(this, entityType, name, payload);

    // return await command.handle();

    throw "Not implemented";
  }

  public newEntity<T extends Entity>(entityTypeName: string): T {
    const entityType = this.#storage.getEntityTypeByName(entityTypeName);

    return this.#observedEntities.attach(
      {
        _id: this.#storage.newId(),
        _createdAt: new Date(),
        _createdBy: this.#loggedUser,
      } as T,
      entityType,
      MutationState.added
    );
  }

  public observedEntities() {
    return this.#observedEntities.toArray();
  }

  public loggedUser(): IUser {
    return Object.assign({}, this.#loggedUser);
  }
}
