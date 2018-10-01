import { InMemoryStorage } from "../../../src/data/storage/in-memory/in-memory-storage";
import { RepositoryFactory, BuiltInEntries, EntityTypeRepository } from "../../../src";
import { expect } from "chai";
import { describe } from "mocha";
import { EntityType } from "../../../src/models";
import { PropertyTypes, SysEntities, SysProperties, ProblemKeywords } from "../../../src/constants";
import { EntityValidator } from "../../../src/data/validation/entity-validator";
import { SysUsers } from "../../../src/constants/sys-users";
import { ValidationProblem } from "../../../src/data/validation/validation-problem";
import { DatabasePopulator } from "../../../src/data/database-populator";
import { TestDatabasePopulator } from "../test-database-populator";
import { TestEntities } from "../../test-entities";
import { TestProperties } from "../../constants/test-properties";

describe("Entity Validator Test", () => {

    let repositoryFactory: RepositoryFactory;
    let builtIn: BuiltInEntries;
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

        builtIn = new BuiltInEntries();
        testEntities = new TestEntities();
    });

    describe("String properties validation", () => {
        it("String doesn't accept other value types", async () => {
            const entity: any = await testEntities.simpleLinkedEntityEntry;

            entity.stringProp = 10;
            const problems = await EntityValidator.validate(testEntities.simpleLinkedEntityType, entity, repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: TestProperties.stringProp,
                keyword: ProblemKeywords.type
            });
        });

        it("String can't be longer then expecified 'max'", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.stringProp = "AAAA";

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: TestProperties.stringProp,
                keyword: ProblemKeywords.maxLength
            });
        });

        it("String can't be shorter then expecified 'min'", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.stringProp = "A";

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: TestProperties.stringProp,
                keyword: ProblemKeywords.minLength
            });
        });

        it("String must match 'pattern'", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.stringProp = "aaa";

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: TestProperties.stringProp,
                keyword: ProblemKeywords.pattern
            });
        });
    });

    describe("Int properties validation", () => {
        it("Int doesn't accept float values", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.intProp = 10.1;

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(2);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: TestProperties.intProp,
                keyword: ProblemKeywords.type
            });
        });

        it("Int can't be greater than 'max'.", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.intProp = 40;

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: TestProperties.intProp,
                keyword: ProblemKeywords.maximum
            });
        });

        it("Int can't be lower than 'min'.", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.intProp = 0;

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: TestProperties.intProp,
                keyword: ProblemKeywords.minimum
            });
        });

        it("Int must respect 'multipleOf'.", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.intProp = 15;

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: TestProperties.intProp,
                keyword: ProblemKeywords.multipleOf
            });
        });
    });

    describe("Number properties validation", () => {
        it("Number doesn't accept other values types", async () => {
            const entity: any = testEntities.complexLinkedEntityEntry;

            entity.numberProp = "15";

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: TestProperties.numberProp,
                keyword: ProblemKeywords.type
            });
        });

        it("Number accept decimal/float values", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.numberProp = 10.0000000001;

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(0);
        });

        it("Number can't be greater than 'max'.", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.numberProp = 30.0000000001;

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: TestProperties.numberProp,
                keyword: ProblemKeywords.maximum
            });
        });

        it("Number can't be lower than 'min'.", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.numberProp = 9.9999999999;

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: TestProperties.numberProp,
                keyword: ProblemKeywords.minimum
            });
        });

        it("Number must respect 'multipleOf'.", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.numberProp = 10.00000000001;

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: TestProperties.numberProp,
                keyword: ProblemKeywords.multipleOf
            });
        });
    });

    describe("DateTime properties validation", () => {
        it("DateTime property doesn't accept other values", async () => {
            const entity: any = testEntities.complexLinkedEntityEntry;

            entity.dateTimeProp = "";

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: TestProperties.dateTimeProp,
                keyword: ProblemKeywords.format
            });
        });

        it("DateTime property accept javascript Date object", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.dateTimeProp = new Date();

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(0);
        });
    });

    describe("Boolean properties validation", () => {
        it("Boolean property doesn't accept other values", async () => {
            const entity: any = testEntities.complexLinkedEntityEntry;

            entity.booleanProp = "";

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: TestProperties.booleanProp,
                keyword: ProblemKeywords.type
            });
        });
    });

    describe("Array properties validation", () => {
        it("Array property doesn't accept other values", async () => {
            const entity: any = testEntities.complexLinkedEntityEntry;

            entity.arrayOfSimpleTypeProp = "";

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: TestProperties.arrayOfSimpleTypeProp,
                keyword: ProblemKeywords.type
            });
        });

        it("Array must respect the 'max' attribute.", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.arrayOfSimpleTypeProp = ["AAA", "AAA", "AAA"];

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: TestProperties.arrayOfSimpleTypeProp,
                keyword: ProblemKeywords.maxItems
            });
        });

        it("Array must respect the 'min' attribute.", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.arrayOfSimpleTypeProp = [];

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: TestProperties.arrayOfSimpleTypeProp,
                keyword: ProblemKeywords.minItems
            });
        });

        it("Array values must respect constraints.", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.arrayOfSimpleTypeProp = ["AAA", "BBBBSS"];

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: TestProperties.arrayOfSimpleTypeProp + "[1]",
                keyword: ProblemKeywords.maxLength
            });
        });
    });

    describe("Properties of abstract entity validation", () => {
        it("Can't have additional properties", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.abstractEntityProp.propx = undefined;

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: "abstractEntityProp.propx",
                keyword: ProblemKeywords.additionalProperties
            });
        });

        it("Can't have missing required property", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.abstractEntityProp.stringProp = undefined;

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: "abstractEntityProp." + TestProperties.stringProp,
                keyword: ProblemKeywords.required
            });
        });

        it("Must respect property abstract entity's constraints.", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.abstractEntityProp.stringProp = "A";

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: "abstractEntityProp." + TestProperties.stringProp,
                keyword: ProblemKeywords.minLength
            });
        });

        it("Non required abstract property doesn't report problems.", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.abstractEntityProp = undefined;

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(0);
        });
    });

    describe("Properties of linked entity validation", () => {
        it("Can't have other properties than that specified on linkedProperties", async () => {
            const entity: any = testEntities.complexLinkedEntityEntry;

            entity.linkedEntityProp.propx = "teste";

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: "linkedEntityProp.propx",
                keyword: ProblemKeywords.additionalProperties
            });
        });

        it("Can't have missing required property", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.linkedEntityProp.stringProp = undefined;

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(2);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: "linkedEntityProp." + TestProperties.stringProp,
                keyword: ProblemKeywords.required
            });
        });

        it("Must respect property abstract entity's constraints.", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.abstractEntityProp.stringProp = "A";

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: "abstractEntityProp." + TestProperties.stringProp,
                keyword: ProblemKeywords.minLength
            });
        });

        it("Non required abstract property doesn't report problems.", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.abstractEntityProp = undefined;

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(0);
        });
    });

    describe("General", () => {

        it("Required property can't be missing.", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.stringProp = undefined;

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: TestProperties.stringProp,
                keyword: ProblemKeywords.required
            });
        });

        it("Object can not have aditional properties", async () => {
            const entity = testEntities.complexLinkedEntityEntry;

            entity.additional = "teste";

            const problems = await EntityValidator.validate(testEntities.complexLinkedEntityType, entity,
                repositoryFactory);

            expect(problems).to.have.length(1);
            expect(problems[0]).to.contains(<ValidationProblem>{
                property: "additional",
                keyword: ProblemKeywords.additionalProperties
            });
        });

    });
});
