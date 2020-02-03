import * as Router from "koa-router";

import * as HttpStatus from "http-status-codes";
import { ParameterizedContext } from "koa";
import { IConcreteEntity } from "@poseidon/core-models";
import { Context } from "../context";
import { IRepositoryFactory } from "../data";

export class ApiV1 {
  private constructor(private readonly repoFactory: IRepositoryFactory) {}

  private static router: Router;

  public static getRouter(repoFactory: IRepositoryFactory) {
    if (ApiV1.router) return ApiV1.router;

    const router = (ApiV1.router = new Router());
    const api = new ApiV1(repoFactory);
    const routeBase: string = "/api/v1/:etName";

    // Starts configuring routes for api
    router.get(routeBase, async ctx => api.list(ctx));
    router.post(`${routeBase}/:command`, async ctx => api.execCommand(ctx));
    return router;
  }

  /**
   * Gets all documents of the given entity type.
   * Remarks: If no skip or limit is provided, a default is used. Limit: 500, Skip: 0.
   * @param req Request
   * @param res Response
   */
  private async list(ctx: ParameterizedContext) {
    const pContext = await Context.create("", "", this.repoFactory);
    const { query } = ctx;

    // Get skip and limit from query string.
    // if not provided, use undefined to preserv function defaults.
    const skip = query.skip ? parseInt(query.skip) : undefined;
    const limit = query.limit ? parseInt(query.limit) : undefined;

    const response = await pContext.executeQuery(ctx.params.etName, query);

    ctx.status = HttpStatus.OK;
    ctx.body = response;
  }

  /**
   * Add an entity to the collection.
   * @param req Request
   * @param res Response
   */
  private async execCommand(ctx: ParameterizedContext) {
    const entity: IConcreteEntity = ctx.request.body;
    const pContext = await Context.create("", "", this.repoFactory);
    const { etName, command } = ctx.params;
    const result = await pContext.executeCommand(command, etName, entity);

    ctx.status = HttpStatus.CREATED;
    ctx.body = result;
  }
}
