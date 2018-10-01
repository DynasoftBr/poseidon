import { DataStorage } from "../../src/data/storage";
import { RepositoryFactory, EntityType, BuiltInEntries } from "../../src";
import { PropertyTypes } from "../../src/constants";
import { SysUsers } from "../../src/constants/sys-users";
import { TestEntities } from "../test-entities";

export class TestDatabasePopulator {

    constructor(private readonly storage: DataStorage) { }

    async populate() {
        const testEntities = new TestEntities();

        const repoFactory = new RepositoryFactory(this.storage);
        const entityTypeRepo = await repoFactory.entityType();

        await Promise.all([
            entityTypeRepo.insertOne(testEntities.simpleAbstractEntityType),
            entityTypeRepo.insertOne(testEntities.simpleLinkedEntityType),
            entityTypeRepo.insertOne(testEntities.complexAbstractEntityType),
            entityTypeRepo.insertOne(testEntities.complexLinkedEntityType),
            entityTypeRepo.insertOne(testEntities.fullEntityType)
        ]);

        const simpleLinkedEntityTypeRepo = await repoFactory.createByName(testEntities.simpleLinkedEntityType.name);
        const complexLinkedEntityTypeRepo = await repoFactory.createByName(testEntities.complexLinkedEntityType.name);
        const fullEntityTypeRepo = await repoFactory.createByName(testEntities.fullEntityType.name);

        await Promise.all([
            simpleLinkedEntityTypeRepo.insertOne(testEntities.simpleLinkedEntityEntry),
            complexLinkedEntityTypeRepo.insertOne(testEntities.complexLinkedEntityEntry),
            fullEntityTypeRepo.insertOne(testEntities.fullEntityEntry)
        ]);
    }
}