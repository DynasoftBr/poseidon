import * as util from "util";

import { Router, Request, Response } from "express";
import winston = require("winston"); // Logger. Uses configuration made in server.ts.

import { SysMsgs, SysError, RequestError } from "./exceptions";
import { EntityRepository } from "./data/entity-repository";
import { DataAccess } from "./data/data-access";
import { Entity } from "./models";
import { ResObj, ResObjStatus } from "./res-obj";

export class ApiV1 {

    router: Router;

    private routeBase: string = "/:etName";
    constructor() {
        // Connect to database.
        DataAccess.connect();

        // Starts configuring routes for api
        this.router = Router();

        // Bad request due to absence of entity type.
        this.router.get("/", (req, res) => this.handleError(res, RequestError.noEntityTypeSpecified()));

        this.router.get(this.routeBase, (req, res) => this.all(req, res));
        this.router.get(this.routeBase + "/query", (req, res) => this.query(req, res));
        this.router.get(this.routeBase + "/:id", (req, res) => this.findOne(req, res));
        this.router.post(this.routeBase, (req, res) => this.create(req, res));
        this.router.delete(this.routeBase + "/:id", (req, res) => this.delete(req, res));
        this.router.patch(this.routeBase + "/:id", (req, res) => this.delete(req, res));
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

                let resp: ResObj = {
                    status: ResObjStatus.success,
                    itens: results.length,
                    result: results
                };

                res.send(resp);

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
                    let resObj: ResObj;

                    resObj = {
                        status: ResObjStatus.success,
                        itens: 1,
                        result: result
                    };

                    res.send(resObj);
                } else // If cannot find specified id, respond with 'not found'.
                    this.handleError(res, RequestError.entityNotFound(req.params.id, req.params.etName));

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
                this.handleError(res, RequestError.invalidHeaderParameters("Missing 'query' header."));
                return;
            }

            // The query must be base64 encoded.
            let q = new Buffer(req.headers.query, "base64").toString();

            repo.query(JSON.parse(q)).then((results) => {

                let resObj: ResObj = {
                    status: ResObjStatus.success,
                    itens: results.length,
                    result: results
                }

                res.send(resObj);

            }).catch((err) => this.handleError(res, err));

        }).catch((err) => this.handleError(res, err));
    }

    /**
     * Add an entity to the collection.
     * @param req Request
     * @param res Response
     */
    private create(req: Request, res: Response) {
        EntityRepository.getRepositoty(req.params.etName).then(repo => {

            let entity: Entity = req.body;
            repo.create(entity).then(result => {

                res.send(201, null);

            }).catch(err => this.handleError(res, err));

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
                    let resObj: ResObj;

                    resObj = {
                        status: ResObjStatus.success,
                        itens: 1,
                        result: result
                    }

                    res.send(resObj);
                } else // If cannot find specified id, respond with 'not found'.
                    this.handleError(res, RequestError.entityNotFound(req.params.etName, req.params.id));

            }).catch((err) => this.handleError(res, err));

        }).catch((err) => this.handleError(res, err));
    }

    /**
     * Update an entity or part of it.
     * @param req Request
     * @param res Response
     */
    private patch(req: Request, res: Response) {
        EntityRepository.getRepositoty(req.params.etName).then(repo => {

            let _id: Entity = req.params.id;
            repo.del(_id).then((result) => {
                res.statusCode = 200;
                res.send(result);
            }).catch((err) => {
                this.handleError(res, err);
            });

        }).catch(err => {
            this.handleError(res, err);
        });
    }

    /**
     * Treats errors and answer the request.
     * @param res The response object to give back to client.
     * @param error A SysError object containing the error.
     */
    private handleError(res: Response, error: SysError) {
        let resObj: ResObj = {
            status: ResObjStatus.error,
            error: error
        };

        if (error.code === SysMsgs.error.noEntityTypeSpecified.code
            || error.code === SysMsgs.error.abstractEntityType.code
            || error.code === SysMsgs.error.invalidHeaderParameters.code)

            res.send(400, resObj);

        else if (error.code === SysMsgs.error.entityNotFound.code
            || error.code === SysMsgs.error.entityTypeNotFound.code)

            res.send(404, resObj);

        else {
            res.send(500);
            winston.error(error.message, error);
        }

    }
}