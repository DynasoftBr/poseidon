import { Repository } from "./repository";

export class EntityRepository implements Repository {
  constructor() {}
  
  getById<T>(id: string): Promise<T> {
    throw new Error("Method not implemented.");
  }
  
  execQuery<T>(id: string): Promise<T> {
    throw new Error("Method not implemented.");
  }
  
  insert<T>(entity: T): Promise<T> {
    throw new Error("Method not implemented.");
  }
  
  update<T>(entity: T): Promise<T> {
    throw new Error("Method not implemented.");
  }
}
