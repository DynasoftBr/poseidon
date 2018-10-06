import { EntityType, User } from "../models";
import { SysEntities } from "../constants";
import { BuiltInEntries } from "./built-in-entries";
import { DataStorage } from "./storage";

export class DatabasePopulator {

    constructor(private readonly storage: DataStorage) { }

    async populate() {
        const buildInEntities = new BuiltInEntries();
        const entityTypeCollection = this.storage.collection<EntityType>(SysEntities.entityType);

        entityTypeCollection.insertOne(buildInEntities.entityType);
        entityTypeCollection.insertOne(buildInEntities.entityTypeEntityProperty);
        entityTypeCollection.insertOne(buildInEntities.entityTypeEntitySchema);
        entityTypeCollection.insertOne(buildInEntities.entityTypeUser);
        entityTypeCollection.insertOne(buildInEntities.entityTypeValidation);
        entityTypeCollection.insertOne(buildInEntities.entityTypeLinkedProperty);
        entityTypeCollection.insertOne(buildInEntities.entityTypeBranch);

        const userCollection = this.storage.collection<User>(SysEntities.user);
        userCollection.insertOne(buildInEntities.rootUser);

    }
}