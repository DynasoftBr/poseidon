import { RepositoryFactory, EntityTypeRepository } from "../src/data/repositories";
import { BuiltInEntries, InMemoryStorage, DatabasePopulator } from "../src/data";
import { EntityType } from "../src/models";
import { TestDatabasePopulator } from "./data/test-database-populator";
import { SysEntities } from "../src/constants";
import { TestEntities } from "./test-entities";
import { expect } from "chai";
import { SchemaValidator } from "../src/validation/general/schema-validator";

describe("Test entities validation", () => {
    let repositoryFactory: RepositoryFactory;
    let entityTypeRepo: EntityTypeRepository;
    let entityType: EntityType;
    let testEntities: TestEntities;

    before(async () => {
        const storage = new InMemoryStorage();
        await storage.connect();

        const populator = new DatabasePopulator(storage);
        const testPopulator = new TestDatabasePopulator(storage);

        await populator.populate();
        await testPopulator.populate();

        repositoryFactory = new RepositoryFactory(storage);
        entityTypeRepo = await repositoryFactory.entityType();
        entityType = await entityTypeRepo.findById(SysEntities.entityType);

        testEntities = new TestEntities();
    });

    // it("Simple abstract entity type is valid", async () => {
    //     const problems = await EntityValidator.validate(entityType, testEntities.simpleAbstractEntityType, repositoryFactory);

    //     expect(problems).to.have.length(0);
    // });

    // it("Simple linked entity type is valid", async () => {
    //     const problems = await EntityValidator.validate(entityType, testEntities.simpleLinkedEntityType, repositoryFactory);

    //     expect(problems).to.have.length(0);
    // });

    // it("Complex abstract entity type is valid", async () => {
    //     const problems = await EntityValidator.validate(entityType, testEntities.complexAbstractEntityType, repositoryFactory);

    //     expect(problems).to.have.length(0);
    // });

    // it("Complex linked entity type is valid", async () => {
    //     const problems = await EntityValidator.validate(entityType, testEntities.complexLinkedEntityType, repositoryFactory);

    //     expect(problems).to.have.length(0);
    // });

    // it("Full entity type with all property options is valid", async () => {
    //     const problems = await EntityValidator.validate(entityType, testEntities.complexLinkedEntityType, repositoryFactory);

    //     expect(problems).to.have.length(0);
    // });

    // it("Simple linked entity test entry is valid", async () => {
    //     const problems = await EntityValidator.validate(testEntities.simpleLinkedEntityType, testEntities.simpleLinkedEntityEntry, repositoryFactory);

    //     expect(problems).to.have.length(0);
    // });

    // it("Complex linked entity test entry is valid", async () => {
    //     const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, testEntities.complexLinkedEntityEntry, repositoryFactory);

    //     expect(problems).to.have.length(0);
    // });

    // it("Full entity type test entry is valid", async () => {
    //     const problems = await EntityValidator.validate(testEntities.fullEntityType, testEntities.fullEntityEntry, repositoryFactory);

    //     expect(problems).to.have.length(0);
    // });
});