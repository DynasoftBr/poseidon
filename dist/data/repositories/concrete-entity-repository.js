"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_repository_1 = require("./abstract-repository");
class ConcreteEntityRepository extends abstract_repository_1.AbstractRepository {
    constructor(storage, entityType) {
        super(storage.collection(entityType.name), storage, entityType);
    }
}
exports.ConcreteEntityRepository = ConcreteEntityRepository;
//# sourceMappingURL=concrete-entity-repository.js.map