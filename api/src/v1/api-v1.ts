import { Router, Request, Response } from "express";
import * as winston from "winston"; // Logger. Uses configuration made in server.ts.

import {
    SysError, SysMsgs, ServiceFactory, ConcreteEntity
} from "@poseidon/common";

import { RequestError } from "./request-error";

export class ApiV1 {
    private static _instance: ApiV1;

    private constructor(private readonly serviceFactory: ServiceFactory) { }

    static init(app: Router, serviceFactory: ServiceFactory) {
        // If we already have an instace, just return it.
        if (this._instance)
            return this._instance;

        let api = this._instance = new ApiV1(serviceFactory);
        let router = Router();
        let routeBase: string = "/:etName";

        // Starts configuring routes for api

        // Bad request, missig entity type.
        router.get("/", (req, res) => api.handleError(res,
            new RequestError(SysMsgs.error.noEntityTypeSpecified)));

        router.get(routeBase, (req, res) => api.all(req, res));
        router.get(routeBase + "/:id", (req, res) => api.findById(req, res));
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
            const service = await this.serviceFactory.getServiceByName(req.params.etName);

            // Get skip and limit from query string.
            // if not provided, use undefined to preserv function defaults.
            let skip = req.query.skip ? parseInt(req.query.skip) : undefined;
            let limit = req.query.limit ? parseInt(req.query.limit) : undefined;

            let results = await service.findMany({}, skip, limit);

            res.send(results);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    /**
     * Finds one item based on the given id.
     * @param req Request
     * @param res Response
     */
    private async findById(req: Request, res: Response) {
        try {
            let service = await this.serviceFactory.getServiceByName(req.params.etName);
            let result = await service.findOne({ _id: req.params.id });

            if (result) {
                res.send(result);
            } else // If cannot find specified id, respond with 'not found'.
                this.handleError(res, new RequestError(SysMsgs.error.entityNotFound, req.params.id, req.params.etName));
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

        let entity: ConcreteEntity = req.body;

        try {
            let service = await this.serviceFactory.getServiceByName(req.params.etName);
            let result = await service.insertOne(entity);

            res.location("/" + result._id).status(201).send(result);
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
            let service = await this.serviceFactory.getServiceByName(req.params.etName);
            let deleteCount = await service.deleteOne(_id);

            // If cannot find specified id, respond with 'not found'.
            if (!deleteCount)
                this.handleError(res, new RequestError(SysMsgs.error.entityNotFound,
                    req.params.etName, req.params.id));

            res.send(null);
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

        let entity: ConcreteEntity = req.body;

        try {
            let service = await this.serviceFactory.getServiceByName(req.params.etName);
            let updatedCount = await service.updateOne(req.params.id, entity);

            // If cannot find specified id, respond with 'not found'.
            if (!updatedCount)
                this.handleError(res, new RequestError(SysMsgs.error.entityNotFound, req.params.etName, req.params.id));

            res.send(204);
        } catch (error) {
            this.handleError(res, error);
        }
    }


    /**
     * Treats errors and answer the request.
     * @param res The response object to give back to client.
     * @param error A SysError object containing the error.
     */
    private handleError(res: Response, error: SysError) {

        if (error.code === SysMsgs.error.noEntityTypeSpecified.code
            || error.code === SysMsgs.error.abstractEntityType.code
            || error.code === SysMsgs.error.invalidHeaderParameters.code)

            res.status(400).send(error);

        else if (error.code === SysMsgs.error.entityNotFound.code
            || error.code === SysMsgs.error.entityTypeNotFound.code)

            res.status(404).send(error);
        else if (error.code === SysMsgs.validation.validationErrorMsg.code)
            res.status(422).send(error);
        else if (error.code === SysMsgs.error.methodNotAllowed.code)
            res.status(405).send(error);
        else {
            res.status(500).send();
            winston.error(error.message, error);
        }
    }

}
const waitFor = (ms: number) => new Promise(r => setTimeout(r, ms));