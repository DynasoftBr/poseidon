"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const _ = require("lodash");
const _1 = require("../");
const _2 = require("../");
const data_connection_1 = require("./data-connection");
const models_1 = require("../models");
const validation_1 = require("./validation");
const entity_repository_events_1 = require("./entity-repository-events");
const database_error_1 = require("./database-error");
class EntityRepository {
    constructor() {
    }
    static getInstance(entityType) {
        if (EntityRepository._instance) {
            EntityRepository._instance.entityType = entityType;
            EntityRepository._instance._collection = data_connection_1.DataAccess.database.collection(entityType.name);
            return EntityRepository._instance;
        }
        else {
            EntityRepository._instance = new EntityRepository();
            return EntityRepository.getInstance(entityType);
        }
    }
    static getRepositoty(entityTypeName) {
        return new Promise((resolve, reject) => {
            // Check if database connection id open before continue.
            if (!data_connection_1.DataAccess.database)
                return reject(new database_error_1.DatabaseError(_1.SysMsgs.error.databaseConnectionClosed));
            data_connection_1.DataAccess.database.collection(models_1.SysEntities.entityType)
                .findOne({ name: entityTypeName }).then((etType) => {
                if (etType === null)
                    reject(new database_error_1.DatabaseError(_1.SysMsgs.error.entityTypeNotFound, entityTypeName));
                else if (etType.abstract)
                    reject(new database_error_1.DatabaseError(_1.SysMsgs.error.abstractEntityType, entityTypeName));
                else {
                    resolve(EntityRepository.getInstance(etType));
                }
            }).catch((err) => reject(_2.SysError.unexpectedError(err)));
        });
    }
    findAll(skip = 0, limit = 500) {
        return new Promise((resolve, reject) => {
            this._collection.find().skip(skip).limit(limit).toArray().then((result) => {
                resolve(result);
            }).catch((err) => {
                reject(_2.SysError.unexpectedError(err));
            });
        });
    }
    findOne(id) {
        return new Promise((resolve, reject) => {
            this._collection.findOne({ _id: id }).then((result) => {
                resolve(result);
            }).catch((err) => {
                reject(_2.SysError.unexpectedError(err));
            });
        });
    }
    query(mquery) {
        return new Promise((resolve, reject) => {
            this._collection.find(mquery).toArray().then((result) => {
                resolve(result);
            }).catch((err) => {
                reject(_2.SysError.unexpectedError(err));
            });
        });
    }
    create(entity) {
        return new Promise((resolve, reject) => {
            let factory = new validation_1.EntityFactory(this.entityType, entity);
            factory.ensureIdProperty();
            factory.applyDefaults();
            factory.applyConvention();
            factory.parseDateTimeProperties();
            if (this.entityType.name === models_1.SysEntities.entityType)
                factory.addReserverdPropsEtType();
            entity = factory.entity;
            entity._id = new mongodb_1.ObjectID().toHexString();
            let events = new entity_repository_events_1.EntityRepositoryEvents(this.entityType);
            // entity = events.beforeValidation(entity);
            validation_1.Validator.validate(this.entityType, entity, true).then(() => {
                let customProblems = events.validating(entity);
                if (customProblems && customProblems.length > 0)
                    return reject(new validation_1.ValidationError(customProblems));
                let clone = _.cloneDeep(entity);
                events.beforeSave(clone, true);
                this._collection.insertOne(entity).then((res) => {
                    events.afterSave(clone, true);
                    return resolve(entity._id);
                }).catch((err) => reject(new database_error_1.DatabaseError(_1.SysMsgs.error.databaseLevelError, err.message)));
            }).catch((err) => reject(err));
        });
    }
    update(entity) {
        return new Promise((resolve, reject) => {
            let oldEntity;
            this.findOne(entity._id).then((res) => {
                if (!res)
                    reject(new database_error_1.DatabaseError(_1.SysMsgs.error.entityNotFound, entity._id, this.entityType.name));
                oldEntity = res;
                entity = _.assignIn(oldEntity, entity); // Overwrite old values with new ones.
                let factory = new validation_1.EntityFactory(this.entityType, entity);
                factory.applyConvention();
                factory.parseDateTimeProperties();
                validation_1.Validator.validate(this.entityType, entity, false).then(() => {
                    this._collection.updateOne({ _id: entity._id }, entity).then((res) => {
                        return resolve();
                    }).catch((err) => reject(new database_error_1.DatabaseError(_1.SysMsgs.error.databaseLevelError, err.message)));
                }).catch((err) => reject(err));
            }).catch((err) => reject(new database_error_1.DatabaseError(_1.SysMsgs.error.databaseLevelError, err.message)));
        });
    }
    del(_id) {
        return new Promise((resolve, reject) => {
            this._collection.deleteOne({ _id: _id }).then((res) => {
                resolve(res.deletedCount);
            }).catch((err) => reject(new database_error_1.DatabaseError(_1.SysMsgs.error.databaseLevelError, err.message)));
        });
    }
}
exports.EntityRepository = EntityRepository;
//# sourceMappingURL=entity-repository.js.map