import { Collection, MongoError, ObjectID } from "mongodb";
import * as _ from "lodash";

import { SysMsgs } from "../";
import { SysError } from "../";
import { DataAccess } from "./data-connection";
import { EntityType, Entity } from "../models";
import { SysEntities } from "../constants";
import { ValidationError, ValidationProblem, Validator, EntityFactory } from "./validation";
import { EntityRepositoryEvents } from "./entity-repository-events";
import { DatabaseError } from "./database-error";

export class EntityRepository {
    private readonly _collection: Collection;
    protected readonly entityType: EntityType;

    private constructor(entityType: EntityType) {
        this.entityType = entityType;
        this._collection = DataAccess.database.collection(entityType.name);
    }

    static async create(entityTypeName: string): Promise<EntityRepository> {

        // Check if database connection id open before continue.
        if (!DataAccess.database)
            throw new DatabaseError(SysMsgs.error.databaseConnectionClosed);

        try {
            let etType = await DataAccess.database.collection(SysEntities.entityType)
                .findOne({ name: entityTypeName });

            if (etType === null)
                throw new DatabaseError(SysMsgs.error.entityTypeNotFound, entityTypeName);
            else if (etType.abstract)
                throw new DatabaseError(SysMsgs.error.abstractEntityType, entityTypeName);

            return new EntityRepository(etType);
        } catch (error) {
            if (error instanceof MongoError)
                throw new DatabaseError(SysMsgs.error.databaseLevelError, error);

            throw error;
        }
    }

    async findAll(skip: number = 0, limit: number = 500): Promise<Entity[]> {
        try {
            return await this._collection.find().skip(skip).limit(limit).toArray();
        } catch (error) {
            if (error instanceof MongoError)
                throw new DatabaseError(SysMsgs.error.databaseLevelError, error);

            throw error;
        }
    }

    async findOne(id: string): Promise<Entity> {
        try {
            return await this._collection.findOne({ _id: id });
        } catch (error) {
            if (error instanceof MongoError)
                throw new DatabaseError(SysMsgs.error.databaseLevelError, error);

            throw error;
        }
    }

    async create(entity: Entity): Promise<string> {

        let factory = new EntityFactory(this.entityType, entity);
        factory.ensureIdProperty();
        factory.applyDefaults();
        factory.applyConvention();
        factory.parseDateTimeProperties();

        if (this.entityType.name === SysEntities.entityType)
            factory.addReserverdPropsEtType();

        entity = factory.entity;
        entity._id = new ObjectID().toHexString();

        let events = new EntityRepositoryEvents(this.entityType);
        // entity = events.beforeValidation(entity);

        await Validator.validate(this.entityType, entity, true);

        // calc validation event to allow custom validation.
        // and check if any validation problem has returned.
        let customProblems = events.validating(entity);
        if (customProblems && customProblems.length > 0)
            throw new ValidationError(customProblems);

        // Event to notify that everything is ok and the object will be saved.
        let clone = _.cloneDeep(entity);
        events.beforeSave(clone, true);

        try {
            let created = await this._collection.insertOne(entity);
        } catch (error) {
            if (error instanceof MongoError)
                throw new DatabaseError(SysMsgs.error.databaseLevelError, error);

            throw error;
        }

        // Event to notify that object has been successfuly saved.
        events.afterSave(clone, true);

        return entity._id;
    }

    async update(entity: Entity) {

        let oldEntity: Entity = await this.findOne(entity._id);

        if (!oldEntity)
            throw new DatabaseError(SysMsgs.error.entityNotFound, entity._id, this.entityType.name);

        entity = _.assignIn(oldEntity, entity); // Overwrite old values with new ones.

        let factory = new EntityFactory(this.entityType, entity);
        factory.applyConvention();
        factory.parseDateTimeProperties();

        await Validator.validate(this.entityType, entity, false);

        try {
            let result = await this._collection.updateOne({ _id: entity._id }, entity);
            return result.matchedCount;
        } catch (error) {
            if (error instanceof MongoError)
                throw new DatabaseError(SysMsgs.error.databaseLevelError, error);

            throw error;
        }
    }

    async del(_id: Entity): Promise<number> {
        try {
            return (await this._collection.deleteOne({ _id: _id })).deletedCount;
        } catch (error) {
            if (error instanceof MongoError)
                throw new DatabaseError(SysMsgs.error.databaseLevelError, error);

            throw error;
        }
    }
}