export interface MongoDbConfiguration {
    url: string;
    dbName: string;
    retries: number;
    timeBetweenRetries: number;
}