import { Collection, MongoError, ObjectID } from "mongodb";
import * as _ from "lodash";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { SchemaBuilderCore, SchemaBuilderGeneric } from "json-schema-fluent-builder/lib/builders";

import { SysMsgs, SysError, ValidationError, DatabaseError, RequestError } from "../exceptions";
import { DataAccess } from "./data-access";
import { EntityType, Entity } from "../models";
import { ValidateMsg, Validator } from "./validation";
import { PropertyConvention, PropertyType } from "../models/constants";


export class EntityRepository {

    private _collection: Collection;

    private constructor(protected entityType: EntityType) {
        this._collection = DataAccess.database.collection(entityType.name);
    }

    static getRepositoty(entityTypeName: string): Promise<EntityRepository> {
        return new Promise((resolve, reject) => {

            DataAccess.database.collection("entity_type").findOne({ name: entityTypeName }).then((result) => {
                if (result === null)
                    reject(RequestError.entityTypeNotFound(entityTypeName));
                else {
                    let et: EntityType = result;

                    if (et.abstract)
                        reject(RequestError.abstractEntityType(entityTypeName));
                    else
                        resolve(new EntityRepository(result));
                }

            }).catch((err) => {
                reject(SysError.unexpectedError(err));
            });
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

    create(entity: Entity): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            Validator.prepare(this.entityType, entity);

            if (this.entityType.name === "entity_type") {
                this.buildAndSaveSchema(<EntityType>entity);
            }
            Validator.validate(this.entityType, entity).then(() => {

                this._collection.insertOne(entity).then((res) => {

                    return resolve();

                }).catch((err: MongoError) => reject(new DatabaseError(err.message)));

            }).catch((problems: ValidateMsg[]) => reject(new ValidationError(problems)));

        });
    }

    update(entity: Entity): Promise<void> {
        let oldEntity: Entity;

        this.findOne(entity._id).then((res) => {
            if (!res)
                reject(RequestError.entityNotFound(entity._id, this.entityType.name);
                        
            oldEntity = res;

            entity = _.assignIn(oldEntity, entity); // Overwrite old values with new ones.


        }).catch((err: MongoError) => reject(new DatabaseError(err.message)));
    }

    save(entity: Entity): Promise<void> {
        if (entity._id)
            return this.update(entity);
        else
            return this.create(entity);
    }

    del(_id: Entity): Promise<number> {
        return new Promise<number>((resolve, reject) => {

            this._collection.deleteOne({ _id: _id }).then((res) => {

                resolve(res.deletedCount);

            }).catch((err: MongoError) => reject(new DatabaseError(err.message)));

        });
    }

    private newEmptyEntity() {
        return {
            _id: new ObjectID().toHexString(),
            created_at: new Date(),
            created_by: "root",
            updated_at: new Date(),
            updated_by: "root"
        };
    }

    
}