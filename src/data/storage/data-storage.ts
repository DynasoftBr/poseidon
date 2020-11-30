import { Entity, EntityType, Paginated } from "@poseidon/core-models";
import { Query } from "../../query-builder/interfaces/query";
import { Mutation } from "../mutation/mutation";
import { ObservedEntity } from "../mutation/observed-entity";

export interface DataStorage {
  getEntityTypeByName(name: string): EntityType;

  query<T extends Entity>(entityTypeName: string, query: Query<T>): Promise<T | T[] | Paginated<T>>;

  getById<T = Entity>(entityTypeName: string, id: string): Promise<T>;

  persist(mutationList: ObservedEntity<Entity>[]): Promise<void>;

  newId(): string;
}
