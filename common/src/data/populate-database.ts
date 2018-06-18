import { Db } from "mongodb";
import { EntityType, User } from "../models";
import { SysEntities } from "../constants";
import { BuiltInEntries } from "./built-in-entries";

export class PopulateDatabase {

    constructor(private readonly db: Db) { }

    populate() {
        let buildInEntities = new BuiltInEntries();
        let entityTypeCollection = this.db.collection<EntityType>(SysEntities.entityType);
        entityTypeCollection.insertMany([
            buildInEntities.entityType,
            buildInEntities.entityTypeEntityProperty,
            buildInEntities.entityTypeEntitySchema
        ]);

        let userCollection = this.db.collection<User>(SysEntities.user);
        userCollection.insertMany([
            buildInEntities.rootUser
        ]);
    }
}