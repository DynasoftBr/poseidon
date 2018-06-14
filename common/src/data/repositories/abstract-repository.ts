import * as Ajv from "ajv";

import { Entity, DatabaseError, SysMsgs, EntityType } from "../..";
import { GenericRepositoryInterface } from "./repository-interface";
import { Collection, MongoError, ObjectID, Db, InsertWriteOpResult, InsertOneWriteOpResult } from "mongodb";
import { EventEmitter } from "events";
import _ = require("lodash");
import { AbstractRepositoryFactory } from "./factories/abstract-repository-factory";
import { PropertyTypes, SysEntities } from "../../constants";
import { SchemaModel } from "json-schema-fluent-builder/lib/models";
import { ValidationProblem } from "./validation-problem";
import { ValidationError } from "./validation-error";
import { EntityValidator } from "./entity-validator";

export abstract class AbstractRepository<T extends Entity>
    extends EventEmitter
    implements GenericRepositoryInterface<T> {

    protected constructor(
        protected readonly collection: Collection,
        public readonly entityType: EntityType,
        protected readonly repoFactory: AbstractRepositoryFactory) {
        super();
    }

    //#region Abstract Members
    protected abstract async beforeValidation(entity: T, isNew: boolean, old?: Entity): Promise<T>;
    protected abstract async validating(entity: T, isNew: boolean, old?: Entity): Promise<ValidationProblem[]>;
    protected abstract async beforeSave(entity: T, isNew: boolean, old?: Entity): Promise<boolean>;
    protected abstract async afterSave(entity: T, isNew: boolean, old?: Entity): Promise<void>;
    protected abstract async beforeDelete(entity: T): Promise<boolean>;
    protected abstract async afterDelete(entity: T): Promise<void>;
    //#endregion

    async deleteOne(_id: string): Promise<number> {
        try {
            return (await this.collection.deleteOne({ _id: _id })).deletedCount;
        } catch (error) {
            this.handleError(error);
        }
    }

    async update(entity: T): Promise<T> {

        let oldEntity: T;
        try {
            // Find existent entity.
            oldEntity = await this.findById(entity._id);

            if (!oldEntity)
                throw new DatabaseError(SysMsgs.error.entityNotFound, entity._id, this.entityType.name);

        } catch (error) {
            this.handleError(error);
        }

        // Overwrite old values with new ones.
        entity = _.assignIn(oldEntity, entity);

        try {
            entity = await this.beforeValidation(entity, false, oldEntity);
        } catch (error) {
            // TODO: Exception
        }

        let problems = await EntityValidator.validate(this.entityType, entity, this.repoFactory);

        try {
            // Custom validations.
            problems.push(...await this.validating(entity, false, oldEntity));
        } catch (error) {
            // TODO: Exception
        }

        // If the array has validation problems, throw an error.
        if (problems.length > 0)
            throw new ValidationError(problems);

        // Event to notify that everything is ok and the object will be saved.
        // Passing a clone as parameter to avoid object being changed after validations
        let clone = _.cloneDeep(entity);

        try {
            this.beforeSave(clone, false, oldEntity);
        } catch (error) {
            // TODO: Exception
        }

        try {
            let result = await this.collection.updateOne({ _id: entity._id }, entity);
        } catch (error) {

        }

        try {
            this.afterSave(clone, false, oldEntity);
        } catch (error) {
            // TODO: Exception
        }
        return entity;
    }

    async insertOne(entity: T): Promise<T> {

        try {
            entity = await this.beforeValidation(entity, true);
        } catch (error) {
            // TODO: Exception
        }

        entity._id = new ObjectID().toHexString();

        let problems = await EntityValidator.validate(this.entityType, entity, this.repoFactory);

        try {
            // call validation event to allow custom validation.
            // And add any validation problem returned.
            problems.push(...await this.validating(entity, true));
        } catch (error) {
            // TODO: Exception
        }

        // If the array has validation problems, throw an error.
        if (problems.length > 0)
            throw new ValidationError(problems);

        // Event to notify that everything is ok and the object will be saved.
        // Passing a clone as parameter to avoid object being changed after validations
        let clone = _.cloneDeep(entity);

        try {
            this.beforeSave(clone, true);
        } catch (error) {
            // TODO: Exception
        }

        try {
            await this.collection.insertOne(entity);
        } catch (error) {
            this.handleError(error);
        }

        try {
            // Event to notify that object has been successfuly saved.
            // Using the clone yet.
            this.afterSave(clone, true);
        } catch (error) {
            // TODO: Exception.
        }

        return entity;
    }

    async findById(id: string): Promise<T> {
        try {
            return await this.collection.findOne({ _id: id });
        } catch (error) {
            this.handleError(error);
        }
    }

    async find(filter: object, skip: number, limit: number): Promise<T[]> {
        try {
            return await this.collection.find(filter).skip(skip).limit(limit).toArray();
        } catch (error) {
            this.handleError(error);
        }
    }

    async findOne(filter: object) {
        try {
            return await this.collection.findOne(filter);
        } catch (error) {
            this.handleError(error);
        }
    }

    handleError(error: any) {
        if (error instanceof MongoError)
            throw new DatabaseError(SysMsgs.error.databaseLevelError, error);

        throw error;
    }
}