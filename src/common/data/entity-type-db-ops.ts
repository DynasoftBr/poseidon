import * as _ from "lodash";

import { EntityType } from "../models";
import { DataAccess } from "./";
import { Collection } from "mongodb";
import { SimpleTypes } from "../models/constants/simple-types";
import { Utility } from "../utility";
import { SchemaBuilder } from "./validation/schema-builder";

export class EntityTypeDbOps {

    public static CreateCollection(entityType: EntityType): Promise<Collection<any>> {
        return DataAccess.database.createCollection(entityType.name);
    }

    public static CreateIndexes(entityType: EntityType, collection: Collection<any>) {
        let coll = collection || DataAccess.database.collection(entityType.name);
        let idxs: any[] = [];
        coll.indexes().then((idx) => {
            // idx
        });
        let length = entityType.props.length;
        for (let idx = 0; idx < length; idx++) {
            let p = entityType.props[idx];

            if (Utility.isSimpleType(p)) {
                if (p.validation.indexed) {

                    let idx: any = {};
                    let idxKeys: any = {};

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

    UpdateIndexes(newEt: EntityType, oldEt: EntityType) {
        let idxsToBeCreated: any[] = [];
        let idxsToBeDroped: any[] = [];
        let coll = DataAccess.database.collection(oldEt.name);
        coll.indexes().then((idxs: any) => {

        });
        newEt.props.forEach(p => {
            let oldProp = _.find(oldEt.props, { name: p.name });
            if (p.validation.indexed) {
                if (oldProp && oldProp.validation.indexed === false)
                    idxsToBeCreated.push({ key: { "createdBy.name": 1 }, unique: true });
            }
        });
    }

    onCreate(entityType: EntityType) {
    }

    onUpdate(newEt: EntityType, oldEt: EntityType) { }

    onDelete(entityType: EntityType) { }
}