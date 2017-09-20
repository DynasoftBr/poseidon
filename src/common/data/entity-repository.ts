import { Collection, MongoError, ObjectID, Db } from "mongodb";
import * as _ from "lodash";

import { SysMsgs } from "../";
import { SysError } from "../";
import { DataAccess, DataConnection } from "./data-connection";
import { EntityType, Entity, SysEntities } from "../models";
import { ValidationError, ValidationProblem, Validator, EntityFactory } from "./validation";
import { EntityRepositoryEvents } from "./entity-repository-events";
import { DatabaseError } from "./database-error";

export class EntityRepository {
    private static _instances: EntityRepository[] = [];
    private _collection: Collection;

    protected constructor(protected entityType: EntityType) {
        this._collection = DataAccess.database.collection(entityType.name);
    }

    static getRepositoty(entityTypeName: string): Promise<EntityRepository> {
        return new Promise((resolve, reject) => {
            // Check if database connection id open before continue.
            if (!DataAccess.database)
                return reject(new DatabaseError(SysMsgs.error.databaseConnectionClosed));
            
            DataAccess.database.collection(SysEntities.entityType)
                .findOne({ name: entityTypeName }).then((etType: EntityType) => {
                    if (etType == null)
                        reject(new DatabaseError(SysMsgs.error.entityTypeNotFound, entityTypeName));
                    else if (etType.abstract)
                        reject(new DatabaseError(SysMsgs.error.abstractEntityType, entityTypeName));
                    else {
                        resolve(this.getInstance(etType));
                    }

                }).catch((err) => reject(SysError.unexpectedError(err)));
        });
    }

    private static getInstance(entityType: EntityType): EntityRepository {
        let repo = _.find(this._instances, (r) => {
            return r._collection.collectionName === entityType.name;
        });

        if (repo) {
            repo.entityType = entityType;
            repo._collection = DataAccess.database.collection(entityType.name);
        }
        else {
            repo = new EntityRepository(entityType);
            this._instances.push(repo);
        }

        return repo;
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
            factory.applyDefaults();
            factory.applyConvention();
            factory.parseDateTimeProperties();

            if (this.entityType.name === SysEntities.entityType)
                factory.addReserverdPropsEtType();

            entity = factory.entity;
            entity._id = new ObjectID().toHexString();

            let events = new EntityRepositoryEvents(this.entityType);
            // entity = events.beforeValidation(entity);

            entity._version = 1;

            Validator.validate(this.entityType, entity, true).then(() => {
                let customProblems = events.validating(entity);
                if (customProblems && customProblems.length > 0)
                    return reject(new ValidationError(customProblems));

                let clone = _.cloneDeep(entity);
                events.beforeSave(clone, true);

                this._collection.insertOne(entity).then((res) => {
                    events.afterSave(clone, true);

                    return resolve(entity._id);

                }).catch((err: MongoError) => {
                    reject(new DatabaseError(SysMsgs.error.databaseLevelError, err.message));
                });

            }).catch((err: ValidationError) => reject(err));
        });
    }

    update(entity: Entity): Promise<void> {
        return new Promise<void>((resolve, reject) => {

            let oldEntity: Entity;
            if (entity._version == null)
                reject(new SysError("System", SysMsgs.error.missingVersionNumber));

            this._collection.findOne({ _id: entity._id, _version: entity._version })
                .then((res) => {
                    if (!res)
                        reject(new DatabaseError(SysMsgs.error.entityNotFound, entity._id, this.entityType.name));

                    oldEntity = res;
                    entity = _.assignIn(oldEntity, entity); // Overwrite old values with new ones.
                    entity._version++;

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