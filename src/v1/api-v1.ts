import * as Router from "koa-router";

import * as HttpStatus from "http-status-codes";
import { ParameterizedContext } from "koa";
import { Entity } from "@poseidon/core-models";
import { Context } from "../data/context";
import qs = require("qs");
import { IDataStorage } from "../data";

export class ApiV1 {
  private constructor(private readonly storage: IDataStorage) {}

  private static router: Router;

  public static getRouter(storage: IDataStorage) {
    if (ApiV1.router) return ApiV1.router;

    const router = (ApiV1.router = new Router());
    const api = new ApiV1(storage);
    const routeBase: string = "/api/v1/:etName";

    // Starts configuring routes for api
    router.post(`${routeBase}/:command`, async (ctx) => api.exec(ctx));
    router.get(`${routeBase}/:id`, async (ctx) => api.getById(ctx));
    router.get(routeBase, async (ctx) => api.query(ctx));
    return router;
  }

  /**
   * Gets document by id.
   * @param req Request
   * @param res Response
   */
  private async getById(ctx: ParameterizedContext) {
    const pContext = await Context.create("", "", this.storage);

    const response = await pContext.getById(ctx.params.etName, ctx.params.id);

    ctx.status = HttpStatus.OK;
    ctx.body = response;
  }

  /**
   * Gets all documents of the given entity type.
   * Remarks: If no skip or limit is provided, a default is used. Limit: 500, Skip: 0.
   * @param req Request
   * @param res Response
   */
  private async query(ctx: ParameterizedContext) {
    const pContext = await Context.create("", "", this.storage);
    const { querystring } = ctx;
    const query = qs.parse(querystring, { strictNullHandling: true, depth: 100 });

    // Get skip and limit from query string.
    // if not provided, use undefined to preserv function defaults.
    query.$skip = query.$skip ? parseInt(query.$skip) : undefined;
    query.$limit = query.$limit ? parseInt(query.$limit) : undefined;

    const response = await pContext.query(ctx.params.etName, query);

    ctx.status = HttpStatus.OK;
    ctx.body = response;
  }

  /**
   * Add an entity to the collection.
   * @param req Request
   * @param res Response
   */
  private async exec(ctx: ParameterizedContext) {
    const entity: Entity = ctx.request.body;
    const pContext = await Context.create("", "", this.storage);
    const { etName, command } = ctx.params;
    const result = await pContext.command(command, etName, entity);

    ctx.status = HttpStatus.CREATED;
    ctx.body = result;
  }
}
