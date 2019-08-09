import { RepositoryFactory, EntityTypeRepository } from "../src/data/repositories";
import { InMemoryStorage, DatabasePopulator } from "../src/data";
import { TestDatabasePopulator } from "./data/test-database-populator";

describe("Test entities validation", () => {
    let repositoryFactory: RepositoryFactory;
    let entityTypeRepo: EntityTypeRepository;

    before(async () => {
        const storage = new InMemoryStorage();
        await storage.connect();

        const populator = new DatabasePopulator(storage);
        const testPopulator = new TestDatabasePopulator(storage);

        await populator.populate();
        await testPopulator.populate();

        repositoryFactory = new RepositoryFactory(storage);
        entityTypeRepo = await repositoryFactory.entityType();

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