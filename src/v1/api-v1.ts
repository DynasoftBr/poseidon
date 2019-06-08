import * as Router from "koa-router";

import * as HttpStatus from "http-status-codes";
import { ParameterizedContext } from "koa";
import { IServiceFactory } from "../services";
import { IConcreteEntity } from "@poseidon/core-models";

export class ApiV1 {

    private constructor(private readonly serviceFactory: IServiceFactory) { }

    private static router: Router;

    public static getRouter(serviceFactory: IServiceFactory) {

        if (ApiV1.router) return ApiV1.router;

        const router = ApiV1.router = new Router();
        const api = new ApiV1(serviceFactory);
        const routeBase: string = "/api/v1/:etName";

        router.get("/teste", async (ctx) => {
            ctx.response.status = 200;
            ctx.response.body = { "teste": "teste" };
        });
        // Starts configuring routes for api
        router.get(routeBase, async (ctx) => api.list(ctx));
        router.get(routeBase + "/:id", async (ctx) => api.findById(ctx));
        router.post(routeBase, async (ctx) => api.create(ctx));
        router.put(routeBase + "/:id", async (ctx) => api.update(ctx));
        router.delete(routeBase + "/:id", async (ctx) => api.delete(ctx));

        return router;
    }

    /**
     * Gets all documents of the given entity type.
     * Remarks: If no skip or limit is provided, a default is used. Limit: 500, Skip: 0.
     * @param req Request
     * @param res Response
     */
    private async list(ctx: ParameterizedContext) {
        const service = await this.serviceFactory.getByName(ctx.params.etName);
        const { query } = ctx;

        // Get skip and limit from query string.
        // if not provided, use undefined to preserv function defaults.
        const skip = query.skip ? parseInt(query.skip) : undefined;
        const limit = query.limit ? parseInt(query.limit) : undefined;

        const results = await service.findMany({}, skip, limit);
        ctx.status = HttpStatus.OK;
        ctx.body = results;
    }

    /**
     * Finds one item based on the given id.
     * @param req Request
     * @param res Response
     */
    private async findById(ctx: ParameterizedContext) {
        const { etName, id } = ctx.par;
        const service = await this.serviceFactory.getByName(etName);
        const result = await service.findOne({ _id: id });

        if (!result) {
            return ctx.status = HttpStatus.NOT_FOUND;
        }

        ctx.status = HttpStatus.OK;
        ctx.body = result;
    }

    /**
     * Add an entity to the collection.
     * @param req Request
     * @param res Response
     */
    private async create(ctx: ParameterizedContext) {
        const entity: IConcreteEntity = ctx.request.body;

        const service = await this.serviceFactory.getByName(ctx.params.etName);
        const result = await service.create(entity);

        ctx.status = HttpStatus.CREATED;
        ctx.body = result;
    }

    /**
     * Remove an entity from collection.
     * @param req Request
     * @param res Response
     */
    private async delete(ctx: ParameterizedContext) {
        const { id, etName } = ctx.params;

        const service = await this.serviceFactory.getByName(etName);
        const deleteCount = await service.delete(id);

        // If cannot find specified id, respond with 'not found'.
        // if (!deleteCount)
        //     return ctx.status = HttpStatus.NOT_FOUND;

        ctx.status = HttpStatus.NO_CONTENT;
    }

    /**
     * Update an entity or part of it.
     * @param req Request
     * @param res Response
     */
    private async update(ctx: ParameterizedContext) {
        const { id, etName } = ctx.params;

        const entity: IConcreteEntity = ctx.request.body;
        entity._id = id;

        const service = await this.serviceFactory.getByName(etName);
        const updatedCount = await service.update(entity);

        // No updates means no entity with that id, so thro.
        if (!updatedCount)
            return ctx.status = HttpStatus.NOT_FOUND;

        return ctx.status = HttpStatus.NO_CONTENT;
    }
}