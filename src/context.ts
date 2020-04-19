import { IEntity, IUser, SysEntities, SysUsers } from "@poseidon/core-models";
import { IResponse } from "./pipelines/response";
import { IQueryRequest } from "./pipelines/query/query-request";
import { IQueryResponse } from "./pipelines/query/query-response";
import { IRepositoryFactory } from "./data";
import { CommandPipeline } from "./pipelines/command/command-pipeline";
import { QueryRequestPipeline } from "./pipelines/query/query-request-pipeline";
import { IQueryModel } from "../poseidon-query-builder/query-model";
import { QueryBuilder } from "../poseidon-query-builder/entity-query-builder";
import { Query } from "./query-builder/interfaces/query";
import { QueryBuilder as KnexQueryBuilder, Raw } from "knex";
import * as knex from "knex";
import { ConditionGroup, SimpleKeys, Condition, Operators } from "./query-builder/interfaces/utility-types";

export class Context {
  private constructor(private readonly repoFac: IRepositoryFactory, public readonly user: IUser) {}

  public static async create(userName: string, pass: string, repoFac: IRepositoryFactory) {
    const userRepo = await repoFac.createById<IUser>(SysEntities.user);
    const user = await userRepo.findById(SysUsers.root);
    return new Context(repoFac, user);
  }

  public async getById<T extends IEntity = IEntity>(entityTypeName: string, id: string): Promise<IResponse<IQueryResponse<T>>> {
    const entityType = await (await this.repoFac.entityType()).findOne({ name: entityTypeName });
    const query = new QueryBuilder().where("_id", "$eq", id).getResult();
    const queryRequest = await QueryRequestPipeline.create<T>(this, entityType, query, this.repoFac);
    return await queryRequest.handle();
  }

  public async executeQuery<T extends IEntity = IEntity>(
    entityTypeName: string,
    query: IQueryModel
  ): Promise<IResponse<IQueryResponse<T>>> {
    const entityType = await (await this.repoFac.entityType()).findOne({ name: entityTypeName });

    const queryRequest = await QueryRequestPipeline.create<T>(this, entityType, query, this.repoFac);
    return await queryRequest.handle();
  }

  public async executeCommand(commandName: string, entityTypeName: string, payload: any) {
    const entityType = await (await this.repoFac.entityType()).findOne({ name: entityTypeName });
    const command = await CommandPipeline.create(this, entityType, commandName, payload);

    return await command.handle();
  }
}