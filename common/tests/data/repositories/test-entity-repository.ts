import { Entity, EntityType } from "../../../src";
import { GenericRepositoryInterface } from "../../../src/data/repositories/repository-interface";
import * as LokiDb from "lokijs";
import { Db } from "mongodb";
import _ = require("lodash");

export class TestEntityRepository implements GenericRepositoryInterface<Entity> {

    collection: Collection<Entity>;
    constructor(private db: LokiDb, public readonly entityType: EntityType) {
        this.collection = db.getCollection(entityType.name);

        if (this.collection == null)
            this.collection = db.addCollection<Entity>(entityType.name);
    }

    async deleteOne(_id: string): Promise<number> {
        let res = this.collection.removeWhere(et => et._id == _id);
        return 1;
    }

    async update(entity: Entity): Promise<Entity> {
        let res = this.collection.updateWhere((et: Entity) => et._id == entity._id, (oldEntity) => {
            _.assignIn(oldEntity, entity);
        });

        return entity;
    }
    async insertOne(entity: Entity): Promise<Entity> {
        entity._id = this.guid();
        let res = this.collection.updateWhere((et: Entity) => et._id == entity._id, (oldEntity) => {
            _.assignIn(oldEntity, entity);
        });

        return entity;
    }
    async findById(id: string): Promise<Entity> {
        return this.collection.findOne({ _id: id });
    }

    async find(filter: object, skip: number, limit: number): Promise<Entity[]> {
        return this.collection.find(filter);
    }

    async findOne(filter: object): Promise<Entity> {
        return this.collection.findOne(filter);
    }

    private guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
    }
}