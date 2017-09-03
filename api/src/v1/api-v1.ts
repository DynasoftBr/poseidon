import * as util from "util";

import { Router, Request, Response, Express } from "express";
import winston = require("winston"); // Logger. Uses configuration made in server.ts.

import {
    SysError, SysMsgs, SysMsg,
    DatabaseError, EntityRepository, Entity
} from "../common";

import { ResObj } from "./res-obj";
import { RequestError } from "./request-error";

export class ApiV1 {
    private static _instance: ApiV1;

    private constructor() { }

    static init(app: Router) {
        // If we already have an instace, just return it.
        if (this._instance)
            return this._instance;

        let api = this._instance = new ApiV1();
        let router = Router();
        let routeBase: string = "/:etName";

        // Starts configuring routes for api

        // Bad request, missig entity type.
        router.get("/", (req, res) => api.handleError(res,
            new RequestError(SysMsgs.error.noEntityTypeSpecified)));

        router.get(routeBase, (req, res) => api.all(req, res));
        router.get(routeBase + "/query", (req, res) => api.query(req, res));
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
    private all(req: Request, res: Response): void {
        EntityRepository.getRepositoty(req.params.etName).then((repo) => {

            // Get skip and limit from query string.
            // if not provided, use undefined to preserv function defaults.
            let skip = req.query.skip ? parseInt(req.query.skip) : undefined;
            let limit = req.query.limit ? parseInt(req.query.limit) : undefined;

            repo.findAll(skip, limit).then((results) => {

                res.send(this.responseSuccess(results, results.length));

                // this is an unexpected error.
            }).catch((err) => this.handleError(res, err));

            // can't create a repository from the specified entity type.
        }).catch((err) => this.handleError(res, err));
    }

    /**
     * Finds one item based on the given id.
     * @param req Request
     * @param res Response
     */
    private findOne(req: Request, res: Response): void {
        EntityRepository.getRepositoty(req.params.etName).then(repo => {

            repo.findOne(req.params.id).then((result) => {

                // If result is not undefined, then we respond with success.
                if (result) {
                    res.send(this.responseSuccess(result, 1));
                } else // If cannot find specified id, respond with 'not found'.
                    this.handleError(res, new RequestError(SysMsgs.error.entityNotFound));

                // this is an unexpected error.
            }).catch((err) => this.handleError(res, err));

            // can't create a repository from the specified entity type.
        }).catch((err) => this.handleError(res, err));
    }

    /**
     * Query an entity based on a mongo query.
     * @param req Request
     * @param res Response
     */
    private query(req: Request, res: Response) {
        EntityRepository.getRepositoty(req.params.etName).then(repo => {

            // Check if the request has a query key in the header.
            if (!req.headers.query) {
                this.handleError(res, new RequestError(SysMsgs.error.invalidHeaderParameters, "query"));
                return;
            }

            // The query must be base64 encoded.
            let q = new Buffer(req.headers.query, "base64").toString();

            repo.query(JSON.parse(q)).then((results) => {
                res.send(this.responseSuccess(results, results.length));

            }).catch((err) => this.handleError(res, err));

        }).catch((err) => this.handleError(res, err));
    }

    /**
     * Add an entity to the collection.
     * @param req Request
     * @param res Response
     */
    private create(req: Request, res: Response) {

        let entity: Entity = req.body;
        EntityRepository.getRepositoty(req.params.etName)
            .then(repo => repo.create(entity))
            .then(result => {
                res.statusCode = 201;
                res.location("/" + result);
                res.send(this.responseSuccess({ _id: result }, 1));

            }).catch((err) => this.handleError(res, err));

    }

    /**
     * Remove an entity from collection.
     * @param req Request
     * @param res Response
     */
    private delete(req: Request, res: Response) {
        EntityRepository.getRepositoty(req.params.etName).then(repo => {

            let _id: Entity = req.params.id;

            repo.del(_id).then((result) => {

                if (result > 0) {
                    res.send(this.responseSuccess(null, 1));
                } else // If cannot find specified id, respond with 'not found'.
                    this.handleError(res, new RequestError(SysMsgs.error.entityNotFound,
                        req.params.etName, req.params.id));

            }).catch((err) => this.handleError(res, err));

        }).catch((err) => this.handleError(res, err));
    }

    /**
     * Update an entity or part of it.
     * @param req Request
     * @param res Response
     */
    private update(req: Request, res: Response) {
        EntityRepository.getRepositoty(req.params.etName).then(repo => {

            let entity: Entity = req.body;
            repo.update(entity).then((result) => {
                res.send(204);
            }).catch((err) => {
                this.handleError(res, err);
            });

        }).catch(err => {
            this.handleError(res, err);
        });
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