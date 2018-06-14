import { RepositoryInterface, GenericRepositoryInterface } from "../../../src/data/repositories/repository-interface";
import { AbstractRepositoryFactory } from "../../../src/data/repositories/factories/abstract-repository-factory";
import { EntityType } from "../../../src/models";
import { TestEntityRepository } from "./test-entity-repository";
import { SysEntities } from "../../../src/constants";
import * as LokiDb from "lokijs";
import { BuiltInEntries } from "../../../src";
export class TestRepositoryFactory extends AbstractRepositoryFactory {

    private db: LokiDb;
    private repositories: Array<RepositoryInterface> = [];
    public constructor() {
        super();
        this.db = new LokiDb("test.json");
    }

    async createByName(entityTypeName: string): Promise<RepositoryInterface> {
        if (entityTypeName === SysEntities.entityType)
            return this.entityType();
        else
            return this.createStandardEntityRepository(entityTypeName);
    }

    private async createStandardEntityRepository(entityTypeName: string) {
        let entityTypeRepo = await this.entityType();
        let entityType = await entityTypeRepo.findOne({ name: entityTypeName });

        return new TestEntityRepository(this.db, entityType);
    }

    entityTypeEntry: EntityType;
    async entityType(): Promise<GenericRepositoryInterface<EntityType>> {
        if (this.entityTypeEntry == null) {
            this.entityTypeEntry = new BuiltInEntries().entityType();
            let collection = this.db.getCollection(SysEntities.entityType);

            if (collection == null) {
                collection = this.db.addCollection(SysEntities.entityType);
                collection.insertOne(this.entityTypeEntry);
            }
        }

        return <any>new TestEntityRepository(this.db, this.entityTypeEntry);
    }
}