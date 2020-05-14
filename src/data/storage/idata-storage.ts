import { Entity, EntityType } from "@poseidon/core-models";
import { Query } from "../../query-builder/interfaces/query";
import { Queryable } from "../../query-builder/queryable";
import { MutationCollection } from "./mutation-collection";

export interface IDataStorage {
  entityTypesByName: Map<string, EntityType>;

  entityTypesById: Map<string, EntityType>;

  mutate(items: MutationCollection, event: string): Promise<void>;

  testConnection(): Promise<void>;

  feed(): Promise<void>;

  migrate(entityType: EntityType): Promise<void>;

  query<T>(entityTypeName: string, callback: (res: T | T[]) => T | T[]): Queryable<T>;
}
