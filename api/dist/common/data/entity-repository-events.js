"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { VM } = require("vm2");
class EntityRepositoryEvents {
    constructor(entityType) {
        this.entityType = entityType;
    }
    beforeValidation(entity) {
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
    validating(entity) {
        return [];
    }
    beforeSave(entity, isNew) {
        return true;
    }
    afterSave(entity, isNew) {
    }
    beforeDelete(entity) {
        return true;
    }
    afterDelete() {
    }
}
exports.EntityRepositoryEvents = EntityRepositoryEvents;
//# sourceMappingURL=entity-repository-events.js.map