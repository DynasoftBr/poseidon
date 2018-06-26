import { AbstractRepository } from "./abstract-repository";
import { EntityType, ConcreteEntity } from "../../models";
import { DataStorage } from "../storage";

export class ConcreteEntityRepository extends AbstractRepository<ConcreteEntity> {

    constructor(storage: DataStorage, entityType: EntityType) {
        super(storage.collection(entityType.name), storage, entityType);
    }

}