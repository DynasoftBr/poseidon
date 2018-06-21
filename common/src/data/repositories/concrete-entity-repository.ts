import { AbstractRepository } from "./abstract-repository";
import { Entity, EntityType, ConcreteEntity } from "../../models";
import { SysEntities } from "../../constants";
import { DataStorage } from "../storage";

export class ConcreteEntityRepository extends AbstractRepository<ConcreteEntity> {

    constructor(storage: DataStorage, entityType: EntityType) {
        super(storage.collection(entityType.name), storage, entityType);
    }

}