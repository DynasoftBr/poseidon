import * as Ajv from "ajv";

import { Entity, DatabaseError, SysMsgs, EntityType } from "../..";
import { GenericRepositoryInterface } from "./repository-interface";
import { Collection, MongoError, ObjectID, Db, InsertWriteOpResult, InsertOneWriteOpResult } from "mongodb";
import { EventEmitter } from "events";
import _ = require("lodash");
import { AbstractRepositoryFactory } from "./factories/abstract-repository-factory";
import { PropertyType, SysEntities} from "../../constants";
import { SchemaModel } from "json-schema-fluent-builder/lib/models";
import { ValidationProblem } from "./validation-problem";
import { ValidationError } from "./validation-error";

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
            oldEntity = await this.findById(entity._id);

            if (!oldEntity)
                throw new DatabaseError(SysMsgs.error.entityNotFound, entity._id, this.entityType.name);

        } catch (error) {
            this.handleError(error);
        }

        // Overwrite old values with new ones.
        entity = _.assignIn(oldEntity, entity);

        try {
            entity = await this.beforeValidation(entity, false);
        } catch (error) {
            // TODO: Exception
        }

        var problems = await this.validate(this.entityType, entity);

        try {
            // Custom validations.
            problems.push(...await this.validating(entity, false));
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
            this.beforeSave(clone, false);
        } catch (error) {
            // TODO: Exception
        }

        try {
            let result = await this.collection.updateOne({ _id: entity._id }, entity);
        } catch (error) {

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

        var problems = await this.validate(this.entityType, entity);

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

    /**
     * Validates an entity against it's schema.
     * @param entitytype The entity type of the entity to be validated.
     * @param entity The entity to be validated.
     */
    public async validate(entitytype: EntityType, entity: Entity): Promise<ValidationProblem[]> {

        let problems: ValidationProblem[] = [];
        let schemaRepo = await this.repoFactory.createByName(SysEntities.entitySchema);

        var schema = await schemaRepo.findById("");

        // Get schema problems.
        problems.push(...this.validateAgainstJsonSchema(schema, entity));

        // Get linked entity problems.
        problems.push(...await this.validateLinkedEntities(entity, entitytype, this.repoFactory));

        return problems;
    }

    /**
     * Validates the entity against the specified schema.
     * @param schema The schema to validate the entity against.
     */
    private validateAgainstJsonSchema(schema: SchemaModel, entity: Entity): ValidationProblem[] {
        // Instantiates ajv library, compiles the schema, them validates the entity.
        let jsonVal = new Ajv({ allErrors: true, verbose: true });
        let validate = jsonVal.compile(schema);
        let valid = validate(entity);

        // if the obj is not valid, builds the messages and returns a 'ValidationProblem' array.
        if (!valid) {
            let problems: ValidationProblem[] = [];
            validate.errors.forEach(err => {
                problems.push(ValidationProblem.buildMsg(err));
            });

            return problems;
        }

        return [];
    }

    /**
     * Validates if linked entities has valid references and if its linked property values match the referenced entity values.
     * @param entity The entity to be validated.
     * @param entityType The entity type of the to be validated.
     * @param repoFactory A repository factory
     */
    private async validateLinkedEntities(entity: Entity, entityType: EntityType,
        repoFactory: AbstractRepositoryFactory): Promise<ValidationProblem[]> {

        let problems: ValidationProblem[] = [];
        var propsLength = entityType.props.length;

        // Iterate entity properties.
        for (let idx = 0; idx < propsLength; idx++) {
            const prop = entityType.props[idx];

            // Validate only if the entity has a value for this property, the required constraint is validated by json schema. 
            if (prop.validation.type === PropertyType.linkedEntity && entity[prop.name] && entity[prop.name]._id) {

                // Get the repository for the linked entity and try find it.
                let lkdEntityRepo = await repoFactory.createByName(prop.validation.ref.name);

                let lkdEntity = await lkdEntityRepo.findById(entity[prop.name]._id);

                // If we can't find an entity with the linked id, add a validation problem.
                if (lkdEntity == null) {
                    problems.push(new ValidationProblem(prop.name, "linkedEntity", SysMsgs.validation.linkedEntityDoesNotExist,
                        prop.validation.ref.name, entity[prop.name]._id));
                } else {
                    // Iterate the linked properties and check if it equals the lineked entity values.
                    prop.validation.linkedProperties.forEach(lkdProp => {

                        // Check if the value provided in linked properties equals linked entity values.
                        if (!_.isEqual(entity[prop.name][lkdProp.name], lkdEntity[lkdProp.name])) {
                            let p = prop.name + "." + lkdProp.name;
                            problems.push(new ValidationProblem(p, "linkedValue", SysMsgs.validation.divergentLinkedValue, p, lkdEntity[lkdProp.name]));
                        }
                    });
                }
            }
        }

        return problems;
    }

    handleError(error: any) {
        if (error instanceof MongoError)
            throw new DatabaseError(SysMsgs.error.databaseLevelError, error);

        throw error;
    }
} 