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
    private static _instance: EntityRepository;
    private _collection: Collection;
    protected entityType: EntityType;

    private constructor() {
    }

    private static getInstance(entityType: EntityType): EntityRepository {
        if (EntityRepository._instance) {
            EntityRepository._instance.entityType = entityType;
            EntityRepository._instance._collection = DataAccess.database.collection(entityType.name);

            return EntityRepository._instance;
        }
        else {
            EntityRepository._instance = new EntityRepository();
            return EntityRepository.getInstance(entityType);
        }

    }

    static getRepositoty(entityTypeName: string): Promise<EntityRepository> {
        return new Promise((resolve, reject) => {

            // Check if database connection id open before continue.
            if (!DataAccess.database)
                return reject(new DatabaseError(SysMsgs.error.databaseConnectionClosed));

            DataAccess.database.collection(SysEntities.entityType)
                .findOne({ name: entityTypeName }).then((etType: EntityType) => {
                    if (etType === null)
                        reject(new DatabaseError(SysMsgs.error.entityTypeNotFound, entityTypeName));
                    else if (etType.abstract)
                        reject(new DatabaseError(SysMsgs.error.abstractEntityType, entityTypeName));
                    else {
                        resolve(EntityRepository.getInstance(etType));
                    }

                }).catch((err) => reject(SysError.unexpectedError(err)));
        });
    }

    findAll(skip: number = 0, limit: number = 500): Promise<Entity[]> {
        return new Promise((resolve, reject) => {
            this._collection.find().skip(skip).limit(limit).toArray().then((result) => {
                resolve(result);
            }).catch((err) => {
                reject(SysError.unexpectedError(err));
            });
        });
    }

    findOne(id: string): Promise<Entity> {
        return new Promise((resolve, reject) => {
            this._collection.findOne({ _id: id }).then((result) => {

                resolve(result);

            }).catch((err) => {
                reject(SysError.unexpectedError(err));
            });
        });
    }

    query(mquery: object): Promise<Entity[]> {
        return new Promise((resolve, reject) => {
            this._collection.find(mquery).toArray().then((result) => {

                resolve(result);

            }).catch((err) => {
                reject(SysError.unexpectedError(err));
            });
        });
    }

    create(entity: Entity): Promise<string> {
        return new Promise<string>((resolve, reject) => {

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

            Validator.validate(this.entityType, entity, true).then(() => {
                let customProblems = events.validating(entity);
                if (customProblems && customProblems.length > 0)
                    return reject(new ValidationError(customProblems));

                let clone = _.cloneDeep(entity);
                events.beforeSave(clone, true);

                this._collection.insertOne(entity).then((res) => {
                    events.afterSave(clone, true);

                    return resolve(entity._id);

                }).catch((err: MongoError) => reject(new DatabaseError(SysMsgs.error.databaseLevelError, err.message)));

            }).catch((err: ValidationError) => reject(err));
        });
    }

    update(entity: Entity): Promise<void> {
        return new Promise<void>((resolve, reject) => {

            let oldEntity: Entity;

            this.findOne(entity._id).then((res) => {
                if (!res)
                    reject(new DatabaseError(SysMsgs.error.entityNotFound, entity._id, this.entityType.name));

                oldEntity = res;
                entity = _.assignIn(oldEntity, entity); // Overwrite old values with new ones.

                let factory = new EntityFactory(this.entityType, entity);
                factory.applyConvention();
                factory.parseDateTimeProperties();


                Validator.validate(this.entityType, entity, false).then(() => {
                    this._collection.updateOne({ _id: entity._id }, entity).then((res) => {

                        return resolve();

                    }).catch((err: MongoError) => reject(new DatabaseError(SysMsgs.error.databaseLevelError, err.message)));

                }).catch((err: ValidationError) => reject(err));

            }).catch((err: MongoError) => reject(new DatabaseError(SysMsgs.error.databaseLevelError, err.message)));

        });
    }

    del(_id: Entity): Promise<number> {
        return new Promise<number>((resolve, reject) => {

            this._collection.deleteOne({ _id: _id }).then((res) => {

                resolve(res.deletedCount);

            }).catch((err: MongoError) => reject(new DatabaseError(SysMsgs.error.databaseLevelError, err.message)));

        });
    }
}