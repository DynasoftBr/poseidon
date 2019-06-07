import { IConcreteEntity } from "@poseidon/core-models";

export interface IService<T extends IConcreteEntity = IConcreteEntity> {
    findMany(filter: object, skip?: number, limit?: number, sort?: object): Promise<T[]>;
    findOne(filter: object): Promise<T>;
    create(entity: Partial<T>, event?: string): Promise<T>;
    update(partialEntity: Partial<T>, event?: string): Promise<Partial<T>>;
    delete(id: string, event?: string): Promise<void>;
    executeCommand<T = any>(command: string, params: any): Promise<T>;
}