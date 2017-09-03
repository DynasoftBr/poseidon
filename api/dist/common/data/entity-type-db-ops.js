"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const _1 = require("./");
const utility_1 = require("../utility");
class EntityTypeDbOps {
    static CreateCollection(entityType) {
        return _1.DataAccess.database.createCollection(entityType.name);
    }
    static CreateIndexes(entityType, collection) {
        let coll = collection || _1.DataAccess.database.collection(entityType.name);
        let idxs = [];
        coll.indexes().then((idx) => {
            // idx
        });
        let length = entityType.props.length;
        for (let idx = 0; idx < length; idx++) {
            let p = entityType.props[idx];
            if (utility_1.Utility.isSimpleType(p)) {
                if (p.validation.indexed) {
                    let idx = {};
                    let idxKeys = {};
                    idxKeys[p.name] = 1;
                    idx.key = idxKeys;
                    idx.unique = p.validation.unique;
                    idx.background = true;
                    idxs.push(idx);
                }
            }
        }
        coll.createIndexes(idxs);
    }
    UpdateIndexes(newEt, oldEt) {
        let idxsToBeCreated = [];
        let idxsToBeDroped = [];
        let coll = _1.DataAccess.database.collection(oldEt.name);
        coll.indexes().then((idxs) => {
        });
        newEt.props.forEach(p => {
            let oldProp = _.find(oldEt.props, { name: p.name });
            if (p.validation.indexed) {
                if (oldProp && oldProp.validation.indexed === false)
                    idxsToBeCreated.push({ key: { "created_by.name": 1 }, unique: true });
            }
        });
    }
    onCreate(entityType) { }
    onUpdate(newEt, oldEt) { }
    onDelete(entityType) { }
}
exports.EntityTypeDbOps = EntityTypeDbOps;
//# sourceMappingURL=entity-type-db-ops.js.map