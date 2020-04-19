import { BuiltInEntries } from "./builtin-entries";
import { IDataStorage } from "./storage";
import { IEntityType, SysEntities, IUser } from "@poseidon/core-models";

export class DatabasePopulator {

    constructor(private readonly storage: IDataStorage) { }

    async populate() {
        const buildInEntities = BuiltInEntries.build();
        const entityTypeCollection = this.storage.collection<IEntityType>(SysEntities.entityType);

        entityTypeCollection.insertOne(buildInEntities.entityType);
        entityTypeCollection.insertOne(buildInEntities.entityTypeEntityProperty);
        entityTypeCollection.insertOne(buildInEntities.entityTypeEntitySchema);
        entityTypeCollection.insertOne(buildInEntities.entityTypeUser);

        const userCollection = this.storage.collection<IUser>(SysEntities.user);
        userCollection.insertOne(buildInEntities.rootUser);

    }
}