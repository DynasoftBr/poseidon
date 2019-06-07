"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Router = require("koa-router");
const HttpStatus = require("http-status-codes");
class ApiV1 {
    constructor(serviceFactory) {
        this.serviceFactory = serviceFactory;
    }
    static getRouter(serviceFactory) {
        if (ApiV1.router)
            return ApiV1.router;
        const router = ApiV1.router = new Router();
        const api = new ApiV1(serviceFactory);
        const routeBase = "/api/v1/:etName";
        // Starts configuring routes for api
        router.get(routeBase, (ctx) => __awaiter(this, void 0, void 0, function* () { return api.list(ctx); }));
        router.get(routeBase + "/:id", (ctx) => __awaiter(this, void 0, void 0, function* () { return api.findById(ctx); }));
        router.post(routeBase, (ctx) => __awaiter(this, void 0, void 0, function* () { return api.create(ctx); }));
        router.put(routeBase + "/:id", (ctx) => __awaiter(this, void 0, void 0, function* () { return api.update(ctx); }));
        router.delete(routeBase + "/:id", (ctx) => __awaiter(this, void 0, void 0, function* () { return api.delete(ctx); }));
        return router;
    }
    /**
     * Gets all documents of the given entity type.
     * Remarks: If no skip or limit is provided, a default is used. Limit: 500, Skip: 0.
     * @param req Request
     * @param res Response
     */
    list(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = yield this.serviceFactory.getByName(ctx.params.etName);
            const { query } = ctx;
            // Get skip and limit from query string.
            // if not provided, use undefined to preserv function defaults.
            const skip = query.skip ? parseInt(query.skip) : undefined;
            const limit = query.limit ? parseInt(query.limit) : undefined;
            const results = yield service.findMany({}, skip, limit);
            ctx.status = HttpStatus.OK;
            ctx.body = results;
        });
    }
    /**
     * Finds one item based on the given id.
     * @param req Request
     * @param res Response
     */
    findById(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const { etName, id } = ctx.par;
            const service = yield this.serviceFactory.getByName(etName);
            const result = yield service.findOne({ _id: id });
            if (!result) {
                return ctx.status = HttpStatus.NOT_FOUND;
            }
            ctx.status = HttpStatus.OK;
            ctx.body = result;
        });
    }
    /**
     * Add an entity to the collection.
     * @param req Request
     * @param res Response
     */
    create(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const entity = ctx.request.body;
            const service = yield this.serviceFactory.getByName(ctx.params.etName);
            const result = yield service.create(entity);
            ctx.status = HttpStatus.CREATED;
            ctx.body = result;
        });
    }
    /**
     * Remove an entity from collection.
     * @param req Request
     * @param res Response
     */
    delete(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, etName } = ctx.params;
            const service = yield this.serviceFactory.getByName(etName);
            const deleteCount = yield service.delete(id);
            // If cannot find specified id, respond with 'not found'.
            // if (!deleteCount)
            //     return ctx.status = HttpStatus.NOT_FOUND;
            ctx.status = HttpStatus.NO_CONTENT;
        });
    }
    /**
     * Update an entity or part of it.
     * @param req Request
     * @param res Response
     */
    update(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, etName } = ctx.params;
            const entity = ctx.request.body;
            const service = yield this.serviceFactory.getByName(etName);
            const updatedCount = yield service.update(entity);
            // No updates means no entity with that id, so thro.
            if (!updatedCount)
                return ctx.status = HttpStatus.NOT_FOUND;
            return ctx.status = HttpStatus.NO_CONTENT;
        });
    }
}
exports.ApiV1 = ApiV1;
//# sourceMappingURL=api-v1.js.map