const { VM } = require("vm2");

import { Entity, EntityType } from "../models";
import { ValidationProblem } from "./validation";

export class EntityRepositoryEvents {

    private VM: any;
    constructor(public entityType: EntityType) {

    }

    beforeValidation(entity: Entity): Entity {
        if (!this.entityType.beforeValidation)
            return entity;

        let fun = Buffer.from(this.entityType.beforeValidation, "base64").toString("hex");
        let vm = new VM({
            timeout: 5000,
            sandbox: { entity }
        });

        let retEntity = vm(fun);

        return retEntity;
    }

    validating(entity: Entity): ValidationProblem[] {
        return [];
    }

    beforeSave(entity: Entity, isNew: boolean): boolean {
        return true;
    }

    afterSave(entity: Entity, isNew: boolean) {

    }

    beforeDelete(entity: Entity): boolean {
        return true;
    }

    afterDelete() {

    }
}