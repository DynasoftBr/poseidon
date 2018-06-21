import * as Ajv from "ajv";

import { Entity, DatabaseError, SysMsgs, EntityType, Repository } from "../..";
import { Collection, MongoError, ObjectID, Db, InsertWriteOpResult, InsertOneWriteOpResult } from "mongodb";
import { EventEmitter } from "events";
import _ = require("lodash");
import { AbstractRepositoryFactory } from "./factories/abstract-repository-factory";
import { PropertyTypes, SysEntities } from "../../constants";
import { ValidationProblem } from "../validation/validation-problem";
import { ValidationError } from "../validation/validation-error";
import { EntityValidator } from "../validation/entity-validator";
import { DataStorage, StorageCollection } from "../storage";
import { ConcreteEntity } from "../../models";

export abstract class AbstractRepository<T extends ConcreteEntity>
    extends EventEmitter
    implements Repository<T> {

    protected constructor(
        protected readonly collection: StorageCollection<T>,
        protected readonly storage: DataStorage,
        public readonly entityType: EntityType) {
        super();
    }

    async deleteOne(id: string): Promise<boolean> {
        return await this.collection.deleteOne(id);
    }

    async updateOne(id: string, entity: T): Promise<boolean> {
        return this.collection.updateOne(id, entity);
    }

    async insertOne(entity: T): Promise<boolean> {
        return this.collection.insertOne(entity);
    }

    async findById(id: string): Promise<T> {
        return await this.collection.findOne({ _id: id });
    }

    async findMany(filter: object, skip: number, limit: number): Promise<T[]> {
        return await this.collection.findMany(filter, skip, limit);
    }

    async findOne(filter: object) {
        return await this.collection.findOne(filter);
    }

    handleError(error: any) {
        if (error instanceof MongoError)
            throw new DatabaseError(SysMsgs.error.databaseLevelError, error);

        throw error;
    }
}