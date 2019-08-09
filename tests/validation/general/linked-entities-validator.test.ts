// import { expect } from "chai";
// import { describe } from "mocha";

// import { RepositoryFactory } from "../../../src/data/repositories";
// import { BuiltInEntries, InMemoryStorage, DatabasePopulator } from "../../../src/data";
// import { TestEntities } from "../../test-entities";
// import { TestDatabasePopulator } from "../../data/test-database-populator";
// import { TestProperties } from "../../constants/test-properties";

// let repositoryFactory: RepositoryFactory;
// let testEntities: TestEntities;

// before(async () => {
//     const storage = new InMemoryStorage();
//     await storage.connect();

//     const populator = new DatabasePopulator(storage);
//     const testPopulator = new TestDatabasePopulator(storage);

//     await populator.populate();
//     await testPopulator.populate();

//     repositoryFactory = new RepositoryFactory(storage);

//     testEntities = new TestEntities();
// });

// describe("Linked properties validator", () => {
//     it("Linked entity id must be valid", async () => {
//         const entity = testEntities.complexLinkedEntityEntry;

//         entity.linkedEntityProp._id = "teste";

//         const problems = await new LinkedEntitiesValidator(testEntities.complexLinkedEntityType,
//             repositoryFactory).validate(entity);

//         expect(problems).to.have.length(1);
//         expect(problems[0]).to.contains(<ValidationProblem>{
//             property: TestProperties.linkedEntityProp,
//             keyword: ProblemKeywords.invalidLinkedEntityId
//         });
//     });

//     it("Linked property value can't be different from source", async () => {
//         const entity = testEntities.complexLinkedEntityEntry;

//         entity.linkedEntityProp.stringProp = "teste";

//         const problems = await new LinkedEntitiesValidator(testEntities.complexLinkedEntityType,
//             repositoryFactory).validate(entity);

//         expect(problems).to.have.length(1);
//         expect(problems[0]).to.contains(<ValidationProblem>{
//             property: TestProperties.linkedEntityProp + "." + TestProperties.stringProp,
//             keyword: ProblemKeywords.invalidLinkedValue
//         });
//     });
// });