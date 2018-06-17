import { RepositoryInterface, GenericRepositoryInterface } from "../../../src/data/repositories/repository-interface";
import { AbstractRepositoryFactory } from "../../../src/data/repositories/factories/abstract-repository-factory";
import { EntityType, EntitySchema, User } from "../../../src/models";
import { TestEntityRepository } from "./test-entity-repository";
import { SysEntities } from "../../../src/constants";
import * as LokiDb from "lokijs";
import { BuiltInEntries } from "../../../src";
import { EntitySchemaBuilder } from "../../../src/data/schema-builder/entity-schema-builder";
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

    entityTypeRepo: GenericRepositoryInterface<EntityType>;
    async entityType(): Promise<GenericRepositoryInterface<EntityType>> {
        if (this.entityTypeRepo == null) {
            this.entityTypeRepo = <any>new TestEntityRepository(this.db, new BuiltInEntries().entityType);
        }

        return this.entityTypeRepo;
    }

    /**
     * Insert the entity type schema to the database.
     */
    async initDatabase() {

        let entityTypeCollection = this.db.addCollection<EntityType>(SysEntities.entityType);
        let schemaCollection = this.db.addCollection<EntitySchema>(SysEntities.entitySchema);
        let userCollection = this.db.addCollection<User>(SysEntities.user);

        let builtin = new BuiltInEntries();

        // Entity types
        entityTypeCollection.insertOne(builtin.entityType);
        entityTypeCollection.insertOne(builtin.entityTypeEntityProperty);
        entityTypeCollection.insertOne(builtin.entityTypeUser);
        entityTypeCollection.insertOne(builtin.entityTypeEntitySchema);

        // Root user
        userCollection.insertOne(builtin.rootUser);

        let schemaBuilder = new EntitySchemaBuilder(await this.entityType());

        // Add entity type schema to schemas' collection.
        let etJsonSchema = (await schemaBuilder.buildSchema(builtin.entityType)).getSchema();

        let entityTypeSchema = builtin.entitySchemaForEntityType;
        entityTypeSchema.schema = JSON.stringify(etJsonSchema);

        schemaCollection.insertOne(entityTypeSchema);

    }
}