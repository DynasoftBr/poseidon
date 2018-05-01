import { Entity, DatabaseError, SysMsgs, EntityType } from "../..";
import { GenericRepositoryInterface } from "./repository-interface";
import { Collection, MongoError, ObjectID } from "mongodb";
import { ValidationProblem, EntityFactory, EntityValidator, ValidationError } from "../validation";
import { EventEmitter } from "events";
import _ = require("lodash");
export abstract class AbstractRepository<T extends Entity>
    extends EventEmitter
    implements GenericRepositoryInterface<T> {


    protected constructor(
        protected collection: Collection,
        public entityType: EntityType) { super(); }

    //#region Abstract Members
    protected abstract async beforeValidation(entity: T, isNew: boolean): Promise<T>;
    protected abstract async validating(entity: T, isNew: boolean): Promise<ValidationProblem[]>;
    protected abstract async beforeSave(entity: T, isNew: boolean): Promise<boolean>;
    protected abstract async afterSave(entity: T, isNew: boolean): Promise<void>;
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
            oldEntity = await this.findOne(entity._id);

            if (!oldEntity)
                throw new DatabaseError(SysMsgs.error.entityNotFound, entity._id, this.entityType.name);

        } catch (error) {
            this.handleError(error);
        }

        // Overwrite old values with new ones.
        entity = _.assignIn(oldEntity, entity);

        let factory = new EntityFactory(this.entityType, entity);
        factory.applyConvention();
        factory.parseDateTimeProperties();

        try {
            entity = await this.beforeValidation(entity, false);
        } catch (error) {
            // Exception
        }

        var problems = await EntityValidator.validate(this.entityType, entity, true);
        // Custom validations.
        problems.push(...await this.validating(entity, false));

        // The entity now has passed all validations and will be saved to database.
        this.beforeSave(entity, false);

        let result = await this.collection.updateOne({ _id: entity._id }, entity);
        return entity;
    }

    async insertOne(entity: T): Promise<T> {
        let factory = new EntityFactory(this.entityType, entity);
        factory.ensureIdProperty();
        factory.applyDefaults();
        factory.applyConvention();
        factory.parseDateTimeProperties();

        entity._id = new ObjectID().toHexString();

        try {
            entity = await this.beforeValidation(entity, true);
        } catch (error) {
            
        }
        
        var problems = await EntityValidator.validate(this.entityType, entity, true);

        // call validation event to allow custom validation.
        // and add any validation problem returned.
        problems.push(...await this.validating(entity, true));

        // If the array has validation problems, throw an error.
        if (problems.length > 0)
            throw new ValidationError(problems);

        // Event to notify that everything is ok and the object will be saved.
        // Passing a clone as parameter to avoid object being changed after validations
        let clone = _.cloneDeep(entity);
        this.beforeSave(clone, true);

        try {
            let created = await this.collection.insertOne(entity);
        } catch (error) {
            this.handleError(error);
        }

        // Event to notify that object has been successfuly saved.
        // Using the clone yet.
        this.afterSave(clone, true);

        return entity;
    }

    async findOne(id: string): Promise<T> {
        try {
            return await this.collection.findOne({ _id: id });
        } catch (error) {
            this.handleError(error);
        }
    }

    async findAll(skip: number, limit: number): Promise<T[]> {
        try {
            return await this.collection.find().skip(skip).limit(limit).toArray();
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