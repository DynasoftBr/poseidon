import { Entity, EntityType } from "../models";
import { ValidationProblem } from "./validation";
export declare class EntityRepositoryEvents {
    entityType: EntityType;
    private VM;
    constructor(entityType: EntityType);
    beforeValidation(entity: Entity): Entity;
    validating(entity: Entity): ValidationProblem[];
    beforeSave(entity: Entity, isNew: boolean): boolean;
    afterSave(entity: Entity, isNew: boolean): void;
    beforeDelete(entity: Entity): boolean;
    afterDelete(): void;
}
