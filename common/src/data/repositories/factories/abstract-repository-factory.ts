import { GenericRepositoryInterface, RepositoryInterface } from "../repository-interface";
import { Entity } from "../../..";

export abstract class AbstractRepositoryFactory {
   abstract async createRepository(entityTypeName: string): Promise<RepositoryInterface>;
}