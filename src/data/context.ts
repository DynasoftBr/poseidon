import { Entity, IUser, SysEntities, SysUsers, PropertyTypes } from "@poseidon/core-models";
import { IResponse } from "../pipelines/response";
import { IQueryResponse } from "../pipelines/query/query-response";
import { CommandPipeline } from "../pipelines/command/command-pipeline";
import { QueryRequestPipeline } from "../pipelines/query/query-request-pipeline";
import { QueryBuilder } from "../../poseidon-query-builder/entity-query-builder";
import { Query } from "../query-builder/interfaces/query";
import { IDataStorage } from ".";
import { DatabaseError, SysMsgs } from "../exceptions";
import * as util from "util";
import { MutationCollection } from "./storage/mutation-collection";
import { ObservedEntity } from "./mutation/observed-entity";
import { Queryable } from "../query-builder/queryable";
import { EntityMutationState } from "./mutation/entity-mutation-state";

export class Context {
  #observed: ObservedEntity[];
  #mutated = new MutationCollection();
  #storage: IDataStorage;

  private constructor(storage: IDataStorage, public readonly user: IUser) {
    this.#storage = storage;
  }

  public static async create(userName: string, pass: string, repoFac: IDataStorage): Promise<Context> {
    // const userRepo = await repoFac.createById<IUser>(SysEntities.user);
    // const user = await userRepo.findById(SysUsers.root);
    // return new Context(repoFac, user);
    throw "Not implemented";
  }

  public async getById<T extends Entity = Entity>(entityTypeName: string, id: string): Promise<IResponse<IQueryResponse<T>>> {
    // const entityType = await (await this.repoFac.entityType()).findOne({ name: entityTypeName });
    // const query = new QueryBuilder().where("_id", "$eq", id).getResult();
    // const queryRequest = await QueryRequestPipeline.create<T>(this, entityType, query, this.repoFac);
    // return await queryRequest.handle();

    throw "Not implemented";
  }

  public query<T extends Entity = Entity>(entityTypeName: string, query: Query<T>): Queryable<Entity> {
    return this.#storage.query(entityTypeName, (res: Entity | Entity[]) => {
      if (Array.isArray(res)) {
        return res.map((i) => {
          const observed = this.#mutated.add(i as T, this.#storage.entityTypesByName.get(entityTypeName), EntityMutationState.unchanged);
          return observed as any as T;
        });
      } else {
        const observed = this.#mutated.add(res as T, this.#storage.entityTypesByName.get(entityTypeName), EntityMutationState.unchanged);
        return observed as any as T;
      }
    });
  }

  public async command(name: string, entityTypeName: string, payload: any) {
    // const entityType = await (await this.repoFac.entityType()).findOne({ name: entityTypeName });
    // const command = await CommandPipeline.create(this, entityType, name, payload);

    // return await command.handle();

    throw "Not implemented";
  }

  public createNew<T extends Entity = Entity>(entityTypeName: string): T {
    const newEt = {} as T;
    const entityType = this.#storage.entityTypesByName.get(entityTypeName);
    if (entityType == null) throw new DatabaseError(SysMsgs.error.entityTypeNotFound);

    return (this.#mutated.add(newEt, entityType, EntityMutationState.added) as any) as T;
  }

  public attach(entity: Entity) {
    if (entity == null) throw new Error(util.format(SysMsgs.error.ParameterCannotBeNull, "entity"));

    const observed = <ObservedEntity>(<any>entity);
    if (!observed.setState) throw new Error(util.format(SysMsgs.error.ParameterCannotBeNull, "entity"));

    this.#observed.push(observed);
  }
}
