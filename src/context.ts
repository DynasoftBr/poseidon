import { IConcreteEntity, IUser, SysEntities, SysUsers } from "@poseidon/core-models";
import { IResponse } from "./pipelines/response";
import { IQueryRequest } from "./pipelines/query/query-request";
import { IQueryResponse } from "./pipelines/query/query-response";
import { IRepositoryFactory } from "./data";
import { CommandPipeline } from "./pipelines/command/command-pipeline";
import { QueryRequestPipeline } from "./pipelines/query/query-request-pipeline";

export class Context {
  private constructor(private readonly repoFac: IRepositoryFactory, public readonly user: IUser) {}

  public static async create(userName: string, pass: string, repoFac: IRepositoryFactory) {
    const userRepo = await repoFac.createById<IUser>(SysEntities.user);
    const user = await userRepo.findById(SysUsers.root);
    return new Context(repoFac, user);
  }

  public async executeQuery<T extends IConcreteEntity = IConcreteEntity>(
    entityTypeName: string,
    query: any
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
