import { EntityType, ConcreteEntity } from "../models";
import { Service } from "./service";
import { AbstractRepositoryFactory, Repository, DatabaseError } from "../data";
import { SysMsgs } from "..";
import { ValidationError } from "../validation/validation-error";
import { ValidationProblem } from "../validation/validation-problem";
import *  as _ from "lodash";
import { ObjectID } from "bson";
import { EntityValidator } from "../validation/entity-validator";

export abstract class AbstractService<T extends ConcreteEntity> implements Service<T> {

    protected entityType: EntityType;
    private validators: EntityValidator[] = [];
    constructor(protected repo: Repository<T>, protected repoFactory: AbstractRepositoryFactory) {
        this.entityType = repo.entityType;
    }

    async findMany(filter: object, skip?: number, limit?: number, sort?: object): Promise<T[]> {
        return await this.repo.findMany(filter, skip, limit, sort);
    }

    async findOne(filter: object): Promise<T> {
        return await this.repo.findOne(filter);
    }

    async insertOne(entity: T): Promise<T> {
        try {
            entity = await this.beforeValidation(entity, true);
        } catch (error) {
            // TODO: Exception
        }

        entity._id = new ObjectID().toHexString();

        const problems = await this.validate(entity);

        try {
            // call validation event to allow custom validation.
            // And add any validation problem returned.
            problems.push(...await this.validating(entity, true));
        } catch (error) {
            // TODO: Exception
        }

        // If the array has validation problems, throw an error.
        if (problems.length > 0) throw new ValidationError(problems);

        // Event to notify that everything is ok and the object will be saved.
        // Passing a clone as parameter to avoid object being changed after validations
        const clone = _.cloneDeep(entity);

        try {
            this.beforeSave(clone, true);
        } catch (error) {
            // TODO: Exception
        }

        try {
            await this.repo.insertOne(entity);
        } catch (error) {
            // TODO: Exception
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

    async deleteOne(id: string): Promise<boolean> {
        return await this.repo.deleteOne(id);
    }

    async updateOne(id: string, entity: T): Promise<T> {
        let oldEntity: T;
        try {
            // Find existent entity.
            oldEntity = await this.repo.findById(entity._id);

            if (!oldEntity)
                throw new DatabaseError(SysMsgs.error.entityNotFound, entity._id, this.entityType.name);

        } catch (error) {
            // TODO: Exception
        }

        // Overwrite old values with new ones.
        entity = _.assignIn(oldEntity, entity);

        try {
            entity = await this.beforeValidation(entity, false, oldEntity);
        } catch (error) {
            // TODO: Exception
        }

        const problems = await this.validate(entity);

        try {
            // Custom validations.
            problems.push(...await this.validating(entity, false, oldEntity));
        } catch (error) {
            // TODO: Exception
        }

        // If the array has validation problems, throw an error.
        if (problems.length)
            throw new ValidationError(problems);

        // Event to notify that everything is ok and the object will be saved.
        // Passing a clone as parameter to avoid object being changed after validations
        const clone = _.cloneDeep(entity);

        try {
            this.beforeSave(clone, false, oldEntity);
        } catch (error) {
            // TODO: Exception
        }

        try {
            const result = await this.repo.updateOne(id, entity);
        } catch (error) {

        }

        try {
            this.afterSave(clone, false, oldEntity);
        } catch (error) {
            // TODO: Exception
        }
        return entity;
    }

    protected addValidator(validator: EntityValidator): void {
        this.validators.push(validator);
    }

    protected async validate(entity: T) {
        const length = this.validators.length;
        const promises: Promise<ValidationProblem[]>[] = [];
        for (let idx = 0; idx < length; idx++) {
            const validator = this.validators[idx];

            promises.push(validator.validate(entity));
        }

        const problems: ValidationProblem[] = [];
        (await Promise.all(promises)).map(el => problems.push(...el));

        return problems;
    }

    //#region Event handlers methods to be overridem by concrete types

    protected async beforeValidation(entity: T, isNew: boolean, old?: T): Promise<T> { return entity; }
    protected async validating(entity: T, isNew: boolean, old?: T)
        : Promise<ValidationProblem[]> { return []; }
    protected async beforeSave(entity: T, isNew: boolean, old?: T): Promise<boolean> { return true; }
    protected async afterSave(entity: T, isNew: boolean, old?: T): Promise<void> { }
    protected async beforeDelete(entity: T): Promise<boolean> { return true; }
    protected async afterDelete(entity: T): Promise<void> { }
    //#endregion

}