import { IStorageCollection } from "./istorage-collection";
import { IStorageConnectionOptions } from "./istorage-connection-options";
import { IConcreteEntity } from "@poseidon/core-models";

export interface IDataStorage {
    /**
     * Starts the connection with database.
     * @param config The configuration parameters to connect to database.
     * @function
     */
    connect(config: IStorageConnectionOptions): Promise<void>;

    /**
     * Gets the collection to be used to insert, update, delete or query data.
     * @param collectionName An convention string in the format of 'database.collection'.
     * @returns A StorageCollection<T> instance.
     * @function
     */
    collection<T extends IConcreteEntity = IConcreteEntity>(collectionName: string): IStorageCollection<T>;
}