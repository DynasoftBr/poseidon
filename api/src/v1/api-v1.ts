import * as util from "util";

import { Router, Request, Response, Express } from "express";
import * as winston from "winston"; // Logger. Uses configuration made in server.ts.

import {
    SysError, SysMsgs, SysMsg,
    DatabaseError, Entity, AbstractRepositoryFactory
} from "@poseidon/common";

import { ResObj } from "./res-obj";
import { RequestError } from "./request-error";

export class ApiV1 {
    private static _instance: ApiV1;

   private constructor(private readonly repositoryFactory: AbstractRepositoryFactory) { }

    static init(app: Router, repositoryFactory: AbstractRepositoryFactory) {
        // If we already have an instace, just return it.
        if (this._instance)
            return this._instance;

        let api = this._instance = new ApiV1(repositoryFactory);
        let router = Router();
        let routeBase: string = "/:etName";

        // Starts configuring routes for api

        // Bad request, missig entity type.
        router.get("/", (req, res) => api.handleError(res,
            new RequestError(SysMsgs.error.noEntityTypeSpecified)));

        router.get(routeBase, (req, res) => api.all(req, res));
        router.get(routeBase + "/:id", (req, res) => api.findOne(req, res));
        router.post(routeBase, (req, res) => api.create(req, res));
        router.put(routeBase + "/:id", (req, res) => api.update(req, res));
        router.delete(routeBase + "/:id", (req, res) => api.delete(req, res));

        // All request that not matches the above, gets method not allowed error.
        router.all("*", (req, res) => api.handleError(res,
            new RequestError(SysMsgs.error.methodNotAllowed)));

        app.use("/v1", router);
    }

    /**
     * Gets all documents of the given entity type.
     * Remarks: If no skip or limit is provided, a default is used. Limit: 500, Skip: 0.
     * @param req Request
     * @param res Response
     */
    private async all(req: Request, res: Response) {
        try {
            let repo = await this.repositoryFactory.createByName(req.params.etName);

            // Get skip and limit from query string.
            // if not provided, use undefined to preserv function defaults.
            let skip = req.query.skip ? parseInt(req.query.skip) : undefined;
            let limit = req.query.limit ? parseInt(req.query.limit) : undefined;

            let results = await repo.find({}, skip, limit);

            res.send(this.responseSuccess(results, results.length));
        } catch (error) {
            this.handleError(res, error);
        }
    }

    /**
     * Finds one item based on the given id.
     * @param req Request
     * @param res Response
     */
    private async findOne(req: Request, res: Response) {
        try {
            let repo = await this.repositoryFactory.createByName(req.params.etName);
            let result = await repo.findOne(req.params.id);

            if (result) {
                res.send(this.responseSuccess(result, 1));
            } else // If cannot find specified id, respond with 'not found'.
                this.handleError(res, new RequestError(SysMsgs.error.entityNotFound));
        } catch (error) {
            this.handleError(res, error);
        }
    }

    /**
     * Add an entity to the collection.
     * @param req Request
     * @param res Response
     */
    private async create(req: Request, res: Response) {

        let entity: Entity = req.body;

        try {
            let repo = await this.repositoryFactory.createByName(req.params.etName);
            let result = await repo.insertOne(entity);

            res.statusCode = 201;
            res.location("/" + result);
            res.send(this.responseSuccess({ _id: result }, 1));
        } catch (error) {
            this.handleError(res, error);
        }
    }

    /**
     * Remove an entity from collection.
     * @param req Request
     * @param res Response
     */
    private async delete(req: Request, res: Response) {

        let _id = req.params.id;

        try {
            let repo = await this.repositoryFactory.createByName(req.params.etName);
            let deleteCount = await repo.deleteOne(_id);

            // If cannot find specified id, respond with 'not found'.
            if (deleteCount == 0)
                this.handleError(res, new RequestError(SysMsgs.error.entityNotFound, req.params.etName, req.params.id));

            res.send(this.responseSuccess(null, 1));
        } catch (error) {
            this.handleError(res, error);
        }
    }

    /**
     * Update an entity or part of it.
     * @param req Request
     * @param res Response
     */
    private async update(req: Request, res: Response) {

        let entity: Entity = req.body;

        try {
            let repo = await this.repositoryFactory.createByName(req.params.etName);
            let updatedCount = await repo.update(entity);

            // If cannot find specified id, respond with 'not found'.
            if (updatedCount == 0)
                this.handleError(res, new RequestError(SysMsgs.error.entityNotFound, req.params.etName, req.params.id));

            res.send(204);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    readonly responseObj: ResObj = {
        status: null,
        itens: 0,
        result: null
    };
    private responseSuccess(result: any, items: number = 1): ResObj {
        this.responseObj.status = "success";
        this.responseObj.itens = items;
        this.responseObj.result = result;

        return this.responseObj;
    }

    private responseError(err: SysError): ResObj {
        this.responseObj.status = "error";
        this.responseObj.error = err;

        return this.responseObj;
    }

    /**
     * Treats errors and answer the request.
     * @param res The response object to give back to client.
     * @param error A SysError object containing the error.
     */
    private handleError(res: Response, error: SysError) {
        let resObj = this.responseError(error);

        if (error.code === SysMsgs.error.noEntityTypeSpecified.code
            || error.code === SysMsgs.error.abstractEntityType.code
            || error.code === SysMsgs.error.invalidHeaderParameters.code)

            res.status(400).send(resObj);

        else if (error.code === SysMsgs.error.entityNotFound.code
            || error.code === SysMsgs.error.entityTypeNotFound.code)

            res.status(404).send(resObj);
        else if (error.code === SysMsgs.validation.validationErrorMsg.code)
            res.status(422).send(resObj);
        else if (error.code === SysMsgs.error.methodNotAllowed.code)
            res.status(405).send(resObj);
        else {
            res.status(500).send();
            winston.error(error.message, error);
        }
    }
}