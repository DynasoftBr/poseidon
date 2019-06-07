import { AbstractRepository } from "./abstract-repository";
import { IDataStorage } from "../storage";
import { IConcreteEntity, IEntityType } from "@poseidon/core-models";

export class ConcreteEntityRepository extends AbstractRepository<IConcreteEntity> {

    constructor(storage: IDataStorage, entityType: IEntityType) {
        super(storage.collection(entityType.name), storage, entityType);
    }

}