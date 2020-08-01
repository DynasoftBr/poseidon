import { Entity } from "@poseidon/core-models";

export interface Repository<T = Entity> {
  getById<T>(id: string): Promise<T>;
  execQuery<T>(id: string): Promise<T>;
  insert<T>(entity: T): Promise<T>;
  update<T>(entity: T): Promise<T>;
}
